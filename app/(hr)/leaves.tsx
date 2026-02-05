// Leaves screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, getStatusVariant, Loading, Button, Modal, Toast } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Leave } from '../../types';
import { format } from 'date-fns';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function LeavesScreen() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchLeaves = useCallback(async () => {
        try {
            const response = await apiClient.leaves.list();
            setLeaves(response.data.items || response.data || []);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            setLeaves([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    useEffect(() => {
        if (filter === 'all') {
            setFilteredLeaves(leaves);
        } else {
            setFilteredLeaves(leaves.filter(l => l.status === filter));
        }
    }, [filter, leaves]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLeaves();
        setRefreshing(false);
    }, [fetchLeaves]);

    const handleApprove = async (leave: Leave) => {
        if (!user) return;
        setActionLoading(true);
        try {
            await apiClient.leaves.approve(leave.leave_id, user.user_id);
            setToast({ message: 'Leave approved successfully', type: 'success' });
            setSelectedLeave(null);
            await fetchLeaves();
        } catch (error) {
            setToast({ message: 'Failed to approve leave', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (leave: Leave) => {
        Alert.prompt(
            'Reject Leave',
            'Please provide a reason for rejection:',
            async (reason) => {
                if (!reason?.trim()) {
                    setToast({ message: 'Rejection reason is required', type: 'error' });
                    return;
                }
                setActionLoading(true);
                try {
                    await apiClient.leaves.reject(leave.leave_id, reason);
                    setToast({ message: 'Leave rejected', type: 'success' });
                    setSelectedLeave(null);
                    await fetchLeaves();
                } catch (error) {
                    setToast({ message: 'Failed to reject leave', type: 'error' });
                } finally {
                    setActionLoading(false);
                }
            },
            'plain-text'
        );
    };

    const renderLeave = ({ item }: { item: Leave }) => (
        <Card style={styles.leaveCard} onPress={() => setSelectedLeave(item)}>
            <View style={styles.leaveHeader}>
                <View style={styles.leaveInfo}>
                    <Text style={styles.employeeName}>{item.employee_name || `Employee ${item.employee_id}`}</Text>
                    <Text style={styles.leaveType}>{item.leave_type}</Text>
                </View>
                <Badge
                    text={item.status}
                    variant={getStatusVariant(item.status)}
                    size="sm"
                />
            </View>
            <View style={styles.leaveDetails}>
                <View style={styles.dateRange}>
                    <Icon name="calendar" size={14} color={Colors.text.tertiary} />
                    <Text style={styles.dateText}>
                        {format(new Date(item.start_date), 'MMM dd')} - {format(new Date(item.end_date), 'MMM dd, yyyy')}
                    </Text>
                </View>
                {item.reason && (
                    <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
                )}
            </View>
        </Card>
    );

    const FilterButton: React.FC<{ value: FilterType; label: string }> = ({ value, label }) => (
        <TouchableOpacity
            style={[styles.filterButton, filter === value && styles.filterButtonActive]}
            onPress={() => setFilter(value)}
        >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (isLoading) {
        return <Loading fullScreen text="Loading leaves..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Leave Requests</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <FilterButton value="all" label="All" />
                <FilterButton value="pending" label="Pending" />
                <FilterButton value="approved" label="Approved" />
                <FilterButton value="rejected" label="Rejected" />
            </View>

            {/* Leave List */}
            <FlatList
                data={filteredLeaves}
                keyExtractor={(item) => item.leave_id.toString()}
                renderItem={renderLeave}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="calendar" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No leave requests found</Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            <Modal
                visible={!!selectedLeave}
                onClose={() => setSelectedLeave(null)}
                title="Leave Request"
            >
                {selectedLeave && (
                    <View style={styles.modalContent}>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Employee</Text>
                            <Text style={styles.modalValue}>
                                {selectedLeave.employee_name || `Employee ${selectedLeave.employee_id}`}
                            </Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Type</Text>
                            <Text style={styles.modalValue}>{selectedLeave.leave_type}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Status</Text>
                            <Badge
                                text={selectedLeave.status}
                                variant={getStatusVariant(selectedLeave.status)}
                            />
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Duration</Text>
                            <Text style={styles.modalValue}>
                                {format(new Date(selectedLeave.start_date), 'MMM dd')} - {format(new Date(selectedLeave.end_date), 'MMM dd, yyyy')}
                            </Text>
                        </View>
                        {selectedLeave.reason && (
                            <View style={styles.modalFullRow}>
                                <Text style={styles.modalLabel}>Reason</Text>
                                <Text style={styles.modalValue}>{selectedLeave.reason}</Text>
                            </View>
                        )}

                        {/* Actions for pending leaves */}
                        {selectedLeave.status === 'pending' && (user?.role === 'admin' || user?.role === 'hr') && (
                            <View style={styles.actionButtons}>
                                <Button
                                    title="Approve"
                                    onPress={() => handleApprove(selectedLeave)}
                                    loading={actionLoading}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Reject"
                                    variant="danger"
                                    onPress={() => handleReject(selectedLeave)}
                                    loading={actionLoading}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        )}
                    </View>
                )}
            </Modal>

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
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    title: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    filterButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.background.primary,
    },
    filterButtonActive: {
        backgroundColor: Colors.primary[600],
    },
    filterText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    filterTextActive: {
        color: Colors.text.inverse,
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
        gap: Spacing.md,
        paddingBottom: Spacing['5xl'],
    },
    leaveCard: {
        padding: Spacing.lg,
    },
    leaveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    leaveInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    leaveType: {
        fontSize: Typography.size.sm,
        color: Colors.primary[600],
        marginTop: 2,
    },
    leaveDetails: {
        marginTop: Spacing.md,
    },
    dateRange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    dateText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    reason: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        marginTop: Spacing.sm,
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
    modalFullRow: {
        gap: Spacing.xs,
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
    actionButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
});
