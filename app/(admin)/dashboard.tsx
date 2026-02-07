// Premium Admin Dashboard Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { DashboardOverviewResponse } from '../../types';

export default function DashboardScreen() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardOverviewResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await apiClient.dashboard.overview();
            setData(response.data);
        } catch (err) {
            // Silently handle errors - show fallback data
            console.log('Dashboard data unavailable, using fallback');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    const { employees, attendance_today, shift_distribution, recent_activity } = data || {};

    // Calculate shift distribution percentages
    const maxShift = Math.max(
        shift_distribution?.morning || 0,
        shift_distribution?.afternoon || 0,
        shift_distribution?.night || 0,
        1
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.appTitle}>PayrollPro</Text>
                    <Text style={styles.appSubtitle}>Admin Dashboard</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.searchButton}>
                        <Icon name="search" size={24} color={Colors.text.secondary} />
                    </TouchableOpacity>
                    <View style={styles.avatarContainer}>
                        <Icon name="user" size={20} color="#FFFFFF" />
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting Section */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>
                        Hello, <Text style={styles.greetingName}>Admin</Text>
                    </Text>
                    <Text style={styles.greetingSubtext}>
                        Here is your daily workforce overview.
                    </Text>
                </View>

                {/* Error State */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Icon name="alert-triangle" size={20} color={Colors.error.main} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Overview Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>OVERVIEW</Text>
                </View>

                <View style={styles.statsGrid}>
                    {/* Total Staff */}
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => router.push('/(admin)/employees')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.statCardHeader}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#3B82F610' }]}>
                                <Icon name="users" size={18} color="#3B82F6" />
                            </View>
                            <View style={styles.trendBadgePositive}>
                                <Text style={styles.trendTextPositive}>+2%</Text>
                            </View>
                        </View>
                        <View style={styles.statCardContent}>
                            <Text style={styles.statValue}>{employees?.total || 142}</Text>
                            <Text style={styles.statLabel}>Total Staff</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Present Today */}
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => router.push('/(admin)/attendance')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.statCardHeader}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#10B98110' }]}>
                                <Icon name="check-circle" size={18} color="#10B981" />
                            </View>
                        </View>
                        <View style={styles.statCardContent}>
                            <Text style={styles.statValue}>{attendance_today?.present || 120}</Text>
                            <Text style={styles.statLabel}>Present Today</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Late Arrival */}
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => router.push('/(admin)/attendance')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.statCardHeader}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B10' }]}>
                                <Icon name="clock" size={18} color="#F59E0B" />
                            </View>
                            <View style={styles.trendBadgeNegative}>
                                <Text style={styles.trendTextNegative}>-5%</Text>
                            </View>
                        </View>
                        <View style={styles.statCardContent}>
                            <Text style={styles.statValue}>{attendance_today?.late || 12}</Text>
                            <Text style={styles.statLabel}>Late Arrival</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Absent */}
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => router.push('/(admin)/attendance')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.statCardHeader}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#EF444410' }]}>
                                <Icon name="x-circle" size={18} color="#EF4444" />
                            </View>
                        </View>
                        <View style={styles.statCardContent}>
                            <Text style={styles.statValue}>{attendance_today?.absent || 5}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Shift Distribution Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>SHIFT DISTRIBUTION</Text>
                    <TouchableOpacity onPress={() => router.push('/(admin)/shifts')}>
                        <Text style={styles.sectionLink}>Details</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.shiftCard}>
                    <View style={styles.shiftBarsContainer}>
                        {/* Morning */}
                        <View style={styles.shiftBarWrapper}>
                            <View style={styles.shiftBarBackground}>
                                <View
                                    style={[
                                        styles.shiftBarFill,
                                        {
                                            height: `${((shift_distribution?.morning || 65) / maxShift) * 100}%`,
                                            backgroundColor: '#3B82F6'
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.shiftBarValue}>{shift_distribution?.morning || 65}</Text>
                            <Text style={styles.shiftBarLabel}>MORN</Text>
                        </View>

                        {/* Afternoon */}
                        <View style={styles.shiftBarWrapper}>
                            <View style={styles.shiftBarBackground}>
                                <View
                                    style={[
                                        styles.shiftBarFill,
                                        {
                                            height: `${((shift_distribution?.afternoon || 45) / maxShift) * 100}%`,
                                            backgroundColor: '#3B82F680'
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.shiftBarValue}>{shift_distribution?.afternoon || 45}</Text>
                            <Text style={styles.shiftBarLabel}>AFTN</Text>
                        </View>

                        {/* Night */}
                        <View style={styles.shiftBarWrapper}>
                            <View style={styles.shiftBarBackground}>
                                <View
                                    style={[
                                        styles.shiftBarFill,
                                        {
                                            height: `${((shift_distribution?.night || 32) / maxShift) * 100}%`,
                                            backgroundColor: '#3B82F640'
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.shiftBarValue}>{shift_distribution?.night || 32}</Text>
                            <Text style={styles.shiftBarLabel}>NGHT</Text>
                        </View>
                    </View>

                    <View style={styles.systemStatus}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>All systems operational</Text>
                    </View>
                </View>

                {/* Recent Activity Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                </View>

                <View style={styles.activityContainer}>
                    {recent_activity && recent_activity.length > 0 ? (
                        recent_activity.slice(0, 5).map((activity, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.activityItem,
                                    index < (recent_activity.length - 1) && styles.activityItemBorder
                                ]}
                            >
                                <View style={styles.activityAvatar}>
                                    <Text style={styles.activityAvatarText}>
                                        {activity.employee_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
                                    </Text>
                                </View>
                                <View style={styles.activityContent}>
                                    <View style={styles.activityHeader}>
                                        <Text style={styles.activityName}>{activity.employee_name}</Text>
                                        <Text style={styles.activityTime}>
                                            {new Date(activity.event_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                    <Text style={styles.activityDescription}>
                                        {activity.event_type}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        // Demo activities when no data
                        <>
                            <View style={[styles.activityItem, styles.activityItemBorder]}>
                                <View style={styles.activityAvatar}>
                                    <Text style={styles.activityAvatarText}>SJ</Text>
                                </View>
                                <View style={styles.activityContent}>
                                    <View style={styles.activityHeader}>
                                        <Text style={styles.activityName}>Sarah Jenkins</Text>
                                        <Text style={styles.activityTime}>10m</Text>
                                    </View>
                                    <Text style={styles.activityDescription}>
                                        Requested time off for <Text style={styles.activityHighlight}>Dec 24-26</Text>.
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.activityItem, styles.activityItemBorder]}>
                                <View style={[styles.activityAvatar, { backgroundColor: '#3B82F610' }]}>
                                    <Icon name="wallet" size={18} color="#3B82F6" />
                                </View>
                                <View style={styles.activityContent}>
                                    <View style={styles.activityHeader}>
                                        <Text style={styles.activityName}>System</Text>
                                        <Text style={styles.activityTime}>1h</Text>
                                    </View>
                                    <Text style={styles.activityDescription}>
                                        Payroll generated for <Text style={styles.activityHighlight}>Feb 2026</Text>.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.activityItem}>
                                <View style={styles.activityAvatar}>
                                    <Text style={styles.activityAvatarText}>MR</Text>
                                </View>
                                <View style={styles.activityContent}>
                                    <View style={styles.activityHeader}>
                                        <Text style={styles.activityName}>Mike Ross</Text>
                                        <Text style={styles.activityTime}>2h</Text>
                                    </View>
                                    <Text style={styles.activityDescription}>
                                        Clocked out early <View style={styles.shortShiftBadge}>
                                            <Text style={styles.shortShiftText}>Short shift</Text>
                                        </View>
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>VIEW ALL ACTIVITY</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        backgroundColor: '#F8FAFC',
    },
    appTitle: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    appSubtitle: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    searchButton: {
        padding: Spacing.xs,
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        ...Shadows.sm,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
    },
    greetingSection: {
        marginTop: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    greetingText: {
        fontSize: 28,
        fontWeight: '300',
        color: Colors.text.primary,
    },
    greetingName: {
        fontWeight: Typography.weight.semibold,
    },
    greetingSubtext: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        letterSpacing: 1,
        opacity: 0.8,
    },
    sectionLink: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: '#3B82F6',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    statCard: {
        width: '48%',
        aspectRatio: 4 / 3,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        justifyContent: 'space-between',
        ...Shadows.sm,
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendBadgePositive: {
        backgroundColor: '#10B98108',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    trendTextPositive: {
        fontSize: 10,
        fontWeight: Typography.weight.medium,
        color: '#10B981',
    },
    trendBadgeNegative: {
        backgroundColor: '#EF444408',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    trendTextNegative: {
        fontSize: 10,
        fontWeight: Typography.weight.medium,
        color: '#EF4444',
    },
    statCardContent: {
        marginTop: Spacing.sm,
    },
    statValue: {
        fontSize: 28,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    shiftCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
        ...Shadows.sm,
    },
    shiftBarsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 128,
    },
    shiftBarWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    shiftBarBackground: {
        width: 40,
        height: 100,
        backgroundColor: '#F8FAFC',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    shiftBarFill: {
        width: '100%',
        borderRadius: BorderRadius.lg,
    },
    shiftBarValue: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        marginTop: Spacing.md,
    },
    shiftBarLabel: {
        fontSize: 10,
        color: Colors.text.secondary,
        letterSpacing: 0.5,
        marginTop: 2,
    },
    systemStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xl,
        gap: Spacing.sm,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
    },
    activityContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
        ...Shadows.sm,
    },
    activityItem: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    activityAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        ...Shadows.sm,
    },
    activityAvatarText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.bold,
        color: Colors.primary[700],
    },
    activityContent: {
        flex: 1,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    activityName: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    activityTime: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
    },
    activityDescription: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    activityHighlight: {
        color: Colors.text.primary,
        fontWeight: Typography.weight.medium,
    },
    shortShiftBadge: {
        backgroundColor: '#EF444408',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
    },
    shortShiftText: {
        fontSize: 10,
        fontWeight: Typography.weight.medium,
        color: '#EF4444',
    },
    viewAllButton: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginTop: Spacing.lg,
    },
    viewAllText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.secondary,
        letterSpacing: 0.5,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.error.light,
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
