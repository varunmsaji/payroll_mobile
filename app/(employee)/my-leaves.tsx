// My Leaves Screen - Employee leave management
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Leave } from '../../types';

const LEAVE_TYPES = ['Annual', 'Sick', 'Personal', 'Unpaid'];

export default function MyLeavesScreen() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Form state
    const [leaveType, setLeaveType] = useState('Annual');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = useCallback(async () => {
        if (!user?.employee_id) return;

        try {
            const response = await apiClient.leaves.list({
                employee_id: user.employee_id,
            });
            setLeaves(response.data || []);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaves();
    }, [fetchLeaves]);

    const handleApplyLeave = async () => {
        if (!user?.employee_id || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.leaves.create({
                employee_id: user.employee_id,
                leave_type: leaveType.toLowerCase(),
                start_date: startDate,
                end_date: endDate,
                reason: reason,
            });
            setShowApplyModal(false);
            resetForm();
            fetchLeaves();
            Alert.alert('Success', 'Leave request submitted successfully');
        } catch (error) {
            console.error('Error applying leave:', error);
            Alert.alert('Error', 'Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelLeave = async (leaveId: number) => {
        Alert.alert(
            'Cancel Leave',
            'Are you sure you want to cancel this leave request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.leaves.cancel(leaveId);
                            fetchLeaves();
                        } catch (error) {
                            console.error('Error canceling leave:', error);
                            Alert.alert('Error', 'Failed to cancel leave request');
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setLeaveType('Annual');
        setStartDate('');
        setEndDate('');
        setReason('');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return Colors.accent.green;
            case 'pending':
                return Colors.accent.orange;
            case 'rejected':
                return Colors.accent.red;
            default:
                return Colors.text.tertiary;
        }
    };

    // Leave balance (placeholder - should come from API)
    const leaveBalance = {
        annual: 20,
        sick: 10,
        personal: 5,
    };

    // Summary
    const summary = {
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Leaves</Text>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => setShowApplyModal(true)}
                >
                    <Icon name="plus" size={20} color={Colors.text.inverse} />
                    <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Leave Balance */}
                <View style={styles.balanceCard}>
                    <Text style={styles.sectionTitle}>Leave Balance</Text>
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceCount}>{leaveBalance.annual}</Text>
                            <Text style={styles.balanceLabel}>Annual</Text>
                        </View>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceCount}>{leaveBalance.sick}</Text>
                            <Text style={styles.balanceLabel}>Sick</Text>
                        </View>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceCount}>{leaveBalance.personal}</Text>
                            <Text style={styles.balanceLabel}>Personal</Text>
                        </View>
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryCount, { color: Colors.accent.orange }]}>
                            {summary.pending}
                        </Text>
                        <Text style={styles.summaryLabel}>Pending</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryCount, { color: Colors.accent.green }]}>
                            {summary.approved}
                        </Text>
                        <Text style={styles.summaryLabel}>Approved</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryCount, { color: Colors.accent.red }]}>
                            {summary.rejected}
                        </Text>
                        <Text style={styles.summaryLabel}>Rejected</Text>
                    </View>
                </View>

                {/* Leave History */}
                <View style={styles.historyCard}>
                    <Text style={styles.sectionTitle}>Leave History</Text>
                    {leaves.length === 0 ? (
                        <Text style={styles.emptyText}>No leave requests found</Text>
                    ) : (
                        leaves.map((leave) => (
                            <View key={leave.leave_id} style={styles.leaveItem}>
                                <View style={styles.leaveHeader}>
                                    <View style={styles.leaveTypeContainer}>
                                        <Text style={styles.leaveType}>
                                            {leave.leave_type.charAt(0).toUpperCase() +
                                                leave.leave_type.slice(1)} Leave
                                        </Text>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: getStatusColor(leave.status) + '20' }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: getStatusColor(leave.status) }
                                                ]}
                                            >
                                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                    {leave.status === 'pending' && (
                                        <TouchableOpacity
                                            onPress={() => handleCancelLeave(leave.leave_id)}
                                        >
                                            <Icon name="close" size={20} color={Colors.accent.red} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={styles.leaveDates}>
                                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                </Text>
                                {leave.reason && (
                                    <Text style={styles.leaveReason}>{leave.reason}</Text>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Apply Leave Modal */}
            <Modal
                visible={showApplyModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowApplyModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Apply for Leave</Text>
                        <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                            <Icon name="close" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        {/* Leave Type */}
                        <Text style={styles.inputLabel}>Leave Type</Text>
                        <View style={styles.typeSelector}>
                            {LEAVE_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeOption,
                                        leaveType === type && styles.typeOptionSelected,
                                    ]}
                                    onPress={() => setLeaveType(type)}
                                >
                                    <Text
                                        style={[
                                            styles.typeOptionText,
                                            leaveType === type && styles.typeOptionTextSelected,
                                        ]}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Start Date */}
                        <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={startDate}
                            onChangeText={setStartDate}
                            placeholder="2024-01-15"
                            placeholderTextColor={Colors.text.tertiary}
                        />

                        {/* End Date */}
                        <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={endDate}
                            onChangeText={setEndDate}
                            placeholder="2024-01-16"
                            placeholderTextColor={Colors.text.tertiary}
                        />

                        {/* Reason */}
                        <Text style={styles.inputLabel}>Reason (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Enter reason for leave..."
                            placeholderTextColor={Colors.text.tertiary}
                            multiline
                            numberOfLines={4}
                        />

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                submitting && styles.submitButtonDisabled,
                            ]}
                            onPress={handleApplyLeave}
                            disabled={submitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
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
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.primary[600],
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    applyButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.text.inverse,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
    },
    balanceCard: {
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
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    balanceItem: {
        alignItems: 'center',
    },
    balanceCount: {
        fontSize: Typography.size.xxl,
        fontWeight: '700',
        color: Colors.primary[600],
    },
    balanceLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    summaryCard: {
        flexDirection: 'row',
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
    summaryItem: {
        flex: 1,
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
    historyCard: {
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
    leaveItem: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    leaveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.xs,
    },
    leaveTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    leaveType: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        fontSize: Typography.size.xs,
        fontWeight: '500',
    },
    leaveDates: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    leaveReason: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        fontStyle: 'italic',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    modalTitle: {
        fontSize: Typography.size.lg,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    modalContent: {
        flex: 1,
        padding: Spacing.md,
    },
    inputLabel: {
        fontSize: Typography.size.sm,
        fontWeight: '500',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
        marginTop: Spacing.md,
    },
    typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    typeOption: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.background.primary,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    typeOptionSelected: {
        backgroundColor: Colors.primary[600],
        borderColor: Colors.primary[600],
    },
    typeOptionText: {
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
    },
    typeOptionTextSelected: {
        color: Colors.text.inverse,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.light,
        padding: Spacing.md,
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: Colors.primary[600],
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: Typography.size.md,
        fontWeight: '600',
        color: Colors.text.inverse,
    },
});
