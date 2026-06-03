using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IAttachmentsService
    {
        Task<(bool IsSuccess, string? ErrorMessage, AttachmentUploadResultDto? Result)> UploadAttachmentAsync(IFormFile file);
    }

    // --- Strongly Typed Response DTO for API Stability ---
    public class AttachmentUploadResultDto
    {
        public required string Url { get; set; }
        public required string FileName { get; set; }
        public required string FilePath { get; set; }
    }
}