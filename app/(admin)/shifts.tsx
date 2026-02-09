// Premium Shifts Management Screen
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';

interface Shift {
    shift_id: number;
    shift_name: string;
    start_time: string;
    end_time: string;
    break_duration?: number;
    description?: string;
    is_active?: boolean;
}

type TabType = 'definitions' | 'roster';

const SHIFT_ICONS: { [key: string]: { icon: string; bgColor: string; iconColor: string } } = {
    'morning': { icon: 'sun', bgColor: '#FFF7ED', iconColor: '#F97316' },
    'evening': { icon: 'moon', bgColor: '#EEF2FF', iconColor: '#6366F1' },
    'night': { icon: 'moon', bgColor: '#F1F5F9', iconColor: '#64748B' },
    'weekend': { icon: 'calendar', bgColor: '#FCE7F3', iconColor: '#DB2777' },
    'default': { icon: 'clock', bgColor: '#DBEAFE', iconColor: '#137FEC' },
};

export default function ShiftsScreen() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('definitions');
    const [error, setError] = useState<string | null>(null);

    const fetchShifts = useCallback(async () => {
        try {
            const response = await apiClient.shifts.list();
            const data = response.data?.items || response.data || [];
            setShifts(Array.isArray(data) ? data : []);
        } catch (err: any) {
            // Silently handle - show empty state
            console.log('Shifts data unavailable');
            setShifts([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchShifts();
    }, [fetchShifts]);

    const getShiftIcon = (shiftName: string) => {
        const lowerName = shiftName?.toLowerCase() || '';
        if (lowerName.includes('morning')) return SHIFT_ICONS.morning;
        if (lowerName.includes('evening')) return SHIFT_ICONS.evening;
        if (lowerName.includes('night')) return SHIFT_ICONS.night;
        if (lowerName.includes('weekend')) return SHIFT_ICONS.weekend;
        return SHIFT_ICONS.default;
    };

    const formatTime = (time: string) => {
        if (!time) return '--:--';
        // Handle HH:MM:SS format
        const parts = time.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
        return time;
    };

    const filteredShifts = shifts.filter(shift =>
        shift.shift_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeShifts = filteredShifts.filter(s => s.is_active !== false);
    const pendingShifts = filteredShifts.filter(s => !s.is_active);

    if (isLoading) {
        return <Loading fullScreen text="Loading shifts..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shifts Management</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Icon name="plus" size={24} color="#137FEC" />
                </TouchableOpacity>
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentedContainer}>
                <View style={styles.segmentedControl}>
                    <View style={[
                        styles.segmentedIndicator,
                        { left: activeTab === 'definitions' ? 4 : '50%' }
                    ]} />
                    <TouchableOpacity
                        style={styles.segmentedButton}
                        onPress={() => setActiveTab('definitions')}
                    >
                        <Text style={[
                            styles.segmentedText,
                            activeTab === 'definitions' && styles.segmentedTextActive
                        ]}>
                            Shift Definitions
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.segmentedButton}
                        onPress={() => setActiveTab('roster')}
                    >
                        <Text style={[
                            styles.segmentedText,
                            activeTab === 'roster' && styles.segmentedTextActive
                        ]}>
                            Daily Roster
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={[1]}
                keyExtractor={() => 'content'}
                renderItem={() => (
                    <>
                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Icon name="search" size={20} color={Colors.text.tertiary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search shifts..."
                                placeholderTextColor={Colors.text.tertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Stats Cards */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.statsContainer}
                        >
                            <View style={[styles.statCard, styles.statCardBlue]}>
                                <View style={styles.statCardHeader}>
                                    <Text style={styles.statCardLabel}>Active</Text>
                                    <Icon name="check-circle" size={18} color="#3B82F6" />
                                </View>
                                <Text style={styles.statCardValue}>{activeShifts.length}</Text>
                                <Text style={styles.statCardSubtext}>Total Definitions</Text>
                            </View>
                            <View style={[styles.statCard, styles.statCardOrange]}>
                                <View style={styles.statCardHeader}>
                                    <Text style={[styles.statCardLabel, { color: '#F97316' }]}>Pending</Text>
                                    <Icon name="clock" size={18} color="#F97316" />
                                </View>
                                <Text style={styles.statCardValue}>{pendingShifts.length}</Text>
                                <Text style={styles.statCardSubtext}>Approval Needed</Text>
                            </View>
                            <View style={[styles.statCard, styles.statCardGreen]}>
                                <View style={styles.statCardHeader}>
                                    <Text style={[styles.statCardLabel, { color: '#10B981' }]}>Coverage</Text>
                                    <Icon name="users" size={18} color="#10B981" />
                                </View>
                                <Text style={styles.statCardValue}>98%</Text>
                                <Text style={styles.statCardSubtext}>Staff Assigned</Text>
                            </View>
                        </ScrollView>

                        {/* Section Header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>All Definitions</Text>
                            <TouchableOpacity style={styles.sortButton}>
                                <Text style={styles.sortButtonText}>Sort by</Text>
                                <Icon name="filter" size={14} color="#137FEC" />
                            </TouchableOpacity>
                        </View>

                        {/* Error State */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-triangle" size={20} color={Colors.error.main} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Shift Cards */}
                        {filteredShifts.map((shift) => {
                            const shiftStyle = getShiftIcon(shift.shift_name);
                            const isActive = shift.is_active !== false;

                            return (
                                <TouchableOpacity
                                    key={shift.shift_id}
                                    style={[styles.shiftCard, !isActive && styles.shiftCardInactive]}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.shiftCardTop}>
                                        <View style={styles.shiftCardLeft}>
                                            <View style={[styles.shiftIcon, { backgroundColor: shiftStyle.bgColor }]}>
                                                <Icon name={shiftStyle.icon} size={20} color={shiftStyle.iconColor} />
                                            </View>
                                            <View>
                                                <Text style={styles.shiftName}>{shift.shift_name}</Text>
                                                <Text style={styles.shiftDescription}>
                                                    {shift.description || 'Standard Shift'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: isActive ? '#D1FAE5' : '#F1F5F9' }
                                        ]}>
                                            <Text style={[
                                                styles.statusBadgeText,
                                                { color: isActive ? '#059669' : '#64748B' }
                                            ]}>
                                                {isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.shiftCardBottom}>
                                        <View style={styles.shiftDetail}>
                                            <Text style={styles.shiftDetailLabel}>TIMING</Text>
                                            <Text style={styles.shiftDetailValue}>
                                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                            </Text>
                                        </View>
                                        <View style={styles.shiftDetail}>
                                            <Text style={styles.shiftDetailLabel}>BREAK</Text>
                                            <Text style={styles.shiftDetailValue}>
                                                {shift.break_duration || 60} min
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.moreButton}>
                                        <Icon name="more-horizontal" size={20} color={Colors.text.tertiary} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Empty State */}
                        {filteredShifts.length === 0 && !error && (
                            <View style={styles.emptyState}>
                                <Icon name="clock" size={48} color={Colors.text.tertiary} />
                                <Text style={styles.emptyText}>No shifts found</Text>
                            </View>
                        )}

                        <View style={{ height: 100 }} />
                    </>
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                <Icon name="plus" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
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
    addButton: {
        padding: Spacing.sm,
        marginRight: -Spacing.sm,
    },
    segmentedContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: BorderRadius.xl,
        padding: 4,
        position: 'relative',
    },
    segmentedIndicator: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.lg,
        ...Shadows.sm,
    },
    segmentedButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        zIndex: 1,
    },
    segmentedText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
    },
    segmentedTextActive: {
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: Spacing.lg,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
        paddingVertical: Spacing.md,
    },
    statsContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
    },
    statCard: {
        width: 128,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        marginRight: Spacing.md,
        borderWidth: 1,
    },
    statCardBlue: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
    },
    statCardOrange: {
        backgroundColor: '#FFF7ED',
        borderColor: '#FDBA74',
    },
    statCardGreen: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statCardLabel: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: '#3B82F6',
    },
    statCardValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    statCardSubtext: {
        fontSize: 10,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sortButtonText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: '#137FEC',
    },
    shiftCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadows.sm,
    },
    shiftCardInactive: {
        opacity: 0.75,
    },
    shiftCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    shiftCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    shiftIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shiftName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    shiftDescription: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: Typography.weight.bold,
        letterSpacing: 0.5,
    },
    shiftCardBottom: {
        flexDirection: 'row',
        gap: Spacing['2xl'],
        marginTop: Spacing.sm,
    },
    shiftDetail: {},
    shiftDetailLabel: {
        fontSize: 10,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
    },
    shiftDetailValue: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    moreButton: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: Spacing.lg,
        padding: Spacing.xs,
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
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#137FEC',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.lg,
    },
});
