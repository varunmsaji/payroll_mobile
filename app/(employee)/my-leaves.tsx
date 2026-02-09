// My Leaves Screen - Premium Leave Management UI
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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Leave } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Unpaid'];

interface LeaveBalance {
    type: string;
    total: number;
    used: number;
    remaining: number;
    icon: string;
    color: string;
    bgColor: string;
    description: string;
}

export default function MyLeavesScreen() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Balances - start with empty, will be populated from API
    const [balances, setBalances] = useState<LeaveBalance[]>([]);

    // Form state
    const [leaveType, setLeaveType] = useState('Annual');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = useCallback(async () => {
        if (!user?.employee_id) {
            setIsLoading(false);
            setRefreshing(false);
            return;
        }

        setError(null);

        // Fetch leave requests
        try {
            const response = await apiClient.leaves.list({
                employee_id: user.employee_id,
            });

            // Safely handle response data
            const rawData = response?.data;
            const leavesData: Leave[] = Array.isArray(rawData) ? rawData : [];

            // Sort by created date descending with safe date parsing
            leavesData.sort((a: Leave, b: Leave) => {
                const dateA = a?.created_at || a?.start_date ? new Date(a.created_at || a.start_date).getTime() : 0;
                const dateB = b?.created_at || b?.start_date ? new Date(b.created_at || b.start_date).getTime() : 0;
                return dateB - dateA;
            });

            setLeaves(leavesData);
        } catch (err: any) {
            console.log('Leaves fetch error:', err?.response?.status || err.message);
            if (err?.response?.status !== 404) {
                setError('Unable to load leave requests. Pull to refresh.');
            }
            setLeaves([]);
        }

        // Fetch balances - separate try-catch
        try {
            const year = new Date().getFullYear();
            const balanceRes = await apiClient.leaves.getBalance(user.employee_id, year);

            if (Array.isArray(balanceRes?.data) && balanceRes.data.length > 0) {
                const mappedBalances: LeaveBalance[] = balanceRes.data.map((item: any) => {
                    const typeName = item?.leave_type_name || 'Leave';
                    let config = { icon: 'calendar', color: '#6366F1', bgColor: '#EEF2FF', description: 'Leave type' };

                    const typeNameLower = typeName.toLowerCase();
                    if (typeNameLower.includes('annual') || typeNameLower.includes('casual')) {
                        config = { icon: 'umbrella', color: '#3B82F6', bgColor: '#EFF6FF', description: 'Paid vacation & personal time' };
                    } else if (typeNameLower.includes('sick')) {
                        config = { icon: 'thermometer', color: '#F43F5E', bgColor: '#FFF1F2', description: 'Medical & health recovery' };
                    } else if (typeNameLower.includes('earned')) {
                        config = { icon: 'award', color: '#14B8A6', bgColor: '#F0FDFA', description: 'Accumulated based on work' };
                    }

                    return {
                        type: typeName,
                        total: typeof item?.total === 'number' ? item.total : 0,
                        used: typeof item?.used === 'number' ? item.used : 0,
                        remaining: typeof item?.remaining === 'number' ? item.remaining : 0,
                        ...config
                    };
                });
                setBalances(mappedBalances);
            } else {
                // Set default balances if no data
                setBalances([
                    { type: 'Annual', total: 0, used: 0, remaining: 0, icon: 'umbrella', color: '#3B82F6', bgColor: '#EFF6FF', description: 'Paid vacation & personal time' },
                    { type: 'Sick', total: 0, used: 0, remaining: 0, icon: 'thermometer', color: '#F43F5E', bgColor: '#FFF1F2', description: 'Medical & health recovery' },
                ]);
            }
        } catch (err: any) {
            console.log('Balance fetch error:', err?.response?.status || err.message);
            // Set default balances on error
            setBalances([
                { type: 'Annual', total: 0, used: 0, remaining: 0, icon: 'umbrella', color: '#3B82F6', bgColor: '#EFF6FF', description: 'Paid vacation & personal time' },
                { type: 'Sick', total: 0, used: 0, remaining: 0, icon: 'thermometer', color: '#F43F5E', bgColor: '#FFF1F2', description: 'Medical & health recovery' },
            ]);
        }

        setIsLoading(false);
        setRefreshing(false);
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
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
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
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved':
                return { label: 'Approved', color: '#10B981', bgColor: '#ECFDF5', icon: 'check-circle' };
            case 'pending':
                return { label: 'Pending', color: '#F59E0B', bgColor: '#FFFBEB', icon: 'clock' };
            case 'rejected':
                return { label: 'Rejected', color: '#EF4444', bgColor: '#FEF2F2', icon: 'x-circle' };
            default:
                return { label: status, color: Colors.text.tertiary, bgColor: '#F1F5F9', icon: 'help-circle' };
        }
    };

    const totalAvailable = balances.reduce((sum, b) => sum + b.remaining, 0);
    const pendingCount = leaves.filter(l => l.status === 'pending').length;

    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Leave Overview</Text>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Icon name="bell" size={20} color={Colors.text.primary} />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Section */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(19, 127, 236, 0.1)' }]}>
                                <Icon name="calendar" size={20} color={Colors.primary[600]} />
                            </View>
                            <View style={styles.yearBadge}>
                                <Text style={styles.yearText}>Year {new Date().getFullYear()}</Text>
                            </View>
                        </View>
                        <Text style={styles.summaryLabel}>Total Available</Text>
                        <Text style={styles.summaryValue}>
                            {totalAvailable} <Text style={styles.summaryUnit}>days</Text>
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                                <Icon name="file-text" size={20} color="#F97316" />
                            </View>
                        </View>
                        <Text style={styles.summaryLabel}>Pending Requests</Text>
                        <Text style={styles.summaryValue}>
                            {pendingCount} <Text style={styles.summaryUnit}>request{pendingCount !== 1 ? 's' : ''}</Text>
                        </Text>
                    </View>
                </View>

                {/* Balance Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Balances</Text>

                    {balances.map((balance, index) => {
                        const usedPercent = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;

                        return (
                            <View key={index} style={styles.balanceCard}>
                                <View style={styles.balanceHeader}>
                                    <View style={styles.balanceInfo}>
                                        <View style={[styles.balanceIcon, { backgroundColor: balance.bgColor }]}>
                                            <Icon name={balance.icon as any} size={20} color={balance.color} />
                                        </View>
                                        <View>
                                            <Text style={styles.balanceType}>{balance.type} Leave</Text>
                                            <Text style={styles.balanceDesc}>{balance.description}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.balanceRemaining}>
                                        <Text style={[styles.balanceRemainingValue, { color: balance.color }]}>
                                            {balance.remaining}
                                        </Text>
                                        <Text style={styles.balanceRemainingLabel}>LEFT</Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${usedPercent}%`, backgroundColor: balance.color }
                                        ]}
                                    />
                                </View>

                                {/* Stats Grid */}
                                <View style={styles.balanceStats}>
                                    <View style={styles.balanceStat}>
                                        <Text style={styles.balanceStatLabel}>Total</Text>
                                        <Text style={styles.balanceStatValue}>{balance.total}</Text>
                                    </View>
                                    <View style={[styles.balanceStat, styles.balanceStatBorder]}>
                                        <Text style={styles.balanceStatLabel}>Used</Text>
                                        <Text style={styles.balanceStatValue}>{balance.used}</Text>
                                    </View>
                                    <View style={styles.balanceStat}>
                                        <Text style={styles.balanceStatLabel}>Remaining</Text>
                                        <Text style={[styles.balanceStatValue, { color: balance.color }]}>
                                            {balance.remaining}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Recent History */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent History</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {leaves.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Icon name="calendar" size={40} color={Colors.text.tertiary} />
                            <Text style={styles.emptyText}>No leave requests yet</Text>
                        </View>
                    ) : (
                        leaves.slice(0, 5).map((leave) => {
                            const config = getStatusConfig(leave.status);
                            const days = calculateDays(leave.start_date, leave.end_date);

                            return (
                                <View key={leave.leave_id} style={styles.historyCard}>
                                    <View style={styles.historyContent}>
                                        <View style={[styles.historyIcon, { backgroundColor: config.bgColor }]}>
                                            <Icon name={config.icon as any} size={20} color={config.color} />
                                        </View>
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyDates}>
                                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                            </Text>
                                            <Text style={styles.historyType}>
                                                {leave.leave_type?.charAt(0).toUpperCase() + leave.leave_type?.slice(1)} Leave • {days} Day{days !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
                                        <Text style={[styles.statusText, { color: config.color }]}>
                                            {config.label}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Bottom padding for FAB */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowApplyModal(true)}
                    activeOpacity={0.9}
                >
                    <Icon name="plus" size={22} color="#fff" />
                    <Text style={styles.fabText}>Apply for Leave</Text>
                </TouchableOpacity>
            </View>

            {/* Apply Leave Modal */}
            <Modal
                visible={showApplyModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowApplyModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.modalBackBtn}
                            onPress={() => setShowApplyModal(false)}
                        >
                            <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>New Request</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Balance Card */}
                        <View style={styles.balanceHeroCard}>
                            <LinearGradient
                                colors={['#3b9eff', '#137fec']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <View style={styles.balanceHeroBg} />
                            <View style={styles.balanceHeroContent}>
                                <View style={styles.balanceHeroRow}>
                                    <Icon name="calendar" size={18} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.balanceHeroLabel}>Annual Leave Balance</Text>
                                </View>
                                <View style={styles.balanceHeroValueRow}>
                                    <Text style={styles.balanceHeroValue}>{totalAvailable}</Text>
                                    <Text style={styles.balanceHeroUnit}>Days Available</Text>
                                </View>
                                <Text style={styles.balanceHeroExpiry}>
                                    Expires Dec 31, {new Date().getFullYear()}
                                </Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View style={styles.formSection}>
                            {/* Leave Type */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Leave Type</Text>
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
                            </View>

                            {/* Date Range */}
                            <View style={styles.dateRow}>
                                <View style={styles.dateField}>
                                    <Text style={styles.formLabel}>Start Date</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={startDate}
                                        onChangeText={setStartDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={Colors.text.tertiary}
                                    />
                                </View>
                                <View style={styles.dateField}>
                                    <Text style={styles.formLabel}>End Date</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={endDate}
                                        onChangeText={setEndDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={Colors.text.tertiary}
                                    />
                                </View>
                            </View>

                            {/* Duration Info */}
                            {startDate && endDate && (
                                <View style={styles.durationInfo}>
                                    <Icon name="info" size={18} color={Colors.primary[600]} />
                                    <Text style={styles.durationText}>
                                        Total duration: <Text style={styles.durationValue}>{calculateDays(startDate, endDate)} days</Text> selected
                                    </Text>
                                </View>
                            )}

                            {/* Reason */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Reason</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={reason}
                                    onChangeText={setReason}
                                    placeholder="Briefly explain why you are taking leave..."
                                    placeholderTextColor={Colors.text.tertiary}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Submit Button */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleApplyLeave}
                            disabled={submitting}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.submitButtonText}>
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </Text>
                            {!submitting && <Icon name="send" size={18} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
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
        backgroundColor: 'rgba(246, 247, 248, 0.9)',
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
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        backgroundColor: '#EF4444',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#f6f7f8',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 24,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    yearBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    yearText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#10B981',
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
        marginTop: 2,
    },
    summaryUnit: {
        fontSize: 13,
        fontWeight: '400',
        color: Colors.text.tertiary,
    },
    section: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary[600],
    },
    balanceCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    balanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    balanceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceType: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    balanceDesc: {
        fontSize: 11,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    balanceRemaining: {
        alignItems: 'flex-end',
    },
    balanceRemainingValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    balanceRemainingLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
    },
    progressBar: {
        height: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    balanceStats: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
    },
    balanceStat: {
        flex: 1,
        alignItems: 'center',
    },
    balanceStatBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#f1f5f9',
    },
    balanceStatLabel: {
        fontSize: 11,
        color: Colors.text.tertiary,
        marginBottom: 2,
    },
    balanceStatValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    historyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyInfo: {
        flex: 1,
    },
    historyDates: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    historyType: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        gap: 12,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.tertiary,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary[600],
        paddingVertical: 16,
        borderRadius: 16,
        ...Shadows.lg,
        shadowColor: Colors.primary[600],
    },
    fabText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    modalBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    balanceHeroCard: {
        borderRadius: 20,
        padding: 24,
        overflow: 'hidden',
        marginBottom: 32,
    },
    balanceHeroBg: {
        position: 'absolute',
        top: -16,
        right: -16,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    balanceHeroContent: {
        gap: 8,
    },
    balanceHeroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    balanceHeroLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
    },
    balanceHeroValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    balanceHeroValue: {
        fontSize: 40,
        fontWeight: '700',
        color: '#fff',
    },
    balanceHeroUnit: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
    },
    balanceHeroExpiry: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
    },
    formSection: {
        gap: 24,
    },
    formGroup: {
        gap: 8,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginLeft: 4,
    },
    typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeOption: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    typeOptionSelected: {
        backgroundColor: Colors.primary[600],
        borderColor: Colors.primary[600],
    },
    typeOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    typeOptionTextSelected: {
        color: '#fff',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateField: {
        flex: 1,
        gap: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    textArea: {
        height: 120,
    },
    durationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(19, 127, 236, 0.05)',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(19, 127, 236, 0.1)',
    },
    durationText: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    durationValue: {
        fontWeight: '700',
        color: Colors.text.primary,
    },
    modalFooter: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary[600],
        paddingVertical: 18,
        borderRadius: 16,
        ...Shadows.lg,
        shadowColor: Colors.primary[600],
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
});
