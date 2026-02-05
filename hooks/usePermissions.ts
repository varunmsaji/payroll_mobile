// Centralized permission checking hook for role-based access control
import { useAuth } from '../lib/auth';

export const usePermissions = () => {
    const { user } = useAuth();

    return {
        // Admin and HR can manage employees
        canManageEmployees: user?.role === 'admin' || user?.role === 'hr',

        // Admin and HR can view all attendance
        canViewAllAttendance: user?.role === 'admin' || user?.role === 'hr',

        // Admin and HR can manage shifts
        canManageShifts: user?.role === 'admin' || user?.role === 'hr',

        // Admin and HR can process payroll
        canProcessPayroll: user?.role === 'admin' || user?.role === 'hr',

        // Admin and HR can approve leaves
        canApproveLeaves: user?.role === 'admin' || user?.role === 'hr',

        // Only Admin can access system settings
        canAccessSettings: user?.role === 'admin',

        // Role checks
        isAdmin: user?.role === 'admin',
        isHR: user?.role === 'hr',
        isEmployee: user?.role === 'employee',

        // Current user info
        role: user?.role,
        employeeId: user?.employee_id,
    };
};

export default usePermissions;
