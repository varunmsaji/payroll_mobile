// Payroll screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, getStatusVariant, Loading, Button, Modal, Toast } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { Payroll } from '../../types';
import { format } from 'date-fns';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollScreen() {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [generating, setGenerating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchPayrolls = useCallback(async () => {
        try {
            const response = await apiClient.payroll.list({ month: selectedMonth, year: selectedYear });
            setPayrolls(response.data.items || response.data || []);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
            setPayrolls([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchPayrolls();
    }, [fetchPayrolls]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPayrolls();
        setRefreshing(false);
    }, [fetchPayrolls]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await apiClient.payroll.generate(selectedMonth, selectedYear);
            setToast({ message: 'Payroll generated successfully', type: 'success' });
            await fetchPayrolls();
        } catch (error) {
            setToast({ message: 'Failed to generate payroll', type: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(y => y - 1);
            } else {
                setSelectedMonth(m => m - 1);
            }
        } else {
            if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(y => y + 1);
            } else {
                setSelectedMonth(m => m + 1);
            }
        }
    };

    const renderPayroll = ({ item }: { item: Payroll }) => (
        <Card style={styles.payrollCard} onPress={() => setSelectedPayroll(item)}>
            <View style={styles.payrollRow}>
                <View style={styles.avatar}>
                    <Icon name="user" size={20} color={Colors.primary[600]} />
                </View>
                <View style={styles.payrollInfo}>
                    <Text style={styles.employeeName}>{item.employee_name || `Employee ${item.employee_id}`}</Text>
                    <Text style={styles.netSalary}>₹{item.net_salary?.toLocaleString() || '0'}</Text>
                </View>
                <Badge
                    text={item.status}
                    variant={getStatusVariant(item.status)}
                    size="sm"
                />
            </View>
        </Card>
    );

    // Calculate totals
    const totalNetSalary = payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
    const paidCount = payrolls.filter(p => p.status === 'paid').length;

    if (isLoading) {
        return <Loading fullScreen text="Loading payroll..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Payroll</Text>
                <Button
                    title="Generate"
                    size="sm"
                    onPress={handleGenerate}
                    loading={generating}
                    icon={<Icon name="plus" size={16} color={Colors.text.inverse} />}
                />
            </View>

            {/* Month Selector */}
            <View style={styles.monthSelector}>
                <TouchableOpacity onPress={() => handleMonthChange('prev')} style={styles.monthArrow}>
                    <Icon name="chevron-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.monthDisplay}>
                    <Text style={styles.monthText}>{months[selectedMonth - 1]}</Text>
                    <Text style={styles.yearText}>{selectedYear}</Text>
                </View>
                <TouchableOpacity onPress={() => handleMonthChange('next')} style={styles.monthArrow}>
                    <Icon name="chevron-right" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Summary Card */}
            <Card style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>₹{totalNetSalary.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>Total Payroll</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{payrolls.length}</Text>
                        <Text style={styles.summaryLabel}>Employees</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.success.main }]}>{paidCount}</Text>
                        <Text style={styles.summaryLabel}>Paid</Text>
                    </View>
                </View>
            </Card>

            {/* Payroll List */}
            <FlatList
                data={payrolls}
                keyExtractor={(item) => item.payroll_id.toString()}
                renderItem={renderPayroll}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="wallet" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No payroll records for this month</Text>
                        <Button
                            title="Generate Payroll"
                            onPress={handleGenerate}
                            loading={generating}
                            style={{ marginTop: Spacing.lg }}
                        />
                    </View>
                }
            />

            {/* Detail Modal */}
            <Modal
                visible={!!selectedPayroll}
                onClose={() => setSelectedPayroll(null)}
                title="Payroll Details"
            >
                {selectedPayroll && (
                    <View style={styles.modalContent}>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Employee</Text>
                            <Text style={styles.modalValue}>
                                {selectedPayroll.employee_name || `Employee ${selectedPayroll.employee_id}`}
                            </Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Status</Text>
                            <Badge
                                text={selectedPayroll.status}
                                variant={getStatusVariant(selectedPayroll.status)}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Basic Salary</Text>
                            <Text style={styles.modalValue}>₹{selectedPayroll.basic_salary?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Present Days</Text>
                            <Text style={styles.modalValue}>{selectedPayroll.present_days}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Absent Days</Text>
                            <Text style={styles.modalValue}>{selectedPayroll.absent_days}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Overtime Hours</Text>
                            <Text style={styles.modalValue}>{selectedPayroll.overtime_hours?.toFixed(1)} hrs</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Overtime Pay</Text>
                            <Text style={[styles.modalValue, { color: Colors.success.main }]}>
                                +₹{selectedPayroll.overtime_pay?.toLocaleString() || '0'}
                            </Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Deductions</Text>
                            <Text style={[styles.modalValue, { color: Colors.error.main }]}>
                                -₹{selectedPayroll.deductions?.toLocaleString() || '0'}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.modalRow}>
                            <Text style={[styles.modalLabel, { fontWeight: Typography.weight.bold }]}>Net Salary</Text>
                            <Text style={[styles.modalValue, { fontSize: Typography.size.xl }]}>
                                ₹{selectedPayroll.net_salary?.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                )}
            </Modal>

            {/* Toast */}
            {toast && (
                <Toast
                    visible={!!toast}
                    type={toast.type}
                    message={toast.message}
                    onDismiss={() => setToast(null)}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    title: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background.primary,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.xl,
    },
    monthArrow: {
        padding: Spacing.sm,
    },
    monthDisplay: {
        alignItems: 'center',
    },
    monthText: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    yearText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    summaryCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    summaryLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border.light,
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
        gap: Spacing.md,
        paddingBottom: Spacing['5xl'],
    },
    payrollCard: {
        padding: Spacing.md,
    },
    payrollRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    payrollInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    netSalary: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.success.main,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['5xl'],
    },
    emptyText: {
        fontSize: Typography.size.base,
        color: Colors.text.secondary,
        marginTop: Spacing.md,
    },
    modalContent: {
        gap: Spacing.md,
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalLabel: {
        fontSize: Typography.size.base,
        color: Colors.text.secondary,
    },
    modalValue: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.light,
        marginVertical: Spacing.sm,
    },
});
