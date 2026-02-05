// Attendance Reconciliation screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Badge, getStatusVariant, Loading, Button, Toast } from '../../../components/ui';
import { Icon } from '../../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { apiClient } from '../../../lib/api';
import { Attendance } from '../../../types';
import { format, subDays, addDays } from 'date-fns';

export default function AttendanceReconciliationScreen() {
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
                <Text style={styles.title}>Reconciliation</Text>
                <View style={{ width: 40 }} />
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

            {/* Info Card */}
            <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Icon name="info" size={20} color={Colors.info.main} />
                    <Text style={styles.infoText}>
                        Tap on an employee to edit their attendance record for this date.
                    </Text>
                </View>
            </Card>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {attendance.map((record) => (
                    <Card key={record.attendance_id} style={styles.attendanceCard}>
                        <View style={styles.attendanceRow}>
                            <View style={styles.avatar}>
                                <Icon name="user" size={20} color={Colors.primary[600]} />
                            </View>
                            <View style={styles.attendanceInfo}>
                                <Text style={styles.employeeName}>
                                    {record.employee_name || `Employee ${record.employee_id}`}
                                </Text>
                                <View style={styles.timeRow}>
                                    <Text style={styles.timeText}>
                                        {record.check_in || '--:--'} - {record.check_out || '--:--'}
                                    </Text>
                                </View>
                            </View>
                            <Badge
                                text={record.status.replace('_', ' ')}
                                variant={getStatusVariant(record.status)}
                                size="sm"
                            />
                        </View>
                        <View style={styles.editHint}>
                            <Icon name="edit" size={14} color={Colors.text.tertiary} />
                            <Text style={styles.editHintText}>Tap to edit</Text>
                        </View>
                    </Card>
                ))}

                {attendance.length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="calendar" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No attendance records for this date</Text>
                    </View>
                )}
            </ScrollView>

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
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    title: {
        flex: 1,
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        textAlign: 'center',
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
    infoCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.info.light,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: Typography.size.sm,
        color: Colors.info.dark,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingTop: 0,
        gap: Spacing.md,
        paddingBottom: Spacing['5xl'],
    },
    attendanceCard: {
        padding: Spacing.lg,
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
    editHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
    },
    editHintText: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
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
});
