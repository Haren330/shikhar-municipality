export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'department_head' | 'staff';
    department?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Department {
    _id: string;
    name: string;
    code: string;
    head: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Report {
    _id: string;
    department: Department;
    month: number;
    year: number;
    title: string;
    description: string;
    progress: number;
    status: 'pending' | 'in-progress' | 'completed' | 'delayed';
    attachments?: Array<{
        filename: string;
        path: string;
        uploadedAt: Date;
    }>;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
}

export interface Budget {
    _id: string;
    department: Department;
    fiscalYear: string;
    totalBudget: number;
    allocatedBudget: number;
    expenditures: Array<{
        category: string;
        amount: number;
        date: Date;
        description: string;
        billNumber?: string;
        approvedBy: User;
    }>;
    status: 'active' | 'completed' | 'cancelled';
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface AppState {
    auth: AuthState;
    departments: Department[];
    reports: Report[];
    budgets: Budget[];
    loading: boolean;
    error: string | null;
} 