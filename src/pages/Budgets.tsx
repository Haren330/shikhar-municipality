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
    Chip,
    Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    AddCircle as AddExpenditureIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Layout from '../components/Layout/Layout';
import { RootState } from '../store';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface Budget {
    _id: string;
    department: {
        _id: string;
        name: string;
    };
    fiscalYear: string;
    totalBudget: number;
    allocatedBudget: number;
    expenditures: {
        _id: string;
        amount: number;
        description: string;
        date: string;
        createdBy: {
            _id: string;
            name: string;
        };
    }[];
    status: 'active' | 'completed' | 'cancelled';
    createdBy: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

const validationSchema = yup.object({
    department: yup.string().required('विभाग चयन गर्नुहोस्'),
    fiscalYear: yup.string().required('आर्थिक वर्ष आवश्यक छ'),
    totalBudget: yup
        .number()
        .min(0, 'बजेट ० भन्दा बढी हुनुपर्छ')
        .required('कुल बजेट आवश्यक छ'),
    allocatedBudget: yup
        .number()
        .min(0, 'आवंटित बजेट ० भन्दा बढी हुनुपर्छ')
        .required('आवंटित बजेट आवश्यक छ'),
});

const expenditureSchema = yup.object({
    amount: yup
        .number()
        .min(0, 'रकम ० भन्दा बढी हुनुपर्छ')
        .required('रकम आवश्यक छ'),
    description: yup.string().required('विवरण आवश्यक छ'),
    date: yup.string().required('मिति आवश्यक छ'),
});

const Budgets: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [expenditureOpen, setExpenditureOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBudgets = async () => {
        try {
            const data = await api.budgets.getAll();
            setBudgets(data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
            toast.error('बजेटहरू लोड गर्न सकिएन');
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
        fetchBudgets();
        fetchDepartments();
    }, []);

    const formik = useFormik({
        initialValues: {
            department: '',
            fiscalYear: new Date().getFullYear().toString(),
            totalBudget: 0,
            allocatedBudget: 0,
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                if (selectedBudget) {
                    await api.budgets.update(selectedBudget._id, values);
                    toast.success('बजेट सफलतापूर्वक अपडेट गरियो');
                } else {
                    await api.budgets.create(values);
                    toast.success('बजेट सफलतापूर्वक सिर्जना गरियो');
                }
                setOpen(false);
                fetchBudgets();
            } catch (error) {
                console.error('Error saving budget:', error);
                toast.error('बजेट सेभ गर्न सकिएन');
            }
            setLoading(false);
        },
    });

    const expenditureFormik = useFormik({
        initialValues: {
            amount: 0,
            description: '',
            date: new Date().toISOString().split('T')[0],
        },
        validationSchema: expenditureSchema,
        onSubmit: async (values) => {
            if (!selectedBudget) return;
            setLoading(true);
            try {
                await api.budgets.addExpenditure(selectedBudget._id, values);
                toast.success('खर्च सफलतापूर्वक थपियो');
                setExpenditureOpen(false);
                fetchBudgets();
            } catch (error) {
                console.error('Error adding expenditure:', error);
                toast.error('खर्च थप्न सकिएन');
            }
            setLoading(false);
        },
    });

    const handleEdit = (budget: Budget) => {
        setSelectedBudget(budget);
        formik.setValues({
            department: budget.department._id,
            fiscalYear: budget.fiscalYear,
            totalBudget: budget.totalBudget,
            allocatedBudget: budget.allocatedBudget,
        });
        setOpen(true);
    };

    const handleAddExpenditure = (budget: Budget) => {
        setSelectedBudget(budget);
        expenditureFormik.resetForm();
        setExpenditureOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedBudget(null);
        formik.resetForm();
    };

    const handleExpenditureClose = () => {
        setExpenditureOpen(false);
        setSelectedBudget(null);
        expenditureFormik.resetForm();
    };

    const columns: GridColDef[] = [
        {
            field: 'department',
            headerName: 'विभाग',
            flex: 1,
            valueGetter: (params) => params.row.department.name,
        },
        { field: 'fiscalYear', headerName: 'आर्थिक वर्ष', flex: 1 },
        {
            field: 'totalBudget',
            headerName: 'कुल बजेट',
            flex: 1,
            valueFormatter: (params) => `रु. ${params.value.toLocaleString()}`,
        },
        {
            field: 'allocatedBudget',
            headerName: 'आवंटित बजेट',
            flex: 1,
            valueFormatter: (params) => `रु. ${params.value.toLocaleString()}`,
        },
        {
            field: 'expenditures',
            headerName: 'खर्च',
            flex: 1,
            valueGetter: (params) => {
                const total = params.row.expenditures.reduce(
                    (sum: number, exp: any) => sum + exp.amount,
                    0
                );
                return total;
            },
            valueFormatter: (params) => `रु. ${params.value.toLocaleString()}`,
        },
        {
            field: 'status',
            headerName: 'स्थिति',
            flex: 1,
            renderCell: (params) => {
                const statusColors = {
                    active: 'success',
                    completed: 'info',
                    cancelled: 'error',
                };
                const statusLabels = {
                    active: 'सक्रिय',
                    completed: 'पूरा भएको',
                    cancelled: 'रद्द गरिएको',
                };
                return (
                    <Chip
                        label={statusLabels[params.value as keyof typeof statusLabels]}
                        color={statusColors[params.value as keyof typeof statusColors] as any}
                        size="small"
                    />
                );
            },
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
                        onClick={() => handleAddExpenditure(params.row)}
                        disabled={params.row.status !== 'active'}
                        size="small"
                    >
                        <AddExpenditureIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Layout>
            <Box sx={{ height: '100%', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4">बजेट व्यवस्थापन</Typography>
                    {user?.role === 'admin' && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpen(true)}
                        >
                            नयाँ बजेट
                        </Button>
                    )}
                </Box>

                <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
                    <DataGrid
                        rows={budgets}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        disableSelectionOnClick
                        getRowId={(row) => row._id}
                    />
                </Paper>

                {/* Budget Form Dialog */}
                <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {selectedBudget ? 'बजेट सम्पादन गर्नुहोस्' : 'नयाँ बजेट'}
                    </DialogTitle>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
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
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="fiscalYear"
                                        label="आर्थिक वर्ष"
                                        value={formik.values.fiscalYear}
                                        onChange={formik.handleChange}
                                        error={formik.touched.fiscalYear && Boolean(formik.errors.fiscalYear)}
                                        helperText={formik.touched.fiscalYear && formik.errors.fiscalYear}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="totalBudget"
                                        label="कुल बजेट"
                                        type="number"
                                        value={formik.values.totalBudget}
                                        onChange={formik.handleChange}
                                        error={formik.touched.totalBudget && Boolean(formik.errors.totalBudget)}
                                        helperText={formik.touched.totalBudget && formik.errors.totalBudget}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        name="allocatedBudget"
                                        label="आवंटित बजेट"
                                        type="number"
                                        value={formik.values.allocatedBudget}
                                        onChange={formik.handleChange}
                                        error={
                                            formik.touched.allocatedBudget &&
                                            Boolean(formik.errors.allocatedBudget)
                                        }
                                        helperText={
                                            formik.touched.allocatedBudget && formik.errors.allocatedBudget
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

                {/* Expenditure Form Dialog */}
                <Dialog
                    open={expenditureOpen}
                    onClose={handleExpenditureClose}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>नयाँ खर्च थप्नुहोस्</DialogTitle>
                    <form onSubmit={expenditureFormik.handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="amount"
                                        label="रकम"
                                        type="number"
                                        value={expenditureFormik.values.amount}
                                        onChange={expenditureFormik.handleChange}
                                        error={
                                            expenditureFormik.touched.amount &&
                                            Boolean(expenditureFormik.errors.amount)
                                        }
                                        helperText={
                                            expenditureFormik.touched.amount &&
                                            expenditureFormik.errors.amount
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="description"
                                        label="विवरण"
                                        multiline
                                        rows={3}
                                        value={expenditureFormik.values.description}
                                        onChange={expenditureFormik.handleChange}
                                        error={
                                            expenditureFormik.touched.description &&
                                            Boolean(expenditureFormik.errors.description)
                                        }
                                        helperText={
                                            expenditureFormik.touched.description &&
                                            expenditureFormik.errors.description
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="date"
                                        label="मिति"
                                        type="date"
                                        value={expenditureFormik.values.date}
                                        onChange={expenditureFormik.handleChange}
                                        error={
                                            expenditureFormik.touched.date &&
                                            Boolean(expenditureFormik.errors.date)
                                        }
                                        helperText={
                                            expenditureFormik.touched.date && expenditureFormik.errors.date
                                        }
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleExpenditureClose}>रद्द गर्नुहोस्</Button>
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

export default Budgets; 