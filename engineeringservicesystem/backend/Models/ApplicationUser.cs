namespace backend.Models;
using Microsoft.AspNetCore.Identity;
using backend.Enums;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    public UserType UserType { get; set; }
    
    // For department and branch registration
    public Guid? DepartmentId { get; set; }
    public Department? UserDepartment { get; set; }
    
    public Guid? BranchId { get; set; }
    public Branch? UserBranch { get; set; }

    // Additional User Info
    public string? EmployeeId { get; set; }
    public string? Position { get; set; }
    public bool IsActive { get; set; } = true;
}
