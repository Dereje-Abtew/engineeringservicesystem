'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  IconButton,
  Breadcrumbs,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Building,
  MapPin,
  FileEdit,
  Send,
  ChevronLeft,
  Calendar,
  DollarSign,
  Filter
} from 'lucide-react';
import { useAuthStore } from '@/store/store';
import { Permissions } from '@/constants/permissions';
import api from '@/utils/api';
import Link from 'next/link';

interface Attachment {
  id?: number;
  fileName: string;
  fileUrl: string;
  documentType: string;
}

interface EngineeringReport {
  remarks: string;
  estimatedValue: number;
  siteVisitDate: string;
}

interface EstimationRequest {
  id: number;
  applicantName: string;
  ownerName: string;
  location?: string;
  city: string;
  subCity: string;
  kebele: string;
  typeOfBuilding: string;
  status: number;
  createdAt: string;
  attachments: Attachment[];
  report?: EngineeringReport;
  filteredEstimationAttachments?: Attachment[];
  filteredAttachmentIds?: number[];
  selectableAttachmentIds?: number[];
}

// Document types that can be selected/sent for filtered estimation view
const SELECTABLE_DOCUMENT_TYPES = new Set<string>([
  'Estimation Excel',
  'Relevant Photo',
  'Estimation Report'
]);

