using System.Collections.Generic;

namespace backend.Constants;

public static class Permissions
{
    // Dashboard
    public const string DashboardView = "Permissions.Dashboard.View";
    
    // Request Views (Granular)
    public const string RequestsView = "Permissions.Requests.View";
    public const string RequestsViewOwn = "Permissions.Requests.ViewOwn";
    public const string RequestsViewBranch = "Permissions.Requests.ViewBranch";
    public const string RequestsViewAll = "Permissions.Requests.ViewAll";
    public const string RequestsViewAssigned = "Permissions.Requests.ViewAssigned";
    
    // Request Actions
    public const string RequestsCreate = "Permissions.Requests.Create";
    public const string RequestsEdit = "Permissions.Requests.Edit";
    public const string RequestsDelete = "Permissions.Requests.Delete";
    public const string RequestsApprove = "Permissions.Requests.Approve";
    public const string RequestsReject = "Permissions.Requests.Reject";
    public const string RequestsAssign = "Permissions.Requests.Assign";
    public const string RequestsManageEngineersWorkLoad = "Permissions.Requests.ManageEngineersWorkLoad";
    public const string RequestsEstimate = "Permissions.Requests.Estimate";

    // User Management
    public const string UserManagementView = "Permissions.UserManagement.View";
    public const string UserManagementManage = "Permissions.UserManagement.Manage";

    // Role Management
    public const string RoleManagementView = "Permissions.RoleManagement.View";
    public const string RoleManagementManage = "Permissions.RoleManagement.Manage";

    // Organization Management
    public const string OrgManagementView = "Permissions.OrgManagement.View";
    public const string OrgManagementManage = "Permissions.OrgManagement.Manage";

    public static List<string> GetAll()
    {
        return new List<string>
        {
            DashboardView,
            RequestsView,
            RequestsViewOwn,
            RequestsViewBranch,
            RequestsViewAll,
            RequestsViewAssigned,
            RequestsCreate,
            RequestsEdit,
            RequestsDelete,
            RequestsApprove,
            RequestsReject,
            RequestsAssign,
            RequestsManageEngineersWorkLoad,
            RequestsEstimate,
            UserManagementView,
            UserManagementManage,
            RoleManagementView,
            RoleManagementManage,
            OrgManagementView,
            OrgManagementManage,
        };
    }
}