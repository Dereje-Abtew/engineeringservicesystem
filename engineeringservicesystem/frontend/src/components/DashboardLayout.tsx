'use client';

import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { useAuthStore } from '@/store/store';
import Sidebar from './Sidebar';
import Header from './Header';

const drawerWidth = 220;
const collapsedWidth = 70;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { notification, closeNotification } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentWidth = isCollapsed ? collapsedWidth : drawerWidth;

  if (!mounted) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Sidebar Component */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        drawerWidth={drawerWidth} 
        collapsedWidth={collapsedWidth} 
      />

      {/* Main Container — flex handles spacing; sidebar nav box acts as the spacer */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        
        {/* Header Component */}
        <Header 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          currentWidth={currentWidth} 
        />

        {/* Dynamic Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 4, md: 6 },
            mt: '70px',
            transition: 'padding 0.2s',
            minHeight: 'calc(100vh - 70px)'
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Global Notification System */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          sx={{ width: '100%', fontWeight: 700, borderRadius: 0, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
