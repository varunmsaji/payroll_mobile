// Premium Leave Management Screen
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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { format, differenceInDays } from 'date-fns';

interface LeaveRequest {
    leave_id: number;
    employee_id: number;
    employee_name?: string;
    first_name?: string;
    last_name?: string;
    position?: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason?: string;
    status: string;
    days?: number;
}

const LEAVE_TYPE_STYLES: { [key: string]: { icon: string; color: string; bg: string } } = {
    'sick': { icon: 'thermometer', color: '#EF4444', bg: '#FEE2E2' },
    'casual': { icon: 'umbrella', color: '#F97316', bg: '#FFF7ED' },
    'vacation': { icon: 'sun', color: '#10B981', bg: '#D1FAE5' },
    'personal': { icon: 'user', color: '#8B5CF6', bg: '#EDE9FE' },
    'maternity': { icon: 'heart', color: '#EC4899', bg: '#FCE7F3' },
    'paternity': { icon: 'heart', color: '#3B82F6', bg: '#DBEAFE' },
    'default': { icon: 'calendar', color: '#64748B', bg: '#F1F5F9' },
};

type TabType = 'pending' | 'approved' | 'rejected';

export default function LeavesScreen() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchLeaves = useCallback(async () => {
        try {
            const response = await apiClient.leaves.list();
            const data = response.data?.items || response.data || [];
            setLeaves(Array.isArray(data) ? data : []);
        } catch (err: any) {
            // Silently handle - show empty state
            console.log('Leave data unavailable');
            setLeaves([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaves();
    }, [fetchLeaves]);

    const handleApprove = async (leave: LeaveRequest) => {
        setProcessingId(leave.leave_id);
        try {
            await apiClient.leaves.approve(leave.leave_id, user?.employee_id || 1);
            Alert.alert('Success', 'Leave request approved');
            fetchLeaves();
        } catch (err) {
            Alert.alert('Error', 'Failed to approve leave request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = (leave: LeaveRequest) => {
        Alert.prompt(
            'Reject Leave',
            'Please provide a reason for rejection:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async (reason) => {
                        setProcessingId(leave.leave_id);
                        try {
                            await apiClient.leaves.reject(leave.leave_id, reason || 'Rejected by admin');
                            Alert.alert('Success', 'Leave request rejected');
                            fetchLeaves();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to reject leave request');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const getLeaveTypeStyle = (type: string) => {
        const lowerType = type?.toLowerCase() || '';
        return LEAVE_TYPE_STYLES[lowerType] || LEAVE_TYPE_STYLES.default;
    };

    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (format(startDate, 'yyyy-MM') === format(endDate, 'yyyy-MM')) {
            return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
        }
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    };

    const calculateDays = (start: string, end: string) => {
        return differenceInDays(new Date(end), new Date(start)) + 1;
    };

    // Group leaves by status
    const pendingLeaves = leaves.filter(l => l.status?.toLowerCase() === 'pending');
    const approvedLeaves = leaves.filter(l => l.status?.toLowerCase() === 'approved');
    const rejectedLeaves = leaves.filter(l => l.status?.toLowerCase() === 'rejected');

    const activeLeaves = activeTab === 'pending' ? pendingLeaves :
        activeTab === 'approved' ? approvedLeaves : rejectedLeaves;

    // Filter by search
    const filteredLeaves = activeLeaves.filter(leave => {
        const name = leave.employee_name || `${leave.first_name || ''} ${leave.last_name || ''}`;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (isLoading) {
        return <Loading fullScreen text="Loading leave requests..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leave Management</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Icon name="filter" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[1]}
                keyExtractor={() => 'content'}
                renderItem={() => (
                    <>
                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.statGridCard,
                                    activeTab === 'pending' && styles.statCardActive
                                ]}
                                onPress={() => setActiveTab('pending')}
                            >
                                <View style={[styles.statGridIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Icon name="clock" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.statGridValue}>{pendingLeaves.length}</Text>
                                <Text style={styles.statGridLabel}>Pending</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.statGridCard,
                                    activeTab === 'approved' && styles.statCardActive
                                ]}
                                onPress={() => setActiveTab('approved')}
                            >
                                <View style={[styles.statGridIcon, { backgroundColor: '#D1FAE5' }]}>
                                    <Icon name="check-circle" size={20} color="#10B981" />
                                </View>
                                <Text style={styles.statGridValue}>{approvedLeaves.length}</Text>
                                <Text style={styles.statGridLabel}>Approved</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.statGridCard,
                                    activeTab === 'rejected' && styles.statCardActive
                                ]}
                                onPress={() => setActiveTab('rejected')}
                            >
                                <View style={[styles.statGridIcon, { backgroundColor: '#FEE2E2' }]}>
                                    <Icon name="x-circle" size={20} color="#EF4444" />
                                </View>
                                <Text style={styles.statGridValue}>{rejectedLeaves.length}</Text>
                                <Text style={styles.statGridLabel}>Rejected</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Icon name="search" size={20} color={Colors.text.tertiary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by employee name..."
                                placeholderTextColor={Colors.text.tertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Section Title */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requests
                            </Text>
                            <Text style={styles.sectionCount}>{filteredLeaves.length} items</Text>
                        </View>

                        {/* Error State */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-triangle" size={20} color={Colors.error.main} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Leave Cards */}
                        {filteredLeaves.map((leave) => {
                            const typeStyle = getLeaveTypeStyle(leave.leave_type);
                            const employeeName = leave.employee_name ||
                                `${leave.first_name || ''} ${leave.last_name || ''}`.trim() || 'Unknown';
                            const days = leave.days || calculateDays(leave.start_date, leave.end_date);
                            const isPending = leave.status?.toLowerCase() === 'pending';
                            const isProcessing = processingId === leave.leave_id;

                            return (
                                <View key={leave.leave_id} style={styles.leaveCard}>
                                    {/* Card Header */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.employeeInfo}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>
                                                    {employeeName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.employeeName}>{employeeName}</Text>
                                                <Text style={styles.employeeRole}>
                                                    {leave.position || 'Employee'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                                            <Icon name={typeStyle.icon} size={12} color={typeStyle.color} />
                                            <Text style={[styles.typeText, { color: typeStyle.color }]}>
                                                {leave.leave_type}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Date Info */}
                                    <View style={styles.dateSection}>
                                        <View style={styles.dateRow}>
                                            <Icon name="calendar" size={16} color={Colors.text.tertiary} />
                                            <Text style={styles.dateText}>
                                                {formatDateRange(leave.start_date, leave.end_date)}
                                            </Text>
                                        </View>
                                        <View style={styles.daysBadge}>
                                            <Text style={styles.daysText}>{days} {days === 1 ? 'day' : 'days'}</Text>
                                        </View>
                                    </View>

                                    {/* Reason */}
                                    {leave.reason && (
                                        <View style={styles.reasonSection}>
                                            <Text style={styles.reasonLabel}>Reason</Text>
                                            <Text style={styles.reasonText} numberOfLines={2}>
                                                {leave.reason}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Actions */}
                                    {isPending && (
                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.approveButton]}
                                                onPress={() => handleApprove(leave)}
                                                disabled={isProcessing}
                                            >
                                                <Icon name="check" size={16} color="#FFFFFF" />
                                                <Text style={styles.approveButtonText}>
                                                    {isProcessing ? 'Processing...' : 'Approve'}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.rejectButton]}
                                                onPress={() => handleReject(leave)}
                                                disabled={isProcessing}
                                            >
                                                <Icon name="close" size={16} color="#EF4444" />
                                                <Text style={styles.rejectButtonText}>Reject</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Status badge for non-pending */}
                                    {!isPending && (
                                        <View style={styles.statusRow}>
                                            <View style={[
                                                styles.statusBadge,
                                                { backgroundColor: leave.status === 'approved' ? '#D1FAE5' : '#FEE2E2' }
                                            ]}>
                                                <Icon
                                                    name={leave.status === 'approved' ? 'check-circle' : 'x-circle'}
                                                    size={14}
                                                    color={leave.status === 'approved' ? '#10B981' : '#EF4444'}
                                                />
                                                <Text style={[
                                                    styles.statusText,
                                                    { color: leave.status === 'approved' ? '#059669' : '#DC2626' }
                                                ]}>
                                                    {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {/* Empty State */}
                        {filteredLeaves.length === 0 && !error && (
                            <View style={styles.emptyState}>
                                <Icon name="calendar" size={48} color={Colors.text.tertiary} />
                                <Text style={styles.emptyTitle}>No Requests</Text>
                                <Text style={styles.emptyText}>
                                    No {activeTab} leave requests found
                                </Text>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: '#FFFFFF',
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
    filterButton: {
        padding: Spacing.sm,
        marginRight: -Spacing.sm,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
        padding: Spacing.lg,
    },
    statGridCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadows.sm,
    },
    statCardActive: {
        borderColor: '#137FEC',
        borderWidth: 2,
    },
    statGridIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    statGridValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    statGridLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.lg,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
        paddingVertical: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    sectionCount: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
    },
    leaveCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    employeeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
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
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    typeText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        textTransform: 'capitalize',
    },
    dateSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    dateText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    daysBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    daysText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: '#4F46E5',
    },
    reasonSection: {
        marginBottom: Spacing.md,
    },
    reasonLabel: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.tertiary,
        marginBottom: 4,
    },
    reasonText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    approveButton: {
        backgroundColor: '#10B981',
    },
    approveButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#FFFFFF',
    },
    rejectButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    rejectButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#EF4444',
    },
    statusRow: {
        marginTop: Spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['5xl'],
    },
    emptyTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        marginTop: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
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
});
