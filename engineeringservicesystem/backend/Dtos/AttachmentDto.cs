namespace backend.Models;

public class AttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public int EstimationRequestId { get; set; }
}