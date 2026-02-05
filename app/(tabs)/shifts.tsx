// Shifts screen
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
import { Card, Badge, getStatusVariant, Loading, Modal, Button } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { Shift, ShiftAssignment } from '../../types';

export default function ShiftsScreen() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [viewMode, setViewMode] = useState<'shifts' | 'assignments'>('shifts');

    const fetchData = useCallback(async () => {
        try {
            const [shiftsRes, assignmentsRes] = await Promise.all([
                apiClient.shifts.list(),
                apiClient.shifts.assignments.list(),
            ]);
            setShifts(shiftsRes.data.items || shiftsRes.data || []);
            setAssignments(assignmentsRes.data.items || assignmentsRes.data || []);
        } catch (error) {
            console.error('Error fetching shifts:', error);
            setShifts([]);
            setAssignments([]);
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

    const renderShift = ({ item }: { item: Shift }) => {
        const assignmentCount = assignments.filter(a => a.shift_id === item.shift_id).length;

        return (
            <Card style={styles.shiftCard} onPress={() => setSelectedShift(item)}>
                <View style={styles.shiftRow}>
                    <View style={styles.shiftIcon}>
                        <Icon name="clock" size={24} color={Colors.primary[600]} />
                    </View>
                    <View style={styles.shiftInfo}>
                        <Text style={styles.shiftName}>{item.shift_name}</Text>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{item.start_time} - {item.end_time}</Text>
                            {item.is_overnight && (
                                <Badge text="Overnight" variant="info" size="sm" />
                            )}
                        </View>
                    </View>
                    <View style={styles.shiftMeta}>
                        <Text style={styles.assignmentCount}>{assignmentCount}</Text>
                        <Text style={styles.assignmentLabel}>assigned</Text>
                    </View>
                </View>
            </Card>
        );
    };

    const renderAssignment = ({ item }: { item: ShiftAssignment }) => (
        <Card style={styles.assignmentCard}>
            <View style={styles.assignmentRow}>
                <View style={styles.avatar}>
                    <Icon name="user" size={18} color={Colors.primary[600]} />
                </View>
                <View style={styles.assignmentInfo}>
                    <Text style={styles.employeeName}>{item.employee_name || `Employee ${item.employee_id}`}</Text>
                    <Text style={styles.shiftLabel}>{item.shift_name}</Text>
                </View>
                <Badge
                    text={item.status}
                    variant={getStatusVariant(item.status)}
                    size="sm"
                />
            </View>
        </Card>
    );

    if (isLoading) {
        return <Loading fullScreen text="Loading shifts..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Shift Management</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Icon name="plus" size={24} color={Colors.text.inverse} />
                </TouchableOpacity>
            </View>

            {/* View Toggle */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, viewMode === 'shifts' && styles.toggleButtonActive]}
                    onPress={() => setViewMode('shifts')}
                >
                    <Icon
                        name="clock"
                        size={18}
                        color={viewMode === 'shifts' ? Colors.text.inverse : Colors.text.secondary}
                    />
                    <Text style={[styles.toggleText, viewMode === 'shifts' && styles.toggleTextActive]}>
                        Shifts
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, viewMode === 'assignments' && styles.toggleButtonActive]}
                    onPress={() => setViewMode('assignments')}
                >
                    <Icon
                        name="users"
                        size={18}
                        color={viewMode === 'assignments' ? Colors.text.inverse : Colors.text.secondary}
                    />
                    <Text style={[styles.toggleText, viewMode === 'assignments' && styles.toggleTextActive]}>
                        Assignments
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {viewMode === 'shifts' ? (
                <FlatList
                    data={shifts}
                    keyExtractor={(item) => item.shift_id.toString()}
                    renderItem={renderShift}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="clock" size={48} color={Colors.text.tertiary} />
                            <Text style={styles.emptyText}>No shifts configured</Text>
                        </View>
                    }
                />
            ) : (
                <FlatList
                    data={assignments}
                    keyExtractor={(item) => item.assignment_id.toString()}
                    renderItem={renderAssignment}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="users" size={48} color={Colors.text.tertiary} />
                            <Text style={styles.emptyText}>No shift assignments</Text>
                        </View>
                    }
                />
            )}

            {/* Shift Detail Modal */}
            <Modal
                visible={!!selectedShift}
                onClose={() => setSelectedShift(null)}
                title="Shift Details"
            >
                {selectedShift && (
                    <View style={styles.modalContent}>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Shift Name</Text>
                            <Text style={styles.modalValue}>{selectedShift.shift_name}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Start Time</Text>
                            <Text style={styles.modalValue}>{selectedShift.start_time}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>End Time</Text>
                            <Text style={styles.modalValue}>{selectedShift.end_time}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Grace Period</Text>
                            <Text style={styles.modalValue}>{selectedShift.grace_period_minutes} minutes</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Overnight</Text>
                            <Text style={styles.modalValue}>{selectedShift.is_overnight ? 'Yes' : 'No'}</Text>
                        </View>

                        <Text style={styles.assignedHeader}>
                            Assigned Employees ({assignments.filter(a => a.shift_id === selectedShift.shift_id).length})
                        </Text>
                        {assignments
                            .filter(a => a.shift_id === selectedShift.shift_id)
                            .slice(0, 5)
                            .map(a => (
                                <View key={a.assignment_id} style={styles.assignedItem}>
                                    <Icon name="user" size={16} color={Colors.text.tertiary} />
                                    <Text style={styles.assignedName}>{a.employee_name || `Employee ${a.employee_id}`}</Text>
                                </View>
                            ))
                        }
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xs,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    toggleButtonActive: {
        backgroundColor: Colors.primary[600],
    },
    toggleText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    toggleTextActive: {
        color: Colors.text.inverse,
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
        gap: Spacing.md,
        paddingBottom: Spacing['5xl'],
    },
    shiftCard: {
        padding: Spacing.lg,
    },
    shiftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    shiftIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    shiftInfo: {
        flex: 1,
    },
    shiftName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 4,
    },
    timeText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    shiftMeta: {
        alignItems: 'center',
    },
    assignmentCount: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.primary[600],
    },
    assignmentLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
    },
    assignmentCard: {
        padding: Spacing.md,
    },
    assignmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignmentInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    shiftLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
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
        gap: Spacing.md,
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
    assignedHeader: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    assignedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    assignedName: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
});
