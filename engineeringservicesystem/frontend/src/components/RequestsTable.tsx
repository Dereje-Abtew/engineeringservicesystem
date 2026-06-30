'use client';

import React, { useMemo } from 'react';
import { Box, Chip, IconButton, Paper, Typography, Tooltip } from '@mui/material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MoreVertical, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/store';

export interface EstimationRequest {
  id: number;
  applicantName: string;
  ownerName: string;
  lhuNo: string;
  city: string;
  subCity: string;
  kebele: string;
  location?: string;
  plotArea: number;
  buildingType: string;
  purpose: string;
  type: string;
  status: number;
  createdAt: string;
  branchUserId?: string;
  branchId?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  report?: {
    id: number;
    estimatedValue: number;
    siteVisitDate: string;
    remarks: string;
    createdAt: string;
    assignedEngineerName?: string;
  };
  // Rejection audit fields (populated by backend)
  checkerRejectionReason?: string;
  managerRejectionReason?: string;
  lastRejectionReason?: string;
  lastRejectionBy?: string;
  lastRejectionDate?: string;
  resentAt?: string;
  resendCount?: number;
}

interface RequestsTableProps {
  data: EstimationRequest[];
  loading: boolean;
  currentUserId: string;
  currentBranchId?: string;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, row: EstimationRequest) => void;
  onViewDetails: (row: EstimationRequest) => void;
}

