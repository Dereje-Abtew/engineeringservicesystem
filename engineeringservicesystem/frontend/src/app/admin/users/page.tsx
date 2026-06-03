'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box, Typography, Button, TextField, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Alert, Menu, MenuItem, ListItemIcon, ListItemText,
  Switch, FormControlLabel, Autocomplete, Avatar, Chip
} from '@mui/material';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Trash2, Plus, MoreVertical, Building2, MapPin, Edit3, KeyRound } from 'lucide-react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/store';
import { Permissions } from '@/constants/permissions';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: string;
  departmentName: string;
  branchId?: string;
  branchName: string;
  employeeId?: string;
  position?: string;
  phoneNumber?: string;
  isActive?: boolean;
  roles: string[];
}

interface Department { id: string; name: string; }
interface Branch { id: string; name: string; departmentId: string; }
interface Role { id: string; name: string; }

export default function UsersPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '',
    role: '', departmentId: '', branchId: '',
    employeeId: '', position: '', phoneNumber: '', isActive: true
  });
  
  // Snapshot baseline reference tracking state
  const [initialEditData, setInitialEditData] = useState<typeof formData | null>(null);
  
  const [isBasedAtBranch, setIsBasedAtBranch] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const currentUser = useAuthStore((state) => state.user);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Custom Confirmation Dialog State
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmState({ ...confirmState, open: false });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, deptData, branchData, roleData] = await Promise.all([
        api.get<User[]>('/UserManagement/users'),
        api.get<Department[]>('/Departments'),
        api.get<Branch[]>('/Branches'),
        api.get<Role[]>('/UserManagement/roles')
      ]);
      setUsers(userData || []);
      setDepartments(deptData || []);
      setBranches(branchData || []);
      setRoles(roleData || []);
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

  // Handle Client-Side Real-Time Field Validations
  const validateField = useCallback((name: string, value: string, currentIsEdit: boolean, currentIsBranch: boolean) => {
    let errorMsg = '';

    if (name === 'firstName' && !value.trim()) {
      errorMsg = 'First Name is required';
    } else if (name === 'lastName' && !value.trim()) {
      errorMsg = 'Last Name is required';
    } else if (name === 'email') {
      if (!value.trim()) {
        errorMsg = 'Email Address is required';
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        errorMsg = 'Invalid email address format';
      }
    } else if (name === 'password') {
      // If editing an existing user, password field is optional
      if (!currentIsEdit) {
        if (!value) {
          errorMsg = 'Password is required';
        } else if (value.length < 6) {
          errorMsg = 'Passwords must be at least 6 characters';
        }
      } else if (value && value.length < 6) {
        errorMsg = 'Passwords must be at least 6 characters';
      }
    } else if (name === 'branchId' && currentIsBranch && !value) {
      errorMsg = 'Assigned Branch is required';
    } else if (name === 'departmentId' && !currentIsBranch && !value) {
      errorMsg = 'Head Office Department is required';
    } else if (name === 'phoneNumber' && value.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]+$/;
      if (!phoneRegex.test(value)) {
        errorMsg = 'Phone number can only contain numeric characters';
      }
    }

    return errorMsg;
  }, []);

  const validateForm = useCallback((currentFormData = formData, currentIsEdit = isEdit, currentIsBranch = isBasedAtBranch) => {
    const newErrors: Record<string, string> = {};

    const fieldsToValidate = ['firstName', 'lastName', 'email', 'password', 'branchId', 'departmentId', 'phoneNumber'];
    fieldsToValidate.forEach((field) => {
      const val = (currentFormData as any)[field] || '';
      const errMsg = validateField(field, val, currentIsEdit, currentIsBranch);
      if (errMsg) {
        newErrors[field] = errMsg;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEdit, isBasedAtBranch, validateField]);

  // Real-time validation sync loop effect
  useEffect(() => {
    if (open) {
      validateForm(formData, isEdit, isBasedAtBranch);
    }
  }, [formData, isEdit, isBasedAtBranch, open, validateForm]);

  const handleInputChange = (field: string, value: any) => {
    setError('');
    setInfoMessage('');
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleOpen = () => {
    const resetData = {
      email: '', password: '', firstName: '', lastName: '',
      role: '', departmentId: '', branchId: '',
      employeeId: '', position: '', phoneNumber: '', isActive: true
    };
    setFormData(resetData);
    setInitialEditData(null);
    setErrors({});
    setTouched({});
    setError('');
    setInfoMessage('');
    setIsBasedAtBranch(false);
    setIsEdit(false);
    setOpen(true);
  };

  const handleEditOpen = () => {
    const userToEdit = users.find(u => u.id === selectedUserId);
    if (!userToEdit) return;

    const editData = {
      email: userToEdit.email || '',
      password: '', 
      firstName: userToEdit.firstName || '',
      lastName: userToEdit.lastName || '',
      role: userToEdit.roles?.[0] || '',
      departmentId: userToEdit.departmentId || '',
      branchId: userToEdit.branchId || '',
      employeeId: userToEdit.employeeId || '',
      position: userToEdit.position || '',
      phoneNumber: userToEdit.phoneNumber || '',
      isActive: userToEdit.isActive ?? true
    };

    setFormData(editData);
    setInitialEditData({ ...editData }); // Clone baseline snapshot accurately to ensure comparison matches on clean loads
    setErrors({});
    setTouched({});
    setError('');
    setInfoMessage('');
    const isBranch = !!userToEdit.branchId;
    setIsBasedAtBranch(isBranch);
    setIsEdit(true);
    setOpen(true);
    handleMenuClose();
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setInfoMessage('');
    setErrors({});
    setTouched({});
    setIsEdit(false);
    setInitialEditData(null);
  };

  const handleSubmit = async () => {
    setError('');
    setInfoMessage('');

    // Trigger visual errors on click explicitly
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      branchId: true,
      departmentId: true,
      phoneNumber: true
    });

    if (!validateForm()) {
      setError('Please correct the validation errors in the form fields below.');
      return;
    }

    // Check modification baselines
    if (isEdit && initialEditData) {
      const isUnchanged = Object.keys(formData).every(
        (key) => (formData as any)[key] === (initialEditData as any)[key]
      );
      
      if (isUnchanged) {
        setInfoMessage("No changes detected. Modify user details before saving, or click Cancel.");
        return;
      }
    }

    // Define the underlying operation execution logic
    const executeSubmitAction = async () => {
      try {
        const payload = {
          ...formData,
          branchId: formData.branchId || null,
          departmentId: formData.departmentId || null,
        };
        
        if (isEdit && selectedUserId) {
          await api.put(`/UserManagement/users/${selectedUserId}`, payload);
        } else {
          await api.post('/UserManagement/register', payload);
        }
        
        fetchData();
        handleClose();
      } catch (err: any) {
        setError(err.message);
      }
    };

    // Intercept Registration phase specifically to prompt confirmation before calling API stack
    if (!isEdit) {
      showConfirm(
        'Register User Account',
        `Are you sure you want to register a new user account for ${formData.firstName} ${formData.lastName} with email ${formData.email}?`,
        executeSubmitAction
      );
    } else {
      // Execute edits directly without an explicit prompt as per existing workflow
      await executeSubmitAction();
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserId) return;
    const defaultPassword = 'ChangeMe@123';
    
    showConfirm(
      'Reset User Password',
      `Are you sure you want to reset this user's password to "${defaultPassword}"?`,
      async () => {
        try {
          await api.post(`/UserManagement/users/${selectedUserId}/reset-password`, { 
            newPassword: defaultPassword 
          });
          handleMenuClose();
        } catch (err: any) {
          setError(err.message);
        }
      }
    );
  };

  const handleDelete = async () => {
    if (!selectedUserId) return;
    showConfirm(
      'Delete User Account',
      'Are you sure you want to permanently delete this user? This action cannot be undone.',
      async () => {
        try {
          await api.delete(`/UserManagement/users/${selectedUserId}`);
          fetchData();
          handleMenuClose();
        } catch (err: any) {
          setError(err.message);
        }
      }
    );
  };

  const columns = React.useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'User Account',
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(6, 78, 59, 0.08)', color: '#064e3b', fontWeight: 800 }}>
              {row.original.firstName?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography fontWeight="700" sx={{ color: '#0f172a' }}>{row.original.firstName} {row.original.lastName}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>{row.original.email}</Typography>
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'location',
        header: 'Organization',
        Cell: ({ row }) => (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Building2 size={14} color="#064e3b" />
              <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>{row.original.departmentName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapPin size={14} color="#94a3b8" />
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{row.original.branchName || 'Headquarters'}</Typography>
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'roles',
        header: 'Roles',
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(cell.getValue<string[]>() || []).map(r => (
              <Chip
                key={r}
                label={r}
                size="small"
                sx={{ bgcolor: 'rgba(234, 179, 8, 0.1)', color: '#854d0e', fontWeight: 800, borderRadius: '6px' }}
              />
            ))}
          </Box>
        )
      },
    ],
    [],
  );

  const canManage = hasPermission(Permissions.UserManagementManage);

  return (
    <DashboardLayout>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', mb: 1 }}>
            User Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Control user access and manage account details across the organization.
          </Typography>
        </Box>
        {mounted && canManage && (
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleOpen}
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
            Register User
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '16px', fontWeight: 600 }}>{error}</Alert>}

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
          data={users}
          state={{ isLoading: loading }}
          enableRowActions
          positionActionsColumn="last"
          renderRowActions={({ row }) => (
            <IconButton onClick={(e) => handleMenuOpen(e, row.original.id)}>
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
          sx: { borderRadius: 0, minWidth: 180, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }
        }}
      >
        <MenuItem onClick={handleEditOpen} disabled={!canManage}>
          <ListItemIcon><Edit3 size={18} /></ListItemIcon>
          <ListItemText primary="Edit User" />
        </MenuItem>
        <MenuItem onClick={handleResetPassword} disabled={!canManage}>
          <ListItemIcon><KeyRound size={18} /></ListItemIcon>
          <ListItemText primary="Reset Password" />
        </MenuItem>
        <MenuItem 
          onClick={handleDelete} 
          disabled={!canManage || selectedUserId === currentUser?.id} 
          sx={{ color: '#ef4444' }}
        >
          <ListItemIcon>
            <Trash2 
              size={18} 
              color={(!canManage || selectedUserId === currentUser?.id) ? "inherit" : "#ef4444"} 
              />
          </ListItemIcon>
          <ListItemText primary="Delete User" />
        </MenuItem>
      </Menu>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: '#064e3b', fontSize: '1.25rem', py: 3, borderBottom: '1px solid #e2e8f0' }}>
          {isEdit ? 'Edit User Details' : 'Add New User'}
        </DialogTitle>
        <DialogContent sx={{ p: 4, pt: 3 }}>
          
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '4px', fontWeight: 600 }}>{error}</Alert>}
          {infoMessage && <Alert severity="info" sx={{ mb: 3, borderRadius: '4px', fontWeight: 600 }}>{infoMessage}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

            <Box display="flex" gap={2}>
              <TextField 
                label="First Name *" 
                fullWidth 
                variant="outlined" 
                value={formData.firstName} 
                onChange={(e) => handleInputChange('firstName', e.target.value)} 
                error={!!(touched.firstName && errors.firstName)}
                helperText={touched.firstName && errors.firstName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }} 
              />
              <TextField 
                label="Last Name *" 
                fullWidth 
                variant="outlined" 
                value={formData.lastName} 
                onChange={(e) => handleInputChange('lastName', e.target.value)} 
                error={!!(touched.lastName && errors.lastName)}
                helperText={touched.lastName && errors.lastName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }} 
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField 
                label="Email Address *" 
                fullWidth 
                variant="outlined" 
                value={formData.email} 
                onChange={(e) => handleInputChange('email', e.target.value)} 
                error={!!(touched.email && errors.email)}
                helperText={touched.email && errors.email}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }} 
              />
              <TextField 
                label="Employee ID" 
                fullWidth 
                variant="outlined" 
                value={formData.employeeId} 
                onChange={(e) => handleInputChange('employeeId', e.target.value)} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }} 
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField 
                label={isEdit ? "Password (Leave blank to keep unchanged)" : "Password *"}
                type="password" 
                fullWidth 
                variant="outlined" 
                value={formData.password} 
                onChange={(e) => handleInputChange('password', e.target.value)} 
                error={!!(touched.password && errors.password)}
                helperText={touched.password && errors.password}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }} 
              />
              <TextField label="Position" fullWidth variant="outlined" value={formData.position} onChange={(e) => handleInputChange('position', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }} />
            </Box>

            <Box sx={{ border: '1px solid #e2e8f0', p: 3, borderRadius: '8px', bgcolor: '#f8fafc' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#064e3b', mb: 2 }}>Work Location</Typography>
              <FormControlLabel
                control={<Switch checked={isBasedAtBranch} onChange={(e) => { setIsBasedAtBranch(e.target.checked); setFormData({ ...formData, departmentId: '', branchId: '' }); setErrors({}); setTouched({}); }} color="success" />}
                label={<Typography sx={{ fontWeight: 600, color: '#334155' }}>{isBasedAtBranch ? "Based at Branch" : "Based at Head Office"}</Typography>}
                sx={{ mb: 2 }}
              />

              {isBasedAtBranch ? (
                <Autocomplete
                  options={branches}
                  getOptionLabel={(option) => option.name || ''}
                  value={branches.find(b => b.id === formData.branchId) || null}
                  onChange={(_, newValue) => {
                    handleInputChange('branchId', newValue ? newValue.id : '');
                    if (newValue) {
                      setFormData(prev => ({ ...prev, branchId: newValue.id, departmentId: newValue.departmentId || '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assigned Branch *"
                      variant="outlined"
                      error={!!(touched.branchId && errors.branchId)}
                      helperText={touched.branchId && errors.branchId}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }}
                    />
                  )}
                />
              ) : (
                <Autocomplete
                  options={departments}
                  getOptionLabel={(option) => option.name || ''}
                  value={departments.find(d => d.id === formData.departmentId) || null}
                  onChange={(_, newValue) => {
                    handleInputChange('departmentId', newValue ? newValue.id : '');
                    if (newValue) {
                      setFormData(prev => ({ ...prev, departmentId: newValue.id, branchId: '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Head Office Department *"
                      variant="outlined"
                      error={!!(touched.departmentId && errors.departmentId)}
                      helperText={touched.departmentId && errors.departmentId}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }}
                    />
                  )}
                />
              )}
            </Box>

            <Box display="flex" gap={2} alignItems="flex-start">
              <Autocomplete
                fullWidth
                options={roles}
                getOptionLabel={(option) => option.name || ''}
                value={roles.find(r => r.name === formData.role) || null}
                onChange={(_, newValue) => {
                  handleInputChange('role', newValue ? newValue.name : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="User Role"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }}
                  />
                )}
              />
              <TextField 
                label="Phone Number" 
                fullWidth 
                variant="outlined" 
                value={formData.phoneNumber} 
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)} 
                error={!!(touched.phoneNumber && errors.phoneNumber)}
                helperText={touched.phoneNumber && errors.phoneNumber}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'white' } }} 
              />
            </Box>

            <FormControlLabel
              control={<Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} color="success" />}
              label={<Typography sx={{ fontWeight: 600, color: '#334155' }}>Active Account</Typography>}
              sx={{ mt: 1 }}
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
            {isEdit ? 'Save Changes' : 'Register Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Confirmation Dialog */}
      <Dialog 
        open={confirmState.open} 
        onClose={closeConfirm}
        PaperProps={{ sx: { borderRadius: 0, border: '4px solid #064e3b' } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#064e3b', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {confirmState.title}
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography fontWeight="600" color="#334155">
            {confirmState.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={closeConfirm} sx={{ color: '#64748b', fontWeight: 800 }}>
            Cancel
          </Button>
          <Button 
            onClick={() => { confirmState.onConfirm(); closeConfirm(); }} 
            variant="contained"
            sx={{ 
              bgcolor: '#064e3b', 
              color: 'white', 
              fontWeight: 800, 
              borderRadius: 0,
              px: 3,
              '&:hover': { bgcolor: '#ef4444' }
            }}
          >
            Confirm Action
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}