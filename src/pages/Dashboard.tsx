import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Divider,
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    AccountBalance as BudgetIcon,
    Business as DepartmentIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout/Layout';
import { RootState } from '../store';
import { api } from '../services/api';

interface DashboardStats {
    totalDepartments: number;
    totalReports: number;
    totalBudgets: number;
    totalUsers: number;
    recentReports: any[];
    budgetOverview: {
        totalAllocated: number;
        totalSpent: number;
        remainingBudget: number;
    };
}

const Dashboard: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<DashboardStats>({
        totalDepartments: 0,
        totalReports: 0,
        totalBudgets: 0,
        totalUsers: 0,
        recentReports: [],
        budgetOverview: {
            totalAllocated: 0,
            totalSpent: 0,
            remainingBudget: 0,
        },
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch departments
                const departments = await api.departments.getAll();
                
                // Fetch reports
                const reports = await api.reports.getAll();
                
                // Fetch budgets
                const budgets = await api.budgets.getAll();
                
                // Calculate budget overview
                const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0);
                const totalSpent = budgets.reduce((sum, budget) => {
                    const spent = budget.expenditures.reduce((total, exp) => total + exp.amount, 0);
                    return sum + spent;
                }, 0);

                setStats({
                    totalDepartments: departments.length,
                    totalReports: reports.length,
                    totalBudgets: budgets.length,
                    totalUsers: 0, // This would need a separate API endpoint
                    recentReports: reports.slice(0, 5),
                    budgetOverview: {
                        totalAllocated,
                        totalSpent,
                        remainingBudget: totalAllocated - totalSpent,
                    },
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, []);

    const StatCard: React.FC<{
        title: string;
        value: number | string;
        icon: React.ReactNode;
        color: string;
    }> = ({ title, value, icon, color }) => (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            backgroundColor: `${color}15`,
                            borderRadius: '50%',
                            p: 1,
                            mr: 2,
                        }}
                    >
                        {icon}
                    </Box>
                    <Typography variant="h6" component="div">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Layout>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" gutterBottom>
                    ड्यासबोर्ड
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    स्वागत छ, {user?.name}
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="कुल विभागहरू"
                            value={stats.totalDepartments}
                            icon={<DepartmentIcon sx={{ color: '#1976d2' }} />}
                            color="#1976d2"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="कुल प्रगति विवरण"
                            value={stats.totalReports}
                            icon={<AssessmentIcon sx={{ color: '#2e7d32' }} />}
                            color="#2e7d32"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="कुल बजेट"
                            value={`रु. ${stats.budgetOverview.totalAllocated.toLocaleString()}`}
                            icon={<BudgetIcon sx={{ color: '#ed6c02' }} />}
                            color="#ed6c02"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="कुल खर्च"
                            value={`रु. ${stats.budgetOverview.totalSpent.toLocaleString()}`}
                            icon={<BudgetIcon sx={{ color: '#9c27b0' }} />}
                            color="#9c27b0"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                बजेट अवलोकन
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1">
                                        कुल आवंटित बजेट: रु. {stats.budgetOverview.totalAllocated.toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1">
                                        कुल खर्च: रु. {stats.budgetOverview.totalSpent.toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1">
                                        बाँकी बजेट: रु. {stats.budgetOverview.remainingBudget.toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                हालको प्रगति विवरणहरू
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            {stats.recentReports.map((report) => (
                                <Box key={report._id} sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">
                                        {report.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        विभाग: {report.department.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        मिति: {new Date(report.createdAt).toLocaleDateString('ne-NP')}
                                    </Typography>
                                    <Divider sx={{ mt: 1 }} />
                                </Box>
                            ))}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Layout>
    );
};

export default Dashboard; 