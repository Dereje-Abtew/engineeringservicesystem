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

  const canViewEstimationReport = (): boolean => {
    return hasPermission('Permissions.Requests.ViewEstimation');
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
    // Manager-level approvals should only be available to users with manager/admin roles
    const isManagerRole = user?.role === 'Manager' || user?.role === 'Admin' || user?.role === 'SystemAdmin';
    return isManagerRole && hasPermission('Permissions.Requests.Approve') && requestStatus === 1;
  };

  const canRejectRequest = (requestStatus: number): boolean => {
    return hasPermission('Permissions.Requests.Reject') && requestStatus === 0;
  };

  const canManagerReject = (requestStatus: number): boolean => {
    const isManagerRole = user?.role === 'Manager' || user?.role === 'Admin' || user?.role === 'SystemAdmin';
    return isManagerRole && hasPermission('Permissions.Requests.Reject') && requestStatus === 1;
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

  /**
   * The maker (the user who created the request) can resend a
   * rejected request. We check:
   *  - Status is 5 (Rejected)
   *  - The user has the Create permission (same permission used by
   *    the backend's Resend endpoint)
   *  - The user is the BranchUser of the request (only the maker
   *    can edit & resend their own rejected request)
   */
  const canResendRejectedRequest = (requestStatus: number, isOwner: boolean): boolean => {
    return hasPermission('Permissions.Requests.Create') && requestStatus === 5 && isOwner;
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
    canResendRejectedRequest,
    canViewEstimationReport,
    userPermissions: user?.permissions || [],
  };
}
