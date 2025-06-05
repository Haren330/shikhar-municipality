import axios from 'axios';
import { User, Department, Report, Budget } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (email: string, password: string) => {
        const response = await api.post<{ token: string }>('/auth/login', { email, password });
        return response.data;
    },
    register: async (userData: Partial<User>) => {
        const response = await api.post<{ token: string }>('/auth/register', userData);
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get<User>('/auth/user');
        return response.data;
    }
};

// Department API
export const departmentAPI = {
    getAll: async () => {
        const response = await api.get<Department[]>('/departments');
        return response.data;
    },
    create: async (departmentData: Partial<Department>) => {
        const response = await api.post<Department>('/departments', departmentData);
        return response.data;
    },
    update: async (id: string, departmentData: Partial<Department>) => {
        const response = await api.put<Department>(`/departments/${id}`, departmentData);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/departments/${id}`);
        return response.data;
    }
};

// Report API
export const reportAPI = {
    getAll: async (filters?: { department?: string; month?: number; year?: number; status?: string }) => {
        const response = await api.get<Report[]>('/reports', { params: filters });
        return response.data;
    },
    create: async (reportData: Partial<Report>) => {
        const response = await api.post<Report>('/reports', reportData);
        return response.data;
    },
    update: async (id: string, reportData: Partial<Report>) => {
        const response = await api.put<Report>(`/reports/${id}`, reportData);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/reports/${id}`);
        return response.data;
    }
};

// Budget API
export const budgetAPI = {
    getAll: async (filters?: { department?: string; fiscalYear?: string; status?: string }) => {
        const response = await api.get<Budget[]>('/budgets', { params: filters });
        return response.data;
    },
    create: async (budgetData: Partial<Budget>) => {
        const response = await api.post<Budget>('/budgets', budgetData);
        return response.data;
    },
    addExpenditure: async (id: string, expenditureData: Partial<Budget['expenditures'][0]>) => {
        const response = await api.put<Budget>(`/budgets/${id}/expenditure`, expenditureData);
        return response.data;
    },
    updateStatus: async (id: string, status: Budget['status']) => {
        const response = await api.put<Budget>(`/budgets/${id}`, { status });
        return response.data;
    }
};

export default api; 