// My Payslips Screen - Employee's own payslips
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Payroll } from '../../types';

export default function MyPayslipsScreen() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payslips, setPayslips] = useState<Payroll[]>([]);
    const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);

    const fetchPayslips = useCallback(async () => {
        if (!user?.employee_id) return;

        try {
            // Get all payroll records - filter by employee on client side
            const response = await apiClient.payroll.list({});
            const allPayroll = response.data || [];
            // Filter to only show current employee's payslips
            const myPayslips = allPayroll.filter(
                (p: Payroll) => p.employee_id === user.employee_id
            );
            setPayslips(myPayslips);
        } catch (error) {
            console.error('Error fetching payslips:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        fetchPayslips();
    }, [fetchPayslips]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPayslips();
    }, [fetchPayslips]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getMonthName = (month: number, year: number) => {
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return Colors.accent.green;
            case 'generated':
                return Colors.primary[600];
            case 'draft':
                return Colors.text.tertiary;
            default:
                return Colors.text.tertiary;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Payslips</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {payslips.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="wallet" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No payslips found</Text>
                    </View>
                ) : (
                    payslips.map((payslip) => (
                        <TouchableOpacity
                            key={payslip.payroll_id}
                            style={styles.payslipCard}
                            onPress={() => setSelectedPayslip(payslip)}
                        >
                            <View style={styles.payslipHeader}>
                                <Text style={styles.monthName}>
                                    {getMonthName(payslip.month, payslip.year)}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(payslip.status) + '20' }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: getStatusColor(payslip.status) }
                                        ]}
                                    >
                                        {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.payslipAmount}>
                                <Text style={styles.amountLabel}>Net Salary</Text>
                                <Text style={styles.amountValue}>
                                    {formatCurrency(payslip.net_salary)}
                                </Text>
                            </View>
                            <View style={styles.payslipFooter}>
                                <Text style={styles.footerText}>
                                    {payslip.present_days} days worked
                                </Text>
                                <Icon name="chevron-right" size={16} color={Colors.text.tertiary} />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Payslip Detail Modal */}
            <Modal
                visible={!!selectedPayslip}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedPayslip(null)}
            >
                {selectedPayslip && (
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payslip Details</Text>
                            <TouchableOpacity onPress={() => setSelectedPayslip(null)}>
                                <Icon name="close" size={24} color={Colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalMonth}>
                                {getMonthName(selectedPayslip.month, selectedPayslip.year)}
                            </Text>

                            {/* Earnings Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Earnings</Text>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Basic Salary</Text>
                                    <Text style={styles.rowValue}>
                                        {formatCurrency(selectedPayslip.basic_salary)}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Overtime Pay</Text>
                                    <Text style={styles.rowValue}>
                                        {formatCurrency(selectedPayslip.overtime_pay)}
                                    </Text>
                                </View>
                                <View style={[styles.row, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Gross Earnings</Text>
                                    <Text style={styles.totalValue}>
                                        {formatCurrency(selectedPayslip.basic_salary + selectedPayslip.overtime_pay)}
                                    </Text>
                                </View>
                            </View>

                            {/* Deductions Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Deductions</Text>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Total Deductions</Text>
                                    <Text style={[styles.rowValue, { color: Colors.accent.red }]}>
                                        -{formatCurrency(selectedPayslip.deductions)}
                                    </Text>
                                </View>
                            </View>

                            {/* Attendance Summary */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Attendance Summary</Text>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Present Days</Text>
                                    <Text style={styles.rowValue}>{selectedPayslip.present_days}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Absent Days</Text>
                                    <Text style={styles.rowValue}>{selectedPayslip.absent_days}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Overtime Hours</Text>
                                    <Text style={styles.rowValue}>{selectedPayslip.overtime_hours}h</Text>
                                </View>
                            </View>

                            {/* Net Salary */}
                            <View style={styles.netSalaryCard}>
                                <Text style={styles.netSalaryLabel}>Net Salary</Text>
                                <Text style={styles.netSalaryValue}>
                                    {formatCurrency(selectedPayslip.net_salary)}
                                </Text>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    header: {
        padding: Spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    title: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['3xl'],
    },
    emptyText: {
        fontSize: Typography.size.md,
        color: Colors.text.tertiary,
        marginTop: Spacing.md,
    },
    payslipCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    payslipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    monthName: {
        fontSize: Typography.size.md,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    statusBadge: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        fontSize: Typography.size.xs,
        fontWeight: '500',
    },
    payslipAmount: {
        marginBottom: Spacing.md,
    },
    amountLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
    },
    amountValue: {
        fontSize: Typography.size.xxl,
        fontWeight: '700',
        color: Colors.primary[600],
    },
    payslipFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    modalTitle: {
        fontSize: Typography.size.lg,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    modalContent: {
        flex: 1,
        padding: Spacing.md,
    },
    modalMonth: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    section: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.md,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
    },
    rowLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    rowValue: {
        fontSize: Typography.size.sm,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        marginTop: Spacing.sm,
        paddingTop: Spacing.md,
    },
    totalLabel: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    totalValue: {
        fontSize: Typography.size.md,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    netSalaryCard: {
        backgroundColor: Colors.primary[600],
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    netSalaryLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.inverse,
        opacity: 0.8,
    },
    netSalaryValue: {
        fontSize: Typography.size.xxxl,
        fontWeight: '700',
        color: Colors.text.inverse,
        marginTop: Spacing.xs,
    },
});
