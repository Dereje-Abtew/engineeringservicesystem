using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Services
{
    public class ReportsService : IReportsService
    {
        private readonly ApplicationDbContext _context;

        public ReportsService(ApplicationDbContext context)
        {
            _context = context;
        }

        // =================================================================
        // REPORT CRUD OPERATIONS
        // =================================================================

        public async Task<EngineeringReportResponseDto?> GetReportByRequestIdAsync(int estimationRequestId)
        {
            var report = await _context.EngineeringReports
                .Include(r => r.AssignedEngineer)
                .Include(r => r.EstimationRequest)
                .FirstOrDefaultAsync(r => r.EstimationRequestId == estimationRequestId);

            return report == null ? null : MapToResponseDto(report);
        }

        public async Task<EngineeringReportResponseDto> CreateReportAsync(CreateEngineeringReportDto dto, string engineerId)
{
    // Verify the request exists and is assigned to this engineer
    var estimationRequest = await _context.EstimationRequests
        .FirstOrDefaultAsync(r => r.Id == dto.EstimationRequestId);

    if (estimationRequest == null)
        throw new Exception("Estimation request not found");

    if (estimationRequest.AssignedEngineerId != engineerId)
        throw new Exception("You are not assigned to this request");

    // Verify status is AssignedToEngineer (3)
    if (estimationRequest.Status != RequestStatus.AssignedToEngineer)
        throw new Exception($"Request is not in assigned status. Current status: {estimationRequest.Status}");

    var report = new EngineeringReport
    {
        EstimationRequestId = dto.EstimationRequestId,
        AssignedEngineerId = engineerId,
        SiteVisitDate = dto.SiteVisitDate,
        Remarks = dto.Remarks,
        EstimatedValue = dto.EstimatedValue,
        CreatedAt = DateTime.UtcNow
    };

    _context.EngineeringReports.Add(report);
    
    // UPDATE: Change status from AssignedToEngineer (3) to Estimated (4)
    estimationRequest.Status = RequestStatus.Estimated; // Make sure this enum value exists (4)
    
    await _context.SaveChangesAsync();

    return await GetReportByRequestIdAsync(report.EstimationRequestId) ?? MapToResponseDto(report);
}

        public async Task<EngineeringReportResponseDto> UpdateReportAsync(int estimationRequestId, UpdateEngineeringReportDto dto, string engineerId)
{
    var report = await _context.EngineeringReports
        .FirstOrDefaultAsync(r => r.EstimationRequestId == estimationRequestId);

    if (report == null)
        throw new Exception("Report not found");

    if (report.AssignedEngineerId != engineerId)
        throw new Exception("You are not authorized to update this report");

    if (dto.SiteVisitDate.HasValue)
        report.SiteVisitDate = dto.SiteVisitDate.Value;

    if (!string.IsNullOrEmpty(dto.Remarks))
        report.Remarks = dto.Remarks;

    if (dto.EstimatedValue.HasValue)
        report.EstimatedValue = dto.EstimatedValue.Value;

    // Optional: Update a "LastUpdatedAt" field if you have one
    // report.LastUpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return await GetReportByRequestIdAsync(estimationRequestId) ?? MapToResponseDto(report);
}

        public async Task<bool> DeleteReportAsync(int estimationRequestId, string engineerId)
        {
            var report = await _context.EngineeringReports
                .FirstOrDefaultAsync(r => r.EstimationRequestId == estimationRequestId);

            if (report == null)
                return false;

            if (report.AssignedEngineerId != engineerId)
                return false;

            _context.EngineeringReports.Remove(report);
            await _context.SaveChangesAsync();
            return true;
        }

        // =================================================================
        // DASHBOARD AND ANALYTICS
        // =================================================================

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
        {
            var totalRequests = await _context.EstimationRequests.CountAsync();

            // Status 0 - Pending (Maker sent to Checker)
            var pendingRequests = await _context.EstimationRequests
                .CountAsync(r => r.Status == RequestStatus.Pending);

            // Status 1 - CheckerApproved (Waiting for Manager)
            var checkerApprovedRequests = await _context.EstimationRequests
                .CountAsync(r => r.Status == RequestStatus.CheckerApproved);

            // Status 2 - ManagerApproved (Ready for assignment)
            var managerApprovedRequests = await _context.EstimationRequests
                .CountAsync(r => r.Status == RequestStatus.ManagerApproved);

            // Status 3 - AssignedToEngineer
            var assignedToEngineer = await _context.EstimationRequests
                .CountAsync(r => r.Status == RequestStatus.AssignedToEngineer);

            // Status 4 - Rejected
            var rejectedRequests = await _context.EstimationRequests
                .CountAsync(r => r.Status == RequestStatus.Rejected);

            // Reports completed
            var completedReports = await _context.EngineeringReports.CountAsync();

            // Total estimated value from all reports
            var totalEstimatedValue = await _context.EngineeringReports
                .SumAsync(r => r.EstimatedValue);

            return new DashboardSummaryDto
            {
                TotalRequests = totalRequests,
                PendingRequests = pendingRequests,
                CheckerApprovedRequests = checkerApprovedRequests,
                ManagerApprovedRequests = managerApprovedRequests,
                AssignedToEngineer = assignedToEngineer,
                RejectedRequests = rejectedRequests,
                CompletedReports = completedReports,
                TotalEstimatedValue = totalEstimatedValue
            };
        }

        public async Task<IEnumerable<StatusDistributionDto>> GetStatusDistributionAsync()
        {
            var distribution = await _context.EstimationRequests
                .GroupBy(r => r.Status)
                .Select(g => new StatusDistributionDto
                {
                    Name = GetStatusName(g.Key),
                    StatusValue = (int)g.Key,
                    Value = g.Count()
                })
                .OrderBy(d => d.StatusValue)
                .ToListAsync();

            return distribution;
        }

        public async Task<IEnumerable<BranchPerformanceDto>> GetBranchPerformanceAsync()
        {
            var performance = await _context.EstimationRequests
                .Where(r => r.BranchUser != null && r.BranchUser.UserBranch != null)
                .GroupBy(r => new
                {
                    BranchId = r.BranchUser!.BranchId,
                    BranchName = r.BranchUser.UserBranch != null ? r.BranchUser.UserBranch.Name : "Unknown"
                })
                .Select(g => new BranchPerformanceDto
                {
                    BranchId = g.Key.BranchId,
                    BranchName = g.Key.BranchName,
                    TotalRequests = g.Count(),
                    CompletedRequests = g.Count(r => r.Status == RequestStatus.AssignedToEngineer && r.Report != null),
                    RejectedRequests = g.Count(r => r.Status == RequestStatus.Rejected),
                    AverageProcessingTime = CalculateAverageProcessingTime(g)
                })
                .OrderByDescending(b => b.TotalRequests)
                .Take(10)
                .ToListAsync();

            return performance;
        }

        public async Task<IEnumerable<MonthlyTrendDto>> GetMonthlyTrendAsync()
        {
            var currentYear = DateTime.UtcNow.Year;
            var startDate = new DateTime(currentYear, 1, 1);
            var endDate = new DateTime(currentYear, 12, 31);

            var monthlyData = await _context.EstimationRequests
                .Where(r => r.CreatedAt >= startDate && r.CreatedAt <= endDate)
                .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    TotalRequests = g.Count(),
                    ApprovedRequests = g.Count(r => r.Status == RequestStatus.ManagerApproved || r.Status == RequestStatus.AssignedToEngineer),
                    RejectedRequests = g.Count(r => r.Status == RequestStatus.Rejected),
                    AverageEstimatedValue = g.Where(r => r.Report != null).Average(r => r.Report != null ? r.Report.EstimatedValue : 0)
                })
                .OrderBy(m => m.Year)
                .ThenBy(m => m.Month)
                .ToListAsync();

            return monthlyData.Select(m => new MonthlyTrendDto
            {
                Year = m.Year,
                Month = m.Month,
                MonthName = GetMonthName(m.Month),
                TotalRequests = m.TotalRequests,
                ApprovedRequests = m.ApprovedRequests,
                RejectedRequests = m.RejectedRequests,
                AverageEstimatedValue = m.AverageEstimatedValue
            });
        }

        // =================================================================
        // PRIVATE HELPER METHODS
        // =================================================================

        private static double CalculateAverageProcessingTime(IGrouping<dynamic, EstimationRequest> group)
        {
            var completedRequests = group.Where(r => r.Status == RequestStatus.AssignedToEngineer && r.Report != null);
            if (!completedRequests.Any()) return 0;

            var avgDays = completedRequests
                .Select(r => (r.Report!.CreatedAt - r.CreatedAt).TotalDays)
                .Average();

            return Math.Round(avgDays, 2);
        }

        private static string GetMonthName(int month)
        {
            return System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
        }

        private static string GetStatusName(RequestStatus status)
        {
            return status switch
            {
                RequestStatus.Pending => "Pending",
                RequestStatus.CheckerApproved => "Checker Approved",
                RequestStatus.ManagerApproved => "Manager Approved",
                RequestStatus.AssignedToEngineer => "Assigned to Engineer",
                RequestStatus.Rejected => "Rejected",
                _ => status.ToString()
            };
        }

        private EngineeringReportResponseDto MapToResponseDto(EngineeringReport report)
        {
            return new EngineeringReportResponseDto
            {
                Id = report.Id,
                EstimationRequestId = report.EstimationRequestId,
                AssignedEngineerId = report.AssignedEngineerId,
                AssignedEngineerName = report.AssignedEngineer != null
                    ? $"{report.AssignedEngineer.FirstName ?? string.Empty} {report.AssignedEngineer.LastName ?? string.Empty}".Trim()
                    : string.Empty,
                SiteVisitDate = report.SiteVisitDate,
                Remarks = report.Remarks,
                EstimatedValue = report.EstimatedValue,
                CreatedAt = report.CreatedAt,
                ApplicantName = report.EstimationRequest?.ApplicantName,
                LHUNo = report.EstimationRequest?.LHUNo,
                PropertyLocation = $"{report.EstimationRequest?.City}, {report.EstimationRequest?.SubCity}"
            };
        }
    }
}