// Premium Attendance Tracker Screen
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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { format, addDays, subDays } from 'date-fns';

interface Attendance {
    attendance_id: number;
    employee_id: number;
    employee_name?: string;
    first_name?: string;
    last_name?: string;
    position?: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    status: string;
    work_hours?: number;
    net_hours?: number;
}

const FILTER_CHIPS = ['All Status', 'On Time', 'Late In', 'Absent'];

export default function AttendanceScreen() {
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeFilter, setActiveFilter] = useState('All Status');
    const [error, setError] = useState<string | null>(null);

    const fetchAttendance = useCallback(async () => {
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await apiClient.attendance.list({ date: dateStr });
            const data = response.data?.items || response.data || [];
            setAttendanceRecords(Array.isArray(data) ? data : []);
        } catch (err: any) {
            // Silently handle - show empty state
            console.log('Attendance data unavailable');
            setAttendanceRecords([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAttendance();
    }, [fetchAttendance]);

    const navigateDate = (direction: 'prev' | 'next') => {
        setSelectedDate(prev =>
            direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1)
        );
    };

    const formatTime = (time: string | null) => {
        if (!time) return '--:--';
        try {
            const date = new Date(time);
            return format(date, 'hh:mm a');
        } catch {
            return time;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'present':
            case 'on_time': return { bg: '#D1FAE5', text: '#059669', border: '#10B981' };
            case 'late': return { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' };
            case 'absent': return { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' };
            case 'overtime': return { bg: '#E0E7FF', text: '#4F46E5', border: '#6366F1' };
            default: return { bg: '#F1F5F9', text: '#64748B', border: '#94A3B8' };
        }
    };

    const filteredRecords = attendanceRecords.filter(record => {
        let matchesFilter = true;
        if (activeFilter === 'On Time') matchesFilter = record.status?.toLowerCase() === 'present';
        if (activeFilter === 'Late In') matchesFilter = record.status?.toLowerCase() === 'late';
        if (activeFilter === 'Absent') matchesFilter = record.status?.toLowerCase() === 'absent';

        const matchesSearch = searchQuery.trim() === '' ||
            (record.employee_name || `${record.first_name} ${record.last_name}`)
                .toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Calculate stats
    const totalEmployees = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r =>
        r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'on_time'
    ).length;
    const lateCount = attendanceRecords.filter(r => r.status?.toLowerCase() === 'late').length;
    const absentCount = attendanceRecords.filter(r => r.status?.toLowerCase() === 'absent').length;

    if (isLoading) {
        return <Loading fullScreen text="Loading attendance..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance Tracker</Text>
                <TouchableOpacity style={styles.calendarButton}>
                    <Icon name="calendar" size={24} color={Colors.text.primary} />
                    <View style={styles.calendarBadge} />
                </TouchableOpacity>
            </View>

            {/* Date Selector */}
            <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.dateNavButton}>
                    <Icon name="chevron-left" size={24} color={Colors.text.tertiary} />
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateLabelText}>
                        {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(selectedDate, 'EEEE')}
                    </Text>
                    <Text style={styles.dateValueText}>{format(selectedDate, 'MMM dd, yyyy')}</Text>
                </View>
                <TouchableOpacity onPress={() => navigateDate('next')} style={styles.dateNavButton}>
                    <Icon name="chevron-right" size={24} color={Colors.text.tertiary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[1]}
                keyExtractor={() => 'content'}
                renderItem={() => (
                    <>
                        {/* Summary Cards */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.statsContainer}
                        >
                            <View style={styles.statCard}>
                                <View style={styles.statCardIcon}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#DBEAFE' }]}>
                                        <Icon name="users" size={18} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.statLabel}>Total</Text>
                                </View>
                                <Text style={styles.statValue}>{totalEmployees}</Text>
                                <Text style={styles.statSubtext}>Employees</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={styles.statCardIcon}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#D1FAE5' }]}>
                                        <Icon name="check-circle" size={18} color="#10B981" />
                                    </View>
                                    <Text style={styles.statLabel}>Present</Text>
                                </View>
                                <View style={styles.statValueRow}>
                                    <Text style={styles.statValue}>{presentCount}</Text>
                                    <View style={styles.trendBadge}>
                                        <Icon name="trending-up" size={12} color="#10B981" />
                                        <Text style={styles.trendText}>2%</Text>
                                    </View>
                                </View>
                                <Text style={styles.statSubtext}>On time</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={styles.statCardIcon}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#FEE2E2' }]}>
                                        <Icon name="x-circle" size={18} color="#EF4444" />
                                    </View>
                                    <Text style={styles.statLabel}>Absent</Text>
                                </View>
                                <View style={styles.statValueRow}>
                                    <Text style={styles.statValue}>{absentCount}</Text>
                                    <Text style={[styles.trendText, { color: '#EF4444' }]}>+1</Text>
                                </View>
                                <Text style={styles.statSubtext}>No Check-in</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={styles.statCardIcon}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
                                        <Icon name="clock" size={18} color="#F59E0B" />
                                    </View>
                                    <Text style={styles.statLabel}>Late</Text>
                                </View>
                                <View style={styles.statValueRow}>
                                    <Text style={styles.statValue}>{lateCount}</Text>
                                    <View style={[styles.trendBadge, { backgroundColor: '#FEF3C7' }]}>
                                        <Icon name="trending-up" size={12} color="#F59E0B" />
                                        <Text style={[styles.trendText, { color: '#F59E0B' }]}>1%</Text>
                                    </View>
                                </View>
                                <Text style={styles.statSubtext}>Late Arrival</Text>
                            </View>
                        </ScrollView>

                        {/* Search & Filter */}
                        <View style={styles.searchSection}>
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
                                    <Icon name="filter" size={20} color={Colors.text.secondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Filter Chips */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chipsContainer}
                            >
                                {FILTER_CHIPS.map((chip) => (
                                    <TouchableOpacity
                                        key={chip}
                                        style={[
                                            styles.chip,
                                            activeFilter === chip && styles.chipActive
                                        ]}
                                        onPress={() => setActiveFilter(chip)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            activeFilter === chip && styles.chipTextActive
                                        ]}>
                                            {chip}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Error State */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-triangle" size={20} color={Colors.error.main} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Attendance Cards */}
                        {filteredRecords.map((record) => {
                            const statusStyle = getStatusColor(record.status);
                            const employeeName = record.employee_name || `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Unknown';
                            const isAbsent = record.status?.toLowerCase() === 'absent';
                            const isLate = record.status?.toLowerCase() === 'late';
                            const isOvertime = record.status?.toLowerCase() === 'overtime';

                            return (
                                <View key={record.attendance_id} style={[styles.attendanceCard, isAbsent && styles.cardFaded]}>
                                    <View style={[styles.cardBorder, { backgroundColor: statusStyle.border }]} />

                                    <View style={styles.cardHeader}>
                                        <View style={styles.employeeInfo}>
                                            <View style={[styles.avatar, isAbsent && styles.avatarGrayscale]}>
                                                <Text style={styles.avatarText}>
                                                    {employeeName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.employeeName}>{employeeName}</Text>
                                                <Text style={styles.employeeRole}>{record.position || 'Employee'}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                                            </Text>
                                        </View>
                                    </View>

                                    {isAbsent ? (
                                        <View style={styles.absentBox}>
                                            <Icon name="alert-circle" size={14} color={Colors.text.tertiary} />
                                            <Text style={styles.absentText}>No punch-in recorded today</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.timeGrid}>
                                            <View style={styles.timeBox}>
                                                <Text style={styles.timeLabel}>CHECK IN</Text>
                                                <Text style={styles.timeValue}>{formatTime(record.check_in)}</Text>
                                                <Text style={[styles.timeStatus, isLate ? { color: '#EF4444' } : { color: '#10B981' }]}>
                                                    {isLate ? '+45m Late' : 'On time'}
                                                </Text>
                                            </View>
                                            <View style={styles.timeBox}>
                                                <Text style={styles.timeLabel}>CHECK OUT</Text>
                                                <Text style={styles.timeValue}>{formatTime(record.check_out)}</Text>
                                                {isOvertime && <Text style={[styles.timeStatus, { color: '#6366F1' }]}>Late Out</Text>}
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.cardFooter}>
                                        <View style={styles.netHoursRow}>
                                            <Icon name="clock" size={14} color={Colors.text.tertiary} />
                                            <Text style={styles.netHoursLabel}>Net: </Text>
                                            <Text style={styles.netHoursValue}>
                                                {record.work_hours ? `${record.work_hours}h` : '--'}
                                            </Text>
                                        </View>
                                        {isAbsent && (
                                            <TouchableOpacity>
                                                <Text style={styles.sendReminderText}>Send Reminder</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })}

                        {/* Empty State */}
                        {filteredRecords.length === 0 && !error && (
                            <View style={styles.emptyState}>
                                <Icon name="calendar" size={48} color={Colors.text.tertiary} />
                                <Text style={styles.emptyText}>No attendance records for this date</Text>
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

            {/* FAB */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                <Icon name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
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
    calendarButton: {
        padding: Spacing.sm,
        marginRight: -Spacing.sm,
        position: 'relative',
    },
    calendarBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
    dateNavButton: {
        padding: Spacing.xs,
    },
    dateDisplay: {
        alignItems: 'center',
    },
    dateLabelText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    dateValueText: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        marginTop: 2,
    },
    statsContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        gap: Spacing.md,
    },
    statCard: {
        width: 144,
        padding: Spacing.lg,
        backgroundColor: '#F8FAFC',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginRight: Spacing.md,
    },
    statCardIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    statIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.sm,
    },
    statValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    statSubtext: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    trendText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: '#10B981',
    },
    searchSection: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: '#FFFFFF',
    },
    searchRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
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
        backgroundColor: '#F1F5F9',
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipsContainer: {
        paddingTop: Spacing.md,
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: '#F1F5F9',
        marginRight: Spacing.sm,
    },
    chipActive: {
        backgroundColor: Colors.text.primary,
    },
    chipText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    attendanceCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cardFaded: {
        opacity: 0.9,
    },
    cardBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: Spacing.lg,
    },
    employeeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
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
    avatarGrayscale: {
        backgroundColor: '#E2E8F0',
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
    employeeRole: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
    },
    timeGrid: {
        flexDirection: 'row',
        gap: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    timeBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    timeValue: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    timeStatus: {
        fontSize: 10,
        fontWeight: Typography.weight.medium,
        marginTop: 2,
    },
    absentBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: '#F8FAFC',
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
    },
    absentText: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    netHoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    netHoursLabel: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    netHoursValue: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.bold,
        color: '#137FEC',
    },
    sendReminderText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: '#137FEC',
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
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#137FEC',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.lg,
    },
});
