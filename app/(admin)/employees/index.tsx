// Premium Employee List Screen
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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/theme';
import { apiClient } from '../../../lib/api';
import { Employee } from '../../../types';

const FILTER_CHIPS = ['All Employees', 'Engineering', 'Design', 'Marketing', 'Human Resources'];

export default function EmployeesScreen() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Employees');
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        try {
            setError(null);
            const response = await apiClient.employees.list();
            const data = response.data?.items || response.data || [];
            setEmployees(Array.isArray(data) ? data : []);
            setFilteredEmployees(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error fetching employees:', err);
            setError('Unable to load employees. Pull to refresh.');
            setEmployees([]);
            setFilteredEmployees([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        let filtered = employees;

        // Apply department filter
        if (activeFilter !== 'All Employees') {
            filtered = filtered.filter(emp =>
                emp.department?.toLowerCase().includes(activeFilter.toLowerCase())
            );
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(emp =>
                `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query) ||
                emp.email?.toLowerCase().includes(query) ||
                emp.position?.toLowerCase().includes(query)
            );
        }

        setFilteredEmployees(filtered);
    }, [searchQuery, employees, activeFilter]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEmployees();
    }, [fetchEmployees]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return '#22C55E';
            case 'on_leave':
            case 'on leave': return '#F59E0B';
            case 'inactive': return '#94A3B8';
            default: return '#94A3B8';
        }
    };

    const getDepartmentColor = (department: string) => {
        const colors: { [key: string]: { bg: string; text: string } } = {
            'engineering': { bg: '#DBEAFE', text: '#1D4ED8' },
            'design': { bg: '#F3E8FF', text: '#7C3AED' },
            'marketing': { bg: '#D1FAE5', text: '#059669' },
            'human resources': { bg: '#FFE4E6', text: '#E11D48' },
            'hr': { bg: '#FFE4E6', text: '#E11D48' },
            'product': { bg: '#FEF3C7', text: '#D97706' },
        };
        const key = department?.toLowerCase() || '';
        return colors[key] || { bg: '#F1F5F9', text: '#475569' };
    };

    // Separate recent hires (last 30 days simulated by first 2 employees)
    const recentHires = filteredEmployees.slice(0, 2);
    const allStaff = filteredEmployees.slice(2);

    const renderEmployeeCard = (item: Employee, isRecent: boolean = false) => (
        <TouchableOpacity
            key={item.employee_id}
            style={[
                styles.employeeCard,
                item.status?.toLowerCase() === 'on leave' && styles.employeeCardFaded
            ]}
            onPress={() => router.push(`/(admin)/employees/${item.employee_id}`)}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                {/* Avatar with status indicator */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {item.first_name?.[0]}{item.last_name?.[0]}
                        </Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                </View>

                {/* Employee Info */}
                <View style={styles.employeeInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.employeeName} numberOfLines={1}>
                            {item.first_name} {item.last_name}
                        </Text>
                        <TouchableOpacity style={styles.moreButton}>
                            <Icon name="more-horizontal" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.employeeRole} numberOfLines={1}>
                        {item.position || 'No position'}
                    </Text>

                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        {item.department && (
                            <View style={[
                                styles.departmentBadge,
                                { backgroundColor: getDepartmentColor(item.department).bg }
                            ]}>
                                <Text style={[
                                    styles.departmentText,
                                    { color: getDepartmentColor(item.department).text }
                                ]}>
                                    {item.department}
                                </Text>
                            </View>
                        )}
                        {item.status?.toLowerCase() === 'on leave' && (
                            <View style={styles.onLeaveBadge}>
                                <Text style={styles.onLeaveText}>On Leave</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return <Loading fullScreen text="Loading employees..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.menuButton}>
                        <Icon name="menu" size={28} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>PayrollPro</Text>
                        <Text style={styles.headerSubtitle}>Admin Dashboard</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Icon name="bell" size={24} color={Colors.text.primary} />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>A</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={[1]} // Single item to render all content
                keyExtractor={() => 'content'}
                renderItem={() => (
                    <>
                        {/* Page Title & Add Button */}
                        <View style={styles.titleSection}>
                            <View>
                                <Text style={styles.pageTitle}>Employees</Text>
                                <Text style={styles.pageSubtitle}>{employees.length} active members</Text>
                            </View>
                            <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                                <Icon name="plus" size={20} color="#FFFFFF" />
                                <Text style={styles.addButtonText}>Add New</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={styles.searchContainer}>
                            <Icon name="search" size={20} color={Colors.text.tertiary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name, email, or role..."
                                placeholderTextColor={Colors.text.tertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <TouchableOpacity style={styles.filterIconButton}>
                                <Icon name="settings" size={20} color={Colors.text.tertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Filter Chips */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.chipsContainer}
                            contentContainerStyle={styles.chipsContent}
                        >
                            {FILTER_CHIPS.map((chip) => (
                                <TouchableOpacity
                                    key={chip}
                                    style={[
                                        styles.chip,
                                        activeFilter === chip && styles.chipActive
                                    ]}
                                    onPress={() => setActiveFilter(chip)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        activeFilter === chip && styles.chipTextActive
                                    ]}>
                                        {chip}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Error State */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-triangle" size={20} color={Colors.error.main} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Recent Hires Section */}
                        {recentHires.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>RECENT HIRES</Text>
                                    <TouchableOpacity>
                                        <Text style={styles.viewAllText}>View All</Text>
                                    </TouchableOpacity>
                                </View>
                                {recentHires.map(emp => renderEmployeeCard(emp, true))}
                            </View>
                        )}

                        {/* All Staff Section */}
                        {allStaff.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>ALL STAFF</Text>
                                </View>
                                {allStaff.map(emp => renderEmployeeCard(emp, false))}
                            </View>
                        )}

                        {/* Empty State */}
                        {filteredEmployees.length === 0 && !error && (
                            <View style={styles.emptyState}>
                                <Icon name="users" size={48} color={Colors.text.tertiary} />
                                <Text style={styles.emptyText}>No employees found</Text>
                            </View>
                        )}

                        {/* Loading indicator at bottom */}
                        <View style={styles.bottomPadding} />
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
        backgroundColor: '#F6F7F8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    menuButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
    },
    headerTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    headerSubtitle: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    profileAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    profileAvatarText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: Colors.primary[700],
    },
    titleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing.lg,
    },
    pageTitle: {
        fontSize: Typography.size['2xl'],
        fontWeight: '900',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: '#137FEC',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadows.lg,
    },
    addButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.bold,
        color: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
        paddingVertical: Spacing.sm,
    },
    filterIconButton: {
        padding: Spacing.xs,
    },
    chipsContainer: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    chipsContent: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: Colors.border.light,
        marginRight: Spacing.sm,
    },
    chipActive: {
        backgroundColor: Colors.text.primary,
        borderColor: Colors.text.primary,
    },
    chipText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    chipTextActive: {
        color: '#FFFFFF',
        fontWeight: Typography.weight.bold,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.bold,
        color: Colors.text.tertiary,
        letterSpacing: 1,
    },
    viewAllText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: '#137FEC',
    },
    employeeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadows.sm,
    },
    employeeCardFaded: {
        opacity: 0.75,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.secondary[200],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.text.secondary,
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    employeeInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    employeeName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        flex: 1,
    },
    moreButton: {
        padding: Spacing.xs,
    },
    employeeRole: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    departmentBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    departmentText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
    },
    onLeaveBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    onLeaveText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.error.light,
        marginHorizontal: Spacing.xl,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.md,
    },
    errorText: {
        fontSize: Typography.size.sm,
        color: Colors.error.dark,
        flex: 1,
    },
    bottomPadding: {
        height: 100,
    },
});
