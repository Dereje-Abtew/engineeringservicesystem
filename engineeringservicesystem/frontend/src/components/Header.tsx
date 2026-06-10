'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Bell,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/store';
import { Settings as SettingsIcon } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  currentWidth: number;
}

export default function Header({ isCollapsed, setIsCollapsed, currentWidth }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const { items: notifications, unreadCount, markAsRead } = useNotifications();
  const [notifAnchor, setNotifAnchor] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotifAnchor(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${currentWidth}px)` },
          ml: { lg: `${currentWidth}px` },
          bgcolor: '#f1b31c',
          color: '#064e3b',
          zIndex: 1100,
          borderRadius: 0,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Toolbar sx={{ height: 70, px: { xs: 1, sm: 2 }, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setIsCollapsed(!isCollapsed)} sx={{ color: '#064e3b' }}>
              <MenuIcon size={24} />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, letterSpacing: '0.5px', display: { xs: 'none', sm: 'block' } }}>
                ENGINEERING SERVICE SYSTEM
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton aria-controls={notifAnchor ? 'notif-menu' : undefined} aria-haspopup="true" onClick={handleNotificationsOpen} sx={{ color: '#064e3b', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 0 }} id="notification-button">
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <Bell size={20} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu
              id="notif-menu"
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              onClose={handleNotificationsClose}
              PaperProps={{ sx: { mt: 1, minWidth: 320, borderRadius: 0, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {notifications.length === 0 && <MenuItem disabled sx={{ py: 2, px: 3 }}>No notifications</MenuItem>}
              {notifications.map(n => (
                <MenuItem key={n.id} onClick={async () => { try { await markAsRead(n.id); handleNotificationsClose(); } catch {} }} sx={{ whiteSpace: 'normal', alignItems: 'flex-start' }}>
                  <ListItemText primary={<strong style={{ fontSize: '0.95rem' }}>{n.title}</strong>} secondary={<span style={{ fontSize: '0.8rem' }}>{n.message}</span>} />
                </MenuItem>
              ))}
            </Menu>

            <Divider orientation="vertical" flexItem sx={{ my: 2, borderColor: 'rgba(6, 78, 59, 0.1)' }} />

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                cursor: 'pointer',
                p: 0.5,
                pr: 1,
                borderRadius: 0,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(6, 78, 59, 0.05)',
                }
              }} 
              onClick={handleProfileMenuOpen}
            >
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#064e3b', display: 'block', lineHeight: 1.2 }}>
                  {user?.name?.toUpperCase()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(6, 78, 59, 0.7)', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {user?.role}
                </Typography>
              </Box>
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: '#064e3b', 
                  color: '#f1b31c', 
                  fontWeight: 900, 
                  borderRadius: '50%', // Circle
                  border: '2px solid #064e3b',
                  fontSize: '1rem',
                  boxShadow: '2px 2px 0px rgba(6, 78, 59, 0.2)'
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <ChevronDown size={16} color="#064e3b" />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 0, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/profile'); }} sx={{ py: 1.5 }}>
          <ListItemIcon><User size={18} /></ListItemIcon>
          <ListItemText primary="My Profile" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/admin/settings'); }} sx={{ py: 1.5 }}>
          <ListItemIcon><SettingsIcon size={18} /></ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444' }}>
          <ListItemIcon><LogOut size={18} color="#ef4444" /></ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
      </Menu>
    </>
  );
}
