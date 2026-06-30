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
                    permissionsToAssign.Add(Permissions.RequestsViewAll);            // See all requests including pending (status 0)
                    permissionsToAssign.Add(Permissions.RequestsApprove);            // Approve at status 0 (from BranchManager)
                    permissionsToAssign.Add(Permissions.RequestsReject);             // Reject at status 0
                    permissionsToAssign.Add(Permissions.RequestsAssign);             // Assign Engineering Officer
                    permissionsToAssign.Add(Permissions.RequestsManageEngineersWorkLoad); // Manage workload
                    permissionsToAssign.Add(Permissions.RequestsUploadFinalEstimation);   // Upload Final Estimation
                    permissionsToAssign.Add(Permissions.RequestsViewFilteredEstimation);  // See Estimation Report
                    permissionsToAssign.Add(Permissions.RequestsViewEstimation);          // See full estimation details
                }
                else if (roleName == "EngineeringOfficer")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewAssigned);
                    permissionsToAssign.Add(Permissions.RequestsEdit);
                    permissionsToAssign.Add(Permissions.RequestsEstimate);
                }
                else if (roleName == "BranchManager")
                {
                    // Replaces Maker + Checker: creates and manages branch requests only.
                    // Manager handles all approvals — BranchManager does NOT approve.
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewBranch);         // See all branch requests
                    permissionsToAssign.Add(Permissions.RequestsCreate);             // Create requests
                    permissionsToAssign.Add(Permissions.RequestsEdit);               // Edit pending requests
                    permissionsToAssign.Add(Permissions.RequestsViewFilteredEstimation); // See Estimation Report
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