namespace backend.Models;

public class FilteredEstimationAttachment
{
    public int Id { get; set; }
    public int EstimationRequestId { get; set; }
    public int AttachmentId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }

    public EstimationRequest? EstimationRequest { get; set; }
    public Attachment? Attachment { get; set; }
}
