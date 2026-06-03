using Microsoft.AspNetCore.Authorization;

namespace backend.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User == null)
        {
            return Task.CompletedTask;
        }

        // 1. "God Mode" Fallback: If user is in Admin or SystemAdmin role, always succeed
        if (context.User.IsInRole("Admin") || context.User.IsInRole("SystemAdmin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 2. Granular Check: Check if the user has the specific permission claim
        var permissions = context.User.FindAll("Permission")
            .Concat(context.User.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/permission"));

        if (permissions.Any(x => x.Value == requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
