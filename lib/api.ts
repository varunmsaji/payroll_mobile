// Axios API client for PayrollPro mobile app
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import { router } from 'expo-router';

// API base URL - update this for your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

console.log('API Config:', {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    RESOLVED_API_BASE_URL: API_BASE_URL
});

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
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        const token = await storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    async (error: AxiosError) => {
        console.error('API Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });
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
            api.get('/hrms/employees', { params }),
        get: (id: number) => api.get(`/hrms/employees/${id}`),
        create: (data: any) => api.post('/hrms/employees', data),
        update: (id: number, data: any) => api.put(`/hrms/employees/${id}`, data),
        delete: (id: number) => api.delete(`/hrms/employees/${id}`),
        updateManager: (id: number, managerId: number | null) =>
            api.patch(`/hrms/employees/${id}/manager`, { manager_id: managerId }),
    },

    // Attendance
    attendance: {
        // Employee Attendance - New API structure
        getEmployeeRange: (employeeId: number, startDate: string, endDate: string) =>
            api.get(`/hrms/attendance/employee/${employeeId}`, {
                params: { start_date: startDate, end_date: endDate }
            }),
        getToday: (employeeId: number) => api.get(`/hrms/attendance/employee/${employeeId}/today`),

        // Legacy endpoints (for backwards compatibility)
        list: (params?: { date?: string; employee_id?: number; status?: string }) =>
            api.get('/hrms/attendance', { params }),
        get: (id: number) => api.get(`/hrms/attendance/${id}`),
        checkIn: (employeeId: number) => api.post(`/hrms/attendance/check-in/${employeeId}`),
        checkOut: (employeeId: number) => api.post(`/hrms/attendance/check-out/${employeeId}`),
        update: (id: number, data: any) => api.put(`/hrms/attendance/${id}`, data),
        bulkUpdate: (data: any[]) => api.post('/hrms/attendance/bulk-update', { records: data }),
    },

    // Leaves - Updated to match new API documentation
    leaves: {
        // Leave Types
        getTypes: () => api.get('/hrms/leaves/types'),
        createType: (data: { name: string; code: string; yearly_quota: number; is_paid: boolean; carry_forward: boolean }) =>
            api.post('/hrms/leaves/types', data),

        // Leave Balance
        getBalance: (employeeId: number, year: number) =>
            api.get(`/hrms/leaves/balance/${employeeId}/${year}`),
        initBalance: (data: { employee_id: number; leave_type_id: number; year: number; quota: number; carry_forwarded: number }) =>
            api.post('/hrms/leaves/balance/init', data),

        // Apply Leave
        apply: (data: { employee_id: number; leave_type_id: number; start_date: string; end_date: string; total_days: number; reason?: string }) =>
            api.post('/hrms/leaves/apply', data),

        // Leave Requests
        getAllRequests: () => api.get('/hrms/leaves/requests'),
        getPendingRequests: () => api.get('/hrms/leaves/requests/pending'),
        getEmployeeRequests: (employeeId: number, params?: { status?: string }) =>
            api.get(`/hrms/leaves/requests/${employeeId}`, { params }),

        // Leave History
        getHistory: (employeeId: number) => api.get(`/hrms/leaves/history/${employeeId}`),

        // Admin Actions
        approve: (leaveId: number) => api.post(`/hrms/leaves/admin/approve/${leaveId}`),
        reject: (leaveId: number) => api.post(`/hrms/leaves/admin/reject/${leaveId}`),

        // Salary Calculation
        getSalaryAfterLeaves: (employeeId: number, year: number, month: number) =>
            api.get(`/hrms/leaves/salary/${employeeId}/${year}/${month}`),

        // Admin Stats
        getAdminStats: () => api.get('/hrms/leaves/admin/stats'),

        // Legacy methods (deprecated but kept for backwards compatibility)
        list: (params?: { status?: string; employee_id?: number }) =>
            api.get('/hrms/leaves', { params }),
        get: (id: number) => api.get(`/hrms/leaves/${id}`),
        create: (data: any) => api.post('/hrms/leaves', data),
        cancel: (id: number) => api.post(`/hrms/leaves/${id}/cancel`),
        requests: (employeeId: number, params?: { status?: string }) =>
            api.get(`/hrms/leaves/requests/${employeeId}`, { params }),
    },

    // Payroll
    payroll: {
        list: (params?: { month?: number; year?: number; status?: string }) =>
            api.get('/hrms/payroll', { params }),
        get: (id: number) => api.get(`/hrms/payroll/${id}`),
        generate: (month: number, year: number) =>
            api.post('/hrms/payroll/generate', { month, year }),
        markPaid: (id: number) => api.post(`/hrms/payroll/${id}/mark-paid`),
    },

    // Shifts
    shifts: {
        list: () => api.get('/hrms/shifts'),
        get: (id: number) => api.get(`/hrms/shifts/${id}`),
        create: (data: any) => api.post('/hrms/shifts', data),
        update: (id: number, data: any) => api.put(`/hrms/shifts/${id}`, data),
        delete: (id: number) => api.delete(`/hrms/shifts/${id}`),
        assignments: {
            list: (params?: { shift_id?: number; employee_id?: number }) =>
                api.get('/hrms/shifts/assignments', { params }),
            getEmployeeShift: (employeeId: number) => api.get(`/hrms/shifts/employee/${employeeId}`),
            create: (data: any) => api.post('/hrms/shifts/assignments', data),
            update: (id: number, data: any) => api.put(`/hrms/shifts/assignments/${id}`, data),
            delete: (id: number) => api.delete(`/hrms/shifts/assignments/${id}`),
        },
    },

    // Workflows
    workflows: {
        list: () => api.get('/hrms/workflows'),
        get: (id: number) => api.get(`/hrms/workflows/${id}`),
        create: (data: any) => api.post('/hrms/workflows', data),
        update: (id: number, data: any) => api.put(`/hrms/workflows/${id}`, data),
        delete: (id: number) => api.delete(`/hrms/workflows/${id}`),
    },

    // Policies
    policies: {
        payroll: {
            list: () => api.get('/hrms/policies/payroll'),
            get: (id: number) => api.get(`/hrms/policies/payroll/${id}`),
            create: (data: any) => api.post('/hrms/policies/payroll', data),
            update: (id: number, data: any) => api.put(`/hrms/policies/payroll/${id}`, data),
            setDefault: (id: number) => api.post(`/hrms/policies/payroll/${id}/set-default`),
        },
        attendance: {
            list: () => api.get('/hrms/policies/attendance'),
            get: (id: number) => api.get(`/hrms/policies/attendance/${id}`),
            create: (data: any) => api.post('/hrms/policies/attendance', data),
            update: (id: number, data: any) => api.put(`/hrms/policies/attendance/${id}`, data),
            setDefault: (id: number) => api.post(`/hrms/policies/attendance/${id}/set-default`),
        },
    },

    // Dashboard
    dashboard: {
        overview: () => api.get('/hrms/admin/dashboard/overview'),
    },

    // Face Registration
    faces: {
        onboard: (data: FormData, params?: any) => api.post('/faces/onboard', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            params, // Query parameters
        }),
    },

    // Face Attendance
    faceAttendance: {
        punch: async (data: FormData, eventTime: string) => {
            // Using fetch instead of axios for reliable multipart uploads in React Native
            const token = await storage.getToken();
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    // Let fetch set the Content-Type automatically with boundary
                },
                body: data,
            };

            const response = await fetch(`${API_BASE_URL}/face_attendance/punch?event_time=${encodeURIComponent(eventTime)}`, config);

            if (!response.ok) {
                const errorBody = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorBody);
                } catch (e) {
                    errorData = { message: errorBody };
                }

                // Mimic Axios error structure for consistency
                const error: any = new Error(errorData.message || 'Request failed');
                error.response = {
                    status: response.status,
                    data: errorData
                };
                throw error;
            }

            const responseData = await response.json();
            return { data: responseData };
        },
        geoPunch: async (data: FormData, eventTime: string, lat: number, lng: number) => {
            // Using fetch instead of axios for reliable multipart uploads in React Native
            const token = await storage.getToken();
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    // Let fetch set the Content-Type automatically with boundary
                },
                body: data,
            };

            const url = `${API_BASE_URL}/face_attendance/geo_punch?event_time=${encodeURIComponent(eventTime)}&lat=${lat}&lng=${lng}`;
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorBody = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorBody);
                } catch (e) {
                    errorData = { message: errorBody };
                }

                // Mimic Axios error structure for consistency
                const error: any = new Error(errorData.message || 'Request failed');
                error.response = {
                    status: response.status,
                    data: errorData
                };
                throw error;
            }

            const responseData = await response.json();
            return { data: responseData };
        },
    },
};

export { api };
export default apiClient;
