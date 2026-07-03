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
    [Authorize]
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
        [Authorize(Policy = Permissions.RequestsView)]
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<EstimationRequestResponseDto>))]
        public async Task<ActionResult<IEnumerable<EstimationRequestResponseDto>>> GetEstimationRequests()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var userPermissions = User.FindAll("Permission")
                .Concat(User.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/permission"))
                .Select(c => c.Value)
                .ToList();

            var isAdminOrSystemAdmin = User.IsInRole("Admin") || User.IsInRole("SystemAdmin");
            var requests = await _requestsService.GetRequestsAsync(userId, userPermissions, isAdminOrSystemAdmin);
            return Ok(requests);
        }

        // GET: api/EstimationRequests/historical-locations
        [Authorize]
        [HttpGet("historical-locations")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(LocationHistoricalDto))]
        public async Task<ActionResult<LocationHistoricalDto>> GetHistoricalLocations()
        {
            var result = await _requestsService.GetHistoricalLocationsAsync();
            return Ok(result);
        }

        // GET: api/EstimationRequests/check-lhc?lhcNo=xxx
        [Authorize]
        [HttpGet("check-lhc")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(LhcCheckResultDto))]
        public async Task<ActionResult<LhcCheckResultDto>> CheckLhc([FromQuery] string lhcNo)
        {
            var result = await _requestsService.CheckLhcWithMetadataAsync(lhcNo);
            return Ok(result);
        }

        // GET: api/EstimationRequests/5
        [Authorize(Policy = Permissions.RequestsView)]
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EstimationRequestResponseDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<EstimationRequestResponseDto>> GetEstimationRequest(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var userPermissions = User.FindAll("Permission")
                .Concat(User.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/permission"))
                .Select(c => c.Value)
                .ToList();

            var isAdminOrSystemAdmin = User.IsInRole("Admin") || User.IsInRole("SystemAdmin");
            var estimationRequestDto = await _requestsService.GetRequestByIdAsync(id, userId, userPermissions, isAdminOrSystemAdmin);
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
        [Authorize(Policy = Permissions.RequestsEstimate)]
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
            if (!result) return NotFound(new { message = "Estimation request not found" });

            return Ok(new { message = "Request rejected successfully by Manager" });
        }

        // =================================================================
        // MANAGER FINAL ESTIMATION UPLOAD ENDPOINT
        // =================================================================

        [Authorize(Policy = Permissions.RequestsUploadFinalEstimation)]
        [HttpPost("{id}/final-estimation")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UploadFinalEstimation(int id, [FromBody] List<AttachmentUploadDto> attachments)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var (succeeded, errorMessage) = await _requestsService.UploadFinalEstimationAsync(id, attachments, userId);
            if (!succeeded)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { message = "Final estimation uploaded successfully" });
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

        // =================================================================
        // ENGINEER REJECT ENDPOINT
        // =================================================================
        [Authorize(Policy = Permissions.RequestsAssignReject)]
        [HttpPost("{id}/engineer-reject")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EngineerReject(int id, [FromBody] EngineerRejectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _requestsService.EngineerRejectAsync(id, dto);
            if (!result) return NotFound(new { message = "Estimation request not found or not assigned to an engineer" });

            return Ok(new { message = "Request rejected successfully by Engineering Officer" });
        }

        // PUT: api/EstimationRequests/5/report
        [Authorize(Policy = Permissions.RequestsEstimate)]
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

        // =================================================================
        // UPDATE (Maker editing a pending request)
        // The maker can edit their request while it is still pending (before
        // the Checker acts). This updates editable fields without changing
        // the workflow status.
        // =================================================================
        [Authorize(Policy = Permissions.RequestsEdit)]
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EstimationRequestResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<EstimationRequestResponseDto>> Update(int id, [FromBody] UpdateEstimationRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            if (dto == null)
            {
                return BadRequest(new { message = "Update payload is required" });
            }

            dto.Id = id;
            var (succeeded, errorMessage) = await _requestsService.UpdateRequestAsync(id, dto, userId);
            if (!succeeded)
            {
                if (string.Equals(errorMessage, "Estimation request not found", System.StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = errorMessage });
                }
                return BadRequest(new { message = errorMessage });
            }

            // Return the updated entity so the client can refresh its state
            var userPermissions = User.FindAll("Permission")
                .Concat(User.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/permission"))
                .Select(c => c.Value)
                .ToList();
            var isAdminOrSystemAdmin = User.IsInRole("Admin") || User.IsInRole("SystemAdmin");

            var updated = await _requestsService.GetRequestByIdAsync(id, userId, userPermissions, isAdminOrSystemAdmin);
            return Ok(updated);
        }

        // =================================================================
        // RESEND (Edit & Resubmit) ENDPOINT
        // The maker edits a rejected request and re-submits it. The
        // status is reset to Pending (0) so the workflow restarts at
        // the Checker step. The rejection reason/date remain in the
        // audit trail (LastRejection* fields) so the workflow is
        // preserved and visible across the resend.
        // =================================================================
        [Authorize(Policy = Permissions.RequestsCreate)]
        [HttpPost("{id}/resend")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EstimationRequestResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<EstimationRequestResponseDto>> Resend(int id, [FromBody] UpdateEstimationRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            if (dto == null)
            {
                return BadRequest(new { message = "Update payload is required" });
            }

            dto.Id = id;
            var (succeeded, errorMessage) = await _requestsService.ResendRequestAsync(id, dto, userId);
            if (!succeeded)
            {
                if (string.Equals(errorMessage, "Estimation request not found", System.StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = errorMessage });
                }
                return BadRequest(new { message = errorMessage });
            }

            // Return the updated entity so the client can refresh its state
            var userPermissions = User.FindAll("Permission")
                .Concat(User.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/permission"))
                .Select(c => c.Value)
                .ToList();
            var isAdminOrSystemAdmin = User.IsInRole("Admin") || User.IsInRole("SystemAdmin");

            var updated = await _requestsService.GetRequestByIdAsync(id, userId, userPermissions, isAdminOrSystemAdmin);
            return Ok(updated);
        }
    }
}

public record AssignOfficerRequest(string OfficerId);
