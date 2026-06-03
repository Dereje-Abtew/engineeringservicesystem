namespace backend.Models;

using System;
using System.Collections.Generic;

public enum PurposeOfEstimation
{
    Mortgage,     // 0
    Guarantee,    // 1
    Loan,         // 2
    Foreclosure   // 3
}

public enum TypeOfBuilding
{
    Condominium,  // 0
    Commercial    // 1
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
}