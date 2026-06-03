namespace backend.Models;

using System.ComponentModel.DataAnnotations;

public class LoginModel
{
    [Required]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RegisterModel
{
    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    public Guid? DepartmentId { get; set; }
    public Guid? BranchId { get; set; }

    [Required]
    public string Role { get; set; } = string.Empty; // "Department", "Branch", "EngineeringOffice"

    public string? EmployeeId { get; set; }
    public string? Position { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;
}
