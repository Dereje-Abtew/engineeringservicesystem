'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Box, Chip, IconButton, Paper, Typography, Tooltip, keyframes, Stepper, Step, StepLabel, StepContent, StepConnector } from '@mui/material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MoreVertical, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/store';

// Highlight flash animation: yellow pulse → fades out
const highlightFlash = keyframes`
  0%   { background-color: #fef08a; box-shadow: 0 0 0 3px #facc15; }
  40%  { background-color: #fef9c3; box-shadow: 0 0 0 6px rgba(250,204,21,0.3); }
  100% { background-color: transparent; box-shadow: none; }
`;

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
  updatedAt?: string;
  branchUserId?: string;
  branchId?: string;
  branchName?: string;
  branchUserName?: string;
  branchManagerName?: string;
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
  checkerActionDate?: string;
  managerActionDate?: string;
  engineerAssignmentDate?: string;
  engineerActionDate?: string;
  checkerRejectionReason?: string;
  managerRejectionReason?: string;
  engineerRejectionReason?: string;
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
  highlightId?: number | null;            // ← new: row to flash
  showTimeline?: boolean;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, row: EstimationRequest) => void;
  onViewDetails: (row: EstimationRequest) => void;
}

export default function RequestsTable({
  data,
  loading,
  currentUserId,
  currentBranchId,
  highlightId,
  showTimeline,
  onMenuOpen,
  onViewDetails
}: RequestsTableProps) {
  const { hasPermission } = useAuthStore();
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
  const [flashId, setFlashId] = useState<number | null>(null);

  // ── When highlightId changes: scroll the row into view and flash it ──
  useEffect(() => {
    if (!highlightId) return;
    setFlashId(highlightId);
    const el = rowRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = setTimeout(() => setFlashId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // ── Permission-based client-side filtering ──
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    const canViewOwn = hasPermission('Permissions.Requests.ViewOwn');
    const canViewBranch = hasPermission('Permissions.Requests.ViewBranch');
    const canViewAll = hasPermission('Permissions.Requests.ViewAll');
    const canViewAllEstimated = hasPermission('Permissions.Requests.ViewAllEstimated');
    const canViewAssigned = hasPermission('Permissions.Requests.ViewAssigned');

    return data.filter((request) => {
      if (canViewAll) return true;

      if (canViewBranch && request.branchId === currentBranchId) return true;

      if (canViewAllEstimated) {
        if (request.status === 4 || (request.assignedEngineerId === currentUserId && request.status === 3))
          return true;
      }

      if (canViewAssigned && request.assignedEngineerId === currentUserId) {
        if (request.status === 3 || request.status === 4) return true;
        if (request.status === 5 && request.lastRejectionBy === 'Engineer') return true;
      }

      if (canViewOwn && request.branchUserId === currentUserId) return true;

      return false;
    });
  }, [data, hasPermission, currentUserId, currentBranchId]);

  // ── Status chip helper ──
  const getStatusChip = (status: number, lastReason?: string, lastBy?: string, lastDate?: string) => {
    const config: Record<number, { label: string; color: string; bg: string; icon: string }> = {
      0: { label: 'Pending Approval', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
      1: { label: 'Branch Manager Approved', color: '#2563eb', bg: '#eff6ff', icon: '✓' },
      2: { label: 'Engineering Manager Approved', color: '#059669', bg: '#ecfdf5', icon: '✓✓' },
      3: { label: 'Assigned to Engineer', color: '#7c3aed', bg: '#f5f3ff', icon: '👷' },
      4: { label: 'Estimated', color: '#0891b2', bg: '#ecfeff', icon: '💰' },
      5: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', icon: '✗' },
    };
    const c = config[status] ?? { label: `Status ${status}`, color: '#64748b', bg: '#f1f5f9', icon: '?' };
    const chip = (
      <Chip
        label={`${c.icon} ${c.label}`}
        size="small"
        sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, borderRadius: '20px', fontSize: '0.7rem', height: 28, '& .MuiChip-label': { px: 1.5 } }}
      />
    );
    if (status === 5 && lastReason) {
      const title = `${lastReason}${lastBy ? ` — by ${lastBy}` : ''}${lastDate ? ` (${new Date(lastDate).toLocaleDateString()})` : ''}`;
      return <Tooltip title={title}>{chip}</Tooltip>;
    }
    return chip;
  };

  // ── Columns ──
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
        // Branch name + manager name stacked
        id: 'branch',
        header: 'Branch',
        size: 160,
        accessorFn: (row) => row.branchName || row.branchUserName || '',
        Cell: ({ row }) => {
          const name = row.original.branchName || row.original.branchUserName || 'N/A';
          const manager = row.original.branchManagerName;
          return (
            <Box>
              <Typography variant="body2" fontWeight={600}>{name}</Typography>
              {manager && (
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  👤 {manager}
                </Typography>
              )}
            </Box>
          );
        }
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 200,
        accessorFn: (row) => row.location || `${row.subCity || ''}, ${row.kebele || ''}`,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapPin size={14} color="#64748b" />
              <Typography variant="body2">
                {row.original.location || `${row.original.subCity}, ${row.original.kebele}`}
              </Typography>
            </Box>
            {row.original.updatedAt && (
              <Typography variant="caption" sx={{ color: '#94a3b8', ml: 3, mt: 0.5 }}>
                Updated: {new Date(row.original.updatedAt).toLocaleDateString()}
              </Typography>
            )}
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
          <Chip label={cell.getValue<string>()} size="small" variant="outlined" sx={{ borderRadius: '12px', fontSize: '0.7rem' }} />
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        size: 130,
        Cell: ({ cell }) => {
          const d = new Date(cell.getValue<string>());
          return (
            <Box>
              <Typography variant="body2">{d.toLocaleDateString()}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 170,
        Cell: ({ cell, row }) =>
          getStatusChip(cell.getValue<number>(), row.original.lastRejectionReason, row.original.lastRejectionBy, row.original.lastRejectionDate)
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
        renderDetailPanel={showTimeline ? ({ row }) => {
          const req = row.original;
          const steps = [
            { label: 'Request Created', date: req.createdAt, by: req.branchUserName },
            { label: req.checkerRejectionReason ? 'Checker Rejected' : 'Checker Approved', date: req.checkerActionDate, error: !!req.checkerRejectionReason },
            { label: req.managerRejectionReason ? 'Manager Rejected' : 'Branch Manager Approved', date: req.managerActionDate, error: !!req.managerRejectionReason },
            { label: 'Assigned to Engineer', date: req.engineerAssignmentDate, by: req.assignedEngineerName },
            { label: req.engineerActionDate && req.status === 5 ? 'Engineer Rejected' : 'Estimation Report Created', date: req.report?.createdAt || (req.status === 5 ? req.engineerActionDate : undefined), error: !!req.engineerRejectionReason },
          ].filter(s => s.date); // only show completed steps or steps with a date

          return (
            <Box sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
                Workflow Timeline
              </Typography>
              <Stepper orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={index} active={true}>
                    <StepLabel
                      error={step.error}
                      optional={
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {new Date(step.date!).toLocaleString()}
                          {step.by ? ` — by ${step.by}` : ''}
                        </Typography>
                      }
                    >
                      <Typography sx={{ fontWeight: 600, color: step.error ? '#dc2626' : '#0f172a' }}>
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          );
        } : undefined}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={(e) => onMenuOpen(e, row.original)}
              sx={{ color: '#64748b', '&:hover': { color: '#064e3b', bgcolor: 'rgba(6, 78, 59, 0.05)' } }}
            >
              <MoreVertical size={18} />
            </IconButton>
          </Box>
        )}
        muiTablePaperProps={{ elevation: 0, sx: { bgcolor: 'transparent' } }}
        muiTableBodyCellProps={{ sx: { py: 1.5, borderBottom: '1px solid #f1f5f9' } }}
        muiTableHeadCellProps={{ sx: { bgcolor: '#f8fafc', fontWeight: 700, color: '#475569', py: 2 } }}
        muiTableBodyRowProps={({ row }) => {
          const isFlashing = row.original.id === flashId;
          return {
            ref: (el: HTMLTableRowElement | null) => { rowRefs.current[row.original.id] = el; },
            sx: {
              '&:hover': { bgcolor: '#f8fafc' },
              ...(isFlashing && {
                animation: `${highlightFlash} 2.8s ease-out`,
                borderRadius: '8px',
                outline: '2px solid #facc15',
              }),
            }
          };
        }}
      />
    </Paper>
  );
}
