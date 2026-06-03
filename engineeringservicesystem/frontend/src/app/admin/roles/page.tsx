'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box, Typography, Button, TextField, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Alert, Menu, MenuItem, ListItemIcon, ListItemText,
  Chip, Checkbox, FormControlLabel, Grid
} from '@mui/material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Plus, MoreVertical, Trash2, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/store';
import { Permissions } from '@/constants/permissions';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { hasPermission } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Custom UI Confirmation State Machine
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    isDeleteAction?: boolean;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDeleteAction: false
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [roleData, permData] = await Promise.all([
        api.get<Role[]>('/UserManagement/roles'),
        api.get<string[]>('/UserManagement/permissions')
      ]);
      setRoles(roleData || []);
      setAvailablePermissions(permData || []);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, role: Role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpen = (role?: Role) => {
    if (role) {
      setRoleName(role.name);
      setSelectedPermissions(role.permissions);
      setIsEdit(true);
    } else {
      setRoleName('');
      setSelectedPermissions([]);
      setIsEdit(false);
    }
    setOpen(true);
    handleMenuClose();
  };

  const handleClose = () => {
    setOpen(false);
    setRoleName('');
    setSelectedPermissions([]);
    setSelectedRole(null);
    setError('');
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  // Triggers custom UI confirmation state modal window
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDeleteAction: boolean = false
  ) => {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm,
      isDeleteAction
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, open: false }));
  };

  // Base persistent mutation methods execution logic handler
  const executeSubmit = async () => {
    try {
      if (isEdit && selectedRole) {
        await api.put(`/UserManagement/roles/${selectedRole.id}`, {
          name: roleName,
          permissions: selectedPermissions
        });
      } else {
        await api.post('/UserManagement/roles', {
          name: roleName,
          permissions: selectedPermissions
        });
      }
      fetchData();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const executeDelete = async () => {
    if (!selectedRole) return;
    try {
      await api.delete(`/UserManagement/roles/${selectedRole.id}`);
      fetchData();
      handleMenuClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submission interceptor logic layer
  const handleSubmit = () => {
    if (!roleName) {
      setError('Role name is required');
      return;
    }

    if (isEdit) {
      showConfirm(
        "Confirm Modification",
        `Are you sure you want to save modifications to the "${roleName}" role? This update will re-map authorization privileges globally.`,
        executeSubmit,
        false
      );
    } else {
      showConfirm(
        "Confirm Role Creation",
        `Are you sure you want to deploy the new security profile entry for "${roleName}" across the organization?`,
        executeSubmit,
        false
      );
    }
  };

  const handleDelete = () => {
    if (!selectedRole) return;
    showConfirm(
      "Confirm Severe Action",
      `Are you absolutely sure you want to remove the "${selectedRole.name}" system role configuration? This action is irreversible and might clear active permission schemes.`,
      executeDelete,
      true
    );
  };

  const isProtectedRole = (name: string) => ['Admin', 'SystemAdmin'].includes(name);

  const columns = React.useMemo<MRT_ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Role Name',
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(6, 78, 59, 0.08)', color: '#064e3b' }}>
              <ShieldCheck size={18} />
            </Box>
            <Typography fontWeight="700">{cell.getValue<string>()}</Typography>
          </Box>
        )
      },
      {
        accessorKey: 'permissions',
        header: 'Permissions',
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(cell.getValue<string[]>() || []).length === 0 ? (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>No permissions</Typography>
            ) : (
              cell.getValue<string[]>().slice(0, 3).map(p => (
                <Chip
                  key={p}
                  label={p.split('.').pop()}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700, borderColor: '#e2e8f0' }}
                />
              ))
            )}
            {(cell.getValue<string[]>() || []).length > 3 && (
              <Typography variant="caption" sx={{ color: '#94a3b8', ml: 0.5, alignSelf: 'center' }}>
                +{cell.getValue<string[]>().length - 3} more
              </Typography>
            )}
          </Box>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            label={isProtectedRole(row.original.name) ? "Core System" : "Managed"}
            size="small"
            sx={{
              bgcolor: isProtectedRole(row.original.name) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(6, 78, 59, 0.05)',
              color: isProtectedRole(row.original.name) ? '#1d4ed8' : '#064e3b',
              fontWeight: 800,
              borderRadius: '8px'
            }}
          />
        )
      },
    ],
    [],
  );

  const canManage = hasPermission(Permissions.RoleManagementManage);

  return (
    <DashboardLayout>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', mb: 1 }}>
            Role & Permissions
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Manage dynamic roles and map them to system permissions.
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
              borderRadius: 0,
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#065f46' }
            }}
          >
            Create New Role
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 0, fontWeight: 600, border: '1px solid #fecaca' }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          p: 1,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}
      >
        <MaterialReactTable
          columns={columns}
          data={roles}
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
          sx: { borderRadius: '12px', minWidth: 180, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }
        }}
      >
        <MenuItem onClick={() => handleOpen(selectedRole || undefined)} disabled={!canManage}>
          <ListItemIcon><ShieldCheck size={18} /></ListItemIcon>
          <ListItemText primary="Edit Role" />
        </MenuItem>
        <MenuItem onClick={handleDelete} disabled={!canManage || (selectedRole ? isProtectedRole(selectedRole.name) : false)} sx={{ color: '#ef4444' }}>
          <ListItemIcon><Trash2 size={18} color={(!canManage || (selectedRole && isProtectedRole(selectedRole.name))) ? "inherit" : "#ef4444"} /></ListItemIcon>
          <ListItemText primary="Delete Role" />
        </MenuItem>
      </Menu>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: '24px', p: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#064e3b', fontSize: '1.75rem' }}>
          {isEdit ? `Edit Role: ${roleName}` : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 4 }}>
            <Typography variant="subtitle2" fontWeight="800" gutterBottom sx={{ color: '#475569' }}>Role Name</Typography>
            <TextField
              autoFocus
              fullWidth
              variant="outlined"
              disabled={isEdit && isProtectedRole(roleName)}
              placeholder="e.g. Senior Manager"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#f8fafc' } }}
            />
          </Box>

          <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 2, color: '#475569' }}>Assign Permissions</Typography>
          <Paper variant="outlined" sx={{ borderRadius: 0, p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Grid container spacing={2}>
              {availablePermissions.map((perm) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={perm}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        icon={<Square size={20} color="#cbd5e1" />}
                        checkedIcon={<CheckSquare size={20} color="#064e3b" />}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight="700" sx={{ color: '#334155' }}>
                        {perm.replace('Permissions.', '').replace('.', ' ')}
                      </Typography>
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
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
              py: 1.5,
              borderRadius: 0,
              fontWeight: 800,
              boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.2)',
              '&:hover': { bgcolor: '#065f46' }
            }}
          >
            {isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dynamic Security & Operational Confirmation Modal Component Instance */}
      <Dialog
        open={confirmState.open}
        onClose={closeConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            border: `4px solid ${confirmState.isDeleteAction ? '#dc2626' : '#064e3b'}`,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: confirmState.isDeleteAction ? '#dc2626' : '#064e3b', pb: 1 }}>
          {confirmState.title}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" fontWeight="600" sx={{ color: '#334155', lineHeight: 1.6 }}>
            {confirmState.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={closeConfirm} 
            sx={{ color: '#64748b', fontWeight: 800, textTransform: 'none' }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              await confirmState.onConfirm();
              closeConfirm();
            }}
            sx={{
              bgcolor: confirmState.isDeleteAction ? '#dc2626' : '#064e3b',
              color: 'white',
              borderRadius: 0,
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: confirmState.isDeleteAction ? '#b91c1c' : '#065f46' }
            }}
          >
            Confirm Action
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}