export default function RequestsTable({ 
  data, 
  loading, 
  currentUserId,
  currentBranchId,
  onMenuOpen,
  onViewDetails
}: RequestsTableProps) {
  const { hasPermission } = useAuthStore();

  // PERMISSION-BASED FILTERING - DYNAMIC VIEW ACCESS
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    const canViewOwn = hasPermission('Permissions.Requests.ViewOwn');
    const canViewBranch = hasPermission('Permissions.Requests.ViewBranch');
    const canViewAll = hasPermission('Permissions.Requests.ViewAll');
    const canViewAllEstimated = hasPermission('Permissions.Requests.ViewAllEstimated');
    const canViewAssigned = hasPermission('Permissions.Requests.ViewAssigned');

    return data.filter((request) => {
      // Manager/Admin with ViewAll - see ALL requests including pending (status 0)
      if (canViewAll) {
        return true;
      }

      // Branch user with ViewBranch - see all requests from their branch
      if (canViewBranch && request.branchId === currentBranchId) {
        return true;
      }

      // User with ViewAllEstimated - see any estimated request (status 4) regardless of assignment, or own requests if status is 3 (Assigned)
      if (canViewAllEstimated) {
        if (request.status === 4 || (request.assignedEngineerId === currentUserId && request.status === 3)) {
          return true;
        }
      }

      // Engineering Officer with ViewAssigned - see own assigned requests (status 3 or 4)
      // AND requests they personally rejected (status 5, lastRejectionBy === 'Engineer')
      if (canViewAssigned && request.assignedEngineerId === currentUserId) {
        if (request.status === 3 || request.status === 4) return true;
        if (request.status === 5 && request.lastRejectionBy === 'Engineer') return true;
      }

      // Regular user with ViewOwn - see only their own requests
      if (canViewOwn && request.branchUserId === currentUserId) {
        return true;
      }

      return false;
    });
  }, [data, hasPermission, currentUserId, currentBranchId]);

  const getStatusChip = (status: number, lastReason?: string, lastBy?: string, lastDate?: string) => {
    // Status config is driven by the RequestStatus enum values from the backend.
    // Labels use role-neutral language so no rename is needed if roles change.
    const config: Record<number, { label: string; color: string; bg: string; icon: string }> = {
      0: { label: 'Pending Approval',          color: '#d97706', bg: '#fef3c7', icon: '⏳' },
      1: { label: 'Branch Manager Approved',   color: '#2563eb', bg: '#eff6ff', icon: '✓'  },
      2: { label: 'Engineering Manager Approved', color: '#059669', bg: '#ecfdf5', icon: '✓✓' },
      3: { label: 'Assigned to Engineer',      color: '#7c3aed', bg: '#f5f3ff', icon: '👷' },
      4: { label: 'Estimated',                 color: '#0891b2', bg: '#ecfeff', icon: '💰' },
      5: { label: 'Rejected',                  color: '#dc2626', bg: '#fef2f2', icon: '✗'  },
    };

    // Fallback for any future status values added on the backend
    const c = config[status] ?? { label: `Status ${status}`, color: '#64748b', bg: '#f1f5f9', icon: '?' };
    const chip = (
      <Chip
        label={`${c.icon} ${c.label}`}
        size="small"
        sx={{
          bgcolor: c.bg,
          color: c.color,
          fontWeight: 600,
          borderRadius: '20px',
          fontSize: '0.7rem',
          height: 28,
          '& .MuiChip-label': { px: 1.5 }
        }}
      />
    );

    if (status === 5 && lastReason) {
      const title = `${lastReason}${lastBy ? ` — by ${lastBy}` : ''}${lastDate ? ` (${new Date(lastDate).toLocaleDateString()})` : ''}`;
      return <Tooltip title={title}>{chip}</Tooltip>;
    }

    return chip;
  };

  const columns = useMemo<MRT_ColumnDef<EstimationRequest>[]>(
    () => [
      { 
        accessorKey: 'id', 
        header: 'No', 
        size: 60, 
        Cell: ({ cell }) => <Box sx={{ fontWeight: 700, color: '#064e3b' }}>{cell.getValue<number>()}</Box> 
      },
      { 
        accessorKey: 'applicantName', 
        header: 'Applicant', 
        size: 150, 
        Cell: ({ cell }) => <Typography fontWeight={600}>{cell.getValue<string>()}</Typography> 
      },
      { 
        accessorKey: 'lhuNo', 
        header: 'LHC No', 
        size: 120, 
        Cell: ({ cell }) => <Typography fontFamily="monospace" fontWeight={500}>{cell.getValue<string>()}</Typography> 
      },
      { 
        accessorKey: 'location', 
        header: 'Location', 
        size: 200,
        accessorFn: (row) => row.location || `${row.subCity || ''}, ${row.kebele || ''}`,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin size={14} color="#64748b" />
            <Typography variant="body2">{row.original.location || `${row.original.subCity}, ${row.original.kebele}`}</Typography>
          </Box>
        )
      },
      { 
        accessorKey: 'plotArea', 
        header: 'Area (m²)', 
        size: 100,
        Cell: ({ cell }) => <Typography fontWeight={500}>{cell.getValue<number>()?.toLocaleString()} m²</Typography>
      },
      { 
        accessorKey: 'buildingType', 
        header: 'Building Type', 
        size: 130,
        Cell: ({ cell }) => (
          <Chip 
            label={cell.getValue<string>()} 
            size="small" 
            variant="outlined" 
            sx={{ borderRadius: '12px', fontSize: '0.7rem' }} 
          />
        )
      },
      { 
        accessorKey: 'createdAt', 
        header: 'Date', 
        size: 110,
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString()
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 160,
        Cell: ({ cell, row }) => getStatusChip(cell.getValue<number>(), row.original.lastRejectionReason, row.original.lastRejectionBy, row.original.lastRejectionDate)
      },
    ],
    []
  );

  return (
    <Paper elevation={0} sx={{ borderRadius: '16px', bgcolor: 'white', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <MaterialReactTable
        columns={columns}
        data={filteredData}
        state={{ isLoading: loading }}
        enableRowActions
        positionActionsColumn="last"
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              onClick={(e) => onMenuOpen(e, row.original)}
              sx={{ 
                color: '#64748b', 
                '&:hover': { color: '#064e3b', bgcolor: 'rgba(6, 78, 59, 0.05)' } 
              }}
            >
              <MoreVertical size={18} />
            </IconButton>
          </Box>
        )}
        muiTablePaperProps={{ elevation: 0, sx: { bgcolor: 'transparent' } }}
        muiTableBodyCellProps={{ sx: { py: 1.5, borderBottom: '1px solid #f1f5f9' } }}
        muiTableHeadCellProps={{ sx: { bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', py: 2 } }}
        muiTableBodyRowProps={{ sx: { '&:hover': { bgcolor: '#f8fafc' } } }}
      />
    </Paper>
  );
}
