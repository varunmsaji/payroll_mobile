// My Attendance Screen - Employee's own attendance history
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
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Attendance } from '../../types';

export default function MyAttendanceScreen() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const fetchAttendance = useCallback(async () => {
        if (!user?.employee_id) return;

        try {
            const response = await apiClient.attendance.list({
                employee_id: user.employee_id,
            });
            setAttendanceRecords(response.data || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAttendance();
    }, [fetchAttendance]);

    const formatTime = (timeString?: string) => {
        if (!timeString) return '--:--';
        return new Date(timeString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present':
                return Colors.accent.green;
            case 'late':
                return Colors.accent.orange;
            case 'absent':
                return Colors.accent.red;
            case 'half_day':
                return Colors.accent.yellow;
            case 'leave':
                return Colors.primary[600];
            default:
                return Colors.text.tertiary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'present':
                return 'Present';
            case 'late':
                return 'Late';
            case 'absent':
                return 'Absent';
            case 'half_day':
                return 'Half Day';
            case 'leave':
                return 'On Leave';
            default:
                return status;
        }
    };

    // Calculate summary stats
    const summary = {
        present: attendanceRecords.filter(r => r.status === 'present').length,
        late: attendanceRecords.filter(r => r.status === 'late').length,
        absent: attendanceRecords.filter(r => r.status === 'absent').length,
        onLeave: attendanceRecords.filter(r => r.status === 'leave').length,
        totalHours: attendanceRecords.reduce((sum, r) => sum + (r.work_hours || 0), 0),
    };

    const changeMonth = (direction: number) => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedMonth(newDate);
    };

    const monthName = selectedMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Attendance</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Month Selector */}
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={() => changeMonth(-1)}>
                        <Icon name="chevron-left" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.monthText}>{monthName}</Text>
                    <TouchableOpacity onPress={() => changeMonth(1)}>
                        <Icon name="chevron-right" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryCount, { color: Colors.accent.green }]}>
                                {summary.present}
                            </Text>
                            <Text style={styles.summaryLabel}>Present</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryCount, { color: Colors.accent.orange }]}>
                                {summary.late}
                            </Text>
                            <Text style={styles.summaryLabel}>Late</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryCount, { color: Colors.accent.red }]}>
                                {summary.absent}
                            </Text>
                            <Text style={styles.summaryLabel}>Absent</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryCount, { color: Colors.primary[600] }]}>
                                {summary.totalHours.toFixed(1)}h
                            </Text>
                            <Text style={styles.summaryLabel}>Hours</Text>
                        </View>
                    </View>
                </View>

                {/* Attendance Records */}
                <View style={styles.recordsCard}>
                    <Text style={styles.sectionTitle}>Attendance History</Text>
                    {attendanceRecords.length === 0 ? (
                        <Text style={styles.emptyText}>No attendance records found</Text>
                    ) : (
                        attendanceRecords.map((record) => (
                            <View key={record.attendance_id} style={styles.recordItem}>
                                <View style={styles.recordDate}>
                                    <Text style={styles.recordDateText}>
                                        {formatDate(record.date)}
                                    </Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(record.status) + '20' }
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: getStatusColor(record.status) }
                                            ]}
                                        >
                                            {getStatusLabel(record.status)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.recordTimes}>
                                    <View style={styles.timeItem}>
                                        <Text style={styles.timeLabel}>In</Text>
                                        <Text style={styles.timeValue}>
                                            {formatTime(record.check_in)}
                                        </Text>
                                    </View>
                                    <View style={styles.timeItem}>
                                        <Text style={styles.timeLabel}>Out</Text>
                                        <Text style={styles.timeValue}>
                                            {formatTime(record.check_out)}
                                        </Text>
                                    </View>
                                    <View style={styles.timeItem}>
                                        <Text style={styles.timeLabel}>Hours</Text>
                                        <Text style={styles.timeValue}>
                                            {record.work_hours?.toFixed(1) || '0.0'}h
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
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
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
    },
    monthText: {
        fontSize: Typography.size.md,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    summaryCard: {
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
    sectionTitle: {
        fontSize: Typography.size.md,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryCount: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
    },
    summaryLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    recordsCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyText: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        textAlign: 'center',
        paddingVertical: Spacing.lg,
    },
    recordItem: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    recordDate: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    recordDateText: {
        fontSize: Typography.size.sm,
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
    recordTimes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeItem: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
    },
    timeValue: {
        fontSize: Typography.size.sm,
        fontWeight: '500',
        color: Colors.text.primary,
        marginTop: 2,
    },
});
