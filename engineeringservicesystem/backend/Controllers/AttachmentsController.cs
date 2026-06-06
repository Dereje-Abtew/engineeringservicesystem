using backend.Constants;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AttachmentsController : ControllerBase
    {
        private readonly IAttachmentsService _attachmentsService;

        public AttachmentsController(IAttachmentsService attachmentsService)
        {
            _attachmentsService = attachmentsService;
        }

        [HttpPost("upload")]
        // [Authorize(Policy = Permissions.RequestsCreate)]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(AttachmentUploadResultDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Upload(IFormFile file, string? documentType = null)
        {
            var (isSuccess, errorMessage, result) = await _attachmentsService.UploadAttachmentAsync(file, documentType);

            if (!isSuccess)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(result);
        }
    }
}