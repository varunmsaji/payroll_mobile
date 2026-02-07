// Premium Payroll Processing Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { format } from 'date-fns';

interface PayrollRecord {
    payroll_id: number;
    employee_id: number;
    employee_name?: string;
    first_name?: string;
    last_name?: string;
    department?: string;
    month: number;
    year: number;
    basic_salary: number;
    gross_pay: number;
    net_pay: number;
    deductions?: number;
    overtime_pay?: number;
    status: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollScreen() {
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [error, setError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const fetchPayrolls = useCallback(async () => {
        try {
            const response = await apiClient.payroll.list({
                month: selectedMonth,
                year: selectedYear
            });
            const data = response.data?.items || response.data || [];
            setPayrolls(Array.isArray(data) ? data : []);
        } catch (err: any) {
            // Silently handle - show empty state
            console.log('Payroll data unavailable');
            setPayrolls([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchPayrolls();
    }, [fetchPayrolls]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPayrolls();
    }, [fetchPayrolls]);

    const handleRunBulkPayroll = () => {
        Alert.alert(
            'Run Bulk Payroll',
            `Generate payroll for ${MONTHS[selectedMonth - 1]} ${selectedYear}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Run',
                    onPress: async () => {
                        setIsRunning(true);
                        try {
                            await apiClient.payroll.generate(selectedMonth, selectedYear);
                            Alert.alert('Success', 'Payroll generated successfully');
                            fetchPayrolls();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to generate payroll');
                        } finally {
                            setIsRunning(false);
                        }
                    }
                }
            ]
        );
    };

    const handleMarkPaid = async (payrollId: number) => {
        try {
            await apiClient.payroll.markPaid(payrollId);
            Alert.alert('Success', 'Payroll marked as paid');
            fetchPayrolls();
        } catch (err) {
            Alert.alert('Error', 'Failed to update payroll status');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return { bg: '#D1FAE5', text: '#059669', icon: 'check-circle' };
            case 'pending': return { bg: '#FEF3C7', text: '#D97706', icon: 'clock' };
            case 'processing': return { bg: '#DBEAFE', text: '#1D4ED8', icon: 'refresh-cw' };
            default: return { bg: '#F1F5F9', text: '#64748B', icon: 'help-circle' };
        }
    };

    // Calculate totals
    const totalGross = payrolls.reduce((sum, p) => sum + (p.gross_pay || 0), 0);
    const totalNet = payrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);
    const totalOT = payrolls.reduce((sum, p) => sum + (p.overtime_pay || 0), 0);
    const paidCount = payrolls.filter(p => p.status?.toLowerCase() === 'paid').length;

    // Filter payrolls
    const filteredPayrolls = payrolls.filter(p => {
        const name = p.employee_name || `${p.first_name || ''} ${p.last_name || ''}`;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (isLoading) {
        return <Loading fullScreen text="Loading payroll..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payroll Processing</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Icon name="settings" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[1]}
                keyExtractor={() => 'content'}
                renderItem={() => (
                    <>
                        {/* Month Selector */}
                        <View style={styles.monthSelector}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedMonth === 1) {
                                        setSelectedMonth(12);
                                        setSelectedYear(y => y - 1);
                                    } else {
                                        setSelectedMonth(m => m - 1);
                                    }
                                }}
                                style={styles.monthNavButton}
                            >
                                <Icon name="chevron-left" size={24} color={Colors.text.tertiary} />
                            </TouchableOpacity>
                            <View style={styles.monthDisplay}>
                                <Text style={styles.monthText}>{MONTHS[selectedMonth - 1]} {selectedYear}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedMonth === 12) {
                                        setSelectedMonth(1);
                                        setSelectedYear(y => y + 1);
                                    } else {
                                        setSelectedMonth(m => m + 1);
                                    }
                                }}
                                style={styles.monthNavButton}
                            >
                                <Icon name="chevron-right" size={24} color={Colors.text.tertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Run Bulk Payroll Button */}
                        <TouchableOpacity
                            style={styles.runPayrollButton}
                            onPress={handleRunBulkPayroll}
                            activeOpacity={0.8}
                            disabled={isRunning}
                        >
                            <LinearGradient
                                colors={['#137FEC', '#0D5EBD']}
                                style={styles.runPayrollGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Icon name="play" size={20} color="#FFFFFF" />
                                <Text style={styles.runPayrollText}>
                                    {isRunning ? 'Processing...' : 'Run Bulk Payroll'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* KPI Cards */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.kpiContainer}
                        >
                            <View style={[styles.kpiCard, styles.kpiCardBlue]}>
                                <Text style={styles.kpiLabel}>Total Gross</Text>
                                <Text style={styles.kpiValue}>₹{totalGross.toLocaleString()}</Text>
                                <Text style={styles.kpiSubtext}>{payrolls.length} employees</Text>
                            </View>
                            <View style={[styles.kpiCard, styles.kpiCardGreen]}>
                                <Text style={styles.kpiLabel}>Total Net</Text>
                                <Text style={styles.kpiValue}>₹{totalNet.toLocaleString()}</Text>
                                <Text style={styles.kpiSubtext}>{paidCount} paid</Text>
                            </View>
                            <View style={[styles.kpiCard, styles.kpiCardPurple]}>
                                <Text style={styles.kpiLabel}>OT Payout</Text>
                                <Text style={styles.kpiValue}>₹{totalOT.toLocaleString()}</Text>
                                <Text style={styles.kpiSubtext}>Overtime</Text>
                            </View>
                        </ScrollView>

                        {/* Search */}
                        <View style={styles.searchRow}>
                            <View style={styles.searchContainer}>
                                <Icon name="search" size={20} color={Colors.text.tertiary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search employee..."
                                    placeholderTextColor={Colors.text.tertiary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity style={styles.filterButton}>
                                <Icon name="filter" size={18} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Section Header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Payroll Details</Text>
                            <Text style={styles.sectionCount}>{filteredPayrolls.length} records</Text>
                        </View>

                        {/* Error State */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-triangle" size={20} color={Colors.error.main} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Payroll Cards */}
                        {filteredPayrolls.map((payroll) => {
                            const statusStyle = getStatusStyle(payroll.status);
                            const employeeName = payroll.employee_name ||
                                `${payroll.first_name || ''} ${payroll.last_name || ''}`.trim() || 'Unknown';
                            const isPending = payroll.status?.toLowerCase() === 'pending';

                            return (
                                <View key={payroll.payroll_id} style={styles.payrollCard}>
                                    {/* Card Header */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.employeeInfo}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>
                                                    {employeeName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.employeeName}>{employeeName}</Text>
                                                <Text style={styles.employeeDept}>
                                                    {payroll.department || 'General'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Icon name={statusStyle.icon} size={12} color={statusStyle.text} />
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                {payroll.status}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Salary Grid */}
                                    <View style={styles.salaryGrid}>
                                        <View style={styles.salaryItem}>
                                            <Text style={styles.salaryLabel}>Basic</Text>
                                            <Text style={styles.salaryValue}>
                                                ₹{(payroll.basic_salary || 0).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={styles.salaryItem}>
                                            <Text style={styles.salaryLabel}>Gross</Text>
                                            <Text style={styles.salaryValue}>
                                                ₹{(payroll.gross_pay || 0).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={styles.salaryItem}>
                                            <Text style={styles.salaryLabel}>Deductions</Text>
                                            <Text style={[styles.salaryValue, { color: '#EF4444' }]}>
                                                -₹{(payroll.deductions || 0).toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Net Pay */}
                                    <View style={styles.netPayRow}>
                                        <Text style={styles.netPayLabel}>Net Pay</Text>
                                        <Text style={styles.netPayValue}>
                                            ₹{(payroll.net_pay || 0).toLocaleString()}
                                        </Text>
                                    </View>

                                    {/* Action Button */}
                                    {isPending && (
                                        <TouchableOpacity
                                            style={styles.markPaidButton}
                                            onPress={() => handleMarkPaid(payroll.payroll_id)}
                                        >
                                            <Icon name="check" size={16} color="#FFFFFF" />
                                            <Text style={styles.markPaidText}>Mark as Paid</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}

                        {/* Empty State */}
                        {filteredPayrolls.length === 0 && !error && (
                            <View style={styles.emptyState}>
                                <Icon name="wallet" size={48} color={Colors.text.tertiary} />
                                <Text style={styles.emptyTitle}>No Payroll Data</Text>
                                <Text style={styles.emptyText}>
                                    No payroll records for {MONTHS[selectedMonth - 1]} {selectedYear}
                                </Text>
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={handleRunBulkPayroll}
                                >
                                    <Text style={styles.generateButtonText}>Generate Payroll</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={{ height: 120 }} />
                    </>
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    backButton: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    headerTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    settingsButton: {
        padding: Spacing.sm,
        marginRight: -Spacing.sm,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        backgroundColor: '#FFFFFF',
    },
    monthNavButton: {
        padding: Spacing.sm,
    },
    monthDisplay: {
        paddingHorizontal: Spacing['2xl'],
    },
    monthText: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    runPayrollButton: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.lg,
    },
    runPayrollGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
    },
    runPayrollText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: '#FFFFFF',
    },
    kpiContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
    },
    kpiCard: {
        width: 160,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginRight: Spacing.md,
    },
    kpiCardBlue: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    kpiCardGreen: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    kpiCardPurple: {
        backgroundColor: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    kpiLabel: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    kpiValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        marginTop: 4,
    },
    kpiSubtext: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: 4,
    },
    searchRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
        paddingVertical: Spacing.md,
    },
    filterButton: {
        width: 48,
        height: 48,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    sectionCount: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
    },
    payrollCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    employeeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.bold,
        color: Colors.primary[700],
    },
    employeeName: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    employeeDept: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    statusText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        textTransform: 'capitalize',
    },
    salaryGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    salaryItem: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    salaryLabel: {
        fontSize: 10,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    salaryValue: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    netPayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    netPayLabel: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    netPayValue: {
        fontSize: Typography.size.xl,
        fontWeight: '800',
        color: '#137FEC',
    },
    markPaidButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: '#10B981',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.md,
    },
    markPaidText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#FFFFFF',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['5xl'],
    },
    emptyTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        marginTop: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    generateButton: {
        backgroundColor: '#137FEC',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.lg,
    },
    generateButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#FFFFFF',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.error.light,
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
    },
    errorText: {
        fontSize: Typography.size.sm,
        color: Colors.error.dark,
        flex: 1,
    },
});
