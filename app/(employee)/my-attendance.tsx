// My Attendance Screen - Premium Timeline Design
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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Attendance } from '../../types';

export default function MyAttendanceScreen() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const fetchAttendance = useCallback(async () => {
        if (!user?.employee_id) {
            setIsLoading(false);
            setRefreshing(false);
            return;
        }

        setError(null);

        try {
            const response = await apiClient.attendance.list({
                employee_id: user.employee_id,
            });

            // Safely handle response data
            const rawRecords = response?.data;
            const records: Attendance[] = Array.isArray(rawRecords) ? rawRecords : [];

            // Sort by date descending with safe date parsing
            records.sort((a: Attendance, b: Attendance) => {
                const dateA = a?.date ? new Date(a.date).getTime() : 0;
                const dateB = b?.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
            });

            setAttendanceRecords(records);
        } catch (err: any) {
            console.log('Error fetching attendance:', err?.response?.status || err.message);
            // Only show error for non-404 responses
            if (err?.response?.status === 404) {
                setAttendanceRecords([]);
            } else {
                setError('Unable to load attendance records. Pull to refresh.');
                setAttendanceRecords([]);
            }
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
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'present':
                return {
                    label: 'Present',
                    color: '#10B981',
                    bgColor: '#ECFDF5',
                    icon: 'check-circle'
                };
            case 'late':
                return {
                    label: 'Late',
                    color: '#F59E0B',
                    bgColor: '#FFFBEB',
                    icon: 'clock'
                };
            case 'absent':
                return {
                    label: 'Absent',
                    color: '#EF4444',
                    bgColor: '#FEF2F2',
                    icon: 'x-circle'
                };
            case 'half_day':
                return {
                    label: 'Half Day',
                    color: '#8B5CF6',
                    bgColor: '#F5F3FF',
                    icon: 'clock'
                };
            case 'leave':
                return {
                    label: 'On Leave',
                    color: '#6366F1',
                    bgColor: '#EEF2FF',
                    icon: 'calendar'
                };
            default:
                return {
                    label: status,
                    color: Colors.text.tertiary,
                    bgColor: '#F1F5F9',
                    icon: 'help-circle'
                };
        }
    };

    const calculateWorkHours = (record: Attendance) => {
        if (record.work_hours) {
            const h = Math.floor(record.work_hours);
            const m = Math.round((record.work_hours - h) * 60);
            return `${h}h ${m.toString().padStart(2, '0')}m`;
        }
        return '--:--';
    };

    // Calculate summary stats
    const summary = {
        present: attendanceRecords.filter(r => r.status === 'present').length,
        late: attendanceRecords.filter(r => r.status === 'late').length,
        absent: attendanceRecords.filter(r => r.status === 'absent').length,
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Attendance History</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Icon name="filter" size={20} color={Colors.primary[600]} />
                </TouchableOpacity>
            </View>

            {/* Month Selector */}
            <View style={styles.monthSelectorContainer}>
                <View style={styles.monthSelector}>
                    <TouchableOpacity style={styles.monthArrow} onPress={() => changeMonth(-1)}>
                        <Icon name="chevron-left" size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.monthDisplay}>
                        <Text style={styles.monthText}>{monthName}</Text>
                        <Icon name="chevron-down" size={16} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.monthArrow} onPress={() => changeMonth(1)}>
                        <Icon name="chevron-right" size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Stats */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Icon name="check-circle" size={18} color="#10B981" />
                        </View>
                        <Text style={styles.statValue}>{summary.present}</Text>
                        <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
                            <Icon name="clock" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.statValue}>{summary.late}</Text>
                        <Text style={styles.statLabel}>Late</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FEF2F2' }]}>
                            <Icon name="x-circle" size={18} color="#EF4444" />
                        </View>
                        <Text style={styles.statValue}>{summary.absent}</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.timeline}>
                    {attendanceRecords.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon name="calendar" size={48} color={Colors.text.tertiary} />
                            <Text style={styles.emptyText}>No attendance records found</Text>
                        </View>
                    ) : (
                        attendanceRecords.map((record, index) => {
                            const config = getStatusConfig(record.status);
                            const isLast = index === attendanceRecords.length - 1;

                            return (
                                <View key={record.attendance_id} style={styles.timelineItem}>
                                    {/* Timeline connector */}
                                    <View style={styles.timelineConnector}>
                                        <View style={styles.timelineDot} />
                                        {!isLast && <View style={styles.timelineLine} />}
                                    </View>

                                    {/* Content */}
                                    <View style={styles.timelineContent}>
                                        {/* Date Header */}
                                        <Text style={styles.recordDate}>{formatDate(record.date)}</Text>

                                        {/* Record Card */}
                                        <View style={[
                                            styles.recordCard,
                                            record.status === 'absent' && styles.recordCardAbsent
                                        ]}>
                                            {/* Status & Hours */}
                                            <View style={styles.recordHeader}>
                                                <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
                                                    <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                                                    <Text style={[styles.statusText, { color: config.color }]}>
                                                        {config.label}
                                                    </Text>
                                                </View>
                                                {record.status !== 'absent' && (
                                                    <View style={styles.hoursDisplay}>
                                                        <Icon name="clock" size={12} color={Colors.text.tertiary} />
                                                        <Text style={styles.hoursText}>
                                                            {calculateWorkHours(record)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Check In/Out Times */}
                                            {record.status !== 'absent' ? (
                                                <View style={styles.timesGrid}>
                                                    <View style={styles.timeBlock}>
                                                        <Text style={styles.timeLabel}>CHECK IN</Text>
                                                        <Text style={styles.timeValue}>
                                                            {formatTime(record.check_in)}
                                                        </Text>
                                                        <Text style={[
                                                            styles.timeNote,
                                                            record.status === 'late' && styles.timeNoteLate
                                                        ]}>
                                                            {record.status === 'late' ? 'Late' : 'On time'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.timeBlock}>
                                                        <Text style={styles.timeLabel}>CHECK OUT</Text>
                                                        <Text style={styles.timeValue}>
                                                            {formatTime(record.check_out)}
                                                        </Text>
                                                        <Text style={styles.timeNote}>Office HQ</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View style={styles.absentContent}>
                                                    <Icon name="alert-triangle" size={20} color="#EF4444" />
                                                    <Text style={styles.absentText}>
                                                        No check-in record found for this date.
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f7f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthSelectorContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 8,
    },
    monthArrow: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        ...Shadows.sm,
    },
    monthDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    monthText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        gap: 6,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.text.tertiary,
    },
    timeline: {
        gap: 0,
    },
    timelineItem: {
        flexDirection: 'row',
        gap: 12,
    },
    timelineConnector: {
        width: 16,
        alignItems: 'center',
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#cbd5e1',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 1,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#e2e8f0',
        marginTop: -2,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 20,
    },
    recordDate: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 10,
    },
    recordCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    recordCardAbsent: {
        backgroundColor: '#FEF2F2',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    hoursDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    hoursText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    timesGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    timeBlock: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    timeNote: {
        fontSize: 11,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    timeNoteLate: {
        color: '#EF4444',
        fontWeight: '500',
    },
    absentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    absentText: {
        flex: 1,
        fontSize: 13,
        color: '#991B1B',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.tertiary,
    },
});
