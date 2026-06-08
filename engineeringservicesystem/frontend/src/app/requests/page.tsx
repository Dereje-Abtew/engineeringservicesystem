'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Typography, Box, Chip, IconButton, Button, Paper, Menu, MenuItem, 
  ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, CircularProgress, Alert, FormHelperText, Card, CardContent, Divider, Tabs, Tab, 
  Select, FormControl, InputLabel, Checkbox, FormControlLabel, Zoom, Tooltip, Avatar, Badge, keyframes,
  type SelectChangeEvent
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { 
  Eye, Plus, CheckCircle, XCircle, Upload, X, FileText, 
  Users, MapPin, RefreshCw, Trash2, Edit, Download, 
  Zap, Star, Target, Crown, Home, Building,
  Ruler, 
  // Phone, Mail, User, Key,
  // Sparkles, Brain, Rocket, Shield, Gem, ThumbsUp,
   Briefcase,
  Trophy, Medal, Compass,
  //  Navigation, Heart, Flame, Settings,BarChart3, 
  Activity,
  //  Gauge, AlertCircle, Check, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/store';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/utils/api';
import { useFormik, type FormikProps } from 'formik';
import * as Yup from 'yup';
import RequestsTable from '@/components/RequestsTable';
import { fetchEthiopianLocations, EthiopianRegion, EthiopianCity, EthiopianSubCity } from '@/constants/ethiopianLocations';

// =================================================================
// Animation keyframes for eye-catching effects
// =================================================================

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(6, 78, 59, 0.4); transform: scale(1); }
  50% { box-shadow: 0 0 0 8px rgba(6, 78, 59, 0.1); transform: scale(1.01); }
  100% { box-shadow: 0 0 0 0 rgba(6, 78, 59, 0); transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const bounceIn = keyframes`
  0% { opacity: 0; transform: translateY(30px); }
  60% { opacity: 1; transform: translateY(-8px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const starPulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const requestInputSx = {
  '& .MuiInputBase-root': {
    borderRadius: '16px',
    minHeight: 60,
    bgcolor: '#fff',
    fontSize: '1rem'
  },
  '& .MuiInputLabel-root': {
    fontSize: '1rem'
  }
};

const requestSelectSx = {
  ...requestInputSx,
  minWidth: 0,
  width: '100%',
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    minHeight: '28px !important',
    py: 1.5
  }
};

// =================================================================
// Type Definitions
// =================================================================

interface EstimationRequest {
  id: number;
  applicantName: string;
  ownerName: string;
  lhuNo: string;
  city: string;
  subCity: string;
  kebele: string;
  location?: string;
  plotArea: number;
  buildingType: string;
  purpose: string;
  type: string;
  status: number;
  createdAt: string;
  branchUserId?: string;
  branchId?: string;
  officerId?: string;
  engineeringOfficerId?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  estimatedValue?: number;
  valuationDate?: string;
  estimatedBy?: string;
  checkerActionDate?: string;
  checkerActionDescription?: string;
  checkerRejectionReason?: string;
  managerActionDate?: string;
  managerActionDescription?: string;
  managerRejectionReason?: string;
  report?: {
    id: number;
    estimatedValue: number;
    siteVisitDate: string;
    remarks: string;
    createdAt: string;
    assignedEngineerName?: string;
  };
  projectFinanceDocType?: string;
  billOfPenalty?: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  id?: number;
  fileName: string;
  fileUrl: string;
  documentType: string;
}

interface RequestFormValues {
  applicantName: string;
  ownerName: string;
  lhuNo: string;
  region: string;
  cityId: string;
  subCityId: string;
  kebeleName: string;
  city: string;
  subCity: string;
  kebele: string;
  plotArea: string;
  buildingType: string;
  purpose: string;
  projectFinanceDocType: string;
  billOfPenalty: boolean;
  type: string;
}

interface EngOfficer {
  id: string;
  name: string;
  email?: string;
  currentLoad: number;
  specialization?: string;
  assignedRequests?: EstimationRequest[];
  previousRequests?: EstimationRequest[]; // All previously assigned requests (including completed)
}

interface AssignmentRecommendation {
  officerId: string;
  officerName: string;
  matchScore: number;
  sameSubCity: boolean;
  sameKebele: boolean;
  perfectMatch: boolean;      // Both sub-city AND kebele match
  sameSubCityCount: number;    // Number of active requests in same sub-city
  sameKebeleCount: number;     // Number of active requests in same kebele
  currentLoad: number;
  specialization: string;
  matchLabel: string;
  matchReason: string;
}

type WorkflowActionType = 'checker_approve' | 'checker_reject' | 'manager_approve' | 'manager_reject' | 'manager_assign' | 'manager_manage' | null;

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[] | string>;
}

interface ApiError {
  response?: { data?: ApiErrorResponse };
}

interface OfficerApiRecord {
  id?: string | number;
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  email?: string;
  [key: string]: unknown;
}

const getErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const err = error as ApiError;
    return err.response?.data?.message || fallback;
  }
  return fallback;
};

const getErrorData = (error: unknown): ApiErrorResponse | undefined => {
  if (typeof error === 'object' && error !== null) {
    const err = error as ApiError;
    return err.response?.data;
  }
  return undefined;
};

// =================================================================
// Password Change Dialog Component
// =================================================================

const PasswordChangeDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/UserManagement/change-password', {
        currentPassword,
        newPassword
      });
      setSuccess('Password changed successfully!');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#064E3B', borderBottom: '1px solid #e2e8f0', py: 2 }}>
        Change Password
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        
        <TextField
          fullWidth
          type="password"
          label="Current Password *"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          sx={{ mb: 3 }}
        />
        
        <TextField
          fullWidth
          type="password"
          label="New Password *"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          helperText="Password must be at least 8 characters"
          sx={{ mb: 3 }}
        />
        
        <TextField
          fullWidth
          type="password"
          label="Confirm New Password *"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handlePasswordChange} variant="contained" disabled={loading} sx={{ bgcolor: '#064E3B' }}>
          {loading ? <CircularProgress size={24} /> : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =================================================================
// View Details Dialog Component
// =================================================================

const ViewDetailsDialog = ({ open, onClose, request }: { open: boolean; onClose: () => void; request: EstimationRequest | null }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (open && request) {
      if (request.attachments && request.attachments.length > 0) {
        setAttachments(request.attachments);
        setLoadingAttachments(false);
      } else if (request.id) {
        const fetchAttachments = async () => {
          setLoadingAttachments(true);
          try {
            const fullRequest = await api.get<EstimationRequest>(`/EstimationRequests/${request.id}`, { silent: true });
            if (fullRequest?.attachments) {
              setAttachments(fullRequest.attachments);
            } else {
              setAttachments([]);
            }
          } catch (err) {
            console.error('Failed to fetch attachments:', err);
            setAttachments([]);
          } finally {
            setLoadingAttachments(false);
          }
        };
        fetchAttachments();
      } else {
        setAttachments([]);
        setLoadingAttachments(false);
      }
    }
  }, [open, request]);

  const getCorrectFileUrl = (fileUrl: string): string => {
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5270/api').replace(/\/api$/, '');
    
    let cleanPath = fileUrl;
    if (!cleanPath.startsWith('/uploads')) {
      cleanPath = `/uploads/${cleanPath.replace(/^\/+/, '')}`;
    }
    
    return `${baseUrl}${cleanPath}`;
  };

  const handleViewFile = (fileUrl: string) => {
    window.open(getCorrectFileUrl(fileUrl), '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = getCorrectFileUrl(fileUrl);
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!request) return null;

  const statusMap: Record<number, { label: string; color: string; bg: string }> = {
    0: { label: 'Pending Checker', color: '#d97706', bg: '#fef3c7' },
    1: { label: 'Checker Approved', color: '#2563eb', bg: '#eff6ff' },
    2: { label: 'Manager Approved', color: '#059669', bg: '#ecfdf5' },
    3: { label: 'Assigned to Engineer', color: '#7c3aed', bg: '#f5f3ff' },
    4: { label: 'Estimated', color: '#0891b2', bg: '#ecfeff' },
    5: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#064E3B', borderBottom: '1px solid #e2e8f0', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}><FileText size={20} />Request Details #{request.id}</Box>
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}><Typography variant="subtitle1" fontWeight="700" sx={{ color: '#064E3B', mb: 2, borderBottom: '2px solid #064E3B', pb: 1 }}>Basic Information</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Applicant Name</Typography><Typography variant="body1" fontWeight="600">{request.applicantName}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Owner Name</Typography><Typography variant="body1" fontWeight="600">{request.ownerName}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>LHU Number</Typography><Typography variant="body1" fontWeight="600" fontFamily="monospace">{request.lhuNo}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Status</Typography><Chip label={statusMap[request.status]?.label} size="small" sx={{ bgcolor: statusMap[request.status]?.bg, color: statusMap[request.status]?.color, fontWeight: 600 }} /></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Created At</Typography><Typography variant="body1" fontWeight="600">{new Date(request.createdAt).toLocaleDateString()}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Assigned Engineer</Typography><Typography variant="body1" fontWeight="600">{request.assignedEngineerName || 'Not Assigned'}</Typography></Grid>
          
          <Grid item xs={12}><Typography variant="subtitle1" fontWeight="700" sx={{ color: '#064E3B', mt: 2, mb: 2, borderBottom: '2px solid #064E3B', pb: 1 }}>Property Details</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Plot Area</Typography><Typography variant="body1" fontWeight="600">{request.plotArea?.toLocaleString()} m²</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Building Type</Typography><Typography variant="body1" fontWeight="600">{request.buildingType}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>City</Typography><Typography variant="body1" fontWeight="600">{request.city}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Sub-City</Typography><Typography variant="body1" fontWeight="600">{request.subCity}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Kebele</Typography><Typography variant="body1" fontWeight="600">{request.kebele}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Purpose</Typography><Typography variant="body1" fontWeight="600">{request.purpose}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Type</Typography><Typography variant="body1" fontWeight="600">{request.type}</Typography></Grid>
          {request.purpose === 'Project Finance' && (
            <>
              <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Project Finance Document</Typography><Typography variant="body1" fontWeight="600">{(request as any).projectFinanceDocType || '-'}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="body2" sx={{ color: '#64748b' }}>Bill of Penalty</Typography><Typography variant="body1" fontWeight="600">{(request as any).billOfPenalty ? 'Yes' : 'No'}</Typography></Grid>
            </>
          )}
          
          <Grid item xs={12}><Typography variant="subtitle1" fontWeight="700" sx={{ color: '#064E3B', mt: 2, mb: 2, borderBottom: '2px solid #064E3B', pb: 1 }}>Attachments ({attachments.length})</Typography></Grid>
          <Grid item xs={12}>
            {loadingAttachments ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
            : attachments.length === 0 ? <Box sx={{ p: 4, bgcolor: '#f8fafc', textAlign: 'center' }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>No attachments</Typography></Box>
            : <Grid container spacing={2}>{attachments.map((att, idx) => (
                <Grid item xs={12} sm={6} key={att.id || idx}>
                  <Card sx={{ borderRadius: '12px' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">{att.fileName}</Typography>
                          <Chip label={att.documentType} size="small" sx={{ mt: 1 }} />
                        </Box>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="View document">
                            <IconButton onClick={() => handleViewFile(att.fileUrl)} size="small">
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download document">
                            <IconButton onClick={() => handleDownload(att.fileUrl, att.fileName)} size="small">
                              <Download size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}</Grid>}
          </Grid>
          
          {request.report ? (
            <>
              <Grid item xs={12}><Typography variant="subtitle1" fontWeight="700" sx={{ color: '#064E3B', mt: 2, mb: 2, borderBottom: '2px solid #064E3B', pb: 1 }}>Valuation Report</Typography></Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Estimated Value</Typography>
                <Typography variant="body1" fontWeight="700" sx={{ color: '#059669' }}>ETB {request.report.estimatedValue?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Site Visit Date</Typography>
                <Typography variant="body1" fontWeight="600">{new Date(request.report.siteVisitDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Report Created At</Typography>
                <Typography variant="body1" fontWeight="600">{new Date(request.report.createdAt).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Prepared By</Typography>
                <Typography variant="body1" fontWeight="600">{request.report.assignedEngineerName || 'Unknown'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Remarks</Typography>
                <Paper sx={{ p: 2, bgcolor: '#f8fafc', mt: 1, whiteSpace: 'pre-wrap' }}>
                  <Typography variant="body2">{request.report.remarks}</Typography>
                </Paper>
              </Grid>
            </>
          ) : null
          }
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// =================================================================
// Estimation Form Dialog - WORKING VERSION FROM REFERENCE CODE
// =================================================================

const EstimationFormDialog = ({ 
  open, 
  onClose, 
  request, 
  onSuccess,
  isEdit = false,
  existingReport = null
}: { 
  open: boolean; 
  onClose: () => void; 
  request: EstimationRequest | null; 
  onSuccess: () => void;
  isEdit?: boolean;
  existingReport?: EstimationRequest['report'] | null;
}) => {
  const { notify } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const [reportAttachments, setReportAttachments] = useState<Attachment[]>([]);
  const [reportUploading, setReportUploading] = useState(false);
  const [reportUploadError, setReportUploadError] = useState<string | null>(null);

  const handleUploadReportFile = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setReportUploadError(`${type} is too large. Please upload a file that is 10 MB or smaller.`);
      e.target.value = '';
      return;
    }
    setReportUploadError(null);
    setReportUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post<{ url: string }>('/Attachments/upload', fd, { silent: true });
      setReportAttachments(prev => [
        ...prev.filter(existing => existing.documentType !== type),
        { fileName: file.name, fileUrl: res.url, documentType: type }
      ]);
    } catch {
      setReportUploadError('Upload failed');
    } finally {
      setReportUploading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (!open) {
      setReportAttachments([]);
      return;
    }

    if (request?.attachments?.length) {
      setReportAttachments(request.attachments.filter(a => ['Estimation Excel', 'Relevant Photo', 'Estimation Report'].includes(a.documentType)));
    } else {
      setReportAttachments([]);
    }
  }, [open, request]);

  const attachmentTypes = ['Estimation Excel', 'Relevant Photo', 'Estimation Report'];
  interface ValuationFormValues {
    estimatedValue: string;
    siteVisitDate: string;
    remarks: string;
    attachments: string;
  }

  const formik = useFormik<ValuationFormValues>({
    enableReinitialize: true,
    initialValues: {
      estimatedValue: isEdit && existingReport ? existingReport.estimatedValue.toString() : '',
      siteVisitDate: isEdit && existingReport ? existingReport.siteVisitDate?.split('T')[0] : new Date().toISOString().split('T')[0],
      remarks: isEdit && existingReport ? existingReport.remarks : '',
      attachments: ''
    },
    validationSchema: Yup.object({
      estimatedValue: Yup.number()
        .nullable()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .positive('Must be positive')
        .typeError('Must be a valid number'),
      remarks: Yup.string()
        .required('Remarks are required')
        .min(1, 'Remarks must be at least 1 character')
        .max(1000, 'Remarks cannot exceed 1000 characters'),
      siteVisitDate: Yup.date().required('Site visit date is required'),
    }),
    validate: () => {
      const errors: Record<string, string> = {};
      const missingAttachments = attachmentTypes.filter(type => !reportAttachments.some(a => a.documentType === type));
      if (missingAttachments.length > 0) {
        errors.attachments = `Required uploads: ${missingAttachments.join(', ')}`;
      }
      return errors;
    },
    onSubmit: async (values) => {
      if (!request) return;
      setSubmitting(true);
      try {
        const comprehensiveRemarks = `
=== PROPERTY SUMMARY ===
Plot Area: ${request.plotArea} sqm
Building Type: ${request.buildingType}
Location: ${request.subCity}, ${request.kebele}
LHU Number: ${request.lhuNo}
        `.trim();

        const payload: any = {
          estimationRequestId: request.id,
          siteVisitDate: new Date(values.siteVisitDate).toISOString(),
          remarks: values.remarks || comprehensiveRemarks,
          estimatedValue: values.estimatedValue ? parseFloat(values.estimatedValue) : 0,
          attachments: reportAttachments.map(a => ({
            fileName: a.fileName,
            filePath: a.fileUrl,
            documentType: a.documentType
          }))
        };

        if (isEdit && existingReport) {
          await api.put(`/EstimationRequests/${request.id}/report`, payload);
          notify('Estimation updated successfully!', 'success');
        } else {
          await api.post(`/EstimationRequests/${request.id}/report`, payload);
          notify('Estimation submitted successfully!', 'success');
        }
        
        onSuccess();
        onClose();
        formik.resetForm();
      } catch (error: unknown) {
        const errorData = getErrorData(error);
        console.error('Estimation submission error:', errorData);

        if (errorData?.errors) {
          const errors = errorData.errors;
          const errorList = Object.values(errors).flat().join(', ');
          notify(`Validation Error: ${errorList}`, 'error');
        } else {
          notify(`Failed to submit estimation: ${getErrorMessage(error, 'Failed to submit estimation')}`, 'error');
        }
      } finally {
        setSubmitting(false);
      }
    }
  });

  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#064E3B', borderBottom: '1px solid #e2e8f0', py: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <FileText size={20} />
          {isEdit ? 'Edit Property Valuation Estimation' : 'Property Valuation Estimation'}
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
          Request #{request.id} - {request.applicantName}
        </Typography>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0fdf4' }}>
            <Typography variant="subtitle2" fontWeight="600">Property Summary</Typography>
            <Grid container spacing={1} mt={0.5}>
              <Grid item xs={6}><Typography variant="caption">Applicant:</Typography><Typography variant="body2" fontWeight="500">{request.applicantName}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption">LHU:</Typography><Typography variant="body2" fontWeight="500">{request.lhuNo}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption">Plot Area:</Typography><Typography variant="body2" fontWeight="700">{request.plotArea} m²</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption">Building Type:</Typography><Typography variant="body2" fontWeight="500">{request.buildingType}</Typography></Grid>
            </Grid>
          </Paper>
          
          <Grid container spacing={3}>
            <input type="hidden" name="siteVisitDate" value={formik.values.siteVisitDate} />
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Property Value (ETB)"
                name="estimatedValue"
                value={formik.values.estimatedValue}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.estimatedValue && Boolean(formik.errors.estimatedValue)}
                helperText={formik.touched.estimatedValue ? String(formik.errors.estimatedValue || '') : 'Optional'}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>Birr</Typography> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Estimation Excel *</Typography>
              <Button component="label" variant="outlined" startIcon={reportUploading ? <CircularProgress size={14} /> : <Upload size={14} />} disabled={reportUploading}>
                Upload Excel
                <input type="file" hidden onChange={(e) => handleUploadReportFile(e, 'Estimation Excel')} accept=".xlsx,.xls" />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: '#475569' }}>
                {reportAttachments.find(a => a.documentType === 'Estimation Excel')?.fileName || 'No file uploaded'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Relevant Photo PDF *</Typography>
              <Button component="label" variant="outlined" startIcon={reportUploading ? <CircularProgress size={14} /> : <Upload size={14} />} disabled={reportUploading}>
                Upload PDF
                <input type="file" hidden onChange={(e) => handleUploadReportFile(e, 'Relevant Photo')} accept=".pdf,.doc,.docx" />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: '#475569' }}>
                {reportAttachments.find(a => a.documentType === 'Relevant Photo')?.fileName || 'No file uploaded'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Estimation Report *</Typography>
              <Button component="label" variant="outlined" startIcon={reportUploading ? <CircularProgress size={14} /> : <Upload size={14} />} disabled={reportUploading}>
                Upload Report
                <input type="file" hidden onChange={(e) => handleUploadReportFile(e, 'Estimation Report')} accept=".pdf,.doc,.docx" />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: '#475569' }}>
                {reportAttachments.find(a => a.documentType === 'Estimation Report')?.fileName || 'No file uploaded'}
              </Typography>
            </Grid>
            {(reportUploadError || (formik.errors.attachments && formik.submitCount > 0)) && (
              <Grid item xs={12}>
                <Alert severity="error">{formik.errors.attachments || reportUploadError}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks *"
                name="remarks"
                value={formik.values.remarks}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.remarks && Boolean(formik.errors.remarks)}
                helperText={formik.touched.remarks ? String(formik.errors.remarks || '') : ''}
                placeholder="Enter overall remarks and summary of the valuation..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting} sx={{ bgcolor: '#064E3B' }}>
            {submitting ? <CircularProgress size={24} /> : (isEdit ? 'Update Estimation' : 'Submit Estimation')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// =================================================================
// Location Selectors
// =================================================================

interface EthiopianLocationSelectorsProps {
  formik: FormikProps<{
    region: string;
    cityId: string;
    subCityId: string;
    kebeleName: string;
    city: string;
    subCity: string;
    kebele: string;
    plotArea: string;
    buildingType: string;
    purpose: string;
    type: string;
  }>;
}

const EthiopianLocationSelectors = ({ formik }: EthiopianLocationSelectorsProps) => {
  const [regions, setRegions] = useState<EthiopianRegion[]>([]);
  const [cities, setCities] = useState<EthiopianCity[]>([]);
  const [subCities, setSubCities] = useState<EthiopianSubCity[]>([]);
  const [kebeles, setKebeles] = useState<string[]>([]);

  useEffect(() => { fetchEthiopianLocations().then(setRegions); }, []);

  const handleRegion = (e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const id = e.target.value as string;
    formik.setFieldValue('region', id);
    formik.setFieldValue('cityId', ''); formik.setFieldValue('subCityId', ''); formik.setFieldValue('kebeleName', '');
    formik.setFieldValue('city', ''); formik.setFieldValue('subCity', ''); formik.setFieldValue('kebele', '');
    const r = regions.find(x => x.id === id);
    setCities(r?.cities || []); setSubCities([]); setKebeles([]);
  };

  const handleCity = (e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const id = e.target.value as string;
    formik.setFieldValue('cityId', id); formik.setFieldValue('subCityId', ''); formik.setFieldValue('kebeleName', '');
    const c = cities.find(x => x.id === id);
    formik.setFieldValue('city', c?.name || '');
    setSubCities(c?.subCities || []); setKebeles([]);
  };

  const handleSubCity = (e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const id = e.target.value as string;
    formik.setFieldValue('subCityId', id); formik.setFieldValue('kebeleName', '');
    const s = subCities.find(x => x.id === id);
    formik.setFieldValue('subCity', s?.name || '');
    setKebeles(s?.kebeles || []);
  };

  const handleKebele = (e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value as string;
    formik.setFieldValue('kebeleName', val);
    formik.setFieldValue('kebele', val);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(260px, 1fr))' },
        gap: 3,
        width: '100%'
      }}
    >
      <Box sx={{ minWidth: 0, width: '100%' }}>
        <FormControl fullWidth required error={formik.touched.region && Boolean(formik.errors.region)} sx={requestSelectSx}>
          <InputLabel>Region</InputLabel>
          <Select value={formik.values.region || ''} onChange={handleRegion} onBlur={formik.handleBlur} name="region" label="Region">
            <MenuItem value=""><em>Select Region</em></MenuItem>
            {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
          </Select>
          {formik.touched.region && formik.errors.region && <FormHelperText error>{formik.errors.region}</FormHelperText>}
        </FormControl>
      </Box>
      <Box sx={{ minWidth: 0, width: '100%' }}>
        <FormControl fullWidth required disabled={!formik.values.region} error={formik.touched.cityId && Boolean(formik.errors.cityId)} sx={requestSelectSx}>
          <InputLabel>City</InputLabel>
          <Select value={formik.values.cityId || ''} onChange={handleCity} onBlur={formik.handleBlur} name="cityId" label="City">
            <MenuItem value=""><em>Select City</em></MenuItem>
            {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
          {formik.touched.cityId && formik.errors.cityId && <FormHelperText error>{formik.errors.cityId}</FormHelperText>}
        </FormControl>
      </Box>
      <Box sx={{ minWidth: 0, width: '100%' }}>
        <FormControl fullWidth required disabled={!formik.values.cityId} error={formik.touched.subCityId && Boolean(formik.errors.subCityId)} sx={requestSelectSx}>
          <InputLabel>Sub-City</InputLabel>
          <Select value={formik.values.subCityId || ''} onChange={handleSubCity} onBlur={formik.handleBlur} name="subCityId" label="Sub-City">
            <MenuItem value=""><em>Select Sub-City</em></MenuItem>
            {subCities.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
          {formik.touched.subCityId && formik.errors.subCityId && <FormHelperText error>{formik.errors.subCityId}</FormHelperText>}
        </FormControl>
      </Box>
      <Box sx={{ minWidth: 0, width: '100%' }}>
        <FormControl fullWidth required disabled={!formik.values.subCityId} error={formik.touched.kebeleName && Boolean(formik.errors.kebeleName)} sx={requestSelectSx}>
          <InputLabel>Kebele</InputLabel>
          <Select value={formik.values.kebeleName || ''} onChange={handleKebele} onBlur={formik.handleBlur} name="kebeleName" label="Kebele">
            <MenuItem value=""><em>Select Kebele</em></MenuItem>
            {kebeles.map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
          </Select>
          {formik.touched.kebeleName && formik.errors.kebeleName && <FormHelperText error>{formik.errors.kebeleName}</FormHelperText>}
        </FormControl>
      </Box>
    </Box>
  );
};

// =================================================================
// Animated Recommendation Card Component
// =================================================================

const AnimatedRecommendationCard = ({ 
  recommendation, 
  isSelected, 
  onClick, 
  index,
  isTopMatch 
}: { 
  recommendation: AssignmentRecommendation;
  isSelected: boolean;
  onClick: () => void;
  index: number;
  isTopMatch: boolean;
}) => {
  let colors;
  let matchIcon = null;
  
  if (recommendation.perfectMatch) {
    colors = { bg: '#f0fdf4', border: '#047857', accent: '#047857', glow: '0 14px 34px rgba(4, 120, 87, 0.18)' };
    matchIcon = <Crown size={16} color="#064E3B" />;
  } else if (recommendation.sameSubCityCount > 0) {
    colors = { bg: '#ecfdf5', border: '#34d399', accent: '#34d399', glow: '0 12px 28px rgba(52, 211, 153, 0.16)' };
    matchIcon = <Building size={14} color="#059669" />;
  } else {
    colors = { bg: '#ffffff', border: '#cbd5e1', accent: '#64748b', glow: '0 10px 24px rgba(15, 23, 42, 0.08)' };
    matchIcon = null;
  }

  return (
      <Card 
        sx={{ 
          borderRadius: '12px',
          bgcolor: colors.bg,
          border: `2px solid ${isSelected ? colors.accent : colors.border}`,
          width: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isSelected ? 'translateY(-2px)' : 'none',
          animation: isTopMatch && !isSelected ? `${pulseGlow} 2s infinite` : 'none',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': { 
            transform: 'translateY(-3px)',
            boxShadow: colors.glow,
            borderColor: colors.accent
          },
          '&::before': isTopMatch ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: `${shimmer} 2s infinite`,
          } : {}
        }}
        onClick={onClick}
      >
        {isTopMatch && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: -10,
              right: -10,
              background: 'linear-gradient(135deg, #064E3B, #059669)',
              color: 'white',
              borderRadius: '30px',
              px: 2,
              py: 0.5,
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 2,
              boxShadow: '0 4px 12px rgba(6, 78, 59, 0.3)',
              animation: `${bounceIn} 0.5s ease-out`
            }}
          >
            <Zap size={12} />
            TOP MATCH
          </Box>
        )}
        
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: colors.accent,
                background: isTopMatch ? 'linear-gradient(135deg, #064E3B, #059669)' : colors.accent,
                boxShadow: isTopMatch ? '0 4px 15px rgba(6, 78, 59, 0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {isTopMatch ? <Crown size={28} /> : recommendation.officerName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="700" display="flex" alignItems="center" gap={1}>
                  {recommendation.officerName}
                  {isTopMatch && (
                    <Tooltip title="Best match based on experience in this exact location">
                      <Box sx={{ animation: `${starPulse} 1.5s infinite` }}>
                        <Star size={16} color="#f59e0b" />
                      </Box>
                    </Tooltip>
                  )}
                </Typography>
                <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                  <Chip size="small" label={recommendation.specialization} icon={<Briefcase size={12} />} sx={{ height: 24, fontSize: '0.7rem' }} />
                  <Chip size="small" label={`${recommendation.currentLoad} active request(s)`} icon={<Activity size={12} />} sx={{ height: 24, fontSize: '0.7rem' }} />
                  <Chip 
                    size="small" 
                    label={recommendation.matchLabel} 
                    icon={matchIcon || undefined}
                    sx={{ 
                      height: 24, 
                      fontSize: '0.7rem',
                      bgcolor: recommendation.perfectMatch ? '#04785720' : 
                               recommendation.sameSubCityCount > 0 ? '#05966920' : '#e2e8f0',
                      color: recommendation.perfectMatch ? '#064E3B' : 
                             recommendation.sameSubCityCount > 0 ? '#059669' : '#64748b',
                      fontWeight: 600
                    }} 
                  />
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Box sx={{ position: 'relative', width: 80, height: 80 }}>
                <svg width={80} height={80}>
                  <circle cx={40} cy={40} r={32} fill="none" stroke="#e2e8f0" strokeWidth="5" />
                  <circle 
                    cx={40} cy={40} r={32} fill="none" 
                    stroke={colors.accent} 
                    strokeWidth="5" 
                    strokeDasharray={2 * Math.PI * 32} 
                    strokeDashoffset={2 * Math.PI * 32 * (1 - recommendation.matchScore / 100)} 
                    strokeLinecap="round" 
                    style={{ 
                      transition: 'stroke-dashoffset 1s ease-out', 
                      transform: 'rotate(-90deg)', 
                      transformOrigin: '50% 50%' 
                    }} 
                  />
                </svg>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="800" sx={{ color: colors.accent, lineHeight: 1 }}>{recommendation.matchScore}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem' }}>MATCH</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" fontWeight="600">Experience Score</Typography>
              <Typography variant="caption" fontWeight="800" sx={{ color: colors.accent }}>{recommendation.matchScore}%</Typography>
            </Box>
            <Box sx={{ width: '100%', bgcolor: '#e2e8f0', borderRadius: '10px', height: 8, overflow: 'hidden' }}>
              <Box 
                sx={{ 
                  width: `${recommendation.matchScore}%`, 
                  bgcolor: colors.accent, 
                  borderRadius: '10px', 
                  height: 8, 
                  transition: 'width 1s ease-out',
                  background: recommendation.perfectMatch ? 'linear-gradient(90deg, #064E3B, #059669)' : colors.accent
                }} 
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="flex-start" gap={0.75}>
              {recommendation.perfectMatch ? <Trophy size={14} color="#047857" /> : recommendation.sameSubCity ? <MapPin size={14} color="#059669" /> : <Compass size={14} color="#64748b" />}
              <Typography variant="caption" fontWeight={recommendation.perfectMatch || recommendation.sameSubCity ? 700 : 500} sx={{ color: recommendation.perfectMatch ? '#047857' : recommendation.sameSubCity ? '#059669' : '#64748b' }}>
                {recommendation.matchReason}
              </Typography>
            </Box>
            {recommendation.perfectMatch && (
              <Tooltip title="Perfect match: active request exists in this same sub-city and kebele">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Medal size={16} color="#064E3B" />
                  <Typography variant="caption" fontWeight="800" sx={{ color: '#064E3B' }}>Perfect</Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
          
          {isSelected && (
            <Zoom in timeout={200}>
              <Box sx={{ mt: 2, pt: 1.5, display: 'flex', alignItems: 'center', gap: 0.75, color: colors.accent, borderTop: `1px solid ${colors.accent}30` }}>
                <CheckCircle size={14} />
                <Typography variant="caption" fontWeight="700">✓ Selected for assignment</Typography>
              </Box>
            </Zoom>
          )}
        </CardContent>
      </Card>
  );
};

// =================================================================
// Main RequestsPage Component
// =================================================================

export default function RequestsPage() {
  const { user, notify } = useAuthStore();
  const { hasPermission, canCreateRequest, canEditRequest, canApproveRequest, canManagerApprove, canRejectRequest, canManagerReject, canAssignRequest, canManageWorkload, canEstimateRequest, canEditEstimation } = usePermissions();
  const router = useRouter();

  const [data, setData] = useState<EstimationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<EstimationRequest | null>(null);
  const [mounted, setMounted] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingReportData, setExistingReportData] = useState<EstimationRequest['report'] | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [workflowAction, setWorkflowAction] = useState<WorkflowActionType>(null);
  const [engOfficers, setEngOfficers] = useState<EngOfficer[]>([]);
  const [recommendations, setRecommendations] = useState<AssignmentRecommendation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<EstimationRequest[]>([]);
  const [manageRequestsForOfficer, setManageRequestsForOfficer] = useState<EngOfficer | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isCheckingLHU, setIsCheckingLHU] = useState(false);
  const [lhuError, setLhuError] = useState<string | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [requestToReassign, setRequestToReassign] = useState<EstimationRequest | null>(null);
  const [selectedNewOfficerId, setSelectedNewOfficerId] = useState<string>('');
  const requiredDocumentTypes = ['Estimation Fee', 'Land Deed', 'Floor Plan'];

  // =================================================================
  // Data Fetching Functions
  // =================================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.get<EstimationRequest[]>('/EstimationRequests', { silent: true });
      
      const requestsWithDetails = await Promise.all(
        (result || []).map(async (request) => {
          try {
            const fullRequest = await api.get<EstimationRequest>(`/EstimationRequests/${request.id}`, { silent: true });
            return { ...request, ...fullRequest };
          } catch {
            return request;
          }
        })
      );
      
      setData(requestsWithDetails || []);
      const pending = (requestsWithDetails || []).filter(r => r.status === 2 && !r.assignedEngineerId);
      setPendingRequests(pending);
      
      return requestsWithDetails || [];
    } catch (error: unknown) {
      console.error('[FetchData Error]', getErrorMessage(error));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOfficers = useCallback(async () => {
    try {
      const result = await api.get<unknown>('/UserManagement/engineering-officers', { silent: true });
      
      let officersArray: OfficerApiRecord[] = [];
      const resultObj = result as Record<string, unknown>;
      
      if (result && Array.isArray(result)) {
        officersArray = result as OfficerApiRecord[];
      } else if (result && typeof result === 'object' && 'data' in result && Array.isArray(resultObj.data)) {
        officersArray = resultObj.data as OfficerApiRecord[];
      } else if (result && typeof result === 'object' && 'items' in result && Array.isArray(resultObj.items)) {
        officersArray = resultObj.items as OfficerApiRecord[];
      } else if (result && typeof result === 'object' && '$values' in result && Array.isArray(resultObj.$values)) {
        officersArray = resultObj.$values as OfficerApiRecord[];
      } else if (result && typeof result === 'object' && 'result' in result && Array.isArray(resultObj.result)) {
        officersArray = resultObj.result as OfficerApiRecord[];
      }
      
      const allRequests = await fetchData();
      
      const mappedOfficers = officersArray.map((officer, idx: number) => {
        const firstName = officer.firstName || officer.FirstName || '';
        const lastName = officer.lastName || officer.LastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        const assignedRequests = allRequests.filter(r => 
          r.assignedEngineerId === (officer.id?.toString()) && 
          (r.status === 2 || r.status === 3)
        );
        
        const previousRequests = allRequests.filter(r => 
          r.assignedEngineerId === (officer.id?.toString())
        );
        
        return {
          id: officer.id?.toString() || `off-${idx}`,
          name: fullName || officer.email || 'Engineer',
          email: officer.email,
          currentLoad: assignedRequests.length,
          specialization: ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Condominium'][Math.floor(Math.random() * 5)],
          assignedRequests: assignedRequests,
          previousRequests: previousRequests
        };
      }).filter(o => o.id && o.id !== '');
      
      if (mappedOfficers.length > 0) {
        setEngOfficers(mappedOfficers);
      } else {
        setEngOfficers([]);
      }
      
    } catch (error: unknown) {
      console.error('Error fetching officers:', getErrorMessage(error));
      setEngOfficers([]);
    }
  }, [fetchData]);

  // =================================================================
  // Helper Functions
  // =================================================================

  const getRequestsByOfficer = useCallback((officerId: string) => {
    return data.filter(r => r.assignedEngineerId === officerId && (r.status === 2 || r.status === 3));
  }, [data]);

  // =================================================================
  // Enhanced Assignment Functions with SubCity/Kebele matching (PERFECT MATCH = Both)
  // =================================================================
  
  const getActiveRequestsCountBySubCity = useCallback((officerId: string, subCity: string): number => {
    const officer = engOfficers.find(o => o.id === officerId);
    if (!officer || !officer.assignedRequests) return 0;
    return officer.assignedRequests.filter(req => 
      req.subCity?.toLowerCase() === subCity?.toLowerCase()
    ).length;
  }, [engOfficers]);
  
  const getActiveRequestsCountByKebele = useCallback((officerId: string, kebele: string, subCity: string): number => {
    const officer = engOfficers.find(o => o.id === officerId);
    if (!officer || !officer.assignedRequests) return 0;
    return officer.assignedRequests.filter(req => 
      req.kebele?.toLowerCase() === kebele?.toLowerCase() &&
      req.subCity?.toLowerCase() === subCity?.toLowerCase()
    ).length;
  }, [engOfficers]);

  const getPreviousRequestsCountBySubCity = getActiveRequestsCountBySubCity;
  const getPreviousRequestsCountByKebele = getActiveRequestsCountByKebele;

  const getRecommendations = useCallback((request: EstimationRequest): AssignmentRecommendation[] => {
    const pendingCount = data.filter(r => r.status === 2 && !r.assignedEngineerId).length;
    
    return engOfficers.map(officer => {
      let matchScore = 0;
      const sameSubCityCount = getActiveRequestsCountBySubCity(officer.id, request.subCity);
      const sameKebeleCount = getActiveRequestsCountByKebele(officer.id, request.kebele, request.subCity);
      
      const perfectMatch = sameSubCityCount > 0 && sameKebeleCount > 0;
      const goodMatch = sameSubCityCount > 0 && sameKebeleCount === 0;
      let matchLabel = 'Available';
      let matchReason = 'No active request in this sub-city or kebele.';
      
      if (perfectMatch) {
        matchScore = 85;
        matchScore += Math.min(12, sameKebeleCount * 4);
        matchScore += Math.min(8, sameSubCityCount * 2);
        matchLabel = 'Perfect Match';
        matchReason = `This engineer has ${sameKebeleCount} active request(s) in the same sub-city and kebele.`;
      } else if (goodMatch) {
        matchScore = 70;
        matchScore += Math.min(12, sameSubCityCount * 3);
        matchLabel = 'Good Match';
        matchReason = `This engineer has ${sameSubCityCount} active request(s) in the same sub-city.`;
      } else {
        const specializationMatch = request.buildingType?.toLowerCase().includes(officer.specialization?.toLowerCase() || '') || false;
        matchScore = specializationMatch ? 35 : 25;
        matchLabel = specializationMatch ? 'Relevant Type' : 'General Fit';
        matchReason = specializationMatch
          ? `No active area match, but the building type aligns with ${officer.specialization || 'their specialization'}.`
          : 'No active area match. Consider workload before assigning.';
      }
      
      const maxLoad = Math.max(...engOfficers.map(o => o.currentLoad), 1);
      const workloadFactor = Math.max(0, 16 - (officer.currentLoad / maxLoad) * 16);
      matchScore += workloadFactor;
      
      const pendingFactor = Math.max(0, 6 - (pendingCount / Math.max(engOfficers.length, 1)) * 4);
      matchScore += pendingFactor;
      
      // Ensure score doesn't exceed 100
      matchScore = Math.min(100, Math.round(matchScore));
      
      return {
        officerId: officer.id,
        officerName: officer.name,
        matchScore: matchScore,
        sameSubCity: sameSubCityCount > 0,
        sameKebele: sameKebeleCount > 0,
        perfectMatch: perfectMatch,
        sameSubCityCount: sameSubCityCount,
        sameKebeleCount: sameKebeleCount,
        currentLoad: officer.currentLoad,
        specialization: officer.specialization || 'General',
        matchLabel,
        matchReason,
      };
    }).sort((a, b) => {
      if (a.perfectMatch !== b.perfectMatch) {
        return a.perfectMatch ? -1 : 1;
      }
      if (a.sameSubCity !== b.sameSubCity) {
        return a.sameSubCity ? -1 : 1;
      }
      return b.matchScore - a.matchScore;
    });
  }, [engOfficers, data, getActiveRequestsCountBySubCity, getActiveRequestsCountByKebele]);

  const batchAssign = useCallback(async (officerId: string, requestIds: number[]) => {
    setAssigning(true);
    try {
      for (const requestId of requestIds) {
        await api.post(`/EstimationRequests/${requestId}/assign`, { officerId });
      }
      const updatedData = await fetchData();
      await fetchOfficers();
      
      const updatedOfficers = engOfficers.map(officer => {
        if (officer.id === officerId) {
          const newlyAssigned = updatedData.filter(r => 
            requestIds.includes(r.id) && r.assignedEngineerId === officerId
          );
          const updatedPrevious = [...(officer.previousRequests || []), ...newlyAssigned];
          return {
            ...officer,
            currentLoad: (officer.currentLoad || 0) + newlyAssigned.length,
            assignedRequests: [...(officer.assignedRequests || []), ...newlyAssigned],
            previousRequests: updatedPrevious
          };
        }
        return officer;
      });
      setEngOfficers(updatedOfficers);
      
      if (manageRequestsForOfficer && manageRequestsForOfficer.id === officerId) {
        const updatedAssignments = getRequestsByOfficer(officerId);
        setManageRequestsForOfficer({ ...manageRequestsForOfficer, assignedRequests: updatedAssignments });
      }
      
      notify(`Successfully assigned ${requestIds.length} request(s)`, 'success');
      return true;
    } catch (error: unknown) {
      console.error('Assignment error:', getErrorMessage(error));
      notify(`Assignment failed: ${getErrorMessage(error)}`, 'error');
      throw error;
    } finally {
      setAssigning(false);
    }
  }, [fetchData, fetchOfficers, engOfficers, getRequestsByOfficer, manageRequestsForOfficer, notify]);

  const removeAssignment = useCallback(async (requestId: number) => {
    if (!confirm('Remove this assignment? The request will be available for reassignment.')) return;
    
    try {
      setAssigning(true);
      try {
        await api.post(`/EstimationRequests/${requestId}/unassign`, {});
      } catch {
        await api.delete(`/EstimationRequests/${requestId}/assignment`);
      }
      
      const updatedData = await fetchData();
      await fetchOfficers();
      
      if (manageRequestsForOfficer) {
        const updatedAssignments = updatedData.filter(r => 
          r.assignedEngineerId === manageRequestsForOfficer.id && 
          (r.status === 2 || r.status === 3)
        );
        setManageRequestsForOfficer({ ...manageRequestsForOfficer, assignedRequests: updatedAssignments });
        
        const updatedOfficers = engOfficers.map(officer => {
          if (officer.id === manageRequestsForOfficer.id) {
            return {
              ...officer,
              currentLoad: updatedAssignments.length,
              assignedRequests: updatedAssignments
            };
          }
          return officer;
        });
        setEngOfficers(updatedOfficers);
      }
      
      notify('Assignment removed successfully', 'success');
      return true;
    } catch (error: unknown) {
      console.error('Error removing assignment:', getErrorMessage(error));
      notify(`Failed to remove assignment: ${getErrorMessage(error)}`, 'error');
      throw error;
    } finally {
      setAssigning(false);
    }
  }, [fetchData, fetchOfficers, manageRequestsForOfficer, engOfficers]);

  const handleReassignRequest = useCallback(async (requestId: number, newOfficerId: string) => {
    if (!newOfficerId) {
      notify('Please select an engineer', 'warning');
      return;
    }
    
    setAssigning(true);
    try {
      const currentRequest = data.find(r => r.id === requestId);
      const oldOfficerId = currentRequest?.assignedEngineerId;
      
      try {
        await api.post(`/EstimationRequests/${requestId}/unassign`, {});
      } catch (err) {
        console.log('No existing assignment or removal failed, proceeding with assign...');
      }
      
      await api.post(`/EstimationRequests/${requestId}/assign`, { officerId: newOfficerId });
      
      const updatedData = await fetchData();
      await fetchOfficers();
      
      if (manageRequestsForOfficer && oldOfficerId === manageRequestsForOfficer.id) {
        const oldOfficerAssignments = updatedData.filter(r => 
          r.assignedEngineerId === oldOfficerId && 
          (r.status === 2 || r.status === 3)
        );
        setManageRequestsForOfficer({ ...manageRequestsForOfficer, assignedRequests: oldOfficerAssignments });
      }
      
      if (manageRequestsForOfficer && newOfficerId === manageRequestsForOfficer.id) {
        const newOfficerAssignments = updatedData.filter(r => 
          r.assignedEngineerId === newOfficerId && 
          (r.status === 2 || r.status === 3)
        );
        setManageRequestsForOfficer({ ...manageRequestsForOfficer, assignedRequests: newOfficerAssignments });
      }
      
      const updatedOfficers = await Promise.all(engOfficers.map(async (officer) => {
        if (officer.id === oldOfficerId || officer.id === newOfficerId) {
          const assignments = updatedData.filter(r => 
            r.assignedEngineerId === officer.id && 
            (r.status === 2 || r.status === 3)
          );
          return {
            ...officer,
            currentLoad: assignments.length,
            assignedRequests: assignments
          };
        }
        return officer;
      }));
      setEngOfficers(updatedOfficers);
      
      notify(`Request #${requestId} reassigned successfully`, 'success');
      setReassignDialogOpen(false);
      setRequestToReassign(null);
      setSelectedNewOfficerId('');
    } catch (error: unknown) {
      console.error('Error reassigning request:', getErrorMessage(error));
      notify(`Failed to reassign: ${getErrorMessage(error)}`, 'error');
    } finally {
      setAssigning(false);
    }
  }, [fetchData, fetchOfficers, data, manageRequestsForOfficer, engOfficers]);

  // =================================================================
  // Workflow Functions
  // =================================================================

  const handleManageWorkload = async (officer: EngOfficer) => {
    const assignedRequests = getRequestsByOfficer(officer.id);
    setManageRequestsForOfficer({ ...officer, currentLoad: assignedRequests.length, assignedRequests: assignedRequests });
    setWorkflowAction('manager_manage');
    handleMenuClose();
  };

  const checkLHU = useCallback(async (lhuNo: string, currentRequestId?: number) => {
    if (!lhuNo?.trim()) { setLhuError(null); return true; }
    setIsCheckingLHU(true);
    try {
      const existing = await api.get<EstimationRequest[]>('/EstimationRequests', { silent: true });
      const duplicate = existing.some(r => 
        r.lhuNo?.toLowerCase() === lhuNo.toLowerCase() && 
        (currentRequestId ? r.id !== currentRequestId : true)
      );
      setLhuError(duplicate ? 'LHU number already exists. Please enter a unique LHU number.' : null);
      return !duplicate;
    } catch { return true; }
    finally { setIsCheckingLHU(false); }
  }, []);

  // =================================================================
  // UI Handlers
  // =================================================================

  const handleView = (row: EstimationRequest) => { setSelectedRow(row); setViewDetailsDialogOpen(true); handleMenuClose(); };
  const handleEstimate = (row: EstimationRequest, isEdit: boolean = false) => { setSelectedRow(row); setIsEditMode(isEdit); setExistingReportData(row.report || null); setEstimationDialogOpen(true); handleMenuClose(); };
  const handleSmartAssign = async (row: EstimationRequest) => { 
    setSelectedRow(row); 
    setRecommendations(getRecommendations(row));
    setSelectedOfficerId('');
    setWorkflowAction('manager_assign'); 
    handleMenuClose(); 
  };
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, row: EstimationRequest) => { setAnchorEl(e.currentTarget); setSelectedRow(row); };
  const handleMenuClose = () => { setAnchorEl(null); };
  const handleOpenForm = () => { setOpenDialog(true); setSubmitError(null); setLhuError(null); };
  let handleCloseForm = () => { setOpenDialog(false); setAttachments([]); setSubmitError(null); };
  const handleConfirmAssignment = async () => {
    if (!selectedOfficerId || !selectedRow) return;
    await batchAssign(selectedOfficerId, [selectedRow.id]);
    setWorkflowAction(null);
    setRecommendations([]);
    setSelectedOfficerId('');
  };
  const handleOpenReassignDialog = (request: EstimationRequest) => {
    setRequestToReassign(request);
    setSelectedNewOfficerId('');
    setReassignDialogOpen(true);
  };

  // =================================================================
  // File Upload Functions
  // =================================================================

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError(`${type} is too large. Please upload a file that is 10 MB or smaller.`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post<{ url: string }>('/Attachments/upload', fd, { silent: true });
      setAttachments(prev => [
        ...prev.filter(existing => existing.documentType !== type),
        { fileName: file.name, fileUrl: res.url, documentType: type }
      ]);
      setSubmitError(null);
    } catch { setSubmitError('Upload failed'); }
    finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (idx: number) => setAttachments(attachments.filter((_, i) => i !== idx));

  const submitRequest = async () => {
    setOpenConfirm(false);
    const missingDocuments = getMissingDocumentTypes();
    if (missingDocuments.length > 0) {
      setSubmitError(`Please upload all required documents: ${missingDocuments.join(', ')}.`);
      return;
    }
    
    const isUnique = await checkLHU(formik.values.lhuNo);
    if (!isUnique) {
      setSubmitError('LHU number already exists. Please enter a unique LHU number.');
      return;
    }
    
    try {
      await api.post('/EstimationRequests', {
        applicantName: formik.values.applicantName.trim(),
        ownerName: formik.values.ownerName.trim(),
        lhuNo: formik.values.lhuNo.trim(),
        city: formik.values.city,
        subCity: formik.values.subCity,
        kebele: formik.values.kebele,
        plotArea: Number(formik.values.plotArea),
        buildingType: formik.values.buildingType,
        purpose: formik.values.purpose,
        projectFinanceDocType: formik.values.projectFinanceDocType,
        billOfPenalty: formik.values.billOfPenalty,
        type: formik.values.type,
        attachments: attachments.map(a => ({ fileName: a.fileName, filePath: a.fileUrl, documentType: a.documentType })),
        branchUserId: user?.id,
        branchId: user?.branchId
      });
      formik.resetForm();
      setAttachments([]);
      await fetchData();
      handleCloseForm();
    } catch (error: unknown) {
      const errorData = getErrorData(error);
      console.error('Submit error:', errorData);
      if (errorData?.message?.toLowerCase().includes('lhu') || (typeof errorData?.errors === 'object' && errorData.errors !== null && 'lhuNo' in errorData.errors)) {
        setSubmitError('LHU number already exists. Please enter a unique LHU number.');
      } else {
        setSubmitError(errorData?.message || 'Submission failed');
      }
    }
  };

  // =================================================================
  // Formik Forms
  // =================================================================

  const schema = Yup.object({
    applicantName: Yup.string().required('Required').min(2),
    ownerName: Yup.string().required('Required').min(2),
    lhuNo: Yup.string().required('Required'),
    region: Yup.string().required('Required'),
    cityId: Yup.string().required('Required'),
    subCityId: Yup.string().required('Required'),
    kebeleName: Yup.string().required('Required'),
    plotArea: Yup.number().required('Required').positive(),
    buildingType: Yup.string().required('Required'),
    purpose: Yup.string().required('Required'),
    projectFinanceDocType: Yup.string().when('purpose', (value: unknown, schema) => {
      const purposeValue = Array.isArray(value) ? value[0] : value;
      return purposeValue === 'Project Finance' ? schema.required('Required') : schema;
    }),
    billOfPenalty: Yup.boolean(),
    type: Yup.string().required('Required'),
  });

  const formik = useFormik<RequestFormValues>({
    initialValues: { applicantName: '', ownerName: '', lhuNo: '', region: '', cityId: '', subCityId: '', kebeleName: '', city: '', subCity: '', kebele: '', plotArea: '', buildingType: '', purpose: '', projectFinanceDocType: '', billOfPenalty: false, type: '' },
    validationSchema: schema,
    onSubmit: () => {
      const missingDocuments = getMissingDocumentTypes();
      if (missingDocuments.length > 0) {
        setSubmitError(`Please upload all required documents: ${missingDocuments.join(', ')}.`);
      } else {
        setOpenConfirm(true);
      }
    },
  });

  handleCloseForm = () => { setOpenDialog(false); formik.resetForm(); setAttachments([]); setSubmitError(null); };

  const getMissingDocumentTypes = () => {
    const required = [...requiredDocumentTypes];
    if (formik.values.purpose === 'Project Finance') {
      required.push('Construction Permit');
    }
    return required.filter(type => !attachments.some(file => file.documentType === type));
  };

  const workflowFormik = useFormik({
    initialValues: { description: '', reason: '', officerId: '' },
    onSubmit: async (values) => {
      if (!selectedRow) return;
      try {
        setLoading(true);
        const currentDate = new Date().toISOString();

        if (workflowAction === 'checker_approve') {
          await api.post(`/EstimationRequests/${selectedRow.id}/checker-approve`, { 
            checkerApprovalDate: currentDate, 
            checkerDescription: values.description 
          });
        } else if (workflowAction === 'checker_reject') {
          await api.post(`/EstimationRequests/${selectedRow.id}/checker-reject`, { 
            checkerRejectionDate: currentDate, 
            checkerReason: values.reason 
          });
        } else if (workflowAction === 'manager_approve') {
          await api.post(`/EstimationRequests/${selectedRow.id}/manager-approve`, { 
            managerApprovalDate: currentDate, 
            managerDescription: values.description 
          });
        } else if (workflowAction === 'manager_reject') {
          await api.post(`/EstimationRequests/${selectedRow.id}/manager-reject`, { 
            managerRejectionDate: currentDate, 
            managerReason: values.reason 
          });
        } else if (workflowAction === 'manager_assign' && values.officerId) {
          await batchAssign(values.officerId, [selectedRow.id]);
        }
        
        setWorkflowAction(null);
        workflowFormik.resetForm();
        const updatedRequests = await fetchData();
        const refreshedRow = updatedRequests.find(r => r.id === selectedRow.id);
        if (refreshedRow) {
          setSelectedRow(refreshedRow);
        }
        setAnchorEl(null);
      } catch (error: unknown) {
        notify(getErrorMessage(error, 'The operation failed'), 'error');
      } finally {
        setLoading(false);
      }
    }
  });

  // =================================================================
  // Menu Items
  // =================================================================

  const getMenuItems = () => {
    if (!selectedRow) return [];
    const items = [];
    items.push(<MenuItem key="view" onClick={() => handleView(selectedRow)}><ListItemIcon><Eye size={18} /></ListItemIcon><ListItemText primary="View Details" /></MenuItem>);
    if (canEditRequest(selectedRow.status)) items.push(<MenuItem key="edit" onClick={() => router.push(`/requests/${selectedRow.id}/edit`)}><ListItemIcon><Edit size={18} /></ListItemIcon><ListItemText primary="Edit Request" /></MenuItem>);
    if (canApproveRequest(selectedRow.status)) items.push(<MenuItem key="approve" onClick={() => setWorkflowAction('checker_approve')}><ListItemIcon><CheckCircle size={18} color="#059669" /></ListItemIcon><ListItemText primary="Approve Request" /></MenuItem>);
    if (canRejectRequest(selectedRow.status)) items.push(<MenuItem key="reject" onClick={() => setWorkflowAction('checker_reject')}><ListItemIcon><XCircle size={18} color="#dc2626" /></ListItemIcon><ListItemText primary="Reject Request" /></MenuItem>);
    if (canManagerApprove(selectedRow.status)) items.push(<MenuItem key="mgr-approve" onClick={() => setWorkflowAction('manager_approve')}><ListItemIcon><CheckCircle size={18} color="#059669" /></ListItemIcon><ListItemText primary="Manager Approve" /></MenuItem>);
    if (canManagerReject(selectedRow.status)) items.push(<MenuItem key="mgr-reject" onClick={() => setWorkflowAction('manager_reject')}><ListItemIcon><XCircle size={18} color="#dc2626" /></ListItemIcon><ListItemText primary="Manager Reject" /></MenuItem>);
    if (canAssignRequest(selectedRow.status, !!selectedRow.assignedEngineerId)) items.push(<MenuItem key="assign" onClick={() => handleSmartAssign(selectedRow)}><ListItemIcon><Target size={18} color="#7c3aed" /></ListItemIcon><ListItemText primary="Smart Assign" /></MenuItem>);
    if (canManageWorkload() && selectedRow.status !== 4 && selectedRow.status !== 5) {
      const officer = engOfficers.find(o => o.id === selectedRow.assignedEngineerId);
      const canOpenWorkload = Boolean(officer && selectedRow.assignedEngineerId && (selectedRow.status === 2 || selectedRow.status === 3));
      items.push(
        <MenuItem
          key="manage"
          disabled={!canOpenWorkload}
          onClick={() => officer ? handleManageWorkload(officer) : null}
        >
          <ListItemIcon><Users size={18} /></ListItemIcon>
          <ListItemText primary="Manage Engineer Workload" />
        </MenuItem>
      );
    }
    if (canEstimateRequest(selectedRow.status, selectedRow.assignedEngineerId === user?.id, !!selectedRow.report)) items.push(<MenuItem key="estimate" onClick={() => handleEstimate(selectedRow, false)}><ListItemIcon><FileText size={18} /></ListItemIcon><ListItemText primary="Send Estimation" /></MenuItem>);
    if (canEditEstimation(selectedRow.status, selectedRow.assignedEngineerId === user?.id, !!selectedRow.report)) items.push(<MenuItem key="re-estimate" onClick={() => handleEstimate(selectedRow, true)}><ListItemIcon><Edit size={18} /></ListItemIcon><ListItemText primary="Re-Estimate" /></MenuItem>);
    if (selectedRow.report) items.push(<MenuItem key="view-report" onClick={() => handleView(selectedRow)}><ListItemIcon><FileText size={18} /></ListItemIcon><ListItemText primary="View Submitted Report" /></MenuItem>);
    return items;
  };

  // =================================================================
  // Effects
  // =================================================================

  useEffect(() => { 
    setMounted(true); 
    fetchData(); 
    if (canManageWorkload() || canAssignRequest(2, false)) fetchOfficers(); 
  }, []);

  // =================================================================
  // Render
  // =================================================================

  return (
    <DashboardLayout>
      <PasswordChangeDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
      {selectedRow && <EstimationFormDialog open={estimationDialogOpen} onClose={() => setEstimationDialogOpen(false)} request={selectedRow} onSuccess={fetchData} isEdit={isEditMode} existingReport={existingReportData} />}
      <ViewDetailsDialog open={viewDetailsDialogOpen} onClose={() => setViewDetailsDialogOpen(false)} request={selectedRow} />

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="700" sx={{ color: '#064E3B' }}>Estimation Requests</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Manage and track all engineering valuation requests.</Typography>
        </Box>
        {mounted && canCreateRequest() && (
          <Button onClick={handleOpenForm} variant="contained" startIcon={<Plus size={18} />} sx={{ bgcolor: '#064E3B' }}>
            New Request
          </Button>
        )}
      </Box>

      <RequestsTable 
        data={data} 
        loading={loading} 
        currentUserId={user?.id || ''} 
        currentBranchId={user?.branchId} 
        onMenuOpen={handleMenuOpen}
        onViewDetails={handleView}
      />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { minWidth: 220 } }}>
        {getMenuItems()}
      </Menu>

      {/* =================================================================
          SMART ASSIGNMENT DIALOG - ENHANCED WITH PERFECT MATCH (SUB-CITY + KEBELE)
          WITH EYE-CATCHING ANIMATIONS
      ================================================================= */}
      <Dialog 
        open={workflowAction === 'manager_assign'} 
        onClose={() => { setWorkflowAction(null); setRecommendations([]); setSelectedOfficerId(''); }} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
      >
        <Box sx={{ 
          background: 'linear-gradient(135deg, #064E3B, #059669)', 
          px: 3, 
          py: 2.5,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Animated background decoration */}
          <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
            <Target size={100} color="white" />
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box>
              <Target size={24} style={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: 'white' }}>
                Smart Assignment - Request #{selectedRow?.id}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {selectedRow?.applicantName} • {selectedRow?.subCity}, Kebele {selectedRow?.kebele}
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 4, pb: 2, bgcolor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Paper sx={{ 
              px: 3, 
              py: 1, 
              borderRadius: '40px', 
              bgcolor: 'white', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              border: '1px solid #e2e8f0'
            }}>
              <MapPin size={16} color="#064E3B" />
              <Typography variant="body2" fontWeight="600">{selectedRow?.subCity}</Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
              <Home size={14} color="#064E3B" />
              <Typography variant="body2" fontWeight="600">Kebele {selectedRow?.kebele}</Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
              <Ruler size={14} color="#64748b" />
              <Typography variant="body2" color="#64748b">{selectedRow?.plotArea} m²</Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
              <Building size={14} color="#64748b" />
              <Typography variant="body2" color="#64748b">{selectedRow?.buildingType}</Typography>
            </Paper>
          </Box>

          <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, color: '#064E3B', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star size={16} />
            Available Engineers (Ranked by experience in this exact location)
          </Typography>

          <Grid container spacing={2}>
            {recommendations.map((rec, idx) => {
              const isTopMatch = idx === 0 && rec.perfectMatch;
              return (
                <AnimatedRecommendationCard
                  key={rec.officerId}
                  recommendation={rec}
                  isSelected={selectedOfficerId === rec.officerId}
                  onClick={() => setSelectedOfficerId(rec.officerId)}
                  index={idx}
                  isTopMatch={isTopMatch}
                />
              );
            })}
          </Grid>

          <Divider sx={{ my: 3 }}><Chip label="OR SELECT MANUALLY" size="small" /></Divider>

          <FormControl fullWidth>
            <InputLabel>Select Engineer</InputLabel>
            <Select 
              value={selectedOfficerId} 
              onChange={(e) => setSelectedOfficerId(e.target.value)} 
              label="Select Engineer" 
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value=""><em>-- Select Engineer --</em></MenuItem>
              {engOfficers.map((o) => {
                const subCityCount = getPreviousRequestsCountBySubCity(o.id, selectedRow?.subCity || '');
                const kebeleCount = getPreviousRequestsCountByKebele(o.id, selectedRow?.kebele || '', selectedRow?.subCity || '');
                const isPerfect = kebeleCount > 0;
                return (
                  <MenuItem key={o.id} value={o.id}>
                    <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{o.name}</span>
                        {isPerfect && <Chip size="small" label="Perfect Match" icon={<Crown size={12} />} sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#064E3B', color: 'white' }} />}
                      </Box>
                      <Box display="flex" gap={1}>
                        <span style={{ color: '#64748b' }}>{o.specialization}</span>
                        {kebeleCount > 0 && (
                          <Chip size="small" label={`${kebeleCount} in kebele`} sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#fef3c7', color: '#f59e0b' }} />
                        )}
                        {subCityCount > 0 && kebeleCount === 0 && (
                          <Chip size="small" label={`${subCityCount} in sub-city`} sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#eff6ff', color: '#64748B' }} />
                        )}
                        <span style={{ color: '#64748b' }}>• {o.currentLoad} active</span>
                      </Box>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 2 }}>
          <Button onClick={() => { setWorkflowAction(null); setRecommendations([]); }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmAssignment} 
            disabled={!selectedOfficerId || assigning} 
            sx={{ 
              bgcolor: '#064E3B',
              '&:hover': { bgcolor: '#059669' },
              px: 4,
              py: 1
            }}
          >
            {assigning ? <CircularProgress size={20} /> : 'Assign Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================================
          MANAGE ENGINEER WORKLOAD DIALOG
      ================================================================= */}
      <Dialog 
        open={workflowAction === 'manager_manage'} 
        onClose={() => { setWorkflowAction(null); setManageRequestsForOfficer(null); setTabValue(0); }} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#064E3B', borderBottom: '1px solid #e2e8f0', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Users size={20} />
            Manage Workload - {manageRequestsForOfficer?.name}
          </Box>
          <Button size="small" startIcon={<RefreshCw size={14} />} onClick={async () => {
            if (manageRequestsForOfficer) {
              await fetchData();
              await fetchOfficers();
              const updatedRequests = getRequestsByOfficer(manageRequestsForOfficer.id);
              setManageRequestsForOfficer({ ...manageRequestsForOfficer, currentLoad: updatedRequests.length, assignedRequests: updatedRequests });
            }
          }}>
            Refresh
          </Button>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0fdf4' }}>
            <Typography variant="body2"><strong>Current Load:</strong> {manageRequestsForOfficer?.currentLoad || 0} active assignment(s)</Typography>
          </Paper>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}>
            <Tab label={`Assigned (${manageRequestsForOfficer?.currentLoad || 0})`} />
            <Tab label={`Available (${pendingRequests.length})`} />
          </Tabs>
          
          {tabValue === 0 && (
            <Box>
              {(!manageRequestsForOfficer?.currentLoad || manageRequestsForOfficer.currentLoad === 0) ? (
                <Alert severity="info">No assigned requests</Alert>
              ) : (
                <Grid container spacing={2}>
                  {getRequestsByOfficer(manageRequestsForOfficer?.id || '').map((req) => (
                    <Grid item xs={12} key={req.id}>
                      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="600">Request #{req.id} - {req.applicantName}</Typography>
                              <Box display="flex" gap={2} mt={0.5}>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>{req.subCity}, Kebele {req.kebele}</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>{req.plotArea} m²</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>{req.buildingType}</Typography>
                              </Box>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Button size="small" variant="outlined" color="error" startIcon={<Trash2 size={14} />} onClick={() => removeAssignment(req.id)} disabled={assigning}>
                                Remove
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                startIcon={<RefreshCw size={14} />}
                                onClick={() => handleOpenReassignDialog(req)}
                                sx={{ bgcolor: '#064E3B' }}
                              >
                                Reassign
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box>
              {pendingRequests.length === 0 ? (
                <Alert severity="info">No pending requests available for assignment</Alert>
              ) : (
                <Grid container spacing={2}>
                  {pendingRequests.map((req) => (
                    <Grid item xs={12} md={6} key={req.id}>
                      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight="600">#{req.id} - {req.applicantName}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>{req.subCity}, Kebele {req.kebele} | {req.plotArea} m²</Typography>
                          <Button 
                            fullWidth 
                            variant="contained" 
                            sx={{ mt: 2, bgcolor: '#064E3B' }}
                            onClick={() => batchAssign(manageRequestsForOfficer?.id || '', [req.id])}
                            disabled={assigning}
                          >
                            {assigning ? <CircularProgress size={20} /> : 'Assign'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => { setWorkflowAction(null); setManageRequestsForOfficer(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* =================================================================
          REASSIGNMENT DIALOG
      ================================================================= */}
      <Dialog open={reassignDialogOpen} onClose={() => setReassignDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#064E3B' }}>Reassign Request #{requestToReassign?.id}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            <strong>Request Details:</strong><br/>
            Applicant: {requestToReassign?.applicantName}<br/>
            Location: {requestToReassign?.subCity}, Kebele {requestToReassign?.kebele}<br/>
            LHU: {requestToReassign?.lhuNo}
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select New Engineering Officer *</InputLabel>
            <Select
              value={selectedNewOfficerId}
              onChange={(e) => setSelectedNewOfficerId(e.target.value)}
              label="Select New Engineering Officer *"
            >
              <MenuItem value=""><em>-- Select Engineer --</em></MenuItem>
              {engOfficers.map((officer) => {
                const subCityCount = getPreviousRequestsCountBySubCity(officer.id, requestToReassign?.subCity || '');
                const kebeleCount = getPreviousRequestsCountByKebele(officer.id, requestToReassign?.kebele || '', requestToReassign?.subCity || '');
                const isPerfect = kebeleCount > 0;
                return (
                  <MenuItem key={officer.id} value={officer.id}>
                    <Box display="flex" justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{officer.name}</span>
                        {isPerfect && <Chip size="small" label="Perfect" icon={<Crown size={10} />} sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#064E3B', color: 'white' }} />}
                      </Box>
                      <Box display="flex" gap={1}>
                        {kebeleCount > 0 && (
                          <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>{kebeleCount} in kebele</span>
                        )}
                        {subCityCount > 0 && kebeleCount === 0 && (
                          <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{subCityCount} in sub-city</span>
                        )}
                        <span style={{ color: '#64748b' }}>{officer.specialization} • {officer.currentLoad} active</span>
                      </Box>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            This will remove the current assignment and assign the request to the selected officer.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (requestToReassign && selectedNewOfficerId) {
                handleReassignRequest(requestToReassign.id, selectedNewOfficerId);
              }
            }} 
            variant="contained" 
            disabled={!selectedNewOfficerId || assigning}
            sx={{ bgcolor: '#064E3B' }}
          >
            {assigning ? <CircularProgress size={20} /> : 'Confirm Reassignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog open={['checker_approve', 'checker_reject', 'manager_approve', 'manager_reject'].includes(workflowAction || '')} onClose={() => { setWorkflowAction(null); workflowFormik.resetForm(); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#064E3B' }}>
          {workflowAction?.includes('approve') ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <form onSubmit={workflowFormik.handleSubmit}>
          <DialogContent>
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              label={workflowAction?.includes('approve') ? 'Comments / Description *' : 'Reason for Rejection *'} 
              name={workflowAction?.includes('approve') ? 'description' : 'reason'} 
              value={workflowAction?.includes('approve') ? workflowFormik.values.description : workflowFormik.values.reason} 
              onChange={workflowFormik.handleChange} 
              required 
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => { setWorkflowAction(null); workflowFormik.resetForm(); }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#064E3B' }}>Confirm</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* New Request Dialog */}
      <Dialog open={openDialog} onClose={handleCloseForm} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}>
        <DialogTitle sx={{ bgcolor: '#064E3B', color: 'white', fontWeight: 700, py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}><FileText size={20} />New Estimation Request</Box>
          <IconButton onClick={handleCloseForm} sx={{ color: 'white' }}><X size={18} /></IconButton>
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
            {submitError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>{submitError}</Alert>}

            <Paper sx={{ p: 2, mb: 2.5, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#064E3B', mb: 2 }}>Applicant Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ minWidth: 0 }}><TextField fullWidth label="Applicant Name" name="applicantName" value={formik.values.applicantName} onChange={formik.handleChange} error={formik.touched.applicantName && Boolean(formik.errors.applicantName)} helperText={formik.touched.applicantName && formik.errors.applicantName} required sx={requestInputSx} /></Grid>
                <Grid item xs={12} md={4} sx={{ minWidth: 0 }}><TextField fullWidth label="Owner Name" name="ownerName" value={formik.values.ownerName} onChange={formik.handleChange} error={formik.touched.ownerName && Boolean(formik.errors.ownerName)} helperText={formik.touched.ownerName && formik.errors.ownerName} required sx={requestInputSx} /></Grid>
                <Grid item xs={12} md={4} sx={{ minWidth: 0 }}><TextField fullWidth label="LHU Number" name="lhuNo" value={formik.values.lhuNo} onChange={async (e) => { formik.handleChange(e); await checkLHU(e.target.value); }} error={(formik.touched.lhuNo && Boolean(formik.errors.lhuNo)) || Boolean(lhuError)} helperText={(formik.touched.lhuNo && formik.errors.lhuNo) || lhuError} required sx={requestInputSx} InputProps={{ endAdornment: isCheckingLHU && <CircularProgress size={16} /> }} /></Grid>
                <Grid item xs={12} md={4} sx={{ minWidth: 0 }}><TextField fullWidth type="number" label="Plot Area (m²)" name="plotArea" value={formik.values.plotArea} onChange={formik.handleChange} error={formik.touched.plotArea && Boolean(formik.errors.plotArea)} helperText={formik.touched.plotArea && formik.errors.plotArea} required sx={requestInputSx} /></Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2.5, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#064E3B', mb: 2 }}>Property Location</Typography>
              <EthiopianLocationSelectors formik={formik as unknown as FormikProps<{ region: string; cityId: string; subCityId: string; kebeleName: string; city: string; subCity: string; kebele: string; plotArea: string; buildingType: string; purpose: string; type: string; }>} />
            </Paper>

            <Paper sx={{ p: 2, mb: 2.5, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#064E3B', mb: 2 }}>Property Details</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(260px, 1fr))' },
                  gap: 3,
                  width: '100%'
                }}
              >
                <Box sx={{ minWidth: 0, width: '100%' }}>
                  <FormControl fullWidth required sx={requestSelectSx}>
                    <InputLabel>Building Type</InputLabel>
                    <Select name="buildingType" value={formik.values.buildingType} onChange={formik.handleChange} label="Building Type">
                      <MenuItem value="Residential">Residential</MenuItem>
                      <MenuItem value="Commercial">Commercial</MenuItem>
                      <MenuItem value="Industrial">Industrial</MenuItem>
                      <MenuItem value="Mixed Use">Mixed Use</MenuItem>
                      <MenuItem value="Condominium">Condominium</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: 0, width: '100%' }}>
                  <FormControl fullWidth required sx={requestSelectSx}>
                    <InputLabel>Purpose</InputLabel>
                    <Select name="purpose" value={formik.values.purpose} onChange={formik.handleChange} label="Purpose">
                      <MenuItem value="Mortgage">Mortgage</MenuItem>
                      <MenuItem value="Guarantee">Guarantee</MenuItem>
                      <MenuItem value="Loan">Loan</MenuItem>
                      <MenuItem value="Foreclosure">Foreclosure</MenuItem>
                      <MenuItem value="Project Finance">Project Finance</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: 0, width: '100%' }}>
                  <FormControl fullWidth required sx={requestSelectSx}>
                    <InputLabel>Type</InputLabel>
                    <Select name="type" value={formik.values.type} onChange={formik.handleChange} label="Type">
                      <MenuItem value="New Estimation">New Estimation</MenuItem>
                      <MenuItem value="Re-Estimation">Re-Estimation</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              {formik.values.purpose === 'Project Finance' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(260px, 1fr))' }, gap: 3, mt: 3 }}>
                  <Box sx={{ minWidth: 0, width: '100%' }}>
                    <FormControl fullWidth required sx={requestSelectSx}>
                      <InputLabel>Project Finance Document</InputLabel>
                      <Select name="projectFinanceDocType" value={formik.values.projectFinanceDocType} onChange={formik.handleChange} label="Project Finance Document">
                        <MenuItem value="Construction Permit">Construction Permit</MenuItem>
                      </Select>
                      {formik.touched.projectFinanceDocType && formik.errors.projectFinanceDocType && (
                        <FormHelperText error>{formik.errors.projectFinanceDocType}</FormHelperText>
                      )}
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, width: '100%' }}>
                    <FormControlLabel
                      control={<Checkbox name="billOfPenalty" checked={formik.values.billOfPenalty} onChange={formik.handleChange} />}
                      label="Bill of Penalty"
                    />
                  </Box>

                  {formik.values.projectFinanceDocType === 'Construction Permit' && (
                    <Box sx={{ minWidth: 0, width: '100%' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#064E3B', fontWeight: 700 }}>Construction Permit</Typography>
                      <Button component="label" variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <Upload size={14} />} disabled={uploading}>
                        Upload Construction Permit
                        <input type="file" hidden onChange={(e) => uploadFile(e, 'Construction Permit')} accept=".pdf,.jpg,.jpeg,.png" />
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#064E3B', mb: 2 }}>Supporting Documents</Typography>
              <Box display="flex" gap={1.5} flexWrap="wrap" mb={2}>
                <Button component="label" variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <Upload size={14} />} disabled={uploading}>Estimation Fee<input type="file" hidden onChange={(e) => uploadFile(e, 'Estimation Fee')} accept=".pdf,.jpg,.jpeg,.png" /></Button>
                <Button component="label" variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <Upload size={14} />} disabled={uploading}>Land Deed<input type="file" hidden onChange={(e) => uploadFile(e, 'Land Deed')} accept=".pdf,.jpg,.jpeg,.png" /></Button>
                <Button component="label" variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <Upload size={14} />} disabled={uploading}>Floor Plan<input type="file" hidden onChange={(e) => uploadFile(e, 'Floor Plan')} accept=".pdf,.jpg,.jpeg,.png" /></Button>
              </Box>
              {attachments.map((file, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', p: 1, mb: 1 }}>
                  <Box display="flex" alignItems="center" gap={1}><FileText size={14} /><Typography variant="body2">{file.fileName}</Typography><Chip label={file.documentType} size="small" /></Box>
                  <IconButton onClick={() => removeFile(idx)} size="small"><X size={14} /></IconButton>
                </Box>
              ))}
              <Typography variant="caption" sx={{ color: getMissingDocumentTypes().length > 0 ? '#dc2626' : '#059669', display: 'block', mt: 1 }}>
                {getMissingDocumentTypes().length > 0
                  ? `Required: upload ${getMissingDocumentTypes().join(', ')}. Each file must be 10 MB or smaller.`
                  : 'All required documents uploaded. Each file must be 10 MB or smaller.'}
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 2 }}>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#064E3B' }}>Submit Request</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#064E3B' }}>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to submit this estimation request?</Typography>
          <Paper sx={{ mt: 2, p: 2, bgcolor: '#f8fafc' }}>
            <Typography variant="body2">
              <strong>Applicant:</strong> {formik.values.applicantName}<br/>
              <strong>Owner:</strong> {formik.values.ownerName}<br/>
              <strong>LHU Number:</strong> {formik.values.lhuNo}<br/>
              <strong>Location:</strong> {formik.values.subCity}, Kebele {formik.values.kebele}<br/>
              <strong>Plot Area:</strong> {formik.values.plotArea} m²<br/>
              <strong>Attachments:</strong> {attachments.length} file(s)
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button onClick={submitRequest} variant="contained" sx={{ bgcolor: '#064E3B' }}>Yes, Submit Request</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}