'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Box, Typography, CircularProgress, Alert, Button, TextField, Grid } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function EditRequestPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      applicantName: '', ownerName: '', lhuNo: '', city: '', subCity: '', kebele: '', plotArea: '', buildingType: 'Condominium', purpose: 'Mortgage', type: 'NewEstimation', projectFinanceDocType: '', billOfPenalty: false
    },
    validationSchema: Yup.object({
      applicantName: Yup.string().required('Applicant is required'),
      ownerName: Yup.string().required('Owner is required'),
      lhuNo: Yup.string().required('LHU No is required'),
    }),
    onSubmit: async (values) => {
      setError(null);
      try {
        await api.put(`/EstimationRequests/${id}`, {
          id: Number(id),
          applicantName: values.applicantName,
          ownerName: values.ownerName,
          lhuNo: values.lhuNo,
          city: values.city,
          subCity: values.subCity,
          kebele: values.kebele,
          latitude: 0,
          longitude: 0,
          plotArea: parseFloat(values.plotArea) || 0,
          buildingType: values.buildingType,
          purpose: values.purpose,
          type: values.type,
          projectFinanceDocType: values.projectFinanceDocType,
          billOfPenalty: values.billOfPenalty
        });
        setSuccess('Request updated successfully');
        router.push(`/requests/${id}`);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || 'Failed to update request');
      }
    }
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.get<{ applicantName?: string; ownerName?: string; lhuNo?: string; city?: string; subCity?: string; kebele?: string; plotArea?: number | string; buildingType?: string; purpose?: string; type?: string; projectFinanceDocType?: string; billOfPenalty?: boolean }>(`/EstimationRequests/${id}`);
        formik.setValues({
          applicantName: data.applicantName ?? '',
          ownerName: data.ownerName ?? '',
          lhuNo: data.lhuNo ?? '',
          city: data.city ?? '',
          subCity: data.subCity ?? '',
          kebele: data.kebele ?? '',
          plotArea: String(data.plotArea ?? ''),
          buildingType: data.buildingType ?? 'Condominium',
          purpose: data.purpose ?? 'Mortgage',
          type: data.type ?? 'NewEstimation',
          projectFinanceDocType: data.projectFinanceDocType ?? '',
          billOfPenalty: data.billOfPenalty ?? false
        });
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || 'Failed to load request');
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <DashboardLayout><Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress color="secondary" /></Box></DashboardLayout>;

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Edit Request #{id}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Applicant" name="applicantName" value={formik.values.applicantName}
                onChange={formik.handleChange} error={!!(formik.touched.applicantName && formik.errors.applicantName)} helperText={formik.touched.applicantName && formik.errors.applicantName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Owner" name="ownerName" value={formik.values.ownerName}
                onChange={formik.handleChange} error={!!(formik.touched.ownerName && formik.errors.ownerName)} helperText={formik.touched.ownerName && formik.errors.ownerName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="LHU No" name="lhuNo" value={formik.values.lhuNo}
                onChange={formik.handleChange} error={!!(formik.touched.lhuNo && formik.errors.lhuNo)} helperText={formik.touched.lhuNo && formik.errors.lhuNo} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Plot Area" name="plotArea" value={formik.values.plotArea}
                onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="City" name="city" value={formik.values.city} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Sub City" name="subCity" value={formik.values.subCity} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Kebele" name="kebele" value={formik.values.kebele} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained">Save changes</Button>
                <Button variant="outlined" onClick={() => router.push(`/requests/${id}`)}>Cancel</Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </DashboardLayout>
  );
}
