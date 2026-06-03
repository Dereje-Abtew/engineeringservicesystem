import { useAuthStore } from '@/store/store';

export function usePermissions() {
  const { user, hasPermission: storeHasPermission } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    return storeHasPermission(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => storeHasPermission(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => storeHasPermission(p));
  };

  // Granular view permission helpers
  const canViewOwnRequests = (): boolean => {
    return hasPermission('Permissions.Requests.ViewOwn');
  };

  const canViewBranchRequests = (): boolean => {
    return hasPermission('Permissions.Requests.ViewBranch');
  };

  const canViewAllRequests = (): boolean => {
    return hasPermission('Permissions.Requests.ViewAll');
  };

  const canViewAssignedRequests = (): boolean => {
    return hasPermission('Permissions.Requests.ViewAssigned');
  };

  // Action permission helpers
  const canCreateRequest = (): boolean => {
    return hasPermission('Permissions.Requests.Create');
  };

  const canEditRequest = (requestStatus: number): boolean => {
    return hasPermission('Permissions.Requests.Edit') && requestStatus === 0;
  };

  const canApproveRequest = (requestStatus: number): boolean => {
    return hasPermission('Permissions.Requests.Approve') && requestStatus === 0;
  };

  const canManagerApprove = (requestStatus: number): boolean => {
    return hasPermission('Permissions.Requests.Approve') && requestStatus === 1;
  };

  const canRejectRequest = (requestStatus: number): boolean => {
    return hasPermission('Permissions.Requests.Reject') && requestStatus === 0;
  };

  const canManagerReject = (requestStatus: number): boolean => {
    return hasPermission('Permissions.Requests.Reject') && requestStatus === 1;
  };

  const canAssignRequest = (requestStatus: number, hasEngineer: boolean): boolean => {
    return hasPermission('Permissions.Requests.Assign') && requestStatus === 2 && !hasEngineer;
  };

  const canManageWorkload = (): boolean => {
    return hasPermission('Permissions.Requests.ManageEngineersWorkLoad');
  };

  const canEstimateRequest = (requestStatus: number, assignedToMe: boolean, hasReport: boolean): boolean => {
    return hasPermission('Permissions.Requests.Estimate') && requestStatus === 3 && assignedToMe && !hasReport;
  };

  const canEditEstimation = (requestStatus: number, assignedToMe: boolean, hasReport: boolean): boolean => {
    return hasPermission('Permissions.Requests.Estimate') && assignedToMe && (requestStatus === 4 || hasReport);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewOwnRequests,
    canViewBranchRequests,
    canViewAllRequests,
    canViewAssignedRequests,
    canCreateRequest,
    canEditRequest,
    canApproveRequest,
    canManagerApprove,
    canRejectRequest,
    canManagerReject,
    canAssignRequest,
    canManageWorkload,
    canEstimateRequest,
    canEditEstimation,
    userPermissions: user?.permissions || [],
  };
}