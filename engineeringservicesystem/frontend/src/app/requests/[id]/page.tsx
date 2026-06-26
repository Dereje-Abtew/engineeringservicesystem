'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Typography, Box, Paper, Chip, Button, List, ListItem, ListItemText, ListItemIcon,
  TextField, Alert, CircularProgress, Stack, Grid, IconButton, Breadcrumbs,
  Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  Select, MenuItem, FormControl, InputLabel, type SelectChangeEvent,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, Download, CheckCircle2, CheckCircle, Building, MapPin, ChevronLeft,
  Calendar, Filter, History, RotateCcw, Save, XCircle as XCircleIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/store';
import { Permissions } from '@/constants/permissions';
import api from '@/utils/api';
import Link from 'next/link';

interface Attachment { id?: number; fileName: string; fileUrl: string; documentType: string; uploadedById?: string; }
interface EngineeringReport { remarks: string; estimatedValue: number; siteVisitDate: string; }
interface EstimationRequest {
  id: number; applicantName: string; ownerName: string; location?: string;
  city: string; subCity: string; kebele: string; typeOfBuilding: string;
  status: number; createdAt: string; lhuNo: string; plotArea: number;
  purpose: string; type: string; attachments: Attachment[];
  report?: EngineeringReport; filteredEstimationAttachments?: Attachment[];
  filteredAttachmentIds?: number[]; selectableAttachmentIds?: number[];
  checkerRejectionReason?: string; checkerActionDate?: string;
  managerRejectionReason?: string; managerActionDate?: string;
  lastRejectionReason?: string; lastRejectionDate?: string;
  lastRejectionBy?: string; resentAt?: string; resendCount?: number;
  projectFinanceDocType?: string; billOfPenalty?: boolean;
  branchUserId?: string; assignedEngineerId?: string;
}
interface ResendFormValues {
  applicantName: string; ownerName: string; lhuNo: string;
  city: string; subCity: string; kebele: string; plotArea: string;
  buildingType: string; purpose: string; type: string;
  projectFinanceDocType: string; billOfPenalty: boolean; makerRemark: string;
}

