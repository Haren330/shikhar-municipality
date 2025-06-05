import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Typography,
    IconButton,
    Paper,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Layout from '../components/Layout/Layout';
import { RootState } from '../store';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface Report {
    _id: string;
    department: {
        _id: string;
        name: string;
    };
    month: number;
    year: number;
    title: string;
    description: string;
    progress: number;
    status: 'pending' | 'approved' | 'rejected';
    attachments: string[];
    createdBy: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

const validationSchema = yup.object({
    department: yup.string().required('विभाग चयन गर्नुहोस्'),
    month: yup.number().required('महिना चयन गर्नुहोस्'),
    year: yup.number().required('वर्ष प्रविष्ट गर्नुहोस्'),
    title: yup.string().required('शीर्षक आवश्यक छ'),
    description: yup.string().required('विवरण आवश्यक छ'),
    progress: yup
        .number()
        .min(0, 'प्रगति ० देखि १०० को बीचमा हुनुपर्छ')
        .max(100, 'प्रगति ० देखि १०० को बीचमा हुनुपर्छ')
        .required('प्रगति आवश्यक छ'),
});

const months = [
    { value: 1, label: 'बैशाख' },
    { value: 2, label: 'जेठ' },
    { value: 3, label: 'असार' },
    { value: 4, label: 'श्रावण' },
    { value: 5, label: 'भदौ' },
    { value: 6, label: 'आश्विन' },
    { value: 7, label: 'कार्तिक' },
    { value: 8, label: 'मंसिर' },
    { value: 9, label: 'पुष' },
    { value: 10, label: 'माघ' },
    { value: 11, label: 'फागुन' },
    { value: 12, label: 'चैत्र' },
];

const Reports: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [reports, setReports] = useState<Report[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchReports = async () => {
        try {
            const data = await api.reports.getAll();
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('प्रगति विवरणहरू लोड गर्न सकिएन');
        }
    };

    const fetchDepartments = async () => {
        try {
            const data = await api.departments.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('विभागहरू लोड गर्न सकिएन');
        }
    };

    useEffect(() => {
        fetchReports();
        fetchDepartments();
    }, []);

    const formik = useFormik({
        initialValues: {
            department: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            title: '',
            description: '',
            progress: 0,
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                if (selectedReport) {
                    await api.reports.update(selectedReport._id, values);
                    toast.success('प्रगति विवरण सफलतापूर्वक अपडेट गरियो');
                } else {
                    await api.reports.create(values);
                    toast.success('प्रगति विवरण सफलतापूर्वक सिर्जना गरियो');
                }
                setOpen(false);
                fetchReports();
            } catch (error) {
                console.error('Error saving report:', error);
                toast.error('प्रगति विवरण सेभ गर्न सकिएन');
            }
            setLoading(false);
        },
    });

    const handleEdit = (report: Report) => {
        setSelectedReport(report);
        formik.setValues({
            department: report.department._id,
            month: report.month,
            year: report.year,
            title: report.title,
            description: report.description,
            progress: report.progress,
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedReport(null);
        formik.resetForm();
    };

    const columns: GridColDef[] = [
        { field: 'title', headerName: 'शीर्षक', flex: 1 },
        {
            field: 'department',
            headerName: 'विभाग',
            flex: 1,
            valueGetter: (params) => params.row.department.name,
        },
        {
            field: 'month',
            headerName: 'महिना',
            flex: 1,
            valueGetter: (params) => months.find((m) => m.value === params.row.month)?.label,
        },
        { field: 'year', headerName: 'वर्ष', flex: 1 },
        {
            field: 'progress',
            headerName: 'प्रगति',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: '100%',
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            mr: 1,
                        }}
                    >
                        <Box
                            sx={{
                                width: `${params.value}%`,
                                height: '100%',
                                bgcolor: params.value >= 100 ? 'success.main' : 'primary.main',
                                borderRadius: 1,
                            }}
                        />
                    </Box>
                    <Typography variant="body2">{params.value}%</Typography>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'स्थिति',
            flex: 1,
            renderCell: (params) => {
                const statusColors = {
                    pending: 'warning.main',
                    approved: 'success.main',
                    rejected: 'error.main',
                };
                const statusLabels = {
                    pending: 'पेन्डिङ',
                    approved: 'स्वीकृत',
                    rejected: 'अस्वीकृत',
                };
                return (
                    <Typography
                        sx={{
                            color: statusColors[params.value as keyof typeof statusColors],
                            fontWeight: 'bold',
                        }}
                    >
                        {statusLabels[params.value as keyof typeof statusLabels]}
                    </Typography>
                );
            },
        },
        {
            field: 'actions',
            headerName: 'कार्यहरू',
            flex: 1,
            renderCell: (params) => (
                <IconButton
                    onClick={() => handleEdit(params.row)}
                    disabled={user?.role !== 'admin' && params.row.createdBy._id !== user?._id}
                >
                    <EditIcon />
                </IconButton>
            ),
        },
    ];

    return (
        <Layout>
            <Box sx={{ height: '100%', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4">प्रगति विवरणहरू</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpen(true)}
                    >
                        नयाँ प्रगति विवरण
                    </Button>
                </Box>

                <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
                    <DataGrid
                        rows={reports}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        disableSelectionOnClick
                        getRowId={(row) => row._id}
                    />
                </Paper>

                <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {selectedReport ? 'प्रगति विवरण सम्पादन गर्नुहोस्' : 'नयाँ प्रगति विवरण'}
                    </DialogTitle>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogContent>
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                                <TextField
                                    select
                                    fullWidth
                                    name="department"
                                    label="विभाग"
                                    value={formik.values.department}
                                    onChange={formik.handleChange}
                                    error={formik.touched.department && Boolean(formik.errors.department)}
                                    helperText={formik.touched.department && formik.errors.department}
                                >
                                    {departments.map((dept) => (
                                        <MenuItem key={dept._id} value={dept._id}>
                                            {dept.name}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    fullWidth
                                    name="month"
                                    label="महिना"
                                    value={formik.values.month}
                                    onChange={formik.handleChange}
                                    error={formik.touched.month && Boolean(formik.errors.month)}
                                    helperText={formik.touched.month && formik.errors.month}
                                >
                                    {months.map((month) => (
                                        <MenuItem key={month.value} value={month.value}>
                                            {month.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    fullWidth
                                    name="year"
                                    label="वर्ष"
                                    type="number"
                                    value={formik.values.year}
                                    onChange={formik.handleChange}
                                    error={formik.touched.year && Boolean(formik.errors.year)}
                                    helperText={formik.touched.year && formik.errors.year}
                                />

                                <TextField
                                    fullWidth
                                    name="progress"
                                    label="प्रगति (%)"
                                    type="number"
                                    value={formik.values.progress}
                                    onChange={formik.handleChange}
                                    error={formik.touched.progress && Boolean(formik.errors.progress)}
                                    helperText={formik.touched.progress && formik.errors.progress}
                                />

                                <TextField
                                    fullWidth
                                    name="title"
                                    label="शीर्षक"
                                    value={formik.values.title}
                                    onChange={formik.handleChange}
                                    error={formik.touched.title && Boolean(formik.errors.title)}
                                    helperText={formik.touched.title && formik.errors.title}
                                    sx={{ gridColumn: 'span 2' }}
                                />

                                <TextField
                                    fullWidth
                                    name="description"
                                    label="विवरण"
                                    multiline
                                    rows={4}
                                    value={formik.values.description}
                                    onChange={formik.handleChange}
                                    error={formik.touched.description && Boolean(formik.errors.description)}
                                    helperText={formik.touched.description && formik.errors.description}
                                    sx={{ gridColumn: 'span 2' }}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose}>रद्द गर्नुहोस्</Button>
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? 'सेभ हुँदैछ...' : 'सेभ गर्नुहोस्'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default Reports; 