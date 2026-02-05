// Axios API client for PayrollPro mobile app
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import { router } from 'expo-router';

// API base URL - update this for your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Clear auth data and redirect to login
            await storage.clearAuth();
            router.replace('/login');
        }
        return Promise.reject(error);
    }
);

// API methods matching backend endpoints
export const apiClient = {
    // Auth
    auth: {
        login: (email: string, password: string) =>
            api.post('/auth/login', { email, password }),
        logout: () => api.post('/auth/logout'),
        me: () => api.get('/auth/me'),
    },

    // Employees
    employees: {
        list: (params?: { page?: number; per_page?: number; search?: string; status?: string }) =>
            api.get('/employees', { params }),
        get: (id: number) => api.get(`/employees/${id}`),
        create: (data: any) => api.post('/employees', data),
        update: (id: number, data: any) => api.put(`/employees/${id}`, data),
        delete: (id: number) => api.delete(`/employees/${id}`),
        updateManager: (id: number, managerId: number | null) =>
            api.patch(`/employees/${id}/manager`, { manager_id: managerId }),
    },

    // Attendance
    attendance: {
        list: (params?: { date?: string; employee_id?: number; status?: string }) =>
            api.get('/attendance', { params }),
        get: (id: number) => api.get(`/attendance/${id}`),
        checkIn: (employeeId: number) => api.post(`/attendance/check-in/${employeeId}`),
        checkOut: (employeeId: number) => api.post(`/attendance/check-out/${employeeId}`),
        update: (id: number, data: any) => api.put(`/attendance/${id}`, data),
        bulkUpdate: (data: any[]) => api.post('/attendance/bulk-update', { records: data }),
    },

    // Leaves
    leaves: {
        list: (params?: { status?: string; employee_id?: number }) =>
            api.get('/leaves', { params }),
        get: (id: number) => api.get(`/leaves/${id}`),
        create: (data: any) => api.post('/leaves', data),
        approve: (id: number, approverId: number) =>
            api.post(`/leaves/${id}/approve`, { approver_id: approverId }),
        reject: (id: number, reason: string) =>
            api.post(`/leaves/${id}/reject`, { reason }),
        cancel: (id: number) => api.post(`/leaves/${id}/cancel`),
    },

    // Payroll
    payroll: {
        list: (params?: { month?: number; year?: number; status?: string }) =>
            api.get('/payroll', { params }),
        get: (id: number) => api.get(`/payroll/${id}`),
        generate: (month: number, year: number) =>
            api.post('/payroll/generate', { month, year }),
        markPaid: (id: number) => api.post(`/payroll/${id}/mark-paid`),
    },

    // Shifts
    shifts: {
        list: () => api.get('/shifts'),
        get: (id: number) => api.get(`/shifts/${id}`),
        create: (data: any) => api.post('/shifts', data),
        update: (id: number, data: any) => api.put(`/shifts/${id}`, data),
        delete: (id: number) => api.delete(`/shifts/${id}`),
        assignments: {
            list: (params?: { shift_id?: number; employee_id?: number }) =>
                api.get('/shifts/assignments', { params }),
            create: (data: any) => api.post('/shifts/assignments', data),
            update: (id: number, data: any) => api.put(`/shifts/assignments/${id}`, data),
            delete: (id: number) => api.delete(`/shifts/assignments/${id}`),
        },
    },

    // Workflows
    workflows: {
        list: () => api.get('/workflows'),
        get: (id: number) => api.get(`/workflows/${id}`),
        create: (data: any) => api.post('/workflows', data),
        update: (id: number, data: any) => api.put(`/workflows/${id}`, data),
        delete: (id: number) => api.delete(`/workflows/${id}`),
    },

    // Policies
    policies: {
        payroll: {
            list: () => api.get('/policies/payroll'),
            get: (id: number) => api.get(`/policies/payroll/${id}`),
            create: (data: any) => api.post('/policies/payroll', data),
            update: (id: number, data: any) => api.put(`/policies/payroll/${id}`, data),
            setDefault: (id: number) => api.post(`/policies/payroll/${id}/set-default`),
        },
        attendance: {
            list: () => api.get('/policies/attendance'),
            get: (id: number) => api.get(`/policies/attendance/${id}`),
            create: (data: any) => api.post('/policies/attendance', data),
            update: (id: number, data: any) => api.put(`/policies/attendance/${id}`, data),
            setDefault: (id: number) => api.post(`/policies/attendance/${id}/set-default`),
        },
    },

    // Dashboard
    dashboard: {
        stats: () => api.get('/dashboard/stats'),
        recentActivity: () => api.get('/dashboard/activity'),
    },
};

export { api };
export default apiClient;
