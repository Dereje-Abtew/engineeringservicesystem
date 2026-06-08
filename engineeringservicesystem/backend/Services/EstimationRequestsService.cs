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

        public EstimationRequestsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EstimationRequestResponseDto>> GetRequestsAsync(string userId, List<string> userPermissions, bool isAdminOrSystemAdmin = false)
        {
            var query = _context.EstimationRequests
                .Include(e => e.BranchUser)
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
            else if (userPermissions.Contains(Permissions.RequestsViewAllAssigned))
            {
                // Show ALL assigned requests to ANY engineer
                query = query.Where(e => e.AssignedEngineerId != null);
            }
            else if (userPermissions.Contains(Permissions.RequestsViewAssigned))
            {
                // Show only MY assigned requests
                query = query.Where(e => e.AssignedEngineerId == userId);
            }

            var entities = await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
            return entities.Select(e =>
            {
                var canViewReport = isAdminOrSystemAdmin || userPermissions.Contains(Permissions.RequestsViewEstimation) || e.AssignedEngineerId == userId;
                return MapToResponseDto(e, canViewReport);
            });
        }

        public async Task<EstimationRequestResponseDto?> GetRequestByIdAsync(int id, string userId, List<string> userPermissions, bool isAdminOrSystemAdmin = false)
        {
            var request = await _context.EstimationRequests
                .Include(e => e.BranchUser)
                .Include(e => e.Report)
                .Include(e => e.Attachments)
                .Include(e => e.AssignedEngineer)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (request == null) return null;

            var canViewReport = isAdminOrSystemAdmin || userPermissions.Contains(Permissions.RequestsViewEstimation) || request.AssignedEngineerId == userId;
            return MapToResponseDto(request, canViewReport);
        }

        public async Task<EstimationRequestResponseDto> CreateRequestAsync(CreateEstimationRequestDto dto, string userId)
        {
            var buildingType = dto.BuildingType?.ToLower() switch
            {
                "condominium" => TypeOfBuilding.Condominium,
                "commercial" => TypeOfBuilding.Commercial,
                _ => TypeOfBuilding.Condominium
            };

            var purpose = dto.Purpose?.ToLower() switch
            {
                "mortgage" => PurposeOfEstimation.Mortgage,
                "guarantee" => PurposeOfEstimation.Guarantee,
                "loan" => PurposeOfEstimation.Loan,
                "foreclosure" => PurposeOfEstimation.Foreclosure,
                "project finance" => PurposeOfEstimation.ProjectFinance,
                _ => PurposeOfEstimation.Mortgage
            };

            var type = dto.Type?.ToLower() switch
            {
                "newestimation" => TypeOfEstimation.NewEstimation,
                "reestimation" => TypeOfEstimation.ReEstimation,
                _ => TypeOfEstimation.NewEstimation
            };

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

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ManagerApproveAsync(int id, ManagerApproveDto dto)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            if (request.Status != RequestStatus.CheckerApproved) return false;

            request.Status = RequestStatus.ManagerApproved;
            request.ManagerActionDate = dto.ManagerApprovalDate;
            request.ManagerActionDescription = dto.ManagerDescription;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ManagerRejectAsync(int id, ManagerRejectDto dto)
        {
            var request = await _context.EstimationRequests.FindAsync(id);
            if (request == null) return false;

            if (request.Status != RequestStatus.CheckerApproved) return false;

            request.Status = RequestStatus.Rejected;
            request.ManagerActionDate = dto.ManagerRejectionDate;
            request.ManagerRejectionReason = dto.ManagerReason;

            await _context.SaveChangesAsync();
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

        private EstimationRequestResponseDto MapToResponseDto(EstimationRequest request)
        {
            return MapToResponseDto(request, true);
        }

        private EstimationRequestResponseDto MapToResponseDto(EstimationRequest request, bool includeReport)
        {
            var attachmentDtos = request.Attachments?.Select(a => new DTOs.AttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FilePath,
                DocumentType = a.DocumentType
            }).ToList() ?? new List<DTOs.AttachmentDto>();

            if (!includeReport)
            {
                var hiddenReportTypes = new[] { "Estimation Excel", "Relevant Photo", "Estimation Report" };
                attachmentDtos = attachmentDtos.Where(a => !hiddenReportTypes.Contains(a.DocumentType)).ToList();
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
                BuildingType = request.BuildingType.ToString(),
                Purpose = request.Purpose == PurposeOfEstimation.ProjectFinance ? "Project Finance" : request.Purpose.ToString(),
                Type = request.Type.ToString(),
                Status = (int)request.Status,
                CreatedAt = request.CreatedAt,
                BranchUserId = request.BranchUserId,
                BranchUserName = request.BranchUser != null
                    ? $"{request.BranchUser.FirstName ?? string.Empty} {request.BranchUser.LastName ?? string.Empty}".Trim()
                    : string.Empty,
                ReportId = includeReport ? request.Report?.Id : null,
                AssignedEngineerId = request.AssignedEngineerId,
                AssignedEngineerName = request.AssignedEngineer != null
                    ? $"{request.AssignedEngineer.FirstName ?? string.Empty} {request.AssignedEngineer.LastName ?? string.Empty}".Trim()
                    : string.Empty,
                EngineerAssignmentDate = request.EngineerAssignmentDate,
                Location = $"{request.City}, {request.SubCity}, Kebele {request.Kebele}",
                Attachments = attachmentDtos,
                CheckerActionDate = request.CheckerActionDate,
                CheckerActionDescription = request.CheckerActionDescription,
                CheckerRejectionReason = request.CheckerRejectionReason,
                ManagerActionDate = request.ManagerActionDate,
                ManagerActionDescription = request.ManagerActionDescription,
                ManagerRejectionReason = request.ManagerRejectionReason
                ,
                ProjectFinanceDocType = request.ProjectFinanceDocType,
                BillOfPenalty = request.BillOfPenalty
            };
        }
    }
}