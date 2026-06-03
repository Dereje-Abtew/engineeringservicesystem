'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { User, Lock, Save, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/store';
import api from '@/utils/api';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/Auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setSuccess('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', mb: 1 }}>
          Account Profile
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Manage your personal information and account security settings.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#064e3b',
                color: '#f1b31c',
                fontSize: '2.5rem',
                fontWeight: 900,
                mx: 'auto',
                mb: 3,
                borderRadius: '50%'
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h6" fontWeight="900" sx={{ color: '#0f172a' }}>
              {user?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontWeight: 600 }}>
              {user?.email}
            </Typography>
            <Chip
              label={user?.role}
              sx={{
                bgcolor: 'rgba(6, 78, 59, 0.1)',
                color: '#064e3b',
                fontWeight: 800,
                borderRadius: 0,
                px: 1
              }}
            />
          </Paper>
        </Grid>

        {/* Security / Password Change */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Lock size={20} color="#064e3b" />
              <Typography variant="h6" fontWeight="900" sx={{ color: '#064e3b' }}>
                Change Password
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 0 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>{error}</Alert>}

            <form onSubmit={handleChangePassword}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />

                <Box sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
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
                    Update Password
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>

          <Paper elevation={0} sx={{ p: 4, mt: 4, borderRadius: 0, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <ShieldCheck size={20} color="#059669" />
              <Typography variant="subtitle1" fontWeight="900" sx={{ color: '#0f172a' }}>
                Account Security
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Your account is protected by industry-standard encryption. Remember to use a strong password and never share it with anyone.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
