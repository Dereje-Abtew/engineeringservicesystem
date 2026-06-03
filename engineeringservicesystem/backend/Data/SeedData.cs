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
            string[] roleNames = { "Admin", "Maker", "Checker", "EngineeringOfficer" };
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
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsApprove);
                }
                else if (roleName == "Maker")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsCreate);
                }
                else if (roleName == "EngineeringOfficer")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsEdit);
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
        }
    }
}