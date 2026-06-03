using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using backend.Enums;

namespace backend.DTOs
{
    public class UserWithRolesDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public UserType UserType { get; set; }
        public Guid? DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public Guid? BranchId { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public bool IsActive { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }

    public class RegisterUserDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6, ErrorMessage = "Passwords must be at least 6 characters.")]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }
        [Required]
        public UserType UserType { get; set; }
        public Guid? DepartmentId { get; set; }
        public Guid? BranchId { get; set; }
        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public string? Role { get; set; }
    }

    public class UpdateUserDto
    {
        [Required]
        public string Id { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }
        [Required]
        public UserType UserType { get; set; }
        public Guid? DepartmentId { get; set; }
        public Guid? BranchId { get; set; }
        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public bool IsActive { get; set; }
        public string? Role { get; set; }
    }
}