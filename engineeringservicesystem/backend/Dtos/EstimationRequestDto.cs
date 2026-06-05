using System.ComponentModel.DataAnnotations;
using System;
using System.Collections.Generic;
using backend.Models;

namespace backend.DTOs
{
    public class EstimationRequestResponseDto
    {
        public int Id { get; set; }
        public string ApplicantName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string LHUNo { get; set; } = string.Empty;

        // Location details
        public string City { get; set; } = string.Empty;
        public string SubCity { get; set; } = string.Empty;
        public string Kebele { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public double PlotArea { get; set; }
        public string BuildingType { get; set; } = string.Empty;  // String, not enum
        public string Purpose { get; set; } = string.Empty;       // String, not enum
        public string Type { get; set; } = string.Empty;          // String, not enum
        public int Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public string? BranchUserId { get; set; }
        public string? BranchUserName { get; set; }

        public List<AttachmentDto> Attachments { get; set; } = new();
        public int? ReportId { get; set; }

        // Project Finance fields
        public string? ProjectFinanceDocType { get; set; }
        public bool? BillOfPenalty { get; set; }

        public string? AssignedEngineerId { get; set; }
        public string? AssignedEngineerName { get; set; }
        public DateTime? EngineerAssignmentDate { get; set; }

        public DateTime? CheckerActionDate { get; set; }
        public string? CheckerActionDescription { get; set; }
        public string? CheckerRejectionReason { get; set; }
        public DateTime? ManagerActionDate { get; set; }
        public string? ManagerActionDescription { get; set; }
        public string? ManagerRejectionReason { get; set; }
    }

    public class CreateEstimationRequestDto
    {
        [Required] public string ApplicantName { get; set; } = string.Empty;
        [Required] public string OwnerName { get; set; } = string.Empty;
        [Required] public string LHUNo { get; set; } = string.Empty;
        
        [Required] public string City { get; set; } = string.Empty;
        [Required] public string SubCity { get; set; } = string.Empty;
        [Required] public string Kebele { get; set; } = string.Empty;
        [Required] public double Latitude { get; set; }
        [Required] public double Longitude { get; set; }

        [Required] public double PlotArea { get; set; }
        
        [Required] 
        public string BuildingType { get; set; } = string.Empty;  // String like "Condominium", "Commercial"
        
        [Required] 
        public string Purpose { get; set; } = string.Empty;       // String like "Mortgage", "Guarantee", "Loan", "Foreclosure"
        
        [Required] 
        public string Type { get; set; } = string.Empty;          // String like "NewEstimation", "ReEstimation"
        
        public string? BranchUserId { get; set; }
        
        public List<AttachmentUploadDto> Attachments { get; set; } = new();
        // Project Finance fields (optional)
        public string? ProjectFinanceDocType { get; set; }
        public bool? BillOfPenalty { get; set; }
    }

    public class UpdateEstimationRequestDto
    {
        public int Id { get; set; }
        public string ApplicantName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string LHUNo { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string SubCity { get; set; } = string.Empty;
        public string Kebele { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double PlotArea { get; set; }
        public string BuildingType { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class AttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
    }

    public class AttachmentUploadDto
    {
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
    }

    // Workflow DTOs
    public class CheckerApproveDto
    {
        [Required] public DateTime CheckerApprovalDate { get; set; }
        [Required] public string CheckerDescription { get; set; } = string.Empty;
    }

    public class CheckerRejectDto
    {
        [Required] public DateTime CheckerRejectionDate { get; set; }
        [Required] public string CheckerReason { get; set; } = string.Empty;
    }

    public class ManagerApproveDto
    {
        [Required] public DateTime ManagerApprovalDate { get; set; }
        [Required] public string ManagerDescription { get; set; } = string.Empty;
    }

    public class ManagerRejectDto
    {
        [Required] public DateTime ManagerRejectionDate { get; set; }
        [Required] public string ManagerReason { get; set; } = string.Empty;
    }

    public class AssignToEngineerDto
    {
        [Required] public string EngineerId { get; set; } = string.Empty;
        [Required] public DateTime AssignmentDate { get; set; }
    }
}