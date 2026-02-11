// PayrollPro Types - Shared with web app

export type UserRole = 'admin' | 'hr' | 'employee';

export interface AuthUser {
    user_id: number;
    role: UserRole;
    employee_id: number | null;
    first_name?: string;
    last_name?: string;
    email?: string;
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
    status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'on_leave';
    work_hours?: number; // Legacy field
    net_hours?: number; // New API field - replaces work_hours
    overtime_hours?: number;
    notes?: string;
    is_late?: boolean;
    is_overtime?: boolean;
    is_payroll_locked?: boolean;
}

// Leave Types
export interface LeaveType {
    leave_type_id: number;
    name: string;
    code: string;
    yearly_quota: number;
    is_paid: boolean;
    carry_forward: boolean;
}

export interface LeaveBalance {
    id: number;
    employee_id: number;
    leave_type_id: number;
    year: number;
    total_quota: number;
    used: number;
    remaining: number;
    carry_forwarded: number;
    leave_type_name?: string;
    is_paid?: boolean;
}

export interface LeaveRequest {
    leave_id: number;
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    leave_type_name?: string;
}

export interface LeaveHistoryItem {
    history_id: number;
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    leave_type_name: string;
    is_paid: boolean;
}

export interface SalaryAfterLeaves {
    employee_id: number;
    year: number;
    month: number;
    base_salary: number;
    unpaid_leave_days: number;
    daily_salary: number;
    deduction: number;
    final_salary: number;
}

export interface LeaveAdminStats {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    this_month_requests: number;
    paid_leaves: number;
    unpaid_leaves: number;
}

// Legacy Leave interface (for backwards compatibility)
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
    start_time?: string;
    end_time?: string;
}

export interface EmployeeShiftDetails {
    id: number;
    employee_id: number;
    shift_id: number;
    effective_from: string;
    effective_to: string | null;
    shift_name: string;
    start_time: string;
    end_time: string;
    required_hours: number;
    is_night_shift: boolean;
    break_start: string;
    break_end: string;
    break_minutes: number;
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

export interface EmployeeCounts {
    total: number;
    active: number;
}

export interface AttendanceToday {
    present: number;
    absent: number;
    late: number;
}

export interface ShiftDistribution {
    shift_name: string;
    employees_assigned: number;
}

export interface RecentActivity {
    employee_id: number;
    employee_name: string;
    event_type: string;
    event_time: string;
    source: string;
}

export interface DashboardOverviewResponse {
    date: string;
    employees: EmployeeCounts;
    attendance_today: AttendanceToday;
    overtime_today_hours: number;
    shift_distribution: ShiftDistribution[];
    recent_activity: RecentActivity[];
}
