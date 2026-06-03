'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/store';
import api from '@/utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Best Practice: Using centralized api instead of raw fetch
      const data = await api.post<any>('/Auth/login', { email, password });

      setAuth({
        id: data.userId,
        name: data.name,
        email: email, // Capture email from login form
        role: data.role
      }, data.token);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        backgroundImage: 'radial-gradient(circle at 0% 0%, #eab30820 0%, transparent 50%), radial-gradient(circle at 100% 100%, #064e3b10 0%, transparent 50%)',
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: '24px',
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#064e3b',
                color: '#eab308',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.3)'
              }}
            >
              <ShieldCheck size={32} />
            </Box>
            <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', letterSpacing: '-0.02em', mb: 1 }}>
              Secure Login
            </Typography>
            <Typography variant="body1" sx={{ color: 'slate.500', fontWeight: 500 }}>
              Engineering Service System
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={20} color="#94a3b8" />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px' }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={20} color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px' }
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mt: 4,
                py: 2,
                borderRadius: '12px',
                bgcolor: '#064e3b',
                color: '#eab308',
                '&:hover': { bgcolor: '#065f46' },
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.2)'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Access System'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 4, color: 'slate.400' }}>
            Authorized Personnel Only
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
