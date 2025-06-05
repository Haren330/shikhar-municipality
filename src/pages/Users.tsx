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
    Grid,
    Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Layout from '../components/Layout/Layout';
import { RootState } from '../store';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    department?: {
        _id: string;
        name: string;
    };
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

const validationSchema = yup.object({
    name: yup.string().required('नाम आवश्यक छ'),
    email: yup.string().email('मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्').required('इमेल आवश्यक छ'),
    password: yup.string().when('_id', {
        is: (id: string) => !id,
        then: (schema) =>
            schema
                .required('पासवर्ड आवश्यक छ')
                .min(6, 'पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ'),
    }),
    role: yup.string().required('भूमिका चयन गर्नुहोस्'),
    department: yup.string().when('role', {
        is: 'user',
        then: (schema) => schema.required('विभाग चयन गर्नुहोस्'),
    }),
});

const Users: React.FC = () => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            const data = await api.auth.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('प्रयोगकर्ताहरू लोड गर्न सकिएन');
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
        fetchUsers();
        fetchDepartments();
    }, []);

    const formik = useFormik({
        initialValues: {
            _id: '',
            name: '',
            email: '',
            password: '',
            role: 'user',
            department: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                if (selectedUser) {
                    const { password, ...updateData } = values;
                    await api.auth.updateUser(selectedUser._id, updateData);
                    toast.success('प्रयोगकर्ता सफलतापूर्वक अपडेट गरियो');
                } else {
                    await api.auth.register(values);
                    toast.success('प्रयोगकर्ता सफलतापूर्वक सिर्जना गरियो');
                }
                setOpen(false);
                fetchUsers();
            } catch (error) {
                console.error('Error saving user:', error);
                toast.error('प्रयोगकर्ता सेभ गर्न सकिएन');
            }
            setLoading(false);
        },
    });

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        formik.setValues({
            _id: user._id,
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            department: user.department?._id || '',
        });
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?._id) {
            toast.error('आफ्नो खाता मेट्न सक्नुहुन्न');
            return;
        }

        if (window.confirm('के तपाईं यो प्रयोगकर्ता मेट्न निश्चित हुनुहुन्छ?')) {
            try {
                await api.auth.deleteUser(id);
                toast.success('प्रयोगकर्ता सफलतापूर्वक मेटियो');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('प्रयोगकर्ता मेट्न सकिएन');
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedUser(null);
        formik.resetForm();
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'नाम', flex: 1 },
        { field: 'email', headerName: 'इमेल', flex: 1 },
        {
            field: 'role',
            headerName: 'भूमिका',
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.value === 'admin' ? 'प्रशासक' : 'प्रयोगकर्ता'}
                    color={params.value === 'admin' ? 'primary' : 'default'}
                    size="small"
                />
            ),
        },
        {
            field: 'department',
            headerName: 'विभाग',
            flex: 1,
            valueGetter: (params) => params.row.department?.name || '-',
        },
        {
            field: 'isActive',
            headerName: 'स्थिति',
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'सक्रिय' : 'निष्क्रिय'}
                    color={params.value ? 'success' : 'error'}
                    size="small"
                />
            ),
        },
        {
            field: 'lastLogin',
            headerName: 'अन्तिम लग इन',
            flex: 1,
            valueGetter: (params) =>
                params.value
                    ? new Date(params.value).toLocaleDateString('ne-NP')
                    : '-',
        },
        {
            field: 'actions',
            headerName: 'कार्यहरू',
            flex: 1,
            renderCell: (params) => (
                <Box>
                    <IconButton
                        onClick={() => handleEdit(params.row)}
                        disabled={params.row._id === currentUser?._id}
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => handleDelete(params.row._id)}
                        disabled={params.row._id === currentUser?._id}
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
                    <Typography variant="h4">प्रयोगकर्ताहरू</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpen(true)}
                    >
                        नयाँ प्रयोगकर्ता
                    </Button>
                </Box>

                <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
                    <DataGrid
                        rows={users}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        disableSelectionOnClick
                        getRowId={(row) => row._id}
                    />
                </Paper>

                <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {selectedUser ? 'प्रयोगकर्ता सम्पादन गर्नुहोस्' : 'नयाँ प्रयोगकर्ता'}
                    </DialogTitle>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        label="नाम"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        error={formik.touched.name && Boolean(formik.errors.name)}
                                        helperText={formik.touched.name && formik.errors.name}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        label="इमेल"
                                        type="email"
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        error={formik.touched.email && Boolean(formik.errors.email)}
                                        helperText={formik.touched.email && formik.errors.email}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        label="पासवर्ड"
                                        type="password"
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        error={
                                            formik.touched.password && Boolean(formik.errors.password)
                                        }
                                        helperText={
                                            formik.touched.password && formik.errors.password
                                        }
                                        disabled={!!selectedUser}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        name="role"
                                        label="भूमिका"
                                        value={formik.values.role}
                                        onChange={formik.handleChange}
                                        error={formik.touched.role && Boolean(formik.errors.role)}
                                        helperText={formik.touched.role && formik.errors.role}
                                    >
                                        <MenuItem value="admin">प्रशासक</MenuItem>
                                        <MenuItem value="user">प्रयोगकर्ता</MenuItem>
                                    </TextField>
                                </Grid>
                                {formik.values.role === 'user' && (
                                    <Grid item xs={12}>
                                        <TextField
                                            select
                                            fullWidth
                                            name="department"
                                            label="विभाग"
                                            value={formik.values.department}
                                            onChange={formik.handleChange}
                                            error={
                                                formik.touched.department &&
                                                Boolean(formik.errors.department)
                                            }
                                            helperText={
                                                formik.touched.department && formik.errors.department
                                            }
                                        >
                                            {departments.map((dept) => (
                                                <MenuItem key={dept._id} value={dept._id}>
                                                    {dept.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                )}
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

export default Users; 