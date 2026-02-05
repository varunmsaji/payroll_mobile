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
import { DashboardOverviewResponse } from '../../types';

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
    const [data, setData] = useState<DashboardOverviewResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const response = await apiClient.dashboard.overview();
            setData(response.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

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

    const { employees, attendance_today, overtime_today_hours, shift_distribution, recent_activity } = data || {};

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
                        <Text style={styles.date}>{new Date().toDateString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarContainer}>
                        <Icon name="user" size={24} color={Colors.text.inverse} />
                    </TouchableOpacity>
                </View>

                {/* Employee Stats */}
                <Text style={styles.sectionTitle}>Employee Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total Employees"
                        value={employees?.total || 0}
                        icon="users"
                        color={Colors.primary[600]}
                        onPress={() => router.push('/(tabs)/employees')}
                    />
                    <StatCard
                        title="Active Now"
                        value={employees?.active || 0}
                        icon="user-check"
                        color={Colors.success.main}
                    />
                </View>

                {/* Attendance Today */}
                <Text style={styles.sectionTitle}>Attendance Today</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Present"
                        value={attendance_today?.present || 0}
                        icon="check-circle"
                        color={Colors.success.main}
                        onPress={() => router.push('/(tabs)/attendance')}
                    />
                    <StatCard
                        title="Absent"
                        value={attendance_today?.absent || 0}
                        icon="x-circle"
                        color={Colors.error.main}
                        onPress={() => router.push('/(tabs)/attendance')}
                    />
                    <StatCard
                        title="Late"
                        value={attendance_today?.late || 0}
                        icon="clock"
                        color={Colors.warning.main}
                    />
                    <StatCard
                        title="Overtime (Hrs)"
                        value={overtime_today_hours || 0}
                        icon="briefcase"
                        color={Colors.info.main}
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
                        title="Shift Management"
                        icon="clock"
                        onPress={() => router.push('/(tabs)/shifts')}
                    />
                </Card>

                {/* Recent Activity */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Card style={styles.activityCard}>
                    {recent_activity?.length === 0 ? (
                        <Text style={styles.emptyText}>No recent activity</Text>
                    ) : (
                        recent_activity?.map((activity, index) => (
                            <View key={index}>
                                <View style={styles.activityItem}>
                                    <View style={styles.activityIcon}>
                                        <Icon name="clock" size={16} color={Colors.primary[600]} />
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityTitle}>{activity.employee_name}</Text>
                                        <Text style={styles.activitySubtitle}>
                                            {activity.event_type} • {new Date(activity.event_time).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                </View>
                                {index < recent_activity.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))
                    )}
                </Card>
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
    date: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    activityCard: {
        padding: 0,
    },
    activityItem: {
        flexDirection: 'row',
        padding: Spacing.lg,
        alignItems: 'center',
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    activitySubtitle: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    emptyText: {
        padding: Spacing.lg,
        textAlign: 'center',
        color: Colors.text.secondary,
    },
});