const statusMap: Record<number, { label: string; bg: string; color: string }> = {
  0: { label: 'Pending', bg: 'rgba(241, 179, 28, 0.1)', color: '#f1b31c' },
  1: { label: 'Checker Approved', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  2: { label: 'Manager Approved', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  3: { label: 'Assigned to Engineer', bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' },
  4: { label: 'Estimated', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  5: { label: 'Rejected', bg: 'rgba(254, 226, 226, 0.75)', color: '#dc2626' }
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user, hasPermission } = useAuthStore();
  const router = useRouter();
  const [request, setRequest] = useState<EstimationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportForm, setReportForm] = useState({
    remarks: '',
    estimatedValue: 0,
    siteVisitDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [sendingFilter, setSendingFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected attachment ids for the filter (used by users with Requests.ViewEstimation permission)
  const [selectedFilterIds, setSelectedFilterIds] = useState<number[]>([]);

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<EstimationRequest>(`/EstimationRequests/${id}`);
      setRequest(data);
      if (data.report) {
        setReportForm({
          remarks: data.report.remarks,
          estimatedValue: data.report.estimatedValue,
          siteVisitDate: data.report.siteVisitDate.split('T')[0]
        });
      }
      // Initialize the selected ids from the server
      setSelectedFilterIds(data.filteredAttachmentIds ?? []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleSubmitReport = async () => {
    setSubmitting(true);
    try {
      await api.put(`/EstimationRequests/${id}/report`, {
        estimationRequestId: Number(id),
        ...reportForm
      });
      await fetchRequest();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // Send selected filtered estimation attachments to the server
  const handleSendFilter = async () => {
    setSendingFilter(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post('/FilteredEstimationAttachments', {
        estimationRequestId: Number(id),
        attachmentIds: selectedFilterIds
      });
      setSuccessMsg('Filtered estimation attachments saved successfully');
      await fetchRequest();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to save filtered attachments');
    } finally {
      setSendingFilter(false);
    }
  };

  const toggleFilterSelection = (attachmentId: number) => {
    setSelectedFilterIds(prev =>
      prev.includes(attachmentId)
        ? prev.filter(x => x !== attachmentId)
        : [...prev, attachmentId]
    );
  };

  const canSelectEstimationDocs = hasPermission(Permissions.RequestsViewEstimation);
  const canViewFilteredEstimation = hasPermission(Permissions.RequestsViewFilteredEstimation);

  // Attachments the user can actually select (estimation docs that have an id)
  const selectableAttachments = useMemo(() => {
    if (!request) return [];
    const selectable = (request.attachments ?? []).filter(
      a => a.id != null && SELECTABLE_DOCUMENT_TYPES.has(a.documentType)
    );
    return selectable;
  }, [request]);

  if (loading) return <DashboardLayout><Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress color="secondary" /></Box></DashboardLayout>;
  if (!request) return <DashboardLayout><Alert severity="error">{error || 'Request not found'}</Alert></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* Header Section */}
      <Box sx={{ mb: 5 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/requests" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Requests</Link>
          <Typography color="text.primary" sx={{ fontWeight: 800 }}>Request Details</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.back()} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <ChevronLeft size={20} color="#064e3b" />
            </IconButton>
            <Box>
              <Typography variant="h3" fontWeight="900" sx={{ color: '#064e3b', mb: 0.5 }}>
                Request #{request.id}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={statusMap[request.status]?.label ?? `Status ${request.status}`}
                  sx={{
                    bgcolor: statusMap[request.status]?.bg ?? 'rgba(241, 241, 241, 0.9)',
                    color: statusMap[request.status]?.color ?? '#334155',
                    fontWeight: 800,
                    borderRadius: '8px'
                  }}
                />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                  Submitted on {new Date(request.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Column: Information */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={4}>
            {/* Customer & Property Card */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" fontWeight="900" sx={{ mb: 4, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Building size={20} /> Property & Applicant
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Applicant Name</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.applicantName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Owner Name</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.ownerName}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Location Address</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <MapPin size={18} color="#f1b31c" />
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>
                      {request.location || `${request.city}, ${request.subCity}, Kebele ${request.kebele}`}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Type of Building</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.typeOfBuilding}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Attachments Card */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" fontWeight="900" sx={{ mb: 3, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={20} /> Documents & Attachments
              </Typography>

              <List sx={{ bgcolor: '#f8fafc', borderRadius: '16px', p: 1 }}>
                {request.attachments.map((file, index) => {
                  const isSelectable = canSelectEstimationDocs
                    && file.id != null
                    && SELECTABLE_DOCUMENT_TYPES.has(file.documentType);
                  const isSelected = isSelectable && selectedFilterIds.includes(file.id as number);

                  return (
                    <ListItem
                      key={file.id ?? index}
                      sx={{
                        bgcolor: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'white',
                        mb: 1,
                        borderRadius: 0,
                        border: isSelected ? '1px solid #10b981' : '1px solid #f1f5f9'
                      }}
                      secondaryAction={
                        <IconButton
                          component="a"
                          href={file.fileUrl}
                          target="_blank"
                          sx={{ color: '#064e3b', bgcolor: 'rgba(6, 78, 59, 0.05)', '&:hover': { bgcolor: 'rgba(6, 78, 59, 0.1)' } }}
                        >
                          <Download size={18} />
                        </IconButton>
                      }
                    >
                      {isSelectable && (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleFilterSelection(file.id as number)}
                          sx={{
                            color: '#10b981',
                            '&.Mui-checked': { color: '#10b981' },
                            mr: 1
                          }}
                          data-testid={`filter-checkbox-${file.id}`}
                        />
                      )}
                      <ListItemIcon sx={{ minWidth: 45 }}>
                        <FileText color="#64748b" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.fileName}
                        secondary={file.documentType}
                        primaryTypographyProps={{ fontWeight: 700, color: '#0f172a' }}
                        secondaryTypographyProps={{ fontWeight: 600, color: '#94a3b8' }}
                      />
                    </ListItem>
                  );
                })}
                {request.attachments.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', p: 2 }}>
                    No attachments available.
                  </Typography>
                )}
              </List>

              {/* Send filter button: visible only to users with Requests.ViewEstimation permission */}
              {canSelectEstimationDocs && selectableAttachments.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={sendingFilter ? <CircularProgress size={18} color="inherit" /> : <Filter size={18} />}
                    onClick={handleSendFilter}
                    disabled={sendingFilter}
                    sx={{
                      bgcolor: '#064e3b',
                      color: 'white',
                      fontWeight: 800,
                      borderRadius: 0,
                      '&:hover': { bgcolor: '#065f46' }
                    }}
                  >
                    {sendingFilter ? 'Sending...' : `Send Filter (${selectedFilterIds.length} selected)`}
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Filtered Estimation Attachments - for users with Requests.ViewFilteredEstimation */}
            {canViewFilteredEstimation && (request.filteredEstimationAttachments?.length ?? 0) > 0 && (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', bgcolor: 'rgba(16, 185, 129, 0.02)' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 3, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle2 size={20} /> Filtered Estimation Documents
                </Typography>

                <List sx={{ bgcolor: '#f8fafc', borderRadius: '16px', p: 1 }}>
                  {request.filteredEstimationAttachments!.map((file, index) => (
                    <ListItem
                      key={file.id ?? index}
                      sx={{ bgcolor: 'white', mb: 1, borderRadius: 0, border: '1px solid #d1fae5' }}
                      secondaryAction={
                        <IconButton
                          component="a"
                          href={file.fileUrl}
                          target="_blank"
                          sx={{ color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.05)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}
                        >
                          <Download size={18} />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 45 }}>
                        <FileText color="#10b981" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.fileName}
                        secondary={file.documentType}
                        primaryTypographyProps={{ fontWeight: 700, color: '#0f172a' }}
                        secondaryTypographyProps={{ fontWeight: 600, color: '#94a3b8' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Stack>
        </Grid>

        {/* Right Column: Action / Report */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={4}>
            {/* Prepare Report Form (For users with Approve permission) */}
            {hasPermission(Permissions.RequestsApprove) && request.status === 0 && (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '2px solid #f1b31c', bgcolor: 'white' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 1, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileEdit size={20} color="#f1b31c" /> Prepare Valuation Report
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 4, fontWeight: 500 }}>
                  Fill in the final valuation details to complete this request.
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Site Visit Date</Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={reportForm.siteVisitDate}
                      onChange={(e) => setReportForm({ ...reportForm, siteVisitDate: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#f8fafc' } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Estimated Value (ETB)</Typography>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="Enter amount"
                      value={reportForm.estimatedValue}
                      onChange={(e) => setReportForm({ ...reportForm, estimatedValue: Number(e.target.value) })}
                      InputProps={{
                        startAdornment: <DollarSign size={18} style={{ marginRight: 8, color: '#94a3b8' }} />,
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#f8fafc' } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Remarks & Findings</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Describe building condition..."
                      value={reportForm.remarks}
                      onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#f8fafc' } }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send size={18} />}
                    onClick={handleSubmitReport}
                    disabled={submitting}
                    sx={{
                      bgcolor: '#064e3b',
                      color: 'white',
                      py: 2,
                      borderRadius: 0,
                      fontWeight: 800,
                      boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.2)',
                      '&:hover': { bgcolor: '#065f46' }
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Final Report'}
                  </Button>
                </Stack>
              </Paper>
            )}

            {/* Display Report (If exists) */}
            {request.report ? (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #10b981', bgcolor: 'rgba(16, 185, 129, 0.02)' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 4, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle2 size={20} /> Final Valuation Report
                </Typography>

                <Stack spacing={4}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Estimated Value</Typography>
                    <Typography variant="h3" fontWeight="900" sx={{ color: '#10b981' }}>
                      ETB {request.report.estimatedValue.toLocaleString()}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={18} color="#64748b" />
                        <Typography variant="body2" fontWeight="700" sx={{ color: '#0f172a' }}>
                          Site Visit Conducted on {new Date(request.report.siteVisitDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={12}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Remarks</Typography>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500, fontStyle: 'italic' }}>
                          &ldquo;{request.report.remarks}&rdquo;
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>
            ) : null}

            {/* Status Alert for Branch-level users (those who create requests) */}
            {hasPermission(Permissions.RequestsCreate) && !request.report && (
              <Alert
                icon={<Clock size={20} />}
                severity="info"
                sx={{
                  borderRadius: 0,
                  bgcolor: 'rgba(241, 179, 28, 0.05)',
                  color: '#064e3b',
                  border: '1px solid rgba(241, 179, 28, 0.2)',
                  '& .MuiAlert-icon': { color: '#f1b31c' }
                }}
              >
                <Typography variant="body2" fontWeight="700">
                  Waiting for Engineering Report. An engineer has been notified to conduct the site visit and submit valuation findings.
                </Typography>
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
