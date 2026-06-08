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
            string[] roleNames = { "Admin", "Maker", "Checker", "Manager", "EngineeringOfficer" };
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
                    permissionsToAssign.Add(Permissions.RequestsViewBranch);
                    permissionsToAssign.Add(Permissions.RequestsApprove);
                }
                else if (roleName == "Maker")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewOwn);
                    permissionsToAssign.Add(Permissions.RequestsCreate);
                }
                else if (roleName == "Manager")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewAll);
                    permissionsToAssign.Add(Permissions.RequestsApprove);
                }
                else if (roleName == "EngineeringOfficer")
                {
                    permissionsToAssign.Add(Permissions.DashboardView);
                    permissionsToAssign.Add(Permissions.RequestsView);
                    permissionsToAssign.Add(Permissions.RequestsViewAssigned);
                    permissionsToAssign.Add(Permissions.RequestsEdit);
                    permissionsToAssign.Add(Permissions.RequestsEstimate);
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

            // Create test users for each role
            var testUsers = new[]
            {
                new { Email = "engineer@test.com", FirstName = "John", LastName = "Engineer", Role = "EngineeringOfficer" },
                new { Email = "manager@test.com", FirstName = "Jane", LastName = "Manager", Role = "Manager" },
                new { Email = "checker@test.com", FirstName = "Bob", LastName = "Checker", Role = "Checker" },
                new { Email = "maker@test.com", FirstName = "Alice", LastName = "Maker", Role = "Maker" }
            };

            foreach (var testUser in testUsers)
            {
                var existingUser = await userManager.FindByEmailAsync(testUser.Email);
                if (existingUser == null)
                {
                    var newUser = new ApplicationUser
                    {
                        UserName = testUser.Email,
                        Email = testUser.Email,
                        FirstName = testUser.FirstName,
                        LastName = testUser.LastName,
                        PhoneNumber = "+251900000000",
                        UserType = UserType.EngineeringOffice,
                        EmailConfirmed = true
                    };

                    var result = await userManager.CreateAsync(newUser, "Test@123!");
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(newUser, testUser.Role);
                    }
                }
            }

            await context.SaveChangesAsync();
        }
    }
}