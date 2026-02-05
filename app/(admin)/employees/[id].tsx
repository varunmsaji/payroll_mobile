// Employee detail screen
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Card, Badge, getStatusVariant, Loading, Button } from '../../../components/ui';
import { Icon } from '../../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { apiClient } from '../../../lib/api';
import { Employee } from '../../../types';
import { format } from 'date-fns';

interface InfoRowProps {
    icon: string;
    label: string;
    value: string | undefined;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <Icon name={icon} size={20} color={Colors.text.tertiary} />
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || 'Not set'}</Text>
        </View>
    </View>
);

export default function EmployeeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const response = await apiClient.employees.get(Number(id));
                setEmployee(response.data);
            } catch (error) {
                console.error('Error fetching employee:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchEmployee();
        }
    }, [id]);

    if (isLoading) {
        return <Loading fullScreen text="Loading employee..." />;
    }

    if (!employee) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Icon name="error" size={48} color={Colors.text.tertiary} />
                    <Text style={styles.errorText}>Employee not found</Text>
                    <Button title="Go Back" onPress={() => router.back()} variant="outline" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Employee Details</Text>
                <TouchableOpacity style={styles.editButton}>
                    <Icon name="edit" size={20} color={Colors.primary[600]} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {employee.first_name?.[0]}{employee.last_name?.[0]}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {employee.first_name} {employee.last_name}
                            </Text>
                            <Text style={styles.profileRole}>{employee.position || 'No position'}</Text>
                            <Badge
                                text={employee.status}
                                variant={getStatusVariant(employee.status)}
                                size="sm"
                            />
                        </View>
                    </View>
                </Card>

                {/* Contact Info */}
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <Card style={styles.infoCard}>
                    <InfoRow icon="email" label="Email" value={employee.email} />
                    <View style={styles.divider} />
                    <InfoRow icon="phone" label="Phone" value={employee.phone} />
                </Card>

                {/* Work Info */}
                <Text style={styles.sectionTitle}>Work Information</Text>
                <Card style={styles.infoCard}>
                    <InfoRow icon="building" label="Department" value={employee.department} />
                    <View style={styles.divider} />
                    <InfoRow icon="user" label="Manager" value={employee.manager_name} />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="calendar"
                        label="Date of Joining"
                        value={employee.date_of_joining ? format(new Date(employee.date_of_joining), 'MMM dd, yyyy') : undefined}
                    />
                </Card>

                {/* Salary Info */}
                <Text style={styles.sectionTitle}>Compensation</Text>
                <Card style={styles.infoCard}>
                    <InfoRow
                        icon="money"
                        label="Basic Salary"
                        value={employee.basic_salary ? `₹${employee.basic_salary.toLocaleString()}` : undefined}
                    />
                </Card>

                {/* Actions */}
                <View style={styles.actions}>
                    <Button
                        title="View Attendance"
                        variant="outline"
                        onPress={() => router.push('/(tabs)/attendance')}
                        fullWidth
                    />
                    <Button
                        title="View Payroll"
                        variant="outline"
                        onPress={() => router.push('/(tabs)/payroll')}
                        fullWidth
                    />
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    headerTitle: {
        flex: 1,
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        textAlign: 'center',
    },
    editButton: {
        padding: Spacing.sm,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing['5xl'],
    },
    profileCard: {
        padding: Spacing.xl,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.primary[700],
    },
    profileInfo: {
        flex: 1,
        gap: Spacing.xs,
    },
    profileName: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    profileRole: {
        fontSize: Typography.size.base,
        color: Colors.text.secondary,
    },
    sectionTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
        marginLeft: Spacing.xs,
    },
    infoCard: {
        padding: 0,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
    },
    infoValue: {
        fontSize: Typography.size.base,
        color: Colors.text.primary,
        fontWeight: Typography.weight.medium,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.light,
        marginHorizontal: Spacing.lg,
    },
    actions: {
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.lg,
    },
    errorText: {
        fontSize: Typography.size.lg,
        color: Colors.text.secondary,
    },
});
