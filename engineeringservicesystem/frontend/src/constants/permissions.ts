/**
 * Permission Constants - For TypeScript Intellisense Only
 * 
 * ⚠️ IMPORTANT: 
 * - Runtime permission checks use hasPermission('Permissions.XXX')
 * - New permissions added in DB will NOT appear here automatically
 * - This file exists for IDE autocomplete convenience only
 */

export const Permissions = {
    // Dashboard
    DashboardView: "Permissions.Dashboard.View",
    
    // Request Views (Granular)
    RequestsView: "Permissions.Requests.View",
    RequestsViewOwn: "Permissions.Requests.ViewOwn",
    RequestsViewBranch: "Permissions.Requests.ViewBranch",
    RequestsViewAll: "Permissions.Requests.ViewAll",
    RequestsViewAssigned: "Permissions.Requests.ViewAssigned",
    RequestsViewAllEstimated: "Permissions.Requests.ViewAllEstimated",

    // Request Actions
    RequestsCreate: "Permissions.Requests.Create",
    RequestsEdit: "Permissions.Requests.Edit",
    RequestsDelete: "Permissions.Requests.Delete",
    RequestsApprove: "Permissions.Requests.Approve",
    RequestsReject: "Permissions.Requests.Reject",
    RequestsAssign: "Permissions.Requests.Assign",
    RequestsAssignReject: "Permissions.Requests.AssignReject",
    RequestsManageEngineersWorkLoad: "Permissions.Requests.ManageEngineersWorkLoad",
    RequestsEstimate: "Permissions.Requests.Estimate",
    RequestsViewEstimation: "Permissions.Requests.ViewEstimation",
    RequestsViewFilteredEstimation: "Permissions.Requests.ViewFilteredEstimation",
    RequestsSendFilteredEstimation: "Permissions.Requests.SendFilteredEstimation",
    RequestsUploadFinalEstimation: "Permissions.Requests.UploadFinalEstimation",

    // User Management
    UserManagementView: "Permissions.UserManagement.View",
    UserManagementManage: "Permissions.UserManagement.Manage",

    // Role Management
    RoleManagementView: "Permissions.RoleManagement.View",
    RoleManagementManage: "Permissions.RoleManagement.Manage",

    // Organization Management
    OrgManagementView: "Permissions.OrgManagement.View",
    OrgManagementManage: "Permissions.OrgManagement.Manage",

    // Workflow Timeline — one permission controls full timeline visibility
    WorkflowTimelineView: "Permissions.WorkflowTimeline.View",
} as const;

export type PermissionKey = keyof typeof Permissions;