'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Download, Filter, Calendar, FileText, TrendingUp, BarChart2 } from 'lucide-react';
import api from '@/utils/api';

interface ReportData {
  name: string;
  value: number;
}

interface BranchReport {
  branchName: string;
  count: number;
}

const COLORS = ['#064e3b', '#f1b31c', '#0ea5e9', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    statusDistribution: ReportData[];
    branchDistribution: BranchReport[];
    monthlyTrend: any[];
  }>({
    statusDistribution: [],
    branchDistribution: [],
    monthlyTrend: []
  });

  const [filter, setFilter] = useState('all');

  const exportCSV = () => {
    const headers = ['Category', 'Value'];
    const statusRows = data.statusDistribution.map(d => [`Status: ${d.name}`, d.value]);
    const branchRows = data.branchDistribution.map(d => [`Branch: ${d.branchName}`, d.count]);
    const trendRows = data.monthlyTrend.map(d => [`Month: ${d.month}`, d.count]);
    
    const csvContent = [
      headers.join(','),
      ...statusRows.map(r => r.join(',')),
      ...branchRows.map(r => r.join(',')),
      ...trendRows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `engineering_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const [statusDist, branchDist, trend] = await Promise.all([
          api.get<any[]>('/Reports/status-distribution'),
          api.get<any[]>('/Reports/branch-performance'),
          api.get<any[]>('/Reports/monthly-trend')
        ]);

        setData({
          statusDistribution: statusDist || [],
          branchDistribution: branchDist || [],
          monthlyTrend: trend || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#064e3b', mb: 1 }}>
            Analytics & Reports
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Visual overview of engineering service requests and branch performance.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handlePrint}
            startIcon={<Download size={15} />}
            sx={{ borderRadius: 0, fontWeight: 800, color: '#064e3b', borderColor: '#064e3b', textTransform: 'none' }}
          >
            Export PDF
          </Button>
          <Button
            variant="contained"
            onClick={exportCSV}
            startIcon={<FileText size={15} />}
            sx={{ bgcolor: '#064e3b', color: 'white', borderRadius: 0, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#065f46' } }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <style jsx global>{`
        @media print {
          .MuiDrawer-root, .MuiAppBar-root, .MuiButton-root, .MuiFormControl-root {
            display: none !important;
          }
          .MuiContainer-root {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          body {
            background-color: white !important;
          }
        }
      `}</style>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 0, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select label="Time Range" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ borderRadius: 0, bgcolor: 'white' }}>
                <MenuItem value="all">Last 12 Months</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Button startIcon={<Filter size={18} />} sx={{ fontWeight: 700, color: '#064e3b' }}>
              Advanced Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="success" />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Main Trend Line Chart */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <TrendingUp size={20} color="#064e3b" />
                <Typography variant="h6" fontWeight="900" sx={{ color: '#064e3b' }}>
                  Service Request Trends
                </Typography>
              </Box>
              <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#064e3b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#064e3b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontWeight: 800, fontSize: 13 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontWeight: 800, fontSize: 13 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 0, border: '2px solid #064e3b', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#064e3b" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Status Distribution Pie Chart */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', height: '100%' }}>
              <Typography variant="h6" fontWeight="900" sx={{ color: '#064e3b', mb: 4 }}>
                Status Distribution
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Top Branches Bar Chart */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <BarChart2 size={20} color="#064e3b" />
                <Typography variant="h6" fontWeight="900" sx={{ color: '#064e3b' }}>
                  Top Performing Branches
                </Typography>
              </Box>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.branchDistribution} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis dataKey="branchName" type="category" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontWeight: 800, fontSize: 14 }} width={120} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="#f1b31c" radius={[0, 4, 4, 0]} barSize={35} stroke="#854d0e" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </DashboardLayout>
  );
}
