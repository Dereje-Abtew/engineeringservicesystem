namespace backend.Models;

using System;
using System.Collections.Generic;

public enum PurposeOfEstimation
{
    Mortgage,     // 0
    Guarantee,    // 1
    Loan,         // 2
    Foreclosure,  // 3
    ProjectFinance // 4
}

public enum TypeOfBuilding
{
    Condominium,  // 0
    Commercial,   // 1
    Residential,  // 2
    Industrial,   // 3
    MixedUse      // 4
}

public enum TypeOfEstimation
{
    NewEstimation,  // 0
    ReEstimation    // 1
}

public enum RequestStatus
{
    Pending = 0,
    CheckerApproved = 1,
    ManagerApproved = 2,
    AssignedToEngineer = 3,
    Estimated = 4,     // New - Engineer completed estimation
    Rejected = 5       // Changed from 4 to 5
}

public class EstimationRequest
{
    public int Id { get; set; }
    public string ApplicantName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string LHUNo { get; set; } = string.Empty;

    // Location Fields
    public string City { get; set; } = string.Empty;
    public string SubCity { get; set; } = string.Empty;
    public string Kebele { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public double PlotArea { get; set; }
    public TypeOfBuilding BuildingType { get; set; }
    public PurposeOfEstimation Purpose { get; set; }
    public TypeOfEstimation Type { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Foreign Keys & Relations
    public string? BranchUserId { get; set; }
    public ApplicationUser? BranchUser { get; set; }
    public List<Attachment> Attachments { get; set; } = new();
    public EngineeringReport? Report { get; set; }

    // Workflow Audit Fields
    public DateTime? CheckerActionDate { get; set; }
    public string? CheckerActionDescription { get; set; }
    public string? CheckerRejectionReason { get; set; }

    public DateTime? ManagerActionDate { get; set; }
    public string? ManagerActionDescription { get; set; }
    public string? ManagerRejectionReason { get; set; }

    // Engineer Assignment Fields
    public string? AssignedEngineerId { get; set; }
    public ApplicationUser? AssignedEngineer { get; set; }
    public DateTime? EngineerAssignmentDate { get; set; }
    public DateTime? EngineerActionDate { get; set; }
    public string? EngineerRejectionReason { get; set; }
    
    // Project Finance specific fields
    public string? ProjectFinanceDocType { get; set; }
    public bool? BillOfPenalty { get; set; }

    // Resend workflow fields - keep the workflow trail visible
    // after the maker edits & resubmits a rejected request.
    public string? LastRejectionReason { get; set; }
    public DateTime? LastRejectionDate { get; set; }
    public string? LastRejectionBy { get; set; }
    public DateTime? ResentAt { get; set; }
    public int ResendCount { get; set; } = 0;
}
