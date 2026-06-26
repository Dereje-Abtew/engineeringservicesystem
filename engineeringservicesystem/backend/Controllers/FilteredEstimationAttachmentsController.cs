using backend.Constants;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FilteredEstimationAttachmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FilteredEstimationAttachmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/FilteredEstimationAttachments/by-request/5
        // Returns the list of filtered attachment ids for a specific request
        [Authorize(Policy = Permissions.RequestsViewEstimation)]
        [HttpGet("by-request/{estimationRequestId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IEnumerable<int>>> GetFilteredAttachmentIds(int estimationRequestId)
        {
            var requestExists = await _context.EstimationRequests.AnyAsync(e => e.Id == estimationRequestId);
            if (!requestExists)
            {
                return NotFound(new { message = "Estimation request not found" });
            }

            var ids = await _context.FilteredEstimationAttachments
                .Where(f => f.EstimationRequestId == estimationRequestId)
                .Select(f => f.AttachmentId)
                .ToListAsync();

            return Ok(ids);
        }

        // POST: api/FilteredEstimationAttachments
        // Body: { estimationRequestId, attachmentIds: [...] }
        // Replaces all selected filter records for the given request with the provided list.
        [Authorize(Policy = Permissions.RequestsViewEstimation)]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SaveFilteredAttachments([FromBody] SaveFilteredAttachmentsDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Invalid payload" });
            }

            var requestExists = await _context.EstimationRequests.AnyAsync(e => e.Id == dto.EstimationRequestId);
            if (!requestExists)
            {
                return NotFound(new { message = "Estimation request not found" });
            }

            // Estimation document types (Excel, Report, Photo) - the only ones that can be selected
            var estimationDocumentTypes = new[] { "Estimation Excel", "Relevant Photo", "Estimation Report" };

            // Validate the attachment ids belong to this request AND are estimation documents
            var validAttachments = await _context.Attachments
                .Where(a => a.EstimationRequestId == dto.EstimationRequestId
                            && estimationDocumentTypes.Contains(a.DocumentType))
                .Select(a => a.Id)
                .ToListAsync();

            var incomingIds = (dto.AttachmentIds ?? new List<int>()).Distinct().ToList();
            var invalid = incomingIds.Where(id => !validAttachments.Contains(id)).ToList();
            if (invalid.Any())
            {
                return BadRequest(new { message = $"Invalid attachment ids: {string.Join(", ", invalid)}" });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Only the assigned engineer can send filtered estimation attachments
            var estimationRequest = await _context.EstimationRequests
                .FirstOrDefaultAsync(e => e.Id == dto.EstimationRequestId);
            if (estimationRequest == null)
            {
                return NotFound(new { message = "Estimation request not found" });
            }
            if (estimationRequest.AssignedEngineerId != userId)
            {
                return BadRequest(new { message = "Only the assigned engineering officer can send the estimation report" });
            }

            // Remove existing filter rows for this request
            var existing = await _context.FilteredEstimationAttachments
                .Where(f => f.EstimationRequestId == dto.EstimationRequestId)
                .ToListAsync();
            if (existing.Any())
            {
                _context.FilteredEstimationAttachments.RemoveRange(existing);
            }

            // Add new rows
            foreach (var attachmentId in incomingIds)
            {
                _context.FilteredEstimationAttachments.Add(new FilteredEstimationAttachment
                {
                    EstimationRequestId = dto.EstimationRequestId,
                    AttachmentId = attachmentId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Filtered attachments saved", count = incomingIds.Count });
        }

        // DELETE: api/FilteredEstimationAttachments/by-request/5
        [Authorize(Policy = Permissions.RequestsViewEstimation)]
        [HttpDelete("by-request/{estimationRequestId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ClearFilteredAttachments(int estimationRequestId)
        {
            var existing = await _context.FilteredEstimationAttachments
                .Where(f => f.EstimationRequestId == estimationRequestId)
                .ToListAsync();

            if (!existing.Any())
            {
                return Ok(new { message = "No filtered attachments to clear" });
            }

            _context.FilteredEstimationAttachments.RemoveRange(existing);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Filtered attachments cleared", count = existing.Count });
        }
    }

    public class SaveFilteredAttachmentsDto
    {
        public int EstimationRequestId { get; set; }
        public List<int> AttachmentIds { get; set; } = new();
    }
}
