// Dashboard screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Badge, Loading } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { DashboardStats } from '../../types';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onPress }) => (
    <Card style={styles.statCard} onPress={onPress}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
            <Icon name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
    </Card>
);

interface QuickActionProps {
    title: string;
    icon: string;
    onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
        <View style={styles.quickActionIcon}>
            <Icon name={icon} size={20} color={Colors.primary[600]} />
        </View>
        <Text style={styles.quickActionText}>{title}</Text>
        <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
);

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const response = await apiClient.dashboard.stats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Set default stats on error
            setStats({
                total_employees: 0,
                present_today: 0,
                on_leave_today: 0,
                pending_leaves: 0,
                pending_payroll: 0,
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, [fetchStats]);

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'admin': return 'Administrator';
            case 'hr': return 'HR Manager';
            case 'employee': return 'Employee';
            default: return 'User';
        }
    };

    if (isLoading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName}>{getRoleLabel()}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarContainer}>
                        <Icon name="user" size={24} color={Colors.text.inverse} />
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total Employees"
                        value={stats?.total_employees || 0}
                        icon="users"
                        color={Colors.primary[600]}
                        onPress={() => router.push('/(tabs)/employees')}
                    />
                    <StatCard
                        title="Present Today"
                        value={stats?.present_today || 0}
                        icon="check-circle"
                        color={Colors.success.main}
                        onPress={() => router.push('/(tabs)/attendance')}
                    />
                    <StatCard
                        title="On Leave"
                        value={stats?.on_leave_today || 0}
                        icon="calendar"
                        color={Colors.warning.main}
                        onPress={() => router.push('/(tabs)/leaves')}
                    />
                    <StatCard
                        title="Pending Leaves"
                        value={stats?.pending_leaves || 0}
                        icon="clock"
                        color={Colors.info.main}
                        onPress={() => router.push('/(tabs)/leaves')}
                    />
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <Card style={styles.quickActionsCard}>
                    <QuickAction
                        title="Manage Employees"
                        icon="users"
                        onPress={() => router.push('/(tabs)/employees')}
                    />
                    <View style={styles.divider} />
                    <QuickAction
                        title="View Attendance"
                        icon="calendar"
                        onPress={() => router.push('/(tabs)/attendance')}
                    />
                    <View style={styles.divider} />
                    <QuickAction
                        title="Leave Requests"
                        icon="calendar-check"
                        onPress={() => router.push('/(tabs)/leaves')}
                    />
                    <View style={styles.divider} />
                    <QuickAction
                        title="Process Payroll"
                        icon="wallet"
                        onPress={() => router.push('/(tabs)/payroll')}
                    />
                    <View style={styles.divider} />
                    <QuickAction
                        title="Shift Management"
                        icon="clock"
                        onPress={() => router.push('/(tabs)/shifts')}
                    />
                </Card>

                {/* Pending Approvals */}
                {(user?.role === 'admin' || user?.role === 'hr') && (stats?.pending_leaves || 0) > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Pending Approvals</Text>
                        <Card
                            style={styles.alertCard}
                            onPress={() => router.push('/(tabs)/leaves')}
                        >
                            <View style={styles.alertContent}>
                                <View style={[styles.alertIcon, { backgroundColor: Colors.warning.light }]}>
                                    <Icon name="warning" size={20} color={Colors.warning.main} />
                                </View>
                                <View style={styles.alertText}>
                                    <Text style={styles.alertTitle}>
                                        {stats?.pending_leaves} Leave Request{(stats?.pending_leaves || 0) > 1 ? 's' : ''} Pending
                                    </Text>
                                    <Text style={styles.alertSubtitle}>Tap to review and approve</Text>
                                </View>
                                <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                            </View>
                        </Card>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing['5xl'],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    greeting: {
        fontSize: Typography.size.base,
        color: Colors.text.secondary,
    },
    userName: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
        marginTop: Spacing.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    statCard: {
        width: '48%',
        padding: Spacing.lg,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    statValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    statTitle: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    quickActionsCard: {
        padding: 0,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    quickActionIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionText: {
        flex: 1,
        fontSize: Typography.size.base,
        color: Colors.text.primary,
        fontWeight: Typography.weight.medium,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.light,
        marginHorizontal: Spacing.lg,
    },
    alertCard: {
        padding: 0,
    },
    alertContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertText: {
        flex: 1,
    },
    alertTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    alertSubtitle: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
});
