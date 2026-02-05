// PayrollPro Types - Shared with web app

export type UserRole = 'admin' | 'hr' | 'employee';

export interface AuthUser {
    user_id: number;
    role: UserRole;
    employee_id: number | null;
}

export interface Employee {
    employee_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    department?: string;
    position?: string;
    date_of_joining?: string;
    manager_id?: number;
    manager_name?: string;
    status: 'active' | 'inactive';
    basic_salary?: number;
}

export interface Attendance {
    attendance_id: number;
    employee_id: number;
    employee_name?: string;
    date: string;
    check_in?: string;
    check_out?: string;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
    work_hours?: number;
    overtime_hours?: number;
    notes?: string;
}

export interface Leave {
    leave_id: number;
    employee_id: number;
    employee_name?: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    approver_id?: number;
    approver_name?: string;
    created_at: string;
}

export interface Payroll {
    payroll_id: number;
    employee_id: number;
    employee_name?: string;
    month: number;
    year: number;
    basic_salary: number;
    present_days: number;
    absent_days: number;
    overtime_hours: number;
    overtime_pay: number;
    deductions: number;
    net_salary: number;
    status: 'draft' | 'generated' | 'paid';
    generated_at?: string;
}

export interface Shift {
    shift_id: number;
    shift_name: string;
    start_time: string;
    end_time: string;
    grace_period_minutes: number;
    is_overnight: boolean;
    created_at: string;
}

export interface ShiftAssignment {
    assignment_id: number;
    employee_id: number;
    employee_name?: string;
    shift_id: number;
    shift_name?: string;
    start_date: string;
    end_date?: string;
    status: 'active' | 'inactive';
}

export interface Workflow {
    workflow_id: number;
    workflow_name: string;
    workflow_type: 'leave_approval' | 'expense_approval' | 'timesheet_approval';
    description?: string;
    is_active: boolean;
    created_at: string;
}

export interface WorkflowStep {
    step_id: number;
    workflow_id: number;
    step_order: number;
    approver_type: 'manager' | 'hr' | 'admin' | 'specific_user';
    approver_id?: number;
    approver_name?: string;
}

export interface PayrollPolicy {
    policy_id: number;
    name: string;
    overtime_multiplier: number;
    late_deduction_per_instance: number;
    absent_deduction_per_day: number;
    leave_encashment_enabled: boolean;
    is_default: boolean;
}

export interface AttendancePolicy {
    policy_id: number;
    name: string;
    work_hours_per_day: number;
    grace_period_minutes: number;
    half_day_hours: number;
    overtime_threshold_hours: number;
    is_default: boolean;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

// Dashboard types
export interface DashboardStats {
    total_employees: number;
    present_today: number;
    on_leave_today: number;
    pending_leaves: number;
    pending_payroll: number;
}
