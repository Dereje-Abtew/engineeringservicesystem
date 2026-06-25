namespace backend.Models;

public class Attachment
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty; // e.g., "ApprovedPlan", "BillOfQuantity", "ConstructionPermit", "LHC"

    public int EstimationRequestId { get; set; }
    public EstimationRequest? EstimationRequest { get; set; }

    // Track who uploaded this attachment (used for Final Estimation visibility)
    public string? UploadedById { get; set; }
    public ApplicationUser? UploadedBy { get; set; }
}
