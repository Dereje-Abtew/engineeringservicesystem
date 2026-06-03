namespace backend.DTOs;

using System;
using System.ComponentModel.DataAnnotations;

public class CreateEngineeringReportDto
{
    [Required]
    public int EstimationRequestId { get; set; }
    
    [Required]
    public DateTime SiteVisitDate { get; set; }
    
    [Required]
    [StringLength(1000, MinimumLength = 1, ErrorMessage = "Remarks must be between 1 and 1000 characters")]
    public string Remarks { get; set; } = string.Empty;
    
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Estimated value must be a positive number")]
    public double EstimatedValue { get; set; }
}

public class UpdateEngineeringReportDto
{
    public DateTime? SiteVisitDate { get; set; }
    
    [StringLength(1000, ErrorMessage = "Remarks cannot exceed 1000 characters")]
    public string? Remarks { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Estimated value must be a positive number")]
    public double? EstimatedValue { get; set; }
}

public class EngineeringReportResponseDto
{
    public int Id { get; set; }
    public int EstimationRequestId { get; set; }
    public string? AssignedEngineerId { get; set; }
    public string? AssignedEngineerName { get; set; }
    public DateTime? SiteVisitDate { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public double EstimatedValue { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Include basic estimation request info for context
    public string? ApplicantName { get; set; }
    public string? LHUNo { get; set; }
    public string? PropertyLocation { get; set; }
}