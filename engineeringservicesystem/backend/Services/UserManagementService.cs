using backend.Data;
using backend.Enums;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Services
{
    public class UserManagementService : IUserManagementService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;

        public UserManagementService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        public async Task<IEnumerable<UserWithRolesDto>> GetUsersAsync()
        {
            var users = await _userManager.Users
                .Include(u => u.UserDepartment)
                .Include(u => u.UserBranch)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.DepartmentId,
                    DepartmentName = u.UserDepartment != null ? u.UserDepartment.Name : "",
                    u.BranchId,
                    BranchName = u.UserBranch != null ? u.UserBranch.Name : "",
                    u.EmployeeId,
                    u.Position,
                    u.PhoneNumber,
                    u.IsActive,
                    u.UserType
                })
                .ToListAsync();

            var usersWithRoles = new List<UserWithRolesDto>();
            foreach (var user in users)
            {
                var appUser = await _userManager.FindByIdAsync(user.Id);
                var roles = appUser != null ? await _userManager.GetRolesAsync(appUser) : new List<string>();

                usersWithRoles.Add(new UserWithRolesDto
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    DepartmentId = user.DepartmentId,
                    DepartmentName = user.DepartmentName,
                    BranchId = user.BranchId,
                    BranchName = user.BranchName,
                    EmployeeId = user.EmployeeId,
                    Position = user.Position,
                    PhoneNumber = user.PhoneNumber,
                    IsActive = user.IsActive,
                    UserType = user.UserType,
                    Roles = roles
                });
            }

            return usersWithRoles;
        }

        public async Task<UserWithRolesDto?> GetUserByIdAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return null;

            var roles = await _userManager.GetRolesAsync(user);

            return new UserWithRolesDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                DepartmentId = user.DepartmentId,
                BranchId = user.BranchId,
                EmployeeId = user.EmployeeId,
                Position = user.Position,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                UserType = user.UserType,
                Roles = roles
            };
        }

        // 💡 አዲስ የተጨመረው የኢንጂነሪንግ ኦፊሰሮችን መለያ ሜቶድ
        public async Task<IEnumerable<UserWithRolesDto>> GetEngineeringOfficersAsync()
        {
            // ሁሉንም ተጠቃሚዎች ከነ ሮላቸው ያመጣል
            var allUsers = await GetUsersAsync();
            
            // የ "EngineeringOfficer" ሮል ያላቸውን ብቻ ለይቶ ይመልሳል
            // ማስታወሻ፡ በዳታቤዝህ ላይ ያለው የሮል ስም በትክክል "EngineeringOfficer" መሆኑን አረጋግጥ
            return allUsers.Where(u => u.Roles.Contains("EngineeringOfficer", StringComparer.OrdinalIgnoreCase));
        }

        // UPDATED: Now consumes the RegisterUserDto contract safely
        public async Task<(bool Succeeded, IEnumerable<IdentityError>? Errors, string? ErrorMessage)> RegisterUserAsync(RegisterUserDto model)
        {
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
            {
                return (false, null, "User already exists!");
            }

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                DepartmentId = model.DepartmentId,
                BranchId = model.BranchId,
                EmployeeId = model.EmployeeId,
                Position = model.Position,
                PhoneNumber = model.PhoneNumber,
                IsActive = true, // Defaulting new user registration instances to active
                SecurityStamp = Guid.NewGuid().ToString(),
                UserType = model.UserType
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                return (false, result.Errors, "User creation failed!");
            }

            if (!string.IsNullOrEmpty(model.Role))
            {
                if (!await _roleManager.RoleExistsAsync(model.Role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(model.Role));
                }
                await _userManager.AddToRoleAsync(user, model.Role);
            }

            return (true, null, null);
        }

        // UPDATED: Now consumes the UpdateUserDto contract and matches signature tuple contract exactly
        public async Task<(bool Succeeded, IEnumerable<IdentityError>? Errors, string? ErrorMessage)> UpdateUserAsync(string id, UpdateUserDto model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return (false, null, "User record not found.");

            // SAFE EXTRA VALUE CHECK: Verify email isn't already allocated to a DIFFERENT user record id profile
            var emailOwner = await _userManager.FindByEmailAsync(model.Email);
            if (emailOwner != null && emailOwner.Id != id)
            {
                return (false, null, "Email address is already in use by another account.");
            }

            user.Email = model.Email;
            user.UserName = model.Email;
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.DepartmentId = model.DepartmentId;
            user.BranchId = model.BranchId;
            user.EmployeeId = model.EmployeeId;
            user.Position = model.Position;
            user.PhoneNumber = model.PhoneNumber;
            user.IsActive = model.IsActive;
            // Preserve existing UserType — the admin form does not expose this field
            // so the DTO always arrives as the default enum value (0).
            // Only update if the caller explicitly sends a non-zero value.
            if (model.UserType != 0)
                user.UserType = model.UserType;

            if (!string.IsNullOrEmpty(model.Role))
            {
                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, model.Role);
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return (false, result.Errors, "Failed to update user profile records.");

            return (true, null, null);
        }

        public async Task<bool> DeleteUserAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return false;

            // Nullify FK references so the delete doesn't violate constraints
            // EstimationRequests.BranchUserId and AssignedEngineerId reference this user
            var ownedRequests = await _context.EstimationRequests
                .Where(r => r.BranchUserId == id)
                .ToListAsync();
            foreach (var req in ownedRequests)
                req.BranchUserId = null;

            var assignedRequests = await _context.EstimationRequests
                .Where(r => r.AssignedEngineerId == id)
                .ToListAsync();
            foreach (var req in assignedRequests)
            {
                req.AssignedEngineerId = null;
                req.EngineerAssignmentDate = null;
            }

            // Nullify Department.HeadId if this user is a department head
            var ledDepartments = await _context.Departments
                .Where(d => d.HeadId == id)
                .ToListAsync();
            foreach (var dept in ledDepartments)
                dept.HeadId = null;

            // Nullify Branch.ManagerId if this user is a branch manager
            var managedBranches = await _context.Branches
                .Where(b => b.ManagerId == id)
                .ToListAsync();
            foreach (var branch in managedBranches)
                branch.ManagerId = null;

            await _context.SaveChangesAsync();

            var result = await _userManager.DeleteAsync(user);
            return result.Succeeded;
        }

        public async Task<(bool Succeeded, IEnumerable<IdentityError>? Errors)> ResetPasswordAsync(string id, ResetPasswordModel model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return (false, null);

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);
            
            return (result.Succeeded, result.Errors);
        }

        public async Task<IEnumerable<RoleResponse>> GetRolesAsync()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            var roleResponses = new List<RoleResponse>();

            foreach (var role in roles)
            {
                var claims = await _roleManager.GetClaimsAsync(role);
                roleResponses.Add(new RoleResponse
                {
                    Id = role.Id,
                    Name = role.Name ?? string.Empty,
                    Permissions = claims.Select(c => c.Value).ToList()
                });
            }

            return roleResponses;
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> CreateRoleAsync(RoleRequest model)
        {
            var roleExist = await _roleManager.RoleExistsAsync(model.Name);
            if (roleExist)
            {
                return (false, "Role already exists");
            }

            var role = new IdentityRole(model.Name);
            var result = await _roleManager.CreateAsync(role);

            if (result.Succeeded && model.Permissions != null)
            {
                foreach (var permission in model.Permissions)
                {
                    await _roleManager.AddClaimAsync(role, new Claim("Permission", permission));
                }
            }

            return (result.Succeeded, result.Succeeded ? null : "Failed to create role");
        }

        public async Task<(bool Succeeded, string? ErrorMessage)> UpdateRoleAsync(string id, RoleRequest model)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null) return (false, "Role not found");

            if (role.Name != model.Name)
            {
                var roleExist = await _roleManager.RoleExistsAsync(model.Name);
                if (roleExist) return (false, "Role already exists");

                role.Name = model.Name;
                await _roleManager.UpdateAsync(role);
            }

            var existingClaims = await _roleManager.GetClaimsAsync(role);
            foreach (var claim in existingClaims)
            {
                await _roleManager.RemoveClaimAsync(role, claim);
            }

            if (model.Permissions != null)
            {
                foreach (var permission in model.Permissions)
                {
                    await _roleManager.AddClaimAsync(role, new Claim("Permission", permission));
                }
            }

            return (true, null);
        }

        public async Task<(bool Succeeded, string? ErrorMessage, IEnumerable<IdentityError>? Errors)> DeleteRoleAsync(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null) return (false, "Role not found", null);

            if (role.Name == "Admin" || role.Name == "SystemAdmin")
            {
                return (false, "Cannot delete core system roles.", null);
            }

            // Remove all users from this role before deleting to avoid FK constraint errors
            if (role.Name != null)
            {
                var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name);
                foreach (var user in usersInRole)
                {
                    await _userManager.RemoveFromRoleAsync(user, role.Name);
                }
            }

            var result = await _roleManager.DeleteAsync(role);
            return (result.Succeeded, result.Succeeded ? null : "Failed to delete role", result.Errors);
        }

        public async Task<bool> UpdateRolePermissionsAsync(string id, List<string> permissions)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null) return false;

            var existingClaims = await _roleManager.GetClaimsAsync(role);
            foreach (var claim in existingClaims)
            {
                await _roleManager.RemoveClaimAsync(role, claim);
            }

            foreach (var permission in permissions)
            {
                await _roleManager.AddClaimAsync(role, new Claim("Permission", permission));
            }

            return true;
        }
    }
}