// Data/SeedData.cs

using Microsoft.AspNetCore.Identity;
using backend.Models;
using backend.Enums;
using backend.Constants;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace backend.Data 
{
    public static class SeedData
    {
        public static async Task Initialize(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            // Create roles
            string[] roleNames = { "Admin", "EngineeringManager", "EngineeringOfficer", "BranchManager" };
            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }

                var role = await roleManager.FindByNameAsync(roleName);
                if (role == null) continue;

                var existingClaims = await roleManager.GetClaimsAsync(role);

                // Assign permissions based on role
                var permissionsToAssign = new List<string>();

                if (roleName == "Admin")
                {
                    // Admin gets EVERYTHING
                    permissionsToAssign = typeof(Permissions).GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy)
                        .Where(f => f.IsLiteral && !f.IsInitOnly)
                        .Select(f => f.GetValue(null)?.ToString())
                        .Where(v => v != null)
                        .Select(v => v!)
                        .ToList();
                }
                else if (roleName == "Checker")
                {
                    // Legacy role - kept for backward compatibility only, no longer seeded
                    // Use BranchManager instead
                }
                else if (roleName == "Maker")
                {
                    // Legacy role - kept for backward compatibility only, no longer seeded
                    // Use BranchManager instead
                }
                else if (roleName == "EngineeringManager")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewAll);
                    permissionsToAssign.Add(Permissions.RequestsApprove);
                    permissionsToAssign.Add(Permissions.RequestsReject);
                    permissionsToAssign.Add(Permissions.RequestsAssign);
                    permissionsToAssign.Add(Permissions.RequestsManageEngineersWorkLoad);
                    permissionsToAssign.Add(Permissions.RequestsUploadFinalEstimation);
                    permissionsToAssign.Add(Permissions.RequestsViewFilteredEstimation);
                    permissionsToAssign.Add(Permissions.RequestsViewEstimation);
                    permissionsToAssign.Add(Permissions.WorkflowTimelineView);
                }
                else if (roleName == "EngineeringOfficer")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewAssigned);
                    permissionsToAssign.Add(Permissions.RequestsEdit);
                    permissionsToAssign.Add(Permissions.RequestsEstimate);
                    permissionsToAssign.Add(Permissions.WorkflowTimelineView);
                }
                else if (roleName == "BranchManager")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewBranch);
                    permissionsToAssign.Add(Permissions.RequestsCreate);
                    permissionsToAssign.Add(Permissions.RequestsEdit);
                    permissionsToAssign.Add(Permissions.RequestsViewFilteredEstimation);
                    permissionsToAssign.Add(Permissions.WorkflowTimelineView);
                }

                foreach (var perm in permissionsToAssign)
                {
                    if (!existingClaims.Any(c => c.Type == "Permission" && c.Value == perm))
                    {
                        await roleManager.AddClaimAsync(role, new Claim("Permission", perm));
                    }
                }
            }

            // Create admin user
            var adminEmail = "admin@engineeringsystem.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FirstName = "System",
                    LastName = "Admin",
                    PhoneNumber = "+251911111111",
                    UserType = UserType.Admin,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
            else
            {
                if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            await context.SaveChangesAsync();

            // ================================================================
            // Seed Head Office Department and Branch
            // Both are created idempotently — safe to run on every startup.
            // ================================================================

            // 1. Seed the "Head Office" Department
            var headOfficeDeptName = "Head Office";
            var headOfficeDept = await context.Departments
                .FirstOrDefaultAsync(d => d.Name == headOfficeDeptName);

            if (headOfficeDept == null)
            {
                headOfficeDept = new Department
                {
                    Id = Guid.NewGuid(),
                    Name = headOfficeDeptName,
                    Description = "Head Office — central engineering and valuation unit",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.Departments.Add(headOfficeDept);
                await context.SaveChangesAsync();
            }

            // 2. Seed the "Head Office" Branch linked to the department above
            var headOfficeBranchName = "Head Office";
            var headOfficeBranch = await context.Branches
                .FirstOrDefaultAsync(b => b.Name == headOfficeBranchName);

            if (headOfficeBranch == null)
            {
                context.Branches.Add(new Branch
                {
                    Id = Guid.NewGuid(),
                    Name = headOfficeBranchName,
                    BranchCode = "HO-001",
                    Location = "Head Office",
                    IsActive = true,
                    DepartmentId = headOfficeDept.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }
    }
}