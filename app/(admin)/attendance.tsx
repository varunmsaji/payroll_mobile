// Attendance screen
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
import { Card, Badge, getStatusVariant, Loading, Modal } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { Attendance } from '../../types';
import { format, subDays, addDays } from 'date-fns';

export default function AttendanceScreen() {
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);

    const fetchAttendance = useCallback(async (date: Date) => {
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const response = await apiClient.attendance.list({ date: dateStr });
            setAttendance(response.data.items || response.data || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setAttendance([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendance(selectedDate);
    }, [selectedDate, fetchAttendance]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAttendance(selectedDate);
        setRefreshing(false);
    }, [selectedDate, fetchAttendance]);

    const handlePrevDay = () => {
        setSelectedDate(prev => subDays(prev, 1));
    };

    const handleNextDay = () => {
        const tomorrow = addDays(new Date(), 1);
        if (addDays(selectedDate, 1) <= tomorrow) {
            setSelectedDate(prev => addDays(prev, 1));
        }
    };

    const renderAttendance = ({ item }: { item: Attendance }) => (
        <Card style={styles.attendanceCard} onPress={() => setSelectedRecord(item)}>
            <View style={styles.attendanceRow}>
                <View style={styles.avatar}>
                    <Icon name="user" size={20} color={Colors.primary[600]} />
                </View>
                <View style={styles.attendanceInfo}>
                    <Text style={styles.employeeName}>{item.employee_name || `Employee ${item.employee_id}`}</Text>
                    <View style={styles.timeRow}>
                        <Icon name="clock" size={14} color={Colors.text.tertiary} />
                        <Text style={styles.timeText}>
                            {item.check_in || '--:--'} - {item.check_out || '--:--'}
                        </Text>
                    </View>
                </View>
                <Badge
                    text={item.status.replace('_', ' ')}
                    variant={getStatusVariant(item.status)}
                    size="sm"
                />
            </View>
        </Card>
    );

    if (isLoading) {
        return <Loading fullScreen text="Loading attendance..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Attendance</Text>
            </View>

            {/* Date Selector */}
            <View style={styles.dateSelector}>
                <TouchableOpacity onPress={handlePrevDay} style={styles.dateArrow}>
                    <Icon name="chevron-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateText}>{format(selectedDate, 'EEEE')}</Text>
                    <Text style={styles.dateSubtext}>{format(selectedDate, 'MMM dd, yyyy')}</Text>
                </View>
                <TouchableOpacity onPress={handleNextDay} style={styles.dateArrow}>
                    <Icon name="chevron-right" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsSummary}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.success.main }]}>
                        {attendance.filter(a => a.status === 'present').length}
                    </Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.error.main }]}>
                        {attendance.filter(a => a.status === 'absent').length}
                    </Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.warning.main }]}>
                        {attendance.filter(a => a.status === 'late').length}
                    </Text>
                    <Text style={styles.statLabel}>Late</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.info.main }]}>
                        {attendance.filter(a => a.status === 'leave').length}
                    </Text>
                    <Text style={styles.statLabel}>Leave</Text>
                </View>
            </View>

            {/* Attendance List */}
            <FlatList
                data={attendance}
                keyExtractor={(item) => item.attendance_id.toString()}
                renderItem={renderAttendance}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="calendar" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No attendance records for this date</Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            <Modal
                visible={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                title="Attendance Details"
            >
                {selectedRecord && (
                    <View style={styles.modalContent}>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Employee</Text>
                            <Text style={styles.modalValue}>
                                {selectedRecord.employee_name || `Employee ${selectedRecord.employee_id}`}
                            </Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Status</Text>
                            <Badge
                                text={selectedRecord.status.replace('_', ' ')}
                                variant={getStatusVariant(selectedRecord.status)}
                            />
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Check In</Text>
                            <Text style={styles.modalValue}>{selectedRecord.check_in || 'Not recorded'}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Check Out</Text>
                            <Text style={styles.modalValue}>{selectedRecord.check_out || 'Not recorded'}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Work Hours</Text>
                            <Text style={styles.modalValue}>{selectedRecord.work_hours?.toFixed(1) || '0'} hrs</Text>
                        </View>
                        {selectedRecord.overtime_hours && selectedRecord.overtime_hours > 0 && (
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Overtime</Text>
                                <Text style={styles.modalValue}>{selectedRecord.overtime_hours.toFixed(1)} hrs</Text>
                            </View>
                        )}
                        {selectedRecord.notes && (
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Notes</Text>
                                <Text style={styles.modalValue}>{selectedRecord.notes}</Text>
                            </View>
                        )}
                    </View>
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
    dateSelector: {
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
    dateArrow: {
        padding: Spacing.sm,
    },
    dateDisplay: {
        alignItems: 'center',
    },
    dateText: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    dateSubtext: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    statsSummary: {
        flexDirection: 'row',
        backgroundColor: Colors.background.primary,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
    },
    statLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
        gap: Spacing.md,
        paddingBottom: Spacing['5xl'],
    },
    attendanceCard: {
        padding: Spacing.md,
    },
    attendanceRow: {
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
    attendanceInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: 4,
    },
    timeText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
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
        gap: Spacing.lg,
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
});
