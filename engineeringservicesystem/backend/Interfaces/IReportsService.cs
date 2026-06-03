using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Services
{
    public interface IReportsService
    {
        // Report CRUD operations
        Task<EngineeringReportResponseDto?> GetReportByRequestIdAsync(int estimationRequestId);
        Task<EngineeringReportResponseDto> CreateReportAsync(CreateEngineeringReportDto dto, string engineerId);
        Task<EngineeringReportResponseDto> UpdateReportAsync(int estimationRequestId, UpdateEngineeringReportDto dto, string engineerId);
        Task<bool> DeleteReportAsync(int estimationRequestId, string engineerId);
        
        // Dashboard and Analytics
        Task<DashboardSummaryDto> GetDashboardSummaryAsync();
        Task<IEnumerable<StatusDistributionDto>> GetStatusDistributionAsync();
        Task<IEnumerable<BranchPerformanceDto>> GetBranchPerformanceAsync();
        Task<IEnumerable<MonthlyTrendDto>> GetMonthlyTrendAsync();
    }

    // --- Strongly Typed DTOs for Client/Server Integration ---

    public class DashboardSummaryDto
    {
        public int TotalRequests { get; set; }
        public int PendingRequests { get; set; }          // Status 0
        public int CheckerApprovedRequests { get; set; }  // Status 1
        public int ManagerApprovedRequests { get; set; }  // Status 2
        public int AssignedToEngineer { get; set; }       // Status 3
        public int RejectedRequests { get; set; }         // Status 4
        public int CompletedReports { get; set; }
        public double TotalEstimatedValue { get; set; }
    }

    public class StatusDistributionDto
    {
        public string Name { get; set; } = string.Empty;
        public int StatusValue { get; set; }
        public int Value { get; set; }
    }

    public class BranchPerformanceDto
    {
        public Guid? BranchId { get; set; }               // Changed from int to Guid?
        public string BranchName { get; set; } = string.Empty;
        public int TotalRequests { get; set; }
        public int CompletedRequests { get; set; }
        public int RejectedRequests { get; set; }
        public double AverageProcessingTime { get; set; }
    }

    public class MonthlyTrendDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int TotalRequests { get; set; }
        public int ApprovedRequests { get; set; }
        public int RejectedRequests { get; set; }
        public double AverageEstimatedValue { get; set; }
    }
}