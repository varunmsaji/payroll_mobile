// My Shift Screen - View assigned shift details
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ShiftAssignment, Shift } from '../../types';

export default function MyShiftScreen() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignment, setAssignment] = useState<ShiftAssignment | null>(null);
    const [shiftDetails, setShiftDetails] = useState<Shift | null>(null);

    const fetchShiftData = useCallback(async () => {
        if (!user?.employee_id) return;

        try {
            // Get current shift assignment
            const assignmentRes = await apiClient.shifts.assignments.list({
                employee_id: user.employee_id,
            });

            const currentAssignment = assignmentRes.data?.find(
                (a: ShiftAssignment) => a.status === 'active'
            );

            if (currentAssignment) {
                setAssignment(currentAssignment);

                // Get shift details
                const shiftRes = await apiClient.shifts.get(currentAssignment.shift_id);
                setShiftDetails(shiftRes.data);
            }
        } catch (error) {
            console.error('Error fetching shift data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        fetchShiftData();
    }, [fetchShiftData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchShiftData();
    }, [fetchShiftData]);

    const formatTime = (timeString?: string) => {
        if (!timeString) return '--:--';
        // Handle HH:MM:SS format
        const parts = timeString.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parts[1];
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes} ${period}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const calculateShiftDuration = () => {
        if (!shiftDetails?.start_time || !shiftDetails?.end_time) return 'N/A';

        const startParts = shiftDetails.start_time.split(':');
        const endParts = shiftDetails.end_time.split(':');

        let startHours = parseInt(startParts[0]);
        let endHours = parseInt(endParts[0]);

        if (shiftDetails.is_overnight && endHours < startHours) {
            endHours += 24;
        }

        const duration = endHours - startHours;
        return `${duration} hours`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Shift</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {!assignment ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="clock" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No shift assigned</Text>
                        <Text style={styles.emptySubtext}>
                            Contact HR to get a shift assigned
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Current Shift Card */}
                        <View style={styles.shiftCard}>
                            <View style={styles.shiftHeader}>
                                <Icon name="clock" size={24} color={Colors.primary[600]} />
                                <Text style={styles.shiftName}>
                                    {assignment.shift_name || 'Regular Shift'}
                                </Text>
                            </View>

                            <View style={styles.timingsContainer}>
                                <View style={styles.timingItem}>
                                    <Text style={styles.timingLabel}>Start Time</Text>
                                    <Text style={styles.timingValue}>
                                        {formatTime(shiftDetails?.start_time)}
                                    </Text>
                                </View>
                                <View style={styles.timingDivider}>
                                    <Icon name="arrow-right" size={20} color={Colors.text.tertiary} />
                                </View>
                                <View style={styles.timingItem}>
                                    <Text style={styles.timingLabel}>End Time</Text>
                                    <Text style={styles.timingValue}>
                                        {formatTime(shiftDetails?.end_time)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Shift Details */}
                        <View style={styles.detailsCard}>
                            <Text style={styles.sectionTitle}>Shift Details</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Duration</Text>
                                <Text style={styles.detailValue}>
                                    {calculateShiftDuration()}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Grace Period</Text>
                                <Text style={styles.detailValue}>
                                    {shiftDetails?.grace_period_minutes || 0} minutes
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Overnight Shift</Text>
                                <Text style={styles.detailValue}>
                                    {shiftDetails?.is_overnight ? 'Yes' : 'No'}
                                </Text>
                            </View>
                        </View>

                        {/* Assignment Info */}
                        <View style={styles.detailsCard}>
                            <Text style={styles.sectionTitle}>Assignment Info</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Assigned From</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(assignment.start_date)}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Assigned Until</Text>
                                <Text style={styles.detailValue}>
                                    {assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor: assignment.status === 'active'
                                                ? Colors.accent.green + '20'
                                                : Colors.text.tertiary + '20'
                                        }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            {
                                                color: assignment.status === 'active'
                                                    ? Colors.accent.green
                                                    : Colors.text.tertiary
                                            }
                                        ]}
                                    >
                                        {assignment.status.charAt(0).toUpperCase() +
                                            assignment.status.slice(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['3xl'] * 2,
    },
    emptyText: {
        fontSize: Typography.size.lg,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
    shiftCard: {
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
    shiftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    shiftName: {
        fontSize: Typography.size.lg,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    timingsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: Colors.background.secondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
    },
    timingItem: {
        alignItems: 'center',
    },
    timingLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    timingValue: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
        color: Colors.primary[600],
    },
    timingDivider: {
        paddingHorizontal: Spacing.md,
    },
    detailsCard: {
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
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    detailLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    detailValue: {
        fontSize: Typography.size.sm,
        fontWeight: '500',
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
});
