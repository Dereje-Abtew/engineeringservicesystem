namespace backend.Models;

using System;

public class EngineeringReport
{
    public int Id { get; set; }
    
    // The user from engineering office who prepared it
    public string? AssignedEngineerId { get; set; }
    public ApplicationUser? AssignedEngineer { get; set; }

    public DateTime? SiteVisitDate { get; set; }
    public string Remarks { get; set; } = string.Empty;
    
    public double EstimatedValue { get; set; } // The valuation

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int EstimationRequestId { get; set; }
    public EstimationRequest? EstimationRequest { get; set; }
}
