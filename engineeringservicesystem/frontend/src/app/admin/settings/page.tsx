'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { Settings, Bell, Shield, Palette, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', mb: 1 }}>
          System Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Configure global system preferences and application behavior.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Bell size={20} color="#064e3b" />
              <Typography variant="h6" fontWeight="900" sx={{ color: '#064e3b' }}>
                Notification Preferences
              </Typography>
            </Box>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive email alerts for new estimation requests."
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
                <Switch defaultChecked color="success" />
              </ListItem>
              <Divider />
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="System Alerts"
                  secondary="Show in-app notifications for status changes."
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
                <Switch defaultChecked color="success" />
              </ListItem>
            </List>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 6, mb: 3 }}>
              <Shield size={20} color="#064e3b" />
              <Typography variant="h6" fontWeight="900" sx={{ color: '#064e3b' }}>
                Security Settings
              </Typography>
            </Box>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Add an extra layer of security to user accounts."
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
                <Switch color="success" />
              </ListItem>
              <Divider />
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Session Timeout"
                  secondary="Automatically log out users after 30 minutes of inactivity."
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
                <Switch defaultChecked color="success" />
              </ListItem>
            </List>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Save size={20} />}
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
                Save All Settings
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Typography variant="subtitle1" fontWeight="900" sx={{ mb: 2, color: '#0f172a' }}>
              System Information
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Version" secondary="1.0.4-stable" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Environment" secondary="Production Mode" />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Database" secondary="PostgreSQL 16.2" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
