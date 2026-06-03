'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Typography,
    Paper,
    Box,
    Button,
    Skeleton,
    Grid
} from '@mui/material';
import {
    ClipboardList,
    CheckCircle,
    Clock,
    Plus
} from 'lucide-react';
import { useAuthStore } from '@/store/store';
import { Permissions } from '@/constants/permissions';
import api from '@/utils/api';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, hasPermission } = useAuthStore();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get<any[]>('/EstimationRequests');
            setRequests(data || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = [
        {
            title: 'TOTAL REQUESTS',
            value: requests.length.toString(),
            icon: <ClipboardList size={24} color="#064e3b" />,
            color: '#064e3b'
        },
        {
            title: 'PENDING ACTIONS',
            value: requests.filter(r => r.status === 'Pending').length.toString(),
            icon: <Clock size={24} color="#064e3b" />,
            color: '#064e3b'
        },
        {
            title: 'COMPLETED',
            value: requests.filter(r => r.status === 'Completed' || r.status === 'ReportPrepared').length.toString(),
            icon: <CheckCircle size={24} color="#064e3b" />,
            color: '#064e3b'
        },
    ];

    return (
        <DashboardLayout>
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', mb: 1, letterSpacing: '-0.02em' }}>
                    Welcome, {user?.name || 'User'}
                </Typography>
                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Overview of the engineering service system activity.
                </Typography>
            </Box>

            <Grid container spacing={4} sx={{ mb: 8 }}>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Grid key={i} size={{ xs: 12, md: 4 }}>
                            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '24px' }} />
                        </Grid>
                    ))
                ) : (
                    stats.map((stat, i) => (
                        <Grid key={i} size={{ xs: 12, md: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 0,
                                    bgcolor: 'white',
                                    border: '1px solid #e2e8f0',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderColor: '#064e3b' },
                                    // The "Little line on left vertical side"
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '4px',
                                        bgcolor: stat.color
                                    }
                                }}
                            >
                                <Box>
                                    <Typography variant="caption" fontWeight="800" sx={{ color: '#64748b', mb: 0.5, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        {stat.title}
                                    </Typography>
                                    <Typography variant="h3" fontWeight="900" sx={{ color: '#0f172a', lineHeight: 1 }}>
                                        {stat.value}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '12px',
                                    bgcolor: 'rgba(6, 78, 59, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 24 })}
                                </Box>
                            </Paper>
                        </Grid>
                    ))
                )}
            </Grid>

            <Typography variant="h5" fontWeight="900" sx={{ color: '#064e3b', mb: 4 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {mounted && hasPermission(Permissions.RequestsCreate) && (
                    <Button
                        component={Link}
                        href="/requests/new"
                        variant="contained"
                        startIcon={<Plus size={20} />}
                        sx={{
                            bgcolor: '#064e3b',
                            color: 'white',
                            px: 6,
                            py: 2,
                            borderRadius: '12px',
                            fontWeight: 800,
                            textTransform: 'none',
                            boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.2)',
                            '&:hover': { bgcolor: '#065f46' }
                        }}
                    >
                        New Request
                    </Button>
                )}
                <Button
                    component={Link}
                    href="/requests"
                    variant="outlined"
                    startIcon={<ClipboardList size={20} />}
                    sx={{
                        px: 6,
                        py: 2,
                        borderRadius: '12px',
                        color: '#064e3b',
                        borderColor: '#064e3b',
                        borderWidth: '2.5px',
                        fontWeight: 800,
                        textTransform: 'none',
                        '&:hover': {
                            bgcolor: 'rgba(6, 78, 59, 0.05)',
                            borderColor: '#064e3b',
                            borderWidth: '2.5px'
                        }
                    }}
                >
                    All Reports
                </Button>
            </Box>
        </DashboardLayout>
    );
}
