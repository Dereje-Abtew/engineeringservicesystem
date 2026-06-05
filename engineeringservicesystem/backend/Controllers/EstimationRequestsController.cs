using backend.Constants;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Authorize(Policy = Permissions.RequestsView)]
    [Route("api/[controller]")]
    [ApiController]
    public class EstimationRequestsController : ControllerBase
    {
        private readonly IEstimationRequestsService _requestsService;

        public EstimationRequestsController(IEstimationRequestsService requestsService)
        {
            _requestsService = requestsService;
        }

        // GET: api/EstimationRequests
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<EstimationRequestResponseDto>))]
        public async Task<ActionResult<IEnumerable<EstimationRequestResponseDto>>> GetEstimationRequests()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var requests = await _requestsService.GetRequestsAsync(userId, userRole);
            return Ok(requests);
        }

        // GET: api/EstimationRequests/5
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EstimationRequestResponseDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<EstimationRequestResponseDto>> GetEstimationRequest(int id)
        {
            var estimationRequestDto = await _requestsService.GetRequestByIdAsync(id);
            if (estimationRequestDto == null)
            {
                return NotFound();
            }

            return Ok(estimationRequestDto);
        }

        // POST: api/EstimationRequests
        [Authorize(Policy = Permissions.RequestsCreate)]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(EstimationRequestResponseDto))]
        public async Task<ActionResult<EstimationRequestResponseDto>> PostEstimationRequest([FromBody] CreateEstimationRequestDto requestDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var createdRequestDto = await _requestsService.CreateRequestAsync(requestDto, userId);
            return CreatedAtAction(nameof(GetEstimationRequest), new { id = createdRequestDto.Id }, createdRequestDto);
        }

        // POST: api/EstimationRequests/5/report
        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPost("{id}/report")] 
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PrepareReport(int id, [FromBody] CreateEngineeringReportDto reportDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var (succeeded, errorMessage) = await _requestsService.PrepareReportAsync(id, reportDto, userId);
            if (!succeeded)
            {
                if (errorMessage == "Id mismatch") return BadRequest(new { Message = errorMessage });
                return NotFound(new { Message = errorMessage });
            }

            return NoContent();
        }

        // PUT: api/EstimationRequests/5/status
        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPut("{id}/status")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] RequestStatus newStatus)
        {
            var updated = await _requestsService.UpdateStatusAsync(id, newStatus);
            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        // =================================================================
        // CHECKER WORKFLOW ENDPOINTS
        // =================================================================

        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPost("{id}/checker-approve")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CheckerApprove(int id, [FromBody] CheckerApproveDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _requestsService.CheckerApproveAsync(id, dto);
            if (!result) return NotFound(new { message = "Estimation request not found" });

            return Ok(new { message = "Request approved successfully by Checker" });
        }

        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPost("{id}/checker-reject")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CheckerReject(int id, [FromBody] CheckerRejectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _requestsService.CheckerRejectAsync(id, dto);
            if (!result) return NotFound(new { message = "Estimation request not found" });

            return Ok(new { message = "Request rejected successfully by Checker" });
        }

        // =================================================================
        // MANAGER WORKFLOW ENDPOINTS
        // =================================================================

        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPost("{id}/manager-approve")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ManagerApprove(int id, [FromBody] ManagerApproveDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _requestsService.ManagerApproveAsync(id, dto);
            if (!result) return NotFound(new { message = "Estimation request not found" });

            return Ok(new { message = "Request approved successfully by Manager" });
        }

        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPost("{id}/manager-reject")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ManagerReject(int id, [FromBody] ManagerRejectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _requestsService.ManagerRejectAsync(id, dto);
            if (!result) return NotFound(new { message = "Request rejected successfully by Manager" });

            return Ok(new { message = "Request rejected successfully by Manager" });
        }

        // =================================================================
        // MANAGER ASSIGN ENGINEERING OFFICER ENDPOINT
        // =================================================================

        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPost("{id}/assign")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AssignToEngineeringOfficer(int id, [FromBody] AssignOfficerRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.OfficerId))
            {
                return BadRequest(new { message = "Officer ID is required" });
            }

            var result = await _requestsService.AssignToEngineeringOfficerAsync(id, request.OfficerId);
            if (!result)
            {
                return NotFound(new { message = "Estimation request not found or cannot be assigned" });
            }

            return Ok(new { message = "Engineering officer assigned successfully" });
        }

        // =================================================================
        // MANAGER UNASSIGN ENGINEERING OFFICER ENDPOINT (NEW)
        // =================================================================

        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPost("{id}/unassign")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UnassignEngineeringOfficer(int id)
        {
            var result = await _requestsService.UnassignEngineeringOfficerAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Estimation request not found or no assignment to remove" });
            }

            return Ok(new { message = "Engineering officer unassigned successfully" });
        }

        // PUT: api/EstimationRequests/5/report
        [Authorize(Policy = Permissions.RequestsApprove)]
        [HttpPut("{id}/report")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateReport(int id, [FromBody] CreateEngineeringReportDto reportDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Reuse the same method - it handles both create and update
            var (succeeded, errorMessage) = await _requestsService.PrepareReportAsync(id, reportDto, userId);
            if (!succeeded)
            {
                if (errorMessage == "Id mismatch") return BadRequest(new { Message = errorMessage });
                return NotFound(new { Message = errorMessage });
            }

            return NoContent();
        }



    }
}

public record AssignOfficerRequest(string OfficerId);