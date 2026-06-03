'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography
} from '@mui/material';
import {
  LayoutDashboard,
  FileSearch,
  Building2,
  MapPin,
  Users,
  ShieldCheck,
  User,
  Settings,
  PieChart as ReportIcon
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/store';
import { Permissions } from '@/constants/permissions';

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  drawerWidth: number;
  collapsedWidth: number;
}

export default function Sidebar({ isCollapsed, drawerWidth, collapsedWidth }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasPermission } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems: NavItem[] = [
    { text: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/dashboard' },
    { text: 'Requests', icon: <FileSearch size={22} />, path: '/requests', permission: Permissions.RequestsView },
    { text: 'Departments', icon: <Building2 size={22} />, path: '/admin/departments', permission: Permissions.OrgManagementView },
    { text: 'Branches', icon: <MapPin size={22} />, path: '/admin/branches', permission: Permissions.OrgManagementView },
    { text: 'Users', icon: <Users size={22} />, path: '/admin/users', permission: Permissions.UserManagementView },
    { text: 'Roles', icon: <ShieldCheck size={22} />, path: '/admin/roles', permission: Permissions.RoleManagementView },
    { text: 'Reports', icon: <ReportIcon size={22} />, path: '/reports', permission: Permissions.OrgManagementView },
  ];

  const currentWidth = isCollapsed ? collapsedWidth : drawerWidth;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#064e3b', color: 'white' }}>
      {/* Sidebar Logo Section */}
      <Box sx={{
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white',
        px: isCollapsed ? 1 : 3,
        borderBottom: '1px solid #e2e8f0',
        transition: 'padding 0.2s',
        borderRadius: 0
      }}>
        <Box
          component="img"
          src={isCollapsed ? "/icon.png" : "/logo.png"}
          alt="Global Bank Ethiopia"
          onError={(e: any) => e.target.style.display = 'none'}
          sx={{ maxHeight: 45, width: 'auto', maxWidth: '100%' }}
        />
      </Box>

      {/* Navigation Items */}
      <List sx={{ px: 0, flexGrow: 1, py: 2 }}>
        {mounted && menuItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;

          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                sx={{
                  borderRadius: 0,
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: isCollapsed ? 2 : 4,
                  bgcolor: isActive ? 'rgba(241, 179, 28, 0.15)' : 'transparent',
                  color: isActive ? '#f1b31c' : 'rgba(255,255,255,0.7)',
                  borderLeft: isActive ? '4px solid #f1b31c' : '4px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'white'
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 0,
                  mr: isCollapsed ? 0 : 3,
                  justifyContent: 'center',
                  color: isActive ? '#f1b31c' : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.875rem' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Mini Profile at Bottom (Only when expanded) */}
      {!isCollapsed && mounted && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 0 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1b31c', color: '#064e3b', fontWeight: 800, fontSize: '0.8rem', borderRadius: '50%' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" noWrap sx={{ fontWeight: 800, color: 'white', display: 'block' }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.65rem' }}>
                {user?.role}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentWidth,
            border: 'none',
            borderRadius: 0,
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden'
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
