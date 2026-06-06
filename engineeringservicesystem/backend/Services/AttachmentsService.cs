using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Services
{
    public class AttachmentsService : IAttachmentsService
    {
        public async Task<(bool IsSuccess, string? ErrorMessage, AttachmentUploadResultDto? Result)> UploadAttachmentAsync(IFormFile file, string? documentType = null)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "No file was uploaded.", null);
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = documentType == "Relevant Photo"
                ? new[] { ".pdf", ".doc", ".docx" }
                : new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xlsx", ".xls", ".csv" };

            if (!allowedExtensions.Contains(extension))
            {
                var errorMsg = documentType == "Relevant Photo"
                    ? "Please convert your photo to PDF format. Allowed formats: PDF, DOC, DOCX."
                    : $"File type '{extension}' is not allowed.";
                return (false, errorMsg, null);
            }

            if (file.Length > 10 * 1024 * 1024)
            {
                return (false, "File size must not exceed 10MB.", null);
            }

            // Resolve uploads directory folder securely in the application root
            var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            Directory.CreateDirectory(uploadFolder);

            var uniqueName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadFolder, uniqueName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 'url' is what the frontend expects; 'filePath' is what we store in DB
            var relativeUrl = $"/uploads/{uniqueName}";
            
            var resultDto = new AttachmentUploadResultDto
            {
                Url = relativeUrl,
                FileName = file.FileName,
                FilePath = relativeUrl
            };

            return (true, null, resultDto);
        }
    }
}