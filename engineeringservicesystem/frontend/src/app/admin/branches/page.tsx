'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box, Typography, Button, TextField, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Alert, Menu, MenuItem, ListItemIcon, ListItemText, Chip
} from '@mui/material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Edit3, Trash2, Plus, MoreVertical, GitBranch, MapPin } from 'lucide-react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/store';
import { Permissions } from '@/constants/permissions';

interface Branch {
  id: string;
  name: string;
  branchCode?: string;
  location?: string;
  isActive?: boolean;
  createdAt?: string;
  usersCount?: number;
}

export default function BranchesPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', branchCode: '', location: '' });
  const [isEdit, setIsEdit] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const branchData = await api.get<Branch[]>('/Branches');
      setBranches(branchData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, branch: Branch) => {
    setAnchorEl(event.currentTarget);
    setSelectedBranch(branch);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBranch(null);
  };

  const handleOpen = (branch?: Branch) => {
    if (branch) {
      setFormData({
        id: branch.id,
        name: branch.name,
        branchCode: branch.branchCode || '',
        location: branch.location || '',
      });
      setIsEdit(true);
    } else {
      setFormData({ id: '', name: '', branchCode: '', location: '' });
      setIsEdit(false);
    }
    setOpen(true);
    handleMenuClose();
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await api.put(`/Branches/${formData.id}`, formData);
      } else {
        const { id, ...createData } = formData;
        await api.post('/Branches', createData);
      }
      fetchData();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedBranch) return;
    if (confirm(`Are you sure you want to delete the ${selectedBranch.name} branch?`)) {
      try {
        await api.delete(`/Branches/${selectedBranch.id}`);
        fetchData();
        handleMenuClose();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const columns = React.useMemo<MRT_ColumnDef<Branch>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Branch',
        minSize: 220,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 40, height: 40,
              borderRadius: '50%',
              bgcolor: '#064e3b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <GitBranch size={18} color="white" />
            </Box>
            <Box>
              <Typography fontWeight="700" sx={{ color: '#0f172a', lineHeight: 1.3 }}>{row.original.name}</Typography>
              {row.original.branchCode && (
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Code: {row.original.branchCode}
                </Typography>
              )}
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'location',
        header: 'Location',
        Cell: ({ cell }) => {
          const loc = cell.getValue<string>();
          return loc ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapPin size={14} color="#94a3b8" />
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>{loc}</Typography>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>—</Typography>
          );
        }
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() !== false ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              bgcolor: cell.getValue<boolean>() !== false ? '#064e3b' : '#94a3b8',
              color: 'white',
              fontWeight: 700,
              borderRadius: '6px',
              fontSize: '0.75rem',
              px: 0.5,
            }}
          />
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue<string>();
          if (!val) return <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>;
          return (
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              {new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          );
        }
      },
    ],
    [],
  );

  const canManage = hasPermission(Permissions.OrgManagementManage);

  return (
    <DashboardLayout>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', mb: 1 }}>
            Branch Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Manage bank branches and their department assignments.
          </Typography>
        </Box>
        {mounted && canManage && (
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => handleOpen()}
            sx={{
              bgcolor: '#064e3b',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#065f46' }
            }}
          >
            Add Branch
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '12px', fontWeight: 600 }}>{error}</Alert>}

      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          p: 1,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}
      >
        <MaterialReactTable
          columns={columns}
          data={branches}
          state={{ isLoading: loading }}
          enableRowActions
          positionActionsColumn="last"
          renderRowActions={({ row }) => (
            <IconButton onClick={(e) => handleMenuOpen(e, row.original)}>
              <MoreVertical size={20} color="#64748b" />
            </IconButton>
          )}
          muiTablePaperProps={{ elevation: 0, sx: { bgcolor: 'transparent' } }}
          muiTableBodyCellProps={{ sx: { py: 2, borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontWeight: 500 } }}
          muiTableHeadCellProps={{ sx: { bgcolor: '#f8fafc', color: '#64748b', fontWeight: 800, py: 2.5, textTransform: 'uppercase', fontSize: '0.75rem' } }}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 0, minWidth: 160, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }
        }}
      >
        <MenuItem onClick={() => handleOpen(selectedBranch || undefined)} disabled={!canManage}>
          <ListItemIcon><Edit3 size={18} /></ListItemIcon>
          <ListItemText primary="Edit Branch" />
        </MenuItem>
        <MenuItem onClick={handleDelete} disabled={!canManage} sx={{ color: '#ef4444' }}>
          <ListItemIcon><Trash2 size={18} color={!canManage ? "inherit" : "#ef4444"} /></ListItemIcon>
          <ListItemText primary="Delete Branch" />
        </MenuItem>
      </Menu>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: '#064e3b', fontSize: '1.25rem', py: 3, borderBottom: '1px solid #e2e8f0' }}>
          {isEdit ? 'Edit Branch' : 'Register New Branch'}
        </DialogTitle>
        <DialogContent sx={{ p: 4, pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              autoFocus
              label="Branch Name *"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }}
            />
            <TextField
              label="Branch Code *"
              fullWidth
              variant="outlined"
              value={formData.branchCode}
              onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }}
            />
            <TextField
              label="Location"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, justifyContent: 'space-between' }}>
          <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 800 }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              bgcolor: '#064e3b',
              color: 'white',
              px: 5,
              py: 1,
              borderRadius: 0,
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#065f46', boxShadow: 'none' }
            }}
          >
            {isEdit ? 'Update Branch' : 'Create Branch'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
