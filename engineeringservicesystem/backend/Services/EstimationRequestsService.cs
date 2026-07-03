using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Constants;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Services
{
    public class EstimationRequestsService : IEstimationRequestsService
    {
        private readonly ApplicationDbContext _context;

        // Estimation document types that can be selected by users with RequestsViewEstimation permission
        private static readonly string[] EstimationDocumentTypes = new[]
        {
            "Estimation Excel",
            "Relevant Photo",
            "Estimation Report"
        };

        public EstimationRequestsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EstimationRequestResponseDto>> GetRequestsAsync(string userId, List<string> userPermissions, bool isAdminOrSystemAdmin = false)
        {
            var query = _context.EstimationRequests
                .Include(e => e.BranchUser)
                    .ThenInclude(u => u.UserBranch)
                        .ThenInclude(b => b!.Manager)
                .Include(e => e.Report)
                .Include(e => e.Attachments)
                .Include(e => e.AssignedEngineer)
                .AsQueryable();

            // Permission-based filtering - Dynamic and role-agnostic
            if (userPermissions.Contains(Permissions.RequestsViewAll))
            {
                // Show all requests - no filter needed
            }
            else if (userPermissions.Contains(Permissions.RequestsViewBranch))
            {
                // Show only requests from user's branch (Checker)
                var checkerUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (checkerUser != null && checkerUser.BranchId.HasValue)
                {
                    query = query.Where(e => e.BranchUser != null &&
                                             e.BranchUser.BranchId == checkerUser.BranchId.Value);
                }
                else
                {
                    query = query.Where(e => e.BranchUserId == userId);
                }
            }
            else if (userPermissions.Contains(Permissions.RequestsViewOwn))
            {
                // Show only user's own requests (Maker)
                query = query.Where(e => e.BranchUserId == userId);
            }
            else if (userPermissions.Contains(Permissions.RequestsViewAllEstimated))
            {
                // Can see own requests if status is Assigned, OR see all requests if status is Estimated,
                // OR see own rejected requests where the engineer was the one who rejected
                query = query.Where(e => e.Status == RequestStatus.Estimated ||
                                         (e.AssignedEngineerId == userId && e.Status == RequestStatus.AssignedToEngineer) ||
                                         (e.AssignedEngineerId == userId && e.Status == RequestStatus.Rejected && e.LastRejectionBy == "Engineer"));
            }
            else if (userPermissions.Contains(Permissions.RequestsViewAssigned))
            {
                // Show only MY assigned requests
                query = query.Where(e => e.AssignedEngineerId == userId);
            }

            var entities = await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
            return entities.Select(e =>
            {
                var canViewReport = isAdminOrSystemAdmin || 
                                    userPermissions.Contains(Permissions.RequestsViewEstimation) || 
                                    e.AssignedEngineerId == userId ||
                                    (userPermissions.Contains(Permissions.RequestsViewAllEstimated) && e.Status == RequestStatus.Estimated);
                return MapToResponseDto(e, canViewReport, userPermissions, isAdminOrSystemAdmin);
            });
        }

        public async Task<EstimationRequestResponseDto?> GetRequestByIdAsync(int id, string userId, List<string> userPermissions, bool isAdminOrSystemAdmin = false)
        {
            var request = await _context.EstimationRequests
                .Include(e => e.BranchUser)
                    .ThenInclude(u => u.UserBranch)
                        .ThenInclude(b => b!.Manager)
                .Include(e => e.Report)
                .Include(e => e.Attachments)
                .Include(e => e.AssignedEngineer)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (request == null) return null;

            var canViewReport = isAdminOrSystemAdmin || 
                                userPermissions.Contains(Permissions.RequestsViewEstimation) || 
                                request.AssignedEngineerId == userId ||
                                (userPermissions.Contains(Permissions.RequestsViewAllEstimated) && request.Status == RequestStatus.Estimated);
            return MapToResponseDto(request, canViewReport, userPermissions, isAdminOrSystemAdmin);
        }

        public async Task<EstimationRequestResponseDto> CreateRequestAsync(CreateEstimationRequestDto dto, string userId)
        {
            var buildingType = ParseBuildingType(dto.BuildingType, TypeOfBuilding.Condominium);
            var purpose = ParsePurpose(dto.Purpose, PurposeOfEstimation.Mortgage);
            var type = ParseEstimationType(dto.Type, TypeOfEstimation.NewEstimation);
            var request = new EstimationRequest
            {
                ApplicantName = dto.ApplicantName,
                OwnerName = dto.OwnerName,
                LHUNo = dto.LHUNo,
                City = dto.City,
                SubCity = dto.SubCity,
                Kebele = dto.Kebele,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                PlotArea = dto.PlotArea,
                BuildingType = buildingType,
                Purpose = purpose,
                Type = type,
                ProjectFinanceDocType = dto.ProjectFinanceDocType,
                BillOfPenalty = dto.BillOfPenalty,
                BranchUserId = userId,
                Status = RequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.EstimationRequests.Add(request);
            await _context.SaveChangesAsync();

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                var attachments = dto.Attachments.Select(a => new Attachment
                {
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    DocumentType = a.DocumentType,
                    EstimationRequestId = request.Id
                });
                _context.Attachments.AddRange(attachments);
                await _context.SaveChangesAsync();
            }

            // Fetch branch info for notification scoping
            var branchUser = await _context.Users
                .Include(u => u.UserBranch)
                .FirstOrDefaultAsync(u => u.Id == userId);
            var branchId = branchUser?.BranchId?.ToString();

            try {
                backend.Services.NotificationCenter.Create(
                    "New Estimation Request",
                    $"Request #{request.Id} submitted by Branch Manager and awaiting Engineering Manager review.",
                    new[] { "EngineeringManager" },
                    Array.Empty<string>(),
                    request.Id,
                    branchId);
            }
            catch { /* Swallow notification errors to not break request creation */ }

            return await GetRequestByIdAsync(request.Id, userId, new List<string>(), false) ?? MapToResponseDto(request);
        }

        public async Task<bool> CheckerApproveAsync(int id, CheckerApproveDto dto)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            if (request.Status != RequestStatus.Pending) return false;

            request.Status = RequestStatus.CheckerApproved;
            request.CheckerActionDate = dto.CheckerApprovalDate;
            request.CheckerActionDescription = dto.CheckerDescription;

            await _context.SaveChangesAsync();

            // Notify Manager that Branch Manager approved and request is ready for Manager action
            try
            {
                var branchId = await GetBranchIdForRequestAsync(request.BranchUserId);
                backend.Services.NotificationCenter.Create(
                    "Request Approved by Branch Manager",
                    $"Request #{request.Id} was approved by Branch Manager and is awaiting Engineering Manager action.",
                    new[] { "EngineeringManager" },
                    Array.Empty<string>(),
                    request.Id,
                    branchId);
            }
            catch { }

            return true;
        }

        public async Task<bool> CheckerRejectAsync(int id, CheckerRejectDto dto)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            if (request.Status != RequestStatus.Pending) return false;

            request.Status = RequestStatus.Rejected;
            request.CheckerActionDate = dto.CheckerRejectionDate;
            request.CheckerRejectionReason = dto.CheckerReason;
            // Track the most-recent rejection on top-level fields so the
            // audit trail is preserved even after the maker edits & resends.
            request.LastRejectionReason = dto.CheckerReason;
            request.LastRejectionDate = dto.CheckerRejectionDate;
            request.LastRejectionBy = "Branch Manager";

            await _context.SaveChangesAsync();

            // Notify the branch manager about rejection with reason
            try
            {
                var makerId = request.BranchUserId;
                var branchId = await GetBranchIdForRequestAsync(makerId);
                var msg = $"Your request #{request.Id} was rejected by Engineering Manager. Reason: {dto.CheckerReason}";
                backend.Services.NotificationCenter.Create(
                    "Request Rejected by Engineering Manager",
                    msg,
                    Array.Empty<string>(), // Specifically targeted, don't broadcast to all branch managers
                    string.IsNullOrEmpty(makerId) ? Array.Empty<string>() : new[] { makerId },
                    request.Id,
                    branchId);
            }
            catch { }

            return true;
        }

        public async Task<bool> ManagerApproveAsync(int id, ManagerApproveDto dto)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            // Accept both Pending (0) — direct from BranchManager — and CheckerApproved (1) legacy
            if (request.Status != RequestStatus.Pending && request.Status != RequestStatus.CheckerApproved) return false;

            request.Status = RequestStatus.ManagerApproved;
            request.ManagerActionDate = dto.ManagerApprovalDate;
            request.ManagerActionDescription = dto.ManagerDescription;

            await _context.SaveChangesAsync();

            // Notify Engineers that Manager approved (target role: Engineer)
            try
            {
                var branchId = await GetBranchIdForRequestAsync(request.BranchUserId);
                backend.Services.NotificationCenter.Create(
                    "Request Approved by Engineering Manager",
                    $"Request #{request.Id} was approved by Engineering Manager and is ready for engineering assignment.",
                    new[] { "Engineer" },
                    Array.Empty<string>(),
                    request.Id,
                    branchId);
            }
            catch { }

            return true;
        }

        public async Task<bool> ManagerRejectAsync(int id, ManagerRejectDto dto)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            // Accept both Pending (0) — direct from BranchManager — and CheckerApproved (1) legacy
            if (request.Status != RequestStatus.Pending && request.Status != RequestStatus.CheckerApproved) return false;

            request.Status = RequestStatus.Rejected;
            request.ManagerActionDate = dto.ManagerRejectionDate;
            request.ManagerRejectionReason = dto.ManagerReason;
            request.LastRejectionReason = dto.ManagerReason;
            request.LastRejectionDate = dto.ManagerRejectionDate;
            request.LastRejectionBy = "Engineering Manager";

            await _context.SaveChangesAsync();

            // Notify the Branch Manager (creator) about manager rejection
            try
            {
                var makerId = request.BranchUserId;
                var branchId = await GetBranchIdForRequestAsync(makerId);
                var msg = $"Your request #{request.Id} was rejected by Engineering Manager. Reason: {dto.ManagerReason}";
                backend.Services.NotificationCenter.Create(
                    "Request Rejected by Engineering Manager",
                    msg,
                    Array.Empty<string>(), // Avoid broadcasting to all
                    string.IsNullOrEmpty(makerId) ? Array.Empty<string>() : new[] { makerId },
                    request.Id,
                    branchId);
            }
            catch { }

            return true;
        }

        public async Task<bool> EngineerRejectAsync(int id, EngineerRejectDto dto)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            if (request.Status != RequestStatus.AssignedToEngineer) return false;

            request.Status = RequestStatus.Rejected;
            request.EngineerActionDate = dto.EngineerRejectionDate;
            request.EngineerRejectionReason = dto.EngineerReason;
            
            request.LastRejectionReason = dto.EngineerReason;
            request.LastRejectionDate = dto.EngineerRejectionDate;
            request.LastRejectionBy = "Engineer";

            await _context.SaveChangesAsync();

            try
            {
                var makerId = request.BranchUserId;
                var branchId = await GetBranchIdForRequestAsync(makerId);
                var msg = $"Your request #{request.Id} was rejected by the Engineering Officer. Reason: {dto.EngineerReason}";
                backend.Services.NotificationCenter.Create(
                    "Request Rejected by Engineer",
                    msg,
                    Array.Empty<string>(), // Target directly to maker
                    string.IsNullOrEmpty(makerId) ? Array.Empty<string>() : new[] { makerId },
                    request.Id,
                    branchId);
            }
            catch { }

            return true;
        }

        public async Task<bool> AssignToEngineerAsync(int id, AssignToEngineerDto dto)
        {
            var request = await _context.EstimationRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return false;

            if (request.Status != RequestStatus.ManagerApproved) return false;

            request.Status = RequestStatus.AssignedToEngineer;
            request.AssignedEngineerId = dto.EngineerId;
            request.EngineerAssignmentDate = dto.AssignmentDate;

            await _context.SaveChangesAsync();

            // Notify assigned Engineer specifically
            try
            {
                var engineerId = dto.EngineerId;
                backend.Services.NotificationCenter.Create(
                    "Assigned to Engineer",
                    $"You have been assigned to request #{request.Id}.",
                    Array.Empty<string>(), // Target specifically
                    string.IsNullOrEmpty(engineerId) ? Array.Empty<string>() : new[] { engineerId },
                    request.Id,
                    null); // Engineer notifications don't need branch filter
            }
            catch { }

            return true;
        }

        public async Task<bool> AssignToEngineeringOfficerAsync(int id, string officerId)
        {
            var request = await _context.EstimationRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return false;

            if (request.Status != RequestStatus.ManagerApproved) return false;

            request.Status = RequestStatus.AssignedToEngineer;
            request.AssignedEngineerId = officerId;
            request.EngineerAssignmentDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify assigned engineering officer specifically
            try
            {
                backend.Services.NotificationCenter.Create(
                    "Assigned to Engineer",
                    $"You have been assigned to request #{request.Id}.",
                    Array.Empty<string>(), // Target specifically
                    string.IsNullOrEmpty(officerId) ? Array.Empty<string>() : new[] { officerId },
                    request.Id,
                    null);
            }
            catch { }

            return true;
        }

        public async Task<bool> UnassignEngineeringOfficerAsync(int id)
        {
            var request = await _context.EstimationRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return false;

            if (string.IsNullOrEmpty(request.AssignedEngineerId)) return false;

            if (request.Status != RequestStatus.AssignedToEngineer && request.Status != RequestStatus.ManagerApproved)
                return false;

            request.Status = RequestStatus.ManagerApproved;
            request.AssignedEngineerId = null;
            request.EngineerAssignmentDate = null;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> PrepareReportAsync(int id, CreateEngineeringReportDto reportDto, string userId)
        {
            var report = new EngineeringReport
            {
                EstimationRequestId = reportDto.EstimationRequestId,
                SiteVisitDate = reportDto.SiteVisitDate,
                Remarks = reportDto.Remarks,
                EstimatedValue = reportDto.EstimatedValue
            };

            return await PrepareReportAsync(id, report, userId, reportDto.Attachments);
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> PrepareReportAsync(int id, EngineeringReport report, string userId, List<AttachmentUploadDto>? attachments = null)
        {
            if (id != report.EstimationRequestId) return (false, "Id mismatch");

            var estimationRequest = await _context.EstimationRequests
                .Include(r => r.Report)
                .Include(r => r.Attachments)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (estimationRequest == null) return (false, "Request not found");

            if (estimationRequest.AssignedEngineerId != userId)
                return (false, "You are not assigned to this request");

            if (estimationRequest.Status != RequestStatus.AssignedToEngineer &&
                estimationRequest.Status != RequestStatus.Estimated)
                return (false, "Request must be in assigned or estimated status");

            // UPSERT: Update if exists, otherwise create
            if (estimationRequest.Report != null)
            {
                estimationRequest.Report.EstimatedValue = report.EstimatedValue;
                estimationRequest.Report.SiteVisitDate = report.SiteVisitDate;
                estimationRequest.Report.Remarks = report.Remarks;
            }
            else
            {
                report.AssignedEngineerId = userId;
                report.CreatedAt = DateTime.UtcNow;
                _context.EngineeringReports.Add(report);
            }

            if (attachments?.Any() == true)
            {
                var attachmentTypes = attachments.Select(a => a.DocumentType).Distinct().ToList();
                var existingAttachments = estimationRequest.Attachments?
                    .Where(a => attachmentTypes.Contains(a.DocumentType))
                    .ToList() ?? new List<Attachment>();

                if (existingAttachments.Any())
                {
                    _context.Attachments.RemoveRange(existingAttachments);
                }

                var newAttachments = attachments.Select(a => new Attachment
                {
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    DocumentType = a.DocumentType,
                    EstimationRequestId = estimationRequest.Id
                });

                _context.Attachments.AddRange(newAttachments);
            }

            if (estimationRequest.Status != RequestStatus.Estimated)
            {
                estimationRequest.Status = RequestStatus.Estimated;
            }

            await _context.SaveChangesAsync();

            // Auto-share the "Estimation Report" attachment to both Manager and Checker
            // by inserting it into FilteredEstimationAttachments immediately upon submission.
            // This means neither Manager nor Checker has to wait for the Engineer to manually "Send".
            try
            {
                // Re-fetch attachments after SaveChanges so we see the newly inserted rows
                var estimationReportAttachments = await _context.Attachments
                    .Where(a => a.EstimationRequestId == estimationRequest.Id
                                && a.DocumentType == "Estimation Report")
                    .ToListAsync();

                if (estimationReportAttachments.Any())
                {
                    // Remove any stale filtered rows for this request so we don't duplicate
                    var staleFiltered = await _context.FilteredEstimationAttachments
                        .Where(f => f.EstimationRequestId == estimationRequest.Id)
                        .ToListAsync();
                    if (staleFiltered.Any())
                        _context.FilteredEstimationAttachments.RemoveRange(staleFiltered);

                    // Insert fresh rows — one per Estimation Report attachment
                    foreach (var att in estimationReportAttachments)
                    {
                        _context.FilteredEstimationAttachments.Add(new FilteredEstimationAttachment
                        {
                            EstimationRequestId = estimationRequest.Id,
                            AttachmentId = att.Id,
                            CreatedAt = DateTime.UtcNow,
                            CreatedBy = userId
                        });
                    }

                    await _context.SaveChangesAsync();
                }
            }
            catch { /* Never break the main flow over the auto-share step */ }

            // Notify both Manager and Checker that the estimation report has been submitted by the engineer
            try
            {
                var engineerName = estimationRequest.AssignedEngineer?.FirstName ?? "Engineer";
                var engineerLastName = estimationRequest.AssignedEngineer?.LastName ?? "";
                var fullName = $"{engineerName} {engineerLastName}".Trim();
                
                var makerId = estimationRequest.BranchUserId;
                var branchId = await GetBranchIdForRequestAsync(makerId);
                
                // Notify both Engineering Manager and the Branch Manager who submitted the request
                backend.Services.NotificationCenter.Create(
                    "Estimation Report Submitted",
                    $"Estimation report for Request #{estimationRequest.Id} has been submitted by {fullName}. Ready for review.",
                    new[] { "EngineeringManager" },
                    string.IsNullOrEmpty(makerId) ? Array.Empty<string>() : new[] { makerId },
                    estimationRequest.Id,
                    branchId);
            }
            catch { }

            return (true, null);
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> PrepareReportAsync(int id, EngineeringReport report, string userId)
        {
            return await PrepareReportAsync(id, report, userId, null);
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> UpdateReportAsync(int id, EngineeringReport report, string userId)
        {
            return await PrepareReportAsync(id, report, userId);
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> UploadFinalEstimationAsync(int id, List<DTOs.AttachmentUploadDto> attachments, string userId)
        {
            var estimationRequest = await _context.EstimationRequests
                .Include(r => r.Attachments)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (estimationRequest == null) return (false, "Request not found");

            if (attachments?.Any() == true)
            {
                var existingFinalEstimations = estimationRequest.Attachments?
                    .Where(a => a.DocumentType == "Final Estimation")
                    .ToList() ?? new List<Attachment>();

                if (existingFinalEstimations.Any())
                {
                    _context.Attachments.RemoveRange(existingFinalEstimations);
                }

                var newAttachments = attachments.Select(a => new Attachment
                {
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    DocumentType = "Final Estimation",
                    EstimationRequestId = estimationRequest.Id,
                    UploadedById = userId
                });

                _context.Attachments.AddRange(newAttachments);
                await _context.SaveChangesAsync();
                return (true, null);
            }

            return (false, "No attachments provided");
        }

        // =================================================================
        // FIXED: This method was missing - ADD THIS
        // =================================================================
        public async Task<bool> UpdateStatusAsync(int id, RequestStatus newStatus)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            request.Status = newStatus;
            await _context.SaveChangesAsync();
            return true;
        }

        // =================================================================
        // RESEND WORKFLOW
        // The maker edits the data of a rejected request and re-submits it.
        // The status is reset to Pending (0) so the workflow restarts at the
        // Checker step. The rejection reason/date are kept in the audit
        // fields and copied to top-level "LastRejection*" fields so the
        // workflow trail is preserved across the resend.
        // =================================================================
        public async Task<(bool Succeeded, string? ErrorMessage)> ResendRequestAsync(int id, UpdateEstimationRequestDto dto, string userId)
        {
            var request = await _context.EstimationRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return (false, "Estimation request not found");

            // Only the original maker (BranchUser) can resend their rejected request.
            if (!string.IsNullOrEmpty(request.BranchUserId) && request.BranchUserId != userId)
                return (false, "You are not allowed to resend this request");

            if (request.Status != RequestStatus.Rejected)
                return (false, "Only rejected requests can be resent");

            // LHC uniqueness check — allow the same LHC as long as it belongs to THIS request.
            if (!string.IsNullOrWhiteSpace(dto.LHUNo) && !dto.LHUNo.Equals(request.LHUNo, StringComparison.OrdinalIgnoreCase))
            {
                var lhcConflict = await _context.EstimationRequests
                    .AnyAsync(r => r.LHUNo.ToLower() == dto.LHUNo.ToLower() && r.Id != id);
                if (lhcConflict)
                    return (false, "LHC number already exists. Please enter a unique LHC number.");
            }

            // Update the editable fields with the new data from the maker.
            request.ApplicantName = dto.ApplicantName;
            request.OwnerName = dto.OwnerName;
            request.LHUNo = dto.LHUNo;
            request.City = dto.City;
            request.SubCity = dto.SubCity;
            request.Kebele = dto.Kebele;
            request.PlotArea = dto.PlotArea;

            request.BuildingType = ParseBuildingType(dto.BuildingType, request.BuildingType);
            request.Purpose = ParsePurpose(dto.Purpose, request.Purpose);
            request.Type = ParseEstimationType(dto.Type, request.Type);

            request.ProjectFinanceDocType = dto.ProjectFinanceDocType;
            request.BillOfPenalty = dto.BillOfPenalty;

            // Reset status to Pending so the workflow restarts.
            request.Status = RequestStatus.Pending;
            request.UpdatedAt = DateTime.UtcNow;

            // Keep the audit trail of the previous rejection on top-level fields
            // so it remains visible after the workflow resumes.
            // (CheckerRejectionReason / ManagerRejectionReason are preserved as-is.)

            // Track the resend itself.
            request.ResentAt = DateTime.UtcNow;
            request.ResendCount += 1;

            await _context.SaveChangesAsync();

            // Notify Manager that the request has been resent by Branch Manager
            try
            {
                var branchId = await GetBranchIdForRequestAsync(request.BranchUserId);
                backend.Services.NotificationCenter.Create(
                    "Request Resent",
                    $"Request #{request.Id} has been resent by Branch Manager and is awaiting Engineering Manager review.",
                    new[] { "EngineeringManager" },
                    Array.Empty<string>(),
                    request.Id,
                    branchId);
            }
            catch { }

            return (true, null);
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> UpdateRequestAsync(int id, UpdateEstimationRequestDto dto, string userId)
        {
            var request = await _context.EstimationRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return (false, "Estimation request not found");

            // Only the original maker (BranchUser) can update their pending request.
            if (!string.IsNullOrEmpty(request.BranchUserId) && request.BranchUserId != userId)
                return (false, "You are not allowed to update this request");

            if (request.Status != RequestStatus.Pending)
                return (false, "Only pending requests can be edited");

            // LHC uniqueness check — allow the same LHC as long as it belongs to THIS request.
            if (!string.IsNullOrWhiteSpace(dto.LHUNo) && !dto.LHUNo.Equals(request.LHUNo, StringComparison.OrdinalIgnoreCase))
            {
                var lhcConflict = await _context.EstimationRequests
                    .AnyAsync(r => r.LHUNo.ToLower() == dto.LHUNo.ToLower() && r.Id != id);
                if (lhcConflict)
                    return (false, "LHC number already exists. Please enter a unique LHC number.");
            }

            // Update editable fields without changing workflow status.
            request.ApplicantName = dto.ApplicantName;
            request.OwnerName = dto.OwnerName;
            request.LHUNo = dto.LHUNo;
            request.City = dto.City;
            request.SubCity = dto.SubCity;
            request.Kebele = dto.Kebele;
            request.PlotArea = dto.PlotArea;

            request.BuildingType = ParseBuildingType(dto.BuildingType, request.BuildingType);
            request.Purpose = ParsePurpose(dto.Purpose, request.Purpose);
            request.Type = ParseEstimationType(dto.Type, request.Type);

            request.ProjectFinanceDocType = dto.ProjectFinanceDocType;
            request.BillOfPenalty = dto.BillOfPenalty;
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify Manager that a pending request was updated by Branch Manager
            try
            {
                var branchId = await GetBranchIdForRequestAsync(request.BranchUserId);
                backend.Services.NotificationCenter.Create(
                    "Request Updated",
                    $"Request #{request.Id} was updated by Branch Manager and is awaiting Engineering Manager review.",
                    new[] { "EngineeringManager" },
                    Array.Empty<string>(),
                    request.Id,
                    branchId);
            }
            catch { }

            return (true, null);
        }

        private async Task<string?> GetBranchIdForRequestAsync(string? branchUserId)
        {
            if (string.IsNullOrEmpty(branchUserId)) return null;
            var user = await _context.Users.FindAsync(branchUserId);
            return user?.BranchId?.ToString();
        }

        private static TypeOfBuilding ParseBuildingType(string? value, TypeOfBuilding fallback) =>
            value?.ToLower() switch
            {
                "condominium"  => TypeOfBuilding.Condominium,
                "commercial"   => TypeOfBuilding.Commercial,
                "residential"  => TypeOfBuilding.Residential,
                "industrial"   => TypeOfBuilding.Industrial,
                "mixed use"    => TypeOfBuilding.MixedUse,
                "mixeduse"     => TypeOfBuilding.MixedUse,
                "mixed-use"    => TypeOfBuilding.MixedUse,
                _              => fallback
            };

        private static PurposeOfEstimation ParsePurpose(string? value, PurposeOfEstimation fallback) =>
            value?.ToLower() switch
            {
                "mortgage"       => PurposeOfEstimation.Mortgage,
                "guarantee"      => PurposeOfEstimation.Guarantee,
                "loan"           => PurposeOfEstimation.Loan,
                "foreclosure"    => PurposeOfEstimation.Foreclosure,
                "project finance"=> PurposeOfEstimation.ProjectFinance,
                "projectfinance" => PurposeOfEstimation.ProjectFinance,
                _                => fallback
            };

        private static TypeOfEstimation ParseEstimationType(string? value, TypeOfEstimation fallback) =>
            value?.ToLower() switch
            {
                "newestimation"  => TypeOfEstimation.NewEstimation,
                "new estimation" => TypeOfEstimation.NewEstimation,
                "reestimation"   => TypeOfEstimation.ReEstimation,
                "re-estimation"  => TypeOfEstimation.ReEstimation,
                _                => fallback
            };

        private EstimationRequestResponseDto MapToResponseDto(EstimationRequest request)
        {
            return MapToResponseDto(request, true, null, false);
        }

        private EstimationRequestResponseDto MapToResponseDto(EstimationRequest request, bool includeReport, List<string>? userPermissions, bool isAdminOrSystemAdmin)
        {
            var allAttachments = request.Attachments?.Select(a => new DTOs.AttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FilePath,
                DocumentType = a.DocumentType,
                UploadedById = a.UploadedById
            }).ToList() ?? new List<DTOs.AttachmentDto>();

            // Permission-based filtering of attachments
            var hasViewEstimation = isAdminOrSystemAdmin
                                    || (userPermissions != null && (userPermissions.Contains(Permissions.RequestsViewEstimation) || userPermissions.Contains(Permissions.RequestsViewAllEstimated)));
            var hasViewFilteredEstimation = isAdminOrSystemAdmin
                                            || (userPermissions != null && userPermissions.Contains(Permissions.RequestsViewFilteredEstimation));

            var attachmentDtos = allAttachments;
            if (!includeReport)
            {
                if (!hasViewEstimation)
                {
                    attachmentDtos = allAttachments
                        .Where(a => !EstimationDocumentTypes.Contains(a.DocumentType))
                        .ToList();
                }
            }

            // For users with RequestsViewEstimation, expose the selectable ids + the currently filtered ids.
            // For
            // For users with RequestsViewEstimation, expose the selectable ids + the currently filtered ids.
            // For users with RequestsViewFilteredEstimation, also expose the currently filtered ids so the
            // dedicated "Filtered Estimation Documents" section can render them.
            List<int> selectableIds = new();
            List<int> filteredIdsList = new();
            List<DTOs.AttachmentDto> filteredAttachmentDtos = new();
            if (hasViewEstimation)
            {
                selectableIds = allAttachments
                    .Where(a => EstimationDocumentTypes.Contains(a.DocumentType))
                    .Select(a => a.Id)
                    .ToList();
                filteredIdsList = _context.FilteredEstimationAttachments
                    .Where(f => f.EstimationRequestId == request.Id)
                    .Select(f => f.AttachmentId)
                    .ToList();
                var filteredIdsSet = filteredIdsList.ToHashSet();
                filteredAttachmentDtos = allAttachments
                    .Where(a => filteredIdsSet.Contains(a.Id))
                    .ToList();
            }
            else if (hasViewFilteredEstimation)
            {
                filteredIdsList = _context.FilteredEstimationAttachments
                    .Where(f => f.EstimationRequestId == request.Id)
                    .Select(f => f.AttachmentId)
                    .ToList();
                var filteredIdsSet = filteredIdsList.ToHashSet();
                filteredAttachmentDtos = allAttachments
                    .Where(a => filteredIdsSet.Contains(a.Id))
                    .ToList();
            }

            return new EstimationRequestResponseDto
            {
                Id = request.Id,
                ApplicantName = request.ApplicantName,
                OwnerName = request.OwnerName,
                LHUNo = request.LHUNo,
                City = request.City,
                SubCity = request.SubCity,
                Kebele = request.Kebele,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                PlotArea = request.PlotArea,
                BuildingType = request.BuildingType switch
                {
                    TypeOfBuilding.Condominium => "Condominium",
                    TypeOfBuilding.Commercial  => "Commercial",
                    TypeOfBuilding.Residential => "Residential",
                    TypeOfBuilding.Industrial  => "Industrial",
                    TypeOfBuilding.MixedUse    => "Mixed Use",
                    _                          => request.BuildingType.ToString()
                },
                Purpose = request.Purpose == PurposeOfEstimation.ProjectFinance ? "Project Finance" : request.Purpose.ToString(),
                Type = request.Type switch
                {
                    TypeOfEstimation.NewEstimation => "New Estimation",
                    TypeOfEstimation.ReEstimation  => "Re-Estimation",
                    _                              => request.Type.ToString()
                },
                Status = (int)request.Status,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
                BranchUserId = request.BranchUserId,
                BranchUserName = request.BranchUser != null
                    ? $"{request.BranchUser.FirstName ?? string.Empty} {request.BranchUser.LastName ?? string.Empty}".Trim()
                    : string.Empty,
                BranchName = request.BranchUser?.UserBranch?.Name,
                BranchId = request.BranchUser?.BranchId?.ToString(),
                BranchManagerName = request.BranchUser?.UserBranch?.Manager != null
                    ? $"{request.BranchUser.UserBranch.Manager.FirstName ?? string.Empty} {request.BranchUser.UserBranch.Manager.LastName ?? string.Empty}".Trim()
                    // Fallback: the creator IS the branch manager
                    : (request.BranchUser != null
                        ? $"{request.BranchUser.FirstName ?? string.Empty} {request.BranchUser.LastName ?? string.Empty}".Trim()
                        : string.Empty),
                ReportId = includeReport ? request.Report?.Id : null,
                Report = includeReport && request.Report != null ? new EngineeringReportResponseDto
                {
                    Id = request.Report.Id,
                    EstimationRequestId = request.Report.EstimationRequestId,
                    AssignedEngineerId = request.Report.AssignedEngineerId,
                    AssignedEngineerName = request.Report.AssignedEngineer != null
                        ? $"{request.Report.AssignedEngineer.FirstName ?? string.Empty} {request.Report.AssignedEngineer.LastName ?? string.Empty}".Trim()
                        : string.Empty,
                    SiteVisitDate = request.Report.SiteVisitDate,
                    Remarks = request.Report.Remarks,
                    EstimatedValue = request.Report.EstimatedValue,
                    CreatedAt = request.Report.CreatedAt
                } : null,
                AssignedEngineerId = request.AssignedEngineerId,
                AssignedEngineerName = request.AssignedEngineer != null
                    ? $"{request.AssignedEngineer.FirstName ?? string.Empty} {request.AssignedEngineer.LastName ?? string.Empty}".Trim()
                    : string.Empty,
                EngineerAssignmentDate = request.EngineerAssignmentDate,
                Location = $"{request.City}, {request.SubCity}, Kebele {request.Kebele}",
                Attachments = attachmentDtos,
                FilteredEstimationAttachments = filteredAttachmentDtos,
                FilteredAttachmentIds = filteredIdsList,
                SelectableAttachmentIds = selectableIds,
                CheckerActionDate = request.CheckerActionDate,
                CheckerActionDescription = request.CheckerActionDescription,
                CheckerRejectionReason = request.CheckerRejectionReason,
                ManagerActionDate = request.ManagerActionDate,
                ManagerActionDescription = request.ManagerActionDescription,
                ManagerRejectionReason = request.ManagerRejectionReason,
                EngineerActionDate = request.EngineerActionDate,
                EngineerRejectionReason = request.EngineerRejectionReason,
                ProjectFinanceDocType = request.ProjectFinanceDocType,
                BillOfPenalty = request.BillOfPenalty,
                LastRejectionReason = request.LastRejectionReason,
                LastRejectionDate = request.LastRejectionDate,
                LastRejectionBy = request.LastRejectionBy,
                ResentAt = request.ResentAt,
                ResendCount = request.ResendCount
            };
        }

        public async Task<LocationHistoricalDto> GetHistoricalLocationsAsync()
        {
            var cities = await _context.EstimationRequests
                .Where(r => !string.IsNullOrEmpty(r.City))
                .Select(r => r.City!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            var subCities = await _context.EstimationRequests
                .Where(r => !string.IsNullOrEmpty(r.SubCity))
                .Select(r => r.SubCity!)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();

            var kebeles = await _context.EstimationRequests
                .Where(r => !string.IsNullOrEmpty(r.Kebele))
                .Select(r => r.Kebele!)
                .Distinct()
                .OrderBy(k => k)
                .ToListAsync();

            return new LocationHistoricalDto
            {
                Cities = cities,
                SubCities = subCities,
                Kebeles = kebeles
            };
        }

        public async Task<bool> CheckLhcExistsAsync(string lhcNo)
        {
            if (string.IsNullOrWhiteSpace(lhcNo)) return false;
            return await _context.EstimationRequests.AnyAsync(r => r.LHUNo.ToLower() == lhcNo.ToLower());
        }

        public async Task<LhcCheckResultDto> CheckLhcWithMetadataAsync(string lhcNo)
        {
            if (string.IsNullOrWhiteSpace(lhcNo))
                return new LhcCheckResultDto { Exists = false };

            var existing = await _context.EstimationRequests
                .Where(r => r.LHUNo.ToLower() == lhcNo.ToLower())
                .OrderBy(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (existing == null)
                return new LhcCheckResultDto { Exists = false, LhcNo = lhcNo };

            return new LhcCheckResultDto
            {
                Exists = true,
                LhcNo = lhcNo,
                FirstEstimationDate = existing.CreatedAt
            };
        }
    }
}
