using backend.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IUserManagementService
    {
        // User Operations
        Task<IEnumerable<UserWithRolesDto>> GetUsersAsync();
        Task<UserWithRolesDto?> GetUserByIdAsync(string id);
        
        // 💡 404 ስህተቱን በሰርቪስ ሌቨር ላይ በንጹህ መንገድ ለመፍታት የተጨመረ አዲስ ሜቶድ
        Task<IEnumerable<UserWithRolesDto>> GetEngineeringOfficersAsync();
        
        // UPDATED: Accepts the dedicated creation payload DTO
        Task<(bool Succeeded, IEnumerable<IdentityError>? Errors, string? ErrorMessage)> RegisterUserAsync(RegisterUserDto model);
        
        // UPDATED: Accepts the dedicated profile modification DTO
        Task<(bool Succeeded, IEnumerable<IdentityError>? Errors, string? ErrorMessage)> UpdateUserAsync(string id, UpdateUserDto model);
        
        Task<bool> DeleteUserAsync(string id);
        Task<(bool Succeeded, IEnumerable<IdentityError>? Errors)> ResetPasswordAsync(string id, ResetPasswordModel model);

        // Role & Permission Operations
        Task<IEnumerable<RoleResponse>> GetRolesAsync();
        Task<(bool Succeeded, string? ErrorMessage)> CreateRoleAsync(RoleRequest model);
        Task<(bool Succeeded, string? ErrorMessage)> UpdateRoleAsync(string id, RoleRequest model);
        Task<(bool Succeeded, string? ErrorMessage, IEnumerable<IdentityError>? Errors)> DeleteRoleAsync(string id);
        Task<bool> UpdateRolePermissionsAsync(string id, List<string> permissions);
    }

    // ==========================================
    // --- Data Transfer Objects (DTOs) ---------
    // ==========================================
    
    public class UserWithRolesDto
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        
        // FIXED: Guid? type matching database entity schema
        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        
        // FIXED: Guid? type matching database entity schema
        public Guid? BranchId { get; set; }
        public string? BranchName { get; set; }
        
        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public backend.Enums.UserType UserType { get; set; }
        public IEnumerable<string> Roles { get; set; } = new List<string>();
    }

    // NEW DTO: Used exclusively for Creating new users
    public class RegisterUserDto
    {
        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Passwords must be at least 6 characters long.")]
        public required string Password { get; set; }

        [Required(ErrorMessage = "First name is required.")]
        public required string FirstName { get; set; }

        [Required(ErrorMessage = "Last name is required.")]
        public required string LastName { get; set; }

        // FIXED: Guid? data type alignment
        public Guid? DepartmentId { get; set; }
        public Guid? BranchId { get; set; }

        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public string? PhoneNumber { get; set; }
        
        [Required(ErrorMessage = "User type assignment is required.")]
        public backend.Enums.UserType UserType { get; set; }
        
        public string? Role { get; set; }
    }

    // NEW DTO: Used exclusively for updating an existing user record
    public class UpdateUserDto
    {
        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "First name is required.")]
        public required string FirstName { get; set; }

        [Required(ErrorMessage = "Last name is required.")]
        public required string LastName { get; set; }

        // FIXED: Guid? data type alignment
        public Guid? DepartmentId { get; set; }
        public Guid? BranchId { get; set; }

        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }

        [Required(ErrorMessage = "User type assignment is required.")]
        public backend.Enums.UserType UserType { get; set; }
        
        public string? Role { get; set; }
    }

    public class ResetPasswordModel
    {
        [Required(ErrorMessage = "New password is required.")]
        [MinLength(6, ErrorMessage = "Passwords must be at least 6 characters long.")]
        public required string NewPassword { get; set; }
    }

    public class RoleRequest
    {
        [Required(ErrorMessage = "Role name is required.")]
        public required string Name { get; set; }
        public List<string>? Permissions { get; set; }
    }

    public class RoleResponse
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public List<string> Permissions { get; set; } = new List<string>();
    }
}