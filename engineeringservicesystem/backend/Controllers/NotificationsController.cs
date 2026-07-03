using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        // Use shared NotificationCenter service
        static NotificationsController()
        {
            // seed a helpful sample
            backend.Services.NotificationCenter.Create("Welcome", "Notification system ready", Array.Empty<string>(), Array.Empty<string>());
        }

        // GET: api/Notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToArray();

            // Get user's branchId if available (for branch manager filtering)
            string? userBranchId = null;
            var dbContext = HttpContext.RequestServices.GetService(typeof(backend.Data.ApplicationDbContext)) as backend.Data.ApplicationDbContext;
            if (dbContext != null)
            {
                var user = await dbContext.Users.FindAsync(userId);
                userBranchId = user?.BranchId?.ToString();
            }

            // delegate to NotificationCenter with branchId
            var results = backend.Services.NotificationCenter.GetForUser(userId, roles, userBranchId).ToList();
            return Ok(results);
        }

        // POST: api/Notifications/{id}/mark-read
        [HttpPost("{id}/mark-read")]
        public ActionResult MarkRead(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var ok = backend.Services.NotificationCenter.MarkRead(id, userId);
            if (!ok) return NotFound();
            return NoContent();
        }

        // For demo: POST api/Notifications (create notification)
        [HttpPost]
        public ActionResult<NotificationDto> Create([FromBody] NotificationDto dto)
        {
            var created = backend.Services.NotificationCenter.Create(dto.Title, dto.Message, dto.TargetRoles ?? Array.Empty<string>(), dto.RecommendedUserIds ?? Array.Empty<string>());
            return CreatedAtAction(nameof(GetNotifications), new { id = created.Id }, created);
        }
    }
}
