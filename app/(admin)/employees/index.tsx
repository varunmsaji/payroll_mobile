// Employees list screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Badge, getStatusVariant, Loading } from '../../../components/ui';
import { Icon } from '../../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { apiClient } from '../../../lib/api';
import { Employee } from '../../../types';

export default function EmployeesScreen() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await apiClient.employees.list();
            const data = response.data.items || response.data || [];
            setEmployees(data);
            setFilteredEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
            setFilteredEmployees([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = employees.filter(
                (emp) =>
                    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query) ||
                    emp.email.toLowerCase().includes(query) ||
                    emp.department?.toLowerCase().includes(query)
            );
            setFilteredEmployees(filtered);
        } else {
            setFilteredEmployees(employees);
        }
    }, [searchQuery, employees]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchEmployees();
        setRefreshing(false);
    }, [fetchEmployees]);

    const renderEmployee = ({ item }: { item: Employee }) => (
        <Card
            style={styles.employeeCard}
            onPress={() => router.push(`/(tabs)/employees/${item.employee_id}`)}
        >
            <View style={styles.employeeRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.first_name?.[0]}{item.last_name?.[0]}
                    </Text>
                </View>
                <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>
                        {item.first_name} {item.last_name}
                    </Text>
                    <Text style={styles.employeeRole}>{item.position || 'No position'}</Text>
                    <Text style={styles.employeeDept}>{item.department || 'No department'}</Text>
                </View>
                <View style={styles.employeeActions}>
                    <Badge
                        text={item.status}
                        variant={getStatusVariant(item.status)}
                        size="sm"
                    />
                    <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                </View>
            </View>
        </Card>
    );

    if (isLoading) {
        return <Loading fullScreen text="Loading employees..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Employees</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Icon name="plus" size={24} color={Colors.text.inverse} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color={Colors.text.tertiary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search employees..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close" size={20} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Employee List */}
            <FlatList
                data={filteredEmployees}
                keyExtractor={(item) => item.employee_id.toString()}
                renderItem={renderEmployee}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="users" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No employees found</Text>
                    </View>
                }
            />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.primary,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.size.base,
        color: Colors.text.primary,
        paddingVertical: Spacing.md,
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
        gap: Spacing.md,
        paddingBottom: Spacing['5xl'],
    },
    employeeCard: {
        padding: Spacing.md,
    },
    employeeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.primary[700],
    },
    employeeInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    employeeRole: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    employeeDept: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    employeeActions: {
        alignItems: 'flex-end',
        gap: Spacing.sm,
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
