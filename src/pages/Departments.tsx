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
    Typography,
    IconButton,
    Paper,
    Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Layout from '../components/Layout/Layout';
import { RootState } from '../store';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface Department {
    _id: string;
    name: string;
    code: string;
    head: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

const validationSchema = yup.object({
    name: yup.string().required('विभागको नाम आवश्यक छ'),
    code: yup.string().required('विभागको कोड आवश्यक छ'),
    head: yup.string().required('विभाग प्रमुखको नाम आवश्यक छ'),
    description: yup.string().required('विवरण आवश्यक छ'),
});

const Departments: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(false);

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
        fetchDepartments();
    }, []);

    const formik = useFormik({
        initialValues: {
            name: '',
            code: '',
            head: '',
            description: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                if (selectedDepartment) {
                    await api.departments.update(selectedDepartment._id, values);
                    toast.success('विभाग सफलतापूर्वक अपडेट गरियो');
                } else {
                    await api.departments.create(values);
                    toast.success('विभाग सफलतापूर्वक सिर्जना गरियो');
                }
                setOpen(false);
                fetchDepartments();
            } catch (error) {
                console.error('Error saving department:', error);
                toast.error('विभाग सेभ गर्न सकिएन');
            }
            setLoading(false);
        },
    });

    const handleEdit = (department: Department) => {
        setSelectedDepartment(department);
        formik.setValues({
            name: department.name,
            code: department.code,
            head: department.head,
            description: department.description,
        });
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('के तपाईं यो विभाग मेट्न निश्चित हुनुहुन्छ?')) {
            try {
                await api.departments.delete(id);
                toast.success('विभाग सफलतापूर्वक मेटियो');
                fetchDepartments();
            } catch (error) {
                console.error('Error deleting department:', error);
                toast.error('विभाग मेट्न सकिएन');
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDepartment(null);
        formik.resetForm();
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'विभागको नाम', flex: 1 },
        { field: 'code', headerName: 'कोड', flex: 1 },
        { field: 'head', headerName: 'विभाग प्रमुख', flex: 1 },
        {
            field: 'description',
            headerName: 'विवरण',
            flex: 2,
            renderCell: (params) => (
                <Typography
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'कार्यहरू',
            flex: 1,
            renderCell: (params) => (
                <Box>
                    <IconButton
                        onClick={() => handleEdit(params.row)}
                        disabled={user?.role !== 'admin'}
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => handleDelete(params.row._id)}
                        disabled={user?.role !== 'admin'}
                        size="small"
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Layout>
            <Box sx={{ height: '100%', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4">विभागहरू</Typography>
                    {user?.role === 'admin' && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpen(true)}
                        >
                            नयाँ विभाग
                        </Button>
                    )}
                </Box>

                <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
                    <DataGrid
                        rows={departments}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        disableSelectionOnClick
                        getRowId={(row) => row._id}
                    />
                </Paper>

                <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {selectedDepartment ? 'विभाग सम्पादन गर्नुहोस्' : 'नयाँ विभाग'}
                    </DialogTitle>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        label="विभागको नाम"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        error={formik.touched.name && Boolean(formik.errors.name)}
                                        helperText={formik.touched.name && formik.errors.name}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="code"
                                        label="कोड"
                                        value={formik.values.code}
                                        onChange={formik.handleChange}
                                        error={formik.touched.code && Boolean(formik.errors.code)}
                                        helperText={formik.touched.code && formik.errors.code}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="head"
                                        label="विभाग प्रमुख"
                                        value={formik.values.head}
                                        onChange={formik.handleChange}
                                        error={formik.touched.head && Boolean(formik.errors.head)}
                                        helperText={formik.touched.head && formik.errors.head}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="description"
                                        label="विवरण"
                                        multiline
                                        rows={4}
                                        value={formik.values.description}
                                        onChange={formik.handleChange}
                                        error={
                                            formik.touched.description &&
                                            Boolean(formik.errors.description)
                                        }
                                        helperText={
                                            formik.touched.description && formik.errors.description
                                        }
                                    />
                                </Grid>
                            </Grid>
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

export default Departments; 