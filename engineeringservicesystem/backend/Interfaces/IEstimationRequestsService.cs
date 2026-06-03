using backend.DTOs;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IEstimationRequestsService
    {
        // Returns clean response items instead of database models
        Task<IEnumerable<EstimationRequestResponseDto>> GetRequestsAsync(string userId, string? userRole);

        // Returns a clean response item or null
        Task<EstimationRequestResponseDto?> GetRequestByIdAsync(int id);

        // Accepts the incoming creation payload (with new fields), returns the finalized response schema
        Task<EstimationRequestResponseDto> CreateRequestAsync(CreateEstimationRequestDto dto, string userId);

        // Keeps report logic insulated
        Task<(bool Succeeded, string? ErrorMessage)> PrepareReportAsync(int id, EngineeringReport report, string userId);

        // Updates status using the DTO/Enum layer
        Task<bool> UpdateStatusAsync(int id, RequestStatus newStatus);

        // Checker specific methods
        Task<bool> CheckerApproveAsync(int id, CheckerApproveDto dto);
        Task<bool> CheckerRejectAsync(int id, CheckerRejectDto dto);

        // Manager specific methods
        Task<bool> ManagerApproveAsync(int id, ManagerApproveDto dto);
        Task<bool> ManagerRejectAsync(int id, ManagerRejectDto dto);

        // Engineering officer assignment methods
        Task<bool> AssignToEngineeringOfficerAsync(int id, string officerId);
        Task<(bool Succeeded, string? ErrorMessage)> UpdateReportAsync(int id, EngineeringReport report, string userId);

        // Engineering officer unassignment method (NEW)
        Task<bool> UnassignEngineeringOfficerAsync(int id);
    }
}