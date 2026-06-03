'use client';

import Link from 'next/link';
import { Button, Box, Typography, Container, Stack, Paper, Grid } from '@mui/material';
import { ArrowRight, ShieldCheck, Zap, Database, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      color: '#0f172a',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Premium Gradient Overlays */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 800,
        height: 800,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 78, 59, 0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -200,
        left: -100,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234, 179, 8, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0
      }} />

      {/* Navbar */}
      <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Container maxWidth="lg">
          <Box sx={{ py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 42,
                height: 42,
                bgcolor: '#064e3b',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 78, 59, 0.2)'
              }}>
                <ShieldCheck size={26} color="white" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#064e3b', letterSpacing: '-1px' }}>
                Engineering<br />
                <span style={{ fontSize: '0.6em', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Service System</span>
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center">
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: '#64748b', fontWeight: 700, '&:hover': { color: '#064e3b' }, transition: 'color 0.2s' }}>
                  Sign In
                </Typography>
              </Link>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                sx={{
                  bgcolor: '#064e3b',
                  color: 'white',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.2,
                  fontWeight: 800,
                  textTransform: 'none',
                  boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.2)',
                  '&:hover': { bgcolor: '#065f46' }
                }}
              >
                Get Access
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mt: { xs: 10, md: 15 }, textAlign: 'center' }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            bgcolor: 'rgba(234, 179, 8, 0.1)',
            borderRadius: '100px',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            mb: 4
          }}>
            <Box sx={{ width: 8, height: 8, bgcolor: '#eab308', borderRadius: '50%' }} />
            <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
              The Trusted Standard in Engineering Valuation
            </Typography>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '3rem', md: '5.5rem' },
              fontWeight: 900,
              lineHeight: 1.05,
              mb: 3,
              color: '#064e3b',
              letterSpacing: '-0.04em',
              maxWidth: '900px',
              mx: 'auto'
            }}
          >
            Engineering workflow<br />
            <span style={{ color: '#eab308' }}>Made Intelligent.</span>
          </Typography>

          <Typography
            variant="h5"
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              color: '#64748b',
              fontWeight: 500,
              lineHeight: 1.6,
              mb: 6,
              fontSize: { xs: '1.1rem', md: '1.35rem' }
            }}
          >
            A high-performance enterprise platform designed for seamless inter-departmental
            engineering services, precision report management, and real-time operational auditing.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ mb: 12 }}>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={22} />}
              sx={{
                bgcolor: '#064e3b',
                color: 'white',
                py: 2.2,
                px: 6,
                borderRadius: '16px',
                fontSize: '1.15rem',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 20px 40px -10px rgba(6, 78, 59, 0.3)',
                '&:hover': { bgcolor: '#065f46' }
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: '#064e3b',
                borderColor: '#e2e8f0',
                bgcolor: 'white',
                py: 2.2,
                px: 6,
                borderRadius: '16px',
                fontSize: '1.15rem',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': { borderColor: '#064e3b', bgcolor: '#f8fafc' }
              }}
            >
              View System Specs
            </Button>
          </Stack>

          {/* Social Proof / Stats */}
          <Paper elevation={0} sx={{
            p: 4,
            borderRadius: '24px',
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            maxWidth: '900px',
            mx: 'auto',
            mb: 15,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <Grid container spacing={4}>
              {[
                { label: 'Uptime Guarantee', val: '99.9%' },
                { label: 'Reports Managed', val: '50k+' },
                { label: 'Security Standard', val: 'Level-5' }
              ].map((stat, i) => (
                <Grid size={{ xs: 12, sm: 4 }} key={i}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#064e3b' }}>{stat.val}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{stat.label}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* Feature Grid */}
        <Box sx={{ mb: 15 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" fontWeight={900} sx={{ color: '#064e3b', mb: 2 }}>Engineered for Efficiency</Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500, maxWidth: 600, mx: 'auto' }}>
              A robust suite of tools built to streamline every aspect of engineering valuation and request tracking.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {[
              { icon: <Database size={24} color="#064e3b" />, title: 'Real-time Data Sync', desc: 'Sync engineering requests across branches and departments instantly with zero latency.' },
              { icon: <ShieldCheck size={24} color="#064e3b" />, title: 'Enterprise Auditing', desc: 'Full traceability of report preparation, site visits, and multi-level approvals.' },
              { icon: <Zap size={24} color="#064e3b" />, title: 'Automated Workflows', desc: 'Smart assignment algorithms that connect requests to available engineers automatically.' },
              { icon: <CheckCircle2 size={24} color="#064e3b" />, title: 'Precision Reporting', desc: 'Dynamic report generation tools with built-in validation and quality control.' }
            ].map((feature, i) => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: '24px',
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', borderColor: '#064e3b' }
                  }}
                >
                  <Box sx={{ width: 48, height: 48, bgcolor: 'rgba(6, 78, 59, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', pl: 1.5, mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" fontWeight="800" sx={{ mb: 1.5, color: '#0f172a' }}>{feature.title}</Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>{feature.desc}</Typography>
                  <Button
                    endIcon={<ChevronRight size={16} />}
                    sx={{ mt: 2, color: '#064e3b', fontWeight: 800, p: 0, '&:hover': { bgcolor: 'transparent', color: '#065f46' } }}
                  >
                    Learn More
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ py: 10, bgcolor: '#064e3b', color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ShieldCheck size={32} color="#eab308" />
                <Typography variant="h5" fontWeight="900" sx={{ color: 'white' }}>Engineering Monitoring</Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 400 }}>
                The official engineering service monitoring platform for high-precision valuation and workflow management.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                © 2026 Engineering Service Monitoring System.<br />
                All rights reserved. Secure and Authorized access only.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
