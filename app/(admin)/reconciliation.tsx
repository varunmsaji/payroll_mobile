// Premium Attendance Reconciliation Screen
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
    Modal,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { format, subDays } from 'date-fns';

interface ReconciliationRecord {
    attendance_id: number;
    employee_id: number;
    employee_name?: string;
    first_name?: string;
    last_name?: string;
    position?: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    status: string;
    issue_type?: 'missing_punch' | 'overtime' | 'late' | 'early_leave';
    needs_review?: boolean;
}

type TabType = 'missing' | 'overtime' | 'pending';

export default function ReconciliationScreen() {
    const [records, setRecords] = useState<ReconciliationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('missing');
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editCheckIn, setEditCheckIn] = useState('');
    const [editCheckOut, setEditCheckOut] = useState('');

    const fetchRecords = useCallback(async () => {
        try {
            // Fetch last 7 days for reconciliation
            const today = new Date();
            const weekAgo = subDays(today, 7);
            const response = await apiClient.attendance.list({
                date: format(weekAgo, 'yyyy-MM-dd')
            });
            const data = response.data?.items || response.data || [];

            // Mark records needing review
            const enrichedData = (Array.isArray(data) ? data : []).map((r: any) => ({
                ...r,
                needs_review: !r.check_in || !r.check_out || r.status === 'late',
                issue_type: !r.check_in || !r.check_out ? 'missing_punch' :
                    r.status === 'late' ? 'late' :
                        r.status === 'overtime' ? 'overtime' : undefined
            }));

            setRecords(enrichedData);
        } catch (err: any) {
            // Silently handle - show empty state
            console.log('Reconciliation data unavailable');
            setRecords([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRecords();
    }, [fetchRecords]);

    const handleEdit = (record: ReconciliationRecord) => {
        setEditingId(record.attendance_id);
        setEditCheckIn(record.check_in || '');
        setEditCheckOut(record.check_out || '');
    };

    const handleSave = async () => {
        if (!editingId) return;

        try {
            await apiClient.attendance.update(editingId, {
                check_in: editCheckIn || null,
                check_out: editCheckOut || null
            });
            Alert.alert('Success', 'Attendance updated successfully');
            setEditingId(null);
            fetchRecords();
        } catch (err) {
            Alert.alert('Error', 'Failed to update attendance');
        }
    };

    const handleIgnore = (id: number) => {
        Alert.alert(
            'Ignore Issue',
            'Mark this issue as reviewed and ignore?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Ignore', style: 'destructive', onPress: () => {
                        setRecords(prev => prev.filter(r => r.attendance_id !== id));
                    }
                }
            ]
        );
    };

    const formatTime = (time: string | null) => {
        if (!time) return '--:--';
        try {
            const date = new Date(time);
            return format(date, 'hh:mm a');
        } catch {
            return time;
        }
    };

    // Group records by type
    const missingPunch = records.filter(r => !r.check_in || !r.check_out);
    const overtimeRecords = records.filter(r => r.status === 'overtime');
    const pendingReview = records.filter(r => r.needs_review);

    const activeRecords = activeTab === 'missing' ? missingPunch :
        activeTab === 'overtime' ? overtimeRecords : pendingReview;

    if (isLoading) {
        return <Loading fullScreen text="Loading reconciliation..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reconciliation</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                    <Icon name="refresh-cw" size={20} color="#137FEC" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[1]}
                keyExtractor={() => 'content'}
                renderItem={() => (
                    <>
                        {/* Stats Cards */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.statsContainer}
                        >
                            <TouchableOpacity
                                style={[styles.statCard, activeTab === 'missing' && styles.statCardActive]}
                                onPress={() => setActiveTab('missing')}
                            >
                                <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                                    <Icon name="alert-circle" size={20} color="#F97316" />
                                </View>
                                <Text style={styles.statValue}>{missingPunch.length}</Text>
                                <Text style={styles.statLabel}>Missing Punches</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statCard, activeTab === 'overtime' && styles.statCardActive]}
                                onPress={() => setActiveTab('overtime')}
                            >
                                <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
                                    <Icon name="clock" size={20} color="#8B5CF6" />
                                </View>
                                <Text style={styles.statValue}>{overtimeRecords.length}</Text>
                                <Text style={styles.statLabel}>Overtime Alerts</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statCard, activeTab === 'pending' && styles.statCardActive]}
                                onPress={() => setActiveTab('pending')}
                            >
                                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                                    <Icon name="file-text" size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.statValue}>{pendingReview.length}</Text>
                                <Text style={styles.statLabel}>Pending Review</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Section Header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {activeTab === 'missing' ? 'Missing Punches' :
                                    activeTab === 'overtime' ? 'Overtime Alerts' : 'Pending Review'}
                            </Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{activeRecords.length}</Text>
                            </View>
                        </View>

                        {/* Error State */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-triangle" size={20} color={Colors.error.main} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Record Cards */}
                        {activeRecords.map((record) => {
                            const employeeName = record.employee_name ||
                                `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Unknown';
                            const isEditing = editingId === record.attendance_id;
                            const isMissingCheckIn = !record.check_in;
                            const isMissingCheckOut = !record.check_out;

                            return (
                                <View key={record.attendance_id} style={styles.recordCard}>
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
                                                <Text style={styles.employeeDate}>
                                                    {format(new Date(record.date), 'MMM dd, yyyy')}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.issueBadge}>
                                            <Icon name="alert-circle" size={12} color="#F97316" />
                                            <Text style={styles.issueText}>
                                                {isMissingCheckIn && isMissingCheckOut ? 'No punches' :
                                                    isMissingCheckIn ? 'No check-in' : 'No check-out'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Time Display/Edit */}
                                    <View style={styles.timeSection}>
                                        <View style={styles.timeBox}>
                                            <Text style={styles.timeLabel}>CHECK IN</Text>
                                            {isEditing ? (
                                                <TextInput
                                                    style={styles.timeInput}
                                                    value={editCheckIn}
                                                    onChangeText={setEditCheckIn}
                                                    placeholder="09:00"
                                                    placeholderTextColor={Colors.text.tertiary}
                                                />
                                            ) : (
                                                <View style={styles.timeValueRow}>
                                                    <Text style={[
                                                        styles.timeValue,
                                                        isMissingCheckIn && styles.timeValueMissing
                                                    ]}>
                                                        {formatTime(record.check_in)}
                                                    </Text>
                                                    {isMissingCheckIn && (
                                                        <Icon name="alert-triangle" size={14} color="#F97316" />
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.timeBox}>
                                            <Text style={styles.timeLabel}>CHECK OUT</Text>
                                            {isEditing ? (
                                                <TextInput
                                                    style={styles.timeInput}
                                                    value={editCheckOut}
                                                    onChangeText={setEditCheckOut}
                                                    placeholder="18:00"
                                                    placeholderTextColor={Colors.text.tertiary}
                                                />
                                            ) : (
                                                <View style={styles.timeValueRow}>
                                                    <Text style={[
                                                        styles.timeValue,
                                                        isMissingCheckOut && styles.timeValueMissing
                                                    ]}>
                                                        {formatTime(record.check_out)}
                                                    </Text>
                                                    {isMissingCheckOut && (
                                                        <Icon name="alert-triangle" size={14} color="#F97316" />
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.actionButtons}>
                                        {isEditing ? (
                                            <>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.saveButton]}
                                                    onPress={handleSave}
                                                >
                                                    <Icon name="check" size={16} color="#FFFFFF" />
                                                    <Text style={styles.saveButtonText}>Save</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.cancelButton]}
                                                    onPress={() => setEditingId(null)}
                                                >
                                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.fixButton]}
                                                    onPress={() => handleEdit(record)}
                                                >
                                                    <Icon name="edit-2" size={14} color="#137FEC" />
                                                    <Text style={styles.fixButtonText}>Fix & Save</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.ignoreButton]}
                                                    onPress={() => handleIgnore(record.attendance_id)}
                                                >
                                                    <Text style={styles.ignoreButtonText}>Ignore</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                </View>
                            );
                        })}

                        {/* Empty State */}
                        {activeRecords.length === 0 && !error && (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Icon name="check-circle" size={48} color="#10B981" />
                                </View>
                                <Text style={styles.emptyTitle}>All Clear!</Text>
                                <Text style={styles.emptyText}>
                                    No {activeTab === 'missing' ? 'missing punches' :
                                        activeTab === 'overtime' ? 'overtime alerts' : 'pending reviews'} found
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
    refreshButton: {
        padding: Spacing.sm,
        marginRight: -Spacing.sm,
    },
    statsContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
    },
    statCard: {
        width: 140,
        padding: Spacing.lg,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginRight: Spacing.md,
        alignItems: 'center',
        ...Shadows.sm,
    },
    statCardActive: {
        borderColor: '#137FEC',
        borderWidth: 2,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    statValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    statLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 4,
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    countBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    countText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: '#4F46E5',
    },
    recordCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: Spacing.lg,
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
    employeeDate: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    issueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF7ED',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    issueText: {
        fontSize: 10,
        fontWeight: Typography.weight.semibold,
        color: '#F97316',
    },
    timeSection: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    timeBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    timeValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    timeValue: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    timeValueMissing: {
        color: Colors.text.tertiary,
    },
    timeInput: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
        padding: 0,
        margin: 0,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
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
    fixButton: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    fixButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#137FEC',
    },
    ignoreButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    ignoreButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    saveButton: {
        backgroundColor: '#137FEC',
    },
    saveButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: '#FFFFFF',
    },
    cancelButton: {
        backgroundColor: '#F1F5F9',
    },
    cancelButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['5xl'],
    },
    emptyIcon: {
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
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