const SELECTABLE_DOCUMENT_TYPES = new Set<string>(['Estimation Excel', 'Relevant Photo', 'Estimation Report']);
const statusMap: Record<number, { label: string; bg: string; color: string }> = {
  0: { label: 'Pending', bg: 'rgba(241, 179, 28, 0.1)', color: '#f1b31c' },
  1: { label: 'Checker Approved', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  2: { label: 'Manager Approved', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  3: { label: 'Assigned to Engineer', bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' },
  4: { label: 'Estimated', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  5: { label: 'Rejected', bg: 'rgba(254, 226, 226, 0.75)', color: '#dc2626' }
};
const BUILDING_TYPE_OPTIONS = ['Condominium', 'Commercial'];
const PURPOSE_OPTIONS = ['Mortgage', 'Guarantee', 'Loan', 'Foreclosure', 'Project Finance'];
const TYPE_OPTIONS = ['NewEstimation', 'ReEstimation'];

export default function RequestDetailPage() {
  const { id } = useParams();
  const { hasPermission, user } = useAuthStore();
  const router = useRouter();
  const [request, setRequest] = useState<EstimationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportForm, setReportForm] = useState({ remarks: '', estimatedValue: 0, siteVisitDate: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [sendingFilter, setSendingFilter] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [estimationExcelWarningOpen, setEstimationExcelWarningOpen] = useState(false);
  const [estimationExcelPendingId, setEstimationExcelPendingId] = useState<number | null>(null);
  const [sendWarningOpen, setSendWarningOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState<'checker' | 'manager' | 'engineer' | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [resendForm, setResendForm] = useState<ResendFormValues>({
    applicantName: '', ownerName: '', lhuNo: '', city: '', subCity: '', kebele: '',
    plotArea: '', buildingType: 'Condominium', purpose: 'Mortgage', type: 'NewEstimation',
    projectFinanceDocType: '', billOfPenalty: false, makerRemark: '',
  });
  const [selectedFilterIds, setSelectedFilterIds] = useState<number[]>([]);

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<EstimationRequest>(`/EstimationRequests/${id}`);
      setRequest(data);
      if (data.report) {
        setReportForm({ remarks: data.report.remarks, estimatedValue: data.report.estimatedValue, siteVisitDate: data.report.siteVisitDate.split('T')[0] });
      }
      setSelectedFilterIds(data.filteredAttachmentIds ?? []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load request');
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  const handleSubmitReport = async () => {
    setSubmitting(true);
    try {
      await api.put(`/EstimationRequests/${id}/report`, { estimationRequestId: Number(id), ...reportForm });
      await fetchRequest();
    } catch (err: unknown) { const e = err as { message?: string }; setError(e.message || 'Failed to submit report'); }
    finally { setSubmitting(false); }
  };

  const performSendFilter = async () => {
    setSendingFilter(true); setError(null); setSuccessMsg(null);
    try {
      await api.post('/FilteredEstimationAttachments', { estimationRequestId: Number(id), attachmentIds: selectedFilterIds });
      setSuccessMsg('Filtered estimation attachments saved successfully');
      await fetchRequest();
    } catch (err: unknown) { const e = err as { message?: string }; setError(e.message || 'Failed to save filtered attachments'); }
    finally { setSendingFilter(false); }
  };
  const handleSendFilter = async () => {
    const hasEstimationExcel = (request?.attachments ?? []).some(a => a.id != null && selectedFilterIds.includes(a.id) && a.documentType === 'Estimation Excel');
    if (hasEstimationExcel) { setSendWarningOpen(true); } else { await performSendFilter(); }
  };
  const handleSendWarningConfirm = async () => { setSendWarningOpen(false); await performSendFilter(); };
  const handleSendWarningCancel = () => { setSendWarningOpen(false); };

  const toggleFilterSelection = (attachmentId: number) => {
    const attachment = request?.attachments.find(a => a.id === attachmentId);
    if (attachment?.documentType === 'Estimation Report') {
      const hasFinal = request?.attachments.some(a => a.documentType === 'Final Estimation');
      if (!hasFinal) {
        setError('Estimation Report cannot be selected before receiving the Final Estimation.');
        return;
      }
    }
    if (attachment?.documentType === 'Estimation Excel' && !selectedFilterIds.includes(attachmentId)) {
      setEstimationExcelPendingId(attachmentId); setEstimationExcelWarningOpen(true);
    } else {
      setSelectedFilterIds(prev => prev.includes(attachmentId) ? prev.filter(x => x !== attachmentId) : [...prev, attachmentId]);
    }
  };
  const handleEstimationExcelWarningConfirm = () => {
    if (estimationExcelPendingId !== null) {
      setSelectedFilterIds(prev => [...prev, estimationExcelPendingId]); setEstimationExcelPendingId(null);
    }
    setEstimationExcelWarningOpen(false);
  };
  const handleEstimationExcelWarningCancel = () => { setEstimationExcelPendingId(null); setEstimationExcelWarningOpen(false); };

  const [uploadingFinal, setUploadingFinal] = useState(false);
  const handleUploadFinalEstimation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Only Excel files (.xls, .xlsx) are allowed for Final Estimation.');
      e.target.value = '';
      return;
    }

    setUploadingFinal(true); setError(null); setSuccessMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', 'Final Estimation');

      const uploadRes = await api.post<{ url: string, fileName: string, filePath: string }>('/Attachments/upload', fd, { silent: true });
      
      await api.post(`/EstimationRequests/${id}/final-estimation`, [{
        fileName: uploadRes.fileName,
        filePath: uploadRes.filePath,
        documentType: 'Final Estimation'
      }]);

      setSuccessMsg('Final estimation uploaded successfully');
      await fetchRequest();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to upload final estimation');
    } finally {
      setUploadingFinal(false);
      // reset file input
      e.target.value = '';
    }
  };

  const openRejectDialog = (type: 'checker' | 'manager' | 'engineer') => { setRejectType(type); setRejectReason(''); setRejectDialogOpen(true); };
  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) { setError('Please enter a rejection reason'); return; }
    setRejecting(true); setError(null);
    try {
      const endpoint = rejectType === 'checker' ? 'checker-reject' : (rejectType === 'manager' ? 'manager-reject' : 'engineer-reject');
      const payload = rejectType === 'checker' ? { checkerRejectionDate: new Date().toISOString(), checkerReason: rejectReason } : (rejectType === 'manager' ? { managerRejectionDate: new Date().toISOString(), managerReason: rejectReason } : { engineerRejectionDate: new Date().toISOString(), engineerReason: rejectReason });
      await api.post(`/EstimationRequests/${id}/${endpoint}`, payload);
      setSuccessMsg('Request rejected successfully. Rejection reason has been recorded.');
      setRejectDialogOpen(false); setRejectReason(''); setRejectType(null);
      await fetchRequest();
    } catch (err: unknown) { const e = err as { message?: string }; setError(e.message || 'Failed to reject request'); }
    finally { setRejecting(false); }
  };
  const handleRejectCancel = () => { setRejectDialogOpen(false); setRejectReason(''); setRejectType(null); };

  const openResendDialog = () => {
    if (!request) return;
    setResendForm({
      applicantName: request.applicantName ?? '', ownerName: request.ownerName ?? '',
      lhuNo: request.lhuNo ?? '', city: request.city ?? '', subCity: request.subCity ?? '',
      kebele: request.kebele ?? '', plotArea: String(request.plotArea ?? ''),
      buildingType: request.typeOfBuilding ?? 'Condominium', purpose: request.purpose ?? 'Mortgage',
      type: request.type ?? 'NewEstimation', projectFinanceDocType: request.projectFinanceDocType ?? '',
      billOfPenalty: request.billOfPenalty ?? false, makerRemark: '',
    });
    setResendOpen(true);
  };
  const closeResendDialog = () => setResendOpen(false);

  const handleResendConfirm = async () => {
    if (!resendForm.applicantName.trim() || !resendForm.ownerName.trim() || !resendForm.lhuNo.trim()) {
      setError('Please fill in Applicant, Owner, and LHU Number before resending.'); return;
    }
    setResending(true); setError(null); setSuccessMsg(null);
    try {
      const updated = await api.post<EstimationRequest>(`/EstimationRequests/${id}/resend`, {
        id: Number(id), applicantName: resendForm.applicantName, ownerName: resendForm.ownerName,
        lhuNo: resendForm.lhuNo, city: resendForm.city, subCity: resendForm.subCity,
        kebele: resendForm.kebele, latitude: 0, longitude: 0,
        plotArea: parseFloat(resendForm.plotArea) || 0,
        buildingType: resendForm.buildingType, purpose: resendForm.purpose, type: resendForm.type,
        projectFinanceDocType: resendForm.projectFinanceDocType,
        billOfPenalty: resendForm.billOfPenalty, makerRemark: resendForm.makerRemark,
      });
      setSuccessMsg(`Request #${id} has been updated and re-submitted. The workflow continues from the Checker step.`);
      setResendOpen(false);
      if (updated) { setRequest(updated); } else { await fetchRequest(); }
    } catch (err: unknown) { const e = err as { message?: string }; setError(e.message || 'Failed to resend request'); }
    finally { setResending(false); }
  };

  const handleResendFormChange = (field: keyof ResendFormValues, value: string | boolean) => {
    setResendForm(prev => ({ ...prev, [field]: value }));
  };
  const handleResendSelectChange = (field: keyof ResendFormValues) =>
    (e: SelectChangeEvent<string>) => handleResendFormChange(field, e.target.value);

  const canSelectEstimationDocs = hasPermission(Permissions.RequestsViewEstimation) && request?.assignedEngineerId === user?.id;
  const canViewFilteredEstimation = hasPermission(Permissions.RequestsViewFilteredEstimation);
  const selectableAttachments = useMemo(() => {
    if (!request) return [];
    return (request.attachments ?? []).filter(a => a.id != null && SELECTABLE_DOCUMENT_TYPES.has(a.documentType));
  }, [request]);

  if (loading) return <DashboardLayout><Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress color="secondary" /></Box></DashboardLayout>;
  if (!request) return <DashboardLayout><Alert severity="error">{error || 'Request not found'}</Alert></DashboardLayout>;

  const isRejected = request.status === 5;
  const rejectionReason = request.checkerRejectionReason || request.managerRejectionReason || request.lastRejectionReason;
  const rejectedBy = request.checkerRejectionReason ? 'Checker' : (request.managerRejectionReason ? 'Manager' : (request.lastRejectionBy ?? null));
  const rejectionDate = request.checkerActionDate || request.managerActionDate || request.lastRejectionDate;

  const hasFinalEstimation = (request.attachments ?? []).some(a => a.documentType === 'Final Estimation');

  return (
    <DashboardLayout>
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
              <Typography variant="h3" fontWeight="900" sx={{ color: '#064e3b', mb: 0.5 }}>Request #{request.id}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={statusMap[request.status]?.label ?? `Status ${request.status}`}
                  sx={{ bgcolor: statusMap[request.status]?.bg ?? 'rgba(241, 241, 241, 0.9)', color: statusMap[request.status]?.color ?? '#334155', fontWeight: 800, borderRadius: '8px' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Submitted on {new Date(request.createdAt).toLocaleDateString()}</Typography>
                {(request.resendCount ?? 0) > 0 && (
                  <Chip icon={<History size={14} />} label={`Resent ${request.resendCount}x`} size="small"
                    sx={{ bgcolor: 'rgba(8, 145, 178, 0.1)', color: '#0e7490', fontWeight: 700 }} />
                )}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>}

      {isRejected && (
        <Alert severity="warning" icon={<XCircleIcon size={20} color="#dc2626" />}
          sx={{ mb: 3, borderRadius: 0, border: '2px solid #dc2626', bgcolor: 'rgba(254, 226, 226, 0.5)' }}>
          <Box>
            <Typography variant="body1" fontWeight="800" sx={{ mb: 1, color: '#7f1d1d' }}>This request was rejected</Typography>
            {rejectionReason && (
              <Typography variant="body2" sx={{ color: '#7f1d1d', mb: 1, fontWeight: 500 }}>
                <strong>{rejectedBy} Reason:</strong> {rejectionReason}
              </Typography>
            )}
            {rejectionDate && (
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                {new Date(rejectionDate).toLocaleDateString()} at {new Date(rejectionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
            {request.branchUserId === user?.id && (
              <Button variant="contained"
                startIcon={resending ? <CircularProgress size={18} color="inherit" /> : <RotateCcw size={18} />}
                onClick={openResendDialog} disabled={resending}
                sx={{ bgcolor: '#0891b2', color: 'white', fontWeight: 800, borderRadius: 0, py: 1, px: 3, '&:hover': { bgcolor: '#0e7490' } }}>
                {resending ? 'Resending...' : 'Edit & Resend for Review'}
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {(request.resendCount ?? 0) > 0 && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<History size={20} />}>
          <Typography variant="body2" fontWeight="700">Resend history</Typography>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            This request has been resent <strong>{request.resendCount}</strong> time{request.resendCount! > 1 ? 's' : ''}.
            Last resent at {request.resentAt ? new Date(request.resentAt).toLocaleString() : 'n/a'}.
            {request.lastRejectionReason && (<> Last rejection reason: <em>{request.lastRejectionReason}</em> (by {request.lastRejectionBy ?? 'reviewer'}).</>)}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={4}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" fontWeight="900" sx={{ mb: 4, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Building size={20} /> Property & Applicant
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Applicant</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.applicantName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Owner</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.ownerName}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>LHC</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a', fontFamily: 'monospace' }}>{request.lhuNo}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Location</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <MapPin size={18} color="#f1b31c" />
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.location || `${request.city}, ${request.subCity}, Kebele ${request.kebele}`}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Plot Area</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.plotArea?.toLocaleString()} m²</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Building</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.typeOfBuilding}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Purpose</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.purpose}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Type</Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ color: '#0f172a' }}>{request.type}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" fontWeight="900" sx={{ mb: 3, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={20} /> Documents & Attachments
              </Typography>
              {request.assignedEngineerId === user?.id && (
                <Alert 
                  severity={hasFinalEstimation ? "success" : "info"} 
                  sx={{ 
                    mb: 2, 
                    borderRadius: '8px',
                    animation: hasFinalEstimation ? 'pulse-alert 2s infinite' : 'none',
                    '@keyframes pulse-alert': {
                      '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
                      '50%': { transform: 'scale(1.01)', boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
                      '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' }
                    }
                  }}
                >
                  {hasFinalEstimation ? (
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#065f46' }}>
                      🎉 Final Estimation is now available! The Estimation Report upload is active. Please upload and submit your Estimation Report to the checker and manager.
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      Waiting for the <strong>Final Estimation</strong> to be uploaded by the manager (requires the "Estimation Excel" and "Relevant Photo PDF" to be uploaded first). The Estimation Report upload is disabled until then. Once received, it will become active.
                    </Typography>
                  )}
                </Alert>
              )}
              {hasPermission(Permissions.RequestsUploadFinalEstimation) && request.attachments.some(a => a.documentType === 'Estimation Excel') && request.attachments.some(a => a.documentType === 'Relevant Photo') && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: '8px', bgcolor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                  <Typography variant="body2">
                    Please review the documents. Once the valuation is approved, <strong>upload the Final Estimation</strong>. 
                    After uploading, please <strong>select the Estimation Report checkbox</strong> and click "Send Filter" to send it to the checker.
                  </Typography>
                </Alert>
              )}
              {(() => {
                const isAssignedEngineer = user?.id != null && user.id === request.assignedEngineerId;
                return (
                  <List sx={{ bgcolor: '#f8fafc', borderRadius: '16px', p: 1 }}>
                {request.attachments.map((file, index) => {
                  const isSelectable = canSelectEstimationDocs && file.id != null && SELECTABLE_DOCUMENT_TYPES.has(file.documentType);
                  const isSelected = isSelectable && selectedFilterIds.includes(file.id as number);
                  const isFinalEstimation = file.documentType === 'Final Estimation';
                  const isEstimationReport = file.documentType === 'Estimation Report';
                  const isDisabledReport = isEstimationReport && !hasFinalEstimation;
                  
                  if (isFinalEstimation && !isAssignedEngineer && !(user?.id != null && file.uploadedById === user.id)) return null;
                  
                  return (
                    <ListItem key={file.id ?? index}
                      sx={{ 
                        bgcolor: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'white', 
                        mb: 1, 
                        borderRadius: isFinalEstimation ? '8px' : 0, 
                        border: isFinalEstimation ? '2px solid #8b5cf6' : (isSelected ? '1px solid #10b981' : '1px solid #f1f5f9'),
                        animation: isFinalEstimation ? 'pulse-border 2s infinite' : 'none',
                        '@keyframes pulse-border': {
                          '0%': { borderColor: '#8b5cf6', boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.4)' },
                          '50%': { borderColor: '#c4b5fd', boxShadow: '0 0 0 6px rgba(139, 92, 246, 0)' },
                          '100%': { borderColor: '#8b5cf6', boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)' }
                        }
                      }}
                      secondaryAction={
                        <IconButton component="a" href={file.fileUrl} target="_blank" sx={{ color: '#064e3b', bgcolor: 'rgba(6, 78, 59, 0.05)' }}>
                          <Download size={18} />
                        </IconButton>
                      }>
                      {isSelectable && (
                        <Checkbox 
                          checked={isSelected} 
                          disabled={isDisabledReport}
                          onChange={() => toggleFilterSelection(file.id as number)} 
                          sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' }, mr: 1 }} 
                        />
                      )}
                      <ListItemIcon sx={{ minWidth: 45 }}><FileText color="#64748b" /></ListItemIcon>
                      <ListItemText primary={file.fileName} secondary={file.documentType}
                        primaryTypographyProps={{ fontWeight: 700, color: '#0f172a' }}
                        secondaryTypographyProps={{ fontWeight: 600, color: '#94a3b8' }} />
                    </ListItem>
                  );
                })}
                {request.attachments.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', p: 2 }}>No attachments available.</Typography>
                )}
              </List>
              );})()}
              {(canSelectEstimationDocs || (hasPermission(Permissions.RequestsUploadFinalEstimation) && request.attachments.some(a => a.documentType === 'Estimation Excel') && request.attachments.some(a => a.documentType === 'Relevant Photo'))) && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  {hasPermission(Permissions.RequestsUploadFinalEstimation) && request.attachments.some(a => a.documentType === 'Estimation Excel') && request.attachments.some(a => a.documentType === 'Relevant Photo') && (
                    <Button component="label" variant="outlined" disabled={uploadingFinal}
                      startIcon={uploadingFinal ? <CircularProgress size={18} color="inherit" /> : <FileText size={18} />}
                      sx={{ borderColor: '#0891b2', color: '#0891b2', fontWeight: 800, borderRadius: 0, '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.05)' } }}>
                      {uploadingFinal ? 'Uploading...' : 'Upload Final Estimation'}
                      <input type="file" hidden onChange={handleUploadFinalEstimation} accept=".xls,.xlsx" />
                    </Button>
                  )}
                  {canSelectEstimationDocs && selectableAttachments.length > 0 && (
                    <Button variant="contained" startIcon={sendingFilter ? <CircularProgress size={18} color="inherit" /> : <Filter size={18} />}
                      onClick={handleSendFilter} disabled={sendingFilter}
                      sx={{ bgcolor: '#064e3b', color: 'white', fontWeight: 800, borderRadius: 0, '&:hover': { bgcolor: '#065f46' } }}>
                      {sendingFilter ? 'Sending...' : `Send Filter (${selectedFilterIds.length} selected)`}
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={4}>
            {isRejected && request.branchUserId === user?.id && (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '2px solid #0891b2', bgcolor: 'rgba(8, 145, 178, 0.02)' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 1, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RotateCcw size={20} color="#0891b2" /> Re-submit Request
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontWeight: 500 }}>
                  Edit the request data and re-submit it. The workflow will continue from the Checker step.
                </Typography>
                <Button variant="contained" fullWidth
                  startIcon={resending ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                  onClick={openResendDialog} disabled={resending}
                  sx={{ bgcolor: '#0891b2', color: 'white', fontWeight: 800, py: 1.5, borderRadius: 0, '&:hover': { bgcolor: '#0e7490' } }}>
                  {resending ? 'Resending...' : 'Edit & Resend for Review'}
                </Button>
              </Paper>
            )}

            {request.report && (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #10b981', bgcolor: 'rgba(16, 185, 129, 0.02)' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 4, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle2 size={20} /> Final Valuation Report
                </Typography>
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Estimated Value</Typography>
                    <Typography variant="h3" fontWeight="900" sx={{ color: '#10b981' }}>ETB {request.report.estimatedValue.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={18} color="#64748b" />
                    <Typography variant="body2" fontWeight="700" sx={{ color: '#0f172a' }}>
                      Site Visit Conducted on {new Date(request.report.siteVisitDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Remarks</Typography>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500, fontStyle: 'italic' }}>&ldquo;{request.report.remarks}&rdquo;</Typography>
                    </Paper>
                  </Box>
                </Stack>
              </Paper>
            )}

            {hasPermission(Permissions.RequestsApprove) && request.status === 0 && (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '2px solid #2563eb', bgcolor: 'rgba(37, 99, 235, 0.02)' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 3, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle size={20} color="#2563eb" /> Checker Review Action
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" fullWidth onClick={() => router.push('/requests')}
                    sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 800, borderRadius: 0, py: 1.5, '&:hover': { bgcolor: '#059669' } }}>Approve</Button>
                  <Button variant="outlined" fullWidth onClick={() => openRejectDialog('checker')}
                    sx={{ borderColor: '#dc2626', color: '#dc2626', fontWeight: 800, borderRadius: 0, py: 1.5, '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.05)' } }}>Reject</Button>
                </Stack>
              </Paper>
            )}

            {hasPermission(Permissions.RequestsApprove) && request.status === 1 && (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '2px solid #7c3aed', bgcolor: 'rgba(124, 58, 237, 0.02)' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 3, color: '#064e3b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle size={20} color="#7c3aed" /> Manager Review Action
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" fullWidth onClick={() => router.push('/requests')}
                    sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 800, borderRadius: 0, py: 1.5, '&:hover': { bgcolor: '#059669' } }}>Approve</Button>
                  <Button variant="outlined" fullWidth onClick={() => openRejectDialog('manager')}
                    sx={{ borderColor: '#dc2626', color: '#dc2626', fontWeight: 800, borderRadius: 0, py: 1.5, '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.05)' } }}>Reject</Button>
                </Stack>
              </Paper>
            )}

            {hasPermission(Permissions.RequestsAssignReject) && request.assignedEngineerId === user?.id && (request.status === 3 || request.status === 4) && (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '2px solid #f59e0b', bgcolor: 'rgba(245, 158, 11, 0.02)' }}>
                <Typography variant="h6" fontWeight="900" sx={{ mb: 3, color: '#b45309', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <XCircleIcon size={20} color="#f59e0b" /> Engineer Review Action
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" fullWidth onClick={() => openRejectDialog('engineer')}
                    sx={{ borderColor: '#dc2626', color: '#dc2626', fontWeight: 800, borderRadius: 0, py: 1.5, '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.05)' } }}>Reject Request</Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={estimationExcelWarningOpen} onClose={handleEstimationExcelWarningCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: '#f1b31c', backgroundColor: 'rgba(241, 179, 28, 0.1)' }}>Estimation Excel - Sensitive Document</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: '#0f172a', fontWeight: 500, mb: 2 }}>
            You are about to select the <strong>"Estimation Excel"</strong> document, which is highly sensitive.
          </DialogContentText>
          <DialogContentText sx={{ color: '#475569' }}>Please ensure you have the necessary permissions and that this action is intended.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleEstimationExcelWarningCancel} variant="outlined" sx={{ borderColor: '#e2e8f0', color: '#64748b', fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleEstimationExcelWarningConfirm} variant="contained" sx={{ bgcolor: '#f1b31c', color: '#0f172a', fontWeight: 700 }}>I Understand, Proceed</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sendWarningOpen} onClose={handleSendWarningCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: '#f1b31c', backgroundColor: 'rgba(241, 179, 28, 0.1)' }}>Confirm Sending Estimation Excel</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: '#0f172a', fontWeight: 500, mb: 2 }}>
            Your selection includes the <strong>"Estimation Excel"</strong> document(s).
          </DialogContentText>
          <DialogContentText sx={{ color: '#475569', mb: 2 }}>This is a sensitive document containing confidential financial information. Are you sure you want to send it?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleSendWarningCancel} variant="outlined" sx={{ borderColor: '#e2e8f0', color: '#64748b', fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleSendWarningConfirm} variant="contained" sx={{ bgcolor: '#f1b31c', color: '#0f172a', fontWeight: 700 }}>Yes, Send</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>Confirm Rejection</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ color: '#0f172a', fontWeight: 500, mb: 2 }}>
            Please provide a detailed rejection reason. The applicant will see this reason and can edit and resubmit the request.
          </DialogContentText>
          <TextField autoFocus fullWidth multiline rows={4} placeholder="Enter rejection reason..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#f8fafc' } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleRejectCancel} variant="outlined" sx={{ borderColor: '#e2e8f0', color: '#64748b', fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleRejectConfirm} disabled={!rejectReason.trim() || rejecting} variant="contained"
            sx={{ bgcolor: '#dc2626', color: 'white', fontWeight: 700, '&:hover': { bgcolor: '#b91c1c' } }}>
            {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resendOpen} onClose={closeResendDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: '#064e3b', borderBottom: '1px solid #e2e8f0', py: 2 }}>
          Edit & Resend Request #{id}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: '8px' }}>
            The original rejection reason is preserved in the audit trail and will remain visible. After you save, the request returns to the Checker step.
          </Alert>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Applicant Name *" value={resendForm.applicantName}
                onChange={(e) => handleResendFormChange('applicantName', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Owner Name *" value={resendForm.ownerName}
                onChange={(e) => handleResendFormChange('ownerName', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="LHC Number *" value={resendForm.lhuNo}
                onChange={(e) => handleResendFormChange('lhuNo', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Plot Area" type="number" value={resendForm.plotArea}
                onChange={(e) => handleResendFormChange('plotArea', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="City" value={resendForm.city}
                onChange={(e) => handleResendFormChange('city', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Sub-City" value={resendForm.subCity}
                onChange={(e) => handleResendFormChange('subCity', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Kebele" value={resendForm.kebele}
                onChange={(e) => handleResendFormChange('kebele', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Building Type</InputLabel>
                <Select value={resendForm.buildingType} label="Building Type" onChange={handleResendSelectChange('buildingType')} sx={{ borderRadius: '8px' }}>
                  {BUILDING_TYPE_OPTIONS.map(opt => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Purpose</InputLabel>
                <Select value={resendForm.purpose} label="Purpose" onChange={handleResendSelectChange('purpose')} sx={{ borderRadius: '8px' }}>
                  {PURPOSE_OPTIONS.map(opt => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={resendForm.type} label="Type" onChange={handleResendSelectChange('type')} sx={{ borderRadius: '8px' }}>
                  {TYPE_OPTIONS.map(opt => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Maker Remark (optional)" multiline rows={3}
                placeholder="Briefly note what was changed or why this resubmission is ready for review..."
                value={resendForm.makerRemark} onChange={(e) => handleResendFormChange('makerRemark', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={closeResendDialog} disabled={resending} variant="outlined" sx={{ borderColor: '#e2e8f0', color: '#64748b', fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleResendConfirm} disabled={resending} variant="contained"
            startIcon={resending ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            sx={{ bgcolor: '#0891b2', color: 'white', fontWeight: 800, '&:hover': { bgcolor: '#0e7490' } }}>
            {resending ? 'Saving...' : 'Save & Resend for Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
