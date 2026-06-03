// frontend/src/constants/requestStatus.ts

export const RequestStatus = {
  PENDING: 0,              // Maker sent to Checker
  CHECKER_APPROVED: 1,     // Checker approved, waiting for Manager
  MANAGER_APPROVED: 2,     // Manager approved, ready for assignment
  ASSIGNED_TO_ENGINEER: 3, // Assigned to Engineering Officer
  REJECTED: 4              // Rejected
} as const;

export type RequestStatusType = typeof RequestStatus[keyof typeof RequestStatus];

// Get status display text based on user role
export const getStatusDisplay = (status: number, userRole: string): string => {
  switch(status) {
    case RequestStatus.PENDING:
      if (userRole === 'maker') return 'Investigation under Checker';
      if (userRole === 'checker') return 'Pending';
      return 'Pending';
      
    case RequestStatus.CHECKER_APPROVED:
      if (userRole === 'manager') return 'Pending';
      return 'Investigation under Manager';
      
    case RequestStatus.MANAGER_APPROVED:
      if (userRole === 'manager') return 'Approved';
      return 'Approved by Manager';
      
    case RequestStatus.ASSIGNED_TO_ENGINEER:
      if (userRole === 'engineeringofficer') return 'Assigned to me';
      return 'Assigned for Engineer';
      
    case RequestStatus.REJECTED:
      return 'Rejected';
      
    default:
      return 'Unknown';
  }
};

// Get available actions for 3-dot menu based on role and status
export const getAvailableActions = (status: number, userRole: string): string[] => {
  const actions = ['View Detail'];
  
  // Checker options: only for status 0 (Pending)
  if (userRole === 'checker' && status === RequestStatus.PENDING) {
    actions.push('Approve', 'Reject');
  }
  
  // Manager options based on status
  if (userRole === 'manager') {
    if (status === RequestStatus.CHECKER_APPROVED) { // Status 1
      actions.push('Approve', 'Reject');
    }
    if (status === RequestStatus.MANAGER_APPROVED) { // Status 2
      actions.push('Assign', 'Reject');
    }
  }
  
  return actions;
};

// Get status color for chip
export const getStatusColor = (status: number): { bg: string; text: string } => {
  switch(status) {
    case RequestStatus.PENDING:
      return { bg: 'rgba(245, 158, 11, 0.1)', text: '#b45309' };
    case RequestStatus.CHECKER_APPROVED:
      return { bg: 'rgba(59, 130, 246, 0.1)', text: '#1d4ed8' };
    case RequestStatus.MANAGER_APPROVED:
      return { bg: 'rgba(16, 185, 129, 0.1)', text: '#047857' };
    case RequestStatus.ASSIGNED_TO_ENGINEER:
      return { bg: 'rgba(139, 92, 246, 0.1)', text: '#6d28d9' };
    case RequestStatus.REJECTED:
      return { bg: 'rgba(239, 68, 68, 0.1)', text: '#b91c1c' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.1)', text: '#64748b' };
  }
};