using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsService _reportsService;

        public ReportsController(IReportsService reportsService)
        {
            _reportsService = reportsService;
        }

        // =================================================================
        // REPORT CRUD ENDPOINTS
        // =================================================================

       [HttpGet("{estimationRequestId}")]
[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EngineeringReportResponseDto))]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> GetReportByRequestId(int estimationRequestId)
{
    try
    {
        var report = await _reportsService.GetReportByRequestIdAsync(estimationRequestId);
        if (report == null)
            return NotFound(new { message = "Report not found for this estimation request" });
        
        return Ok(report);
    }
    catch (Exception ex)
    {
        return NotFound(new { message = ex.Message });
    }
}

        [HttpPost]
        [Authorize(Roles = "EngineeringOfficer,EngineeringOfficer")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(EngineeringReportResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> CreateReport([FromBody] CreateEngineeringReportDto dto)
        {
            // Get the current user's ID from the JWT token
            var engineerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(engineerId))
                return Unauthorized(new { message = "User not authenticated" });

            try
            {
                var report = await _reportsService.CreateReportAsync(dto, engineerId);
                return CreatedAtAction(nameof(GetReportByRequestId), 
                    new { estimationRequestId = report.EstimationRequestId }, 
                    report);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{estimationRequestId}")]
        [Authorize(Roles = "EngineeringOfficer,EngineeringOfficer")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EngineeringReportResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateReport(int estimationRequestId, [FromBody] UpdateEngineeringReportDto dto)
        {
            // Get the current user's ID from the JWT token
            var engineerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(engineerId))
                return Unauthorized(new { message = "User not authenticated" });

            try
            {
                var report = await _reportsService.UpdateReportAsync(estimationRequestId, dto, engineerId);
                if (report == null)
                    return NotFound(new { message = "Report not found" });
                
                return Ok(report);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{estimationRequestId}")]
        [Authorize(Roles = "EngineeringOfficer,EngineeringOfficer,Manager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteReport(int estimationRequestId)
        {
            // Get the current user's ID from the JWT token
            var engineerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(engineerId))
                return Unauthorized(new { message = "User not authenticated" });

            var result = await _reportsService.DeleteReportAsync(estimationRequestId, engineerId);
            if (!result)
                return NotFound(new { message = "Report not found or you are not authorized to delete it" });
            
            return Ok(new { message = "Report deleted successfully" });
        }

        // =================================================================
        // DASHBOARD AND ANALYTICS ENDPOINTS (Existing)
        // =================================================================

        [HttpGet("dashboard-summary")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(DashboardSummaryDto))]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var summary = await _reportsService.GetDashboardSummaryAsync();
            return Ok(summary);
        }

        [HttpGet("status-distribution")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<StatusDistributionDto>))]
        public async Task<IActionResult> GetStatusDistribution()
        {
            var distribution = await _reportsService.GetStatusDistributionAsync();
            return Ok(distribution);
        }

        [HttpGet("branch-performance")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<BranchPerformanceDto>))]
        public async Task<IActionResult> GetBranchPerformance()
        {
            var performance = await _reportsService.GetBranchPerformanceAsync();
            return Ok(performance);
        }

        [HttpGet("monthly-trend")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<MonthlyTrendDto>))]
        public async Task<IActionResult> GetMonthlyTrend()
        {
            var trend = await _reportsService.GetMonthlyTrendAsync();
            return Ok(trend);
        }
    }
}