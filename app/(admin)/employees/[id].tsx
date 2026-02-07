// Premium Employee Detail Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/theme';
import { apiClient } from '../../../lib/api';
import { Employee, LeaveBalance } from '../../../types';

interface StatCardProps {
    icon: string;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
    subValue?: string;
    trend?: { value: string; positive: boolean };
    progress?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, iconColor, label, value, subValue, trend, progress }) => (
    <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
            <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
                <Icon name={icon} size={20} color={iconColor} />
            </View>
            {trend && (
                <View style={[styles.trendBadge, { backgroundColor: trend.positive ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={[styles.trendText, { color: trend.positive ? '#059669' : '#DC2626' }]}>
                        {trend.value}
                    </Text>
                </View>
            )}
        </View>
        <View style={styles.statCardBody}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{value}</Text>
                {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
            </View>
            {progress !== undefined && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>
            )}
        </View>
    </View>
);

interface InfoRowProps {
    icon: string;
    label: string;
    value: string | undefined;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoIconContainer}>
            <Icon name={icon} size={20} color={Colors.text.tertiary} />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{value || 'Not set'}</Text>
        </View>
    </View>
);

export default function EmployeeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const response = await apiClient.employees.get(Number(id));
            setEmployee(response.data);

            // Try to fetch leave balance
            try {
                const year = new Date().getFullYear();
                const balanceRes = await apiClient.leaves.getBalance(Number(id), year);
                const balances = balanceRes.data?.balances || balanceRes.data || [];
                setLeaveBalance(Array.isArray(balances) ? balances : []);
            } catch (err) {
                console.log('Leave balance not available');
                setLeaveBalance([]);
            }
        } catch (err: any) {
            console.error('Error fetching employee:', err);
            setError('Unable to load employee details');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleCall = () => {
        if (employee?.phone) {
            Linking.openURL(`tel:${employee.phone}`);
        }
    };

    const handleEmail = () => {
        if (employee?.email) {
            Linking.openURL(`mailto:${employee.email}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return '#22C55E';
            case 'on_leave':
            case 'on leave': return '#F59E0B';
            case 'inactive': return '#94A3B8';
            default: return '#94A3B8';
        }
    };

    // Calculate total leave balance
    const totalLeave = leaveBalance.reduce((sum, b) => sum + (b.total || 0), 0);
    const usedLeave = leaveBalance.reduce((sum, b) => sum + (b.used || 0), 0);
    const remainingLeave = totalLeave - usedLeave;
    const leavePercentage = totalLeave > 0 ? Math.round((remainingLeave / totalLeave) * 100) : 0;

    if (isLoading) {
        return <Loading fullScreen text="Loading employee..." />;
    }

    if (!employee || error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Employee Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Icon name="users" size={48} color={Colors.text.tertiary} />
                    <Text style={styles.errorText}>{error || 'Employee not found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Employee Profile</Text>
                <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    {/* Avatar with Status */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.heroAvatar}>
                            <Text style={styles.heroAvatarText}>
                                {employee.first_name?.[0]}{employee.last_name?.[0]}
                            </Text>
                        </View>
                        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(employee.status) }]}>
                            <View style={styles.statusInnerDot} />
                        </View>
                    </View>

                    {/* Name & Role */}
                    <Text style={styles.heroName}>{employee.first_name} {employee.last_name}</Text>
                    <Text style={styles.heroRole}>{employee.position || 'No position'}</Text>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.status) + '20' }]}>
                        <View style={[styles.statusBadgeDot, { backgroundColor: getStatusColor(employee.status) }]} />
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(employee.status) }]}>
                            {employee.status === 'active' ? 'Active Employee' : employee.status}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                            <View style={styles.actionIconContainer}>
                                <Icon name="phone" size={20} color="#137FEC" />
                            </View>
                            <Text style={styles.actionLabel}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                            <View style={styles.actionIconContainer}>
                                <Icon name="mail" size={20} color="#137FEC" />
                            </View>
                            <Text style={styles.actionLabel}>Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <View style={styles.actionIconContainer}>
                                <Icon name="message-circle" size={20} color="#137FEC" />
                            </View>
                            <Text style={styles.actionLabel}>Message</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Carousel */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statsContainer}
                >
                    <StatCard
                        icon="clock"
                        iconBg="#FFF7ED"
                        iconColor="#F97316"
                        label="Late Days"
                        value="2"
                        trend={{ value: '-10%', positive: true }}
                    />
                    <StatCard
                        icon="trending-up"
                        iconBg="#F3E8FF"
                        iconColor="#8B5CF6"
                        label="Overtime"
                        value="12h"
                        trend={{ value: '+2h', positive: true }}
                    />
                    <StatCard
                        icon="umbrella"
                        iconBg="#DBEAFE"
                        iconColor="#137FEC"
                        label="Leave"
                        value={`${remainingLeave}`}
                        subValue={`/${totalLeave}`}
                        progress={leavePercentage}
                    />
                </ScrollView>

                {/* Personal Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Personal Details</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>View all</Text>
                        </TouchableOpacity>
                    </View>
                    <InfoRow icon="user" label="Employee ID" value={`#PPRO-${employee.employee_id}`} />
                    <View style={styles.divider} />
                    <InfoRow icon="mail" label="Email Address" value={employee.email} />
                    <View style={styles.divider} />
                    <InfoRow icon="phone" label="Phone Number" value={employee.phone} />
                    <View style={styles.divider} />
                    <InfoRow icon="home" label="Address" value={employee.address || 'Not provided'} />
                </View>

                {/* Shift & Department Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Shift & Department</Text>
                    </View>
                    <TouchableOpacity style={styles.shiftRow}>
                        <View style={styles.shiftRowLeft}>
                            <View style={[styles.shiftIcon, { backgroundColor: '#E0E7FF' }]}>
                                <Icon name="building" size={18} color="#4F46E5" />
                            </View>
                            <View>
                                <Text style={styles.shiftTitle}>{employee.department || 'No Department'}</Text>
                                <Text style={styles.shiftSubtitle}>Main Team</Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={18} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shiftRow}>
                        <View style={styles.shiftRowLeft}>
                            <View style={[styles.shiftIcon, { backgroundColor: '#FCE7F3' }]}>
                                <Icon name="clock" size={18} color="#DB2777" />
                            </View>
                            <View>
                                <Text style={styles.shiftTitle}>09:00 - 17:00</Text>
                                <Text style={styles.shiftSubtitle}>Regular Shift</Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={18} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                </View>

                {/* Salary Structure Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Salary Structure</Text>
                        <View style={styles.monthlyBadge}>
                            <Text style={styles.monthlyBadgeText}>Monthly</Text>
                        </View>
                    </View>

                    {/* Stacked Bar */}
                    <View style={styles.salaryBar}>
                        <View style={[styles.salaryBarSegment, { flex: 75, backgroundColor: '#137FEC' }]} />
                        <View style={[styles.salaryBarSegment, { flex: 10, backgroundColor: '#2DD4BF' }]} />
                        <View style={[styles.salaryBarSegment, { flex: 15, backgroundColor: '#F87171' }]} />
                    </View>

                    {/* Salary Breakdown */}
                    <View style={styles.salaryBreakdown}>
                        <View style={styles.salaryRow}>
                            <View style={styles.salaryRowLeft}>
                                <View style={[styles.salaryDot, { backgroundColor: '#137FEC' }]} />
                                <Text style={styles.salaryLabel}>Base Pay</Text>
                            </View>
                            <Text style={styles.salaryValue}>
                                ₹{((employee.basic_salary || 0) * 0.75).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.salaryRow}>
                            <View style={styles.salaryRowLeft}>
                                <View style={[styles.salaryDot, { backgroundColor: '#2DD4BF' }]} />
                                <Text style={styles.salaryLabel}>Allowances</Text>
                            </View>
                            <Text style={styles.salaryValue}>
                                ₹{((employee.basic_salary || 0) * 0.10).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.salaryRow}>
                            <View style={styles.salaryRowLeft}>
                                <View style={[styles.salaryDot, { backgroundColor: '#F87171' }]} />
                                <Text style={styles.salaryLabel}>Tax & Deductions</Text>
                            </View>
                            <Text style={[styles.salaryValue, { color: '#EF4444' }]}>
                                -₹{((employee.basic_salary || 0) * 0.15).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.salaryRow}>
                            <Text style={styles.netSalaryLabel}>Net Salary</Text>
                            <Text style={styles.netSalaryValue}>
                                ₹{(employee.basic_salary || 0).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F7F8',
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
    editButton: {
        paddingHorizontal: Spacing.sm,
    },
    editButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#137FEC',
    },
    scrollContent: {
        paddingBottom: Spacing['5xl'],
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: Spacing['2xl'],
        paddingHorizontal: Spacing.lg,
        backgroundColor: '#FFFFFF',
    },
    avatarContainer: {
        position: 'relative',
    },
    heroAvatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        ...Shadows.lg,
    },
    heroAvatarText: {
        fontSize: 36,
        fontWeight: Typography.weight.bold,
        color: Colors.primary[700],
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusInnerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
    },
    heroName: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        marginTop: Spacing.lg,
    },
    heroRole: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.md,
    },
    statusBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.xl,
        width: '100%',
        maxWidth: 320,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing.xs,
        padding: Spacing.md,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: Colors.border.light,
        ...Shadows.sm,
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    statsContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.lg,
    },
    statCard: {
        width: 160,
        padding: Spacing.lg,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: Colors.border.light,
        marginRight: Spacing.md,
        ...Shadows.sm,
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    statIconContainer: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    trendBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    trendText: {
        fontSize: 10,
        fontWeight: Typography.weight.bold,
    },
    statCardBody: {},
    statLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        fontWeight: Typography.weight.medium,
        marginBottom: 4,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    statSubValue: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        fontWeight: Typography.weight.normal,
    },
    progressContainer: {
        marginTop: Spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#137FEC',
        borderRadius: 3,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius['2xl'],
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border.light,
        ...Shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    cardTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    viewAllText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#137FEC',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        fontWeight: Typography.weight.medium,
    },
    infoValue: {
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
        fontWeight: Typography.weight.semibold,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: Spacing.sm,
    },
    shiftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        backgroundColor: '#F8FAFC',
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
    },
    shiftRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    shiftIcon: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    shiftTitle: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    shiftSubtitle: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    monthlyBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.lg,
    },
    monthlyBadgeText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.secondary,
    },
    salaryBar: {
        flexDirection: 'row',
        height: 16,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    salaryBarSegment: {
        height: '100%',
    },
    salaryBreakdown: {
        gap: Spacing.md,
    },
    salaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    salaryRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    salaryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    salaryLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    salaryValue: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    netSalaryLabel: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    netSalaryValue: {
        fontSize: Typography.size.xl,
        fontWeight: '800',
        color: '#137FEC',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.lg,
        padding: Spacing.xl,
    },
    errorText: {
        fontSize: Typography.size.base,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#137FEC',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    retryButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#FFFFFF',
    },
});
