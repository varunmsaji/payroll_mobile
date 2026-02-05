// Payroll Policy screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Badge, Loading, Button, Modal } from '../../../components/ui';
import { Icon } from '../../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { apiClient } from '../../../lib/api';
import { PayrollPolicy } from '../../../types';

export default function PayrollPolicyScreen() {
    const [policies, setPolicies] = useState<PayrollPolicy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<PayrollPolicy | null>(null);

    const fetchPolicies = useCallback(async () => {
        try {
            const response = await apiClient.policies.payroll.list();
            setPolicies(response.data.items || response.data || []);
        } catch (error) {
            console.error('Error fetching policies:', error);
            setPolicies([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPolicies();
        setRefreshing(false);
    }, [fetchPolicies]);

    if (isLoading) {
        return <Loading fullScreen text="Loading policies..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Payroll Policies</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Icon name="plus" size={20} color={Colors.primary[600]} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {policies.map((policy) => (
                    <Card
                        key={policy.policy_id}
                        style={styles.policyCard}
                        onPress={() => setSelectedPolicy(policy)}
                    >
                        <View style={styles.policyHeader}>
                            <View style={styles.policyInfo}>
                                <Text style={styles.policyName}>{policy.name}</Text>
                                {policy.is_default && (
                                    <Badge text="Default" variant="success" size="sm" />
                                )}
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </View>
                        <View style={styles.policyDetails}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>OT Multiplier</Text>
                                <Text style={styles.detailValue}>{policy.overtime_multiplier}x</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Late Deduction</Text>
                                <Text style={styles.detailValue}>₹{policy.late_deduction_per_instance}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Absent/Day</Text>
                                <Text style={styles.detailValue}>₹{policy.absent_deduction_per_day}</Text>
                            </View>
                        </View>
                    </Card>
                ))}

                {policies.length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="policy" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No payroll policies configured</Text>
                    </View>
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={!!selectedPolicy}
                onClose={() => setSelectedPolicy(null)}
                title="Policy Details"
            >
                {selectedPolicy && (
                    <View style={styles.modalContent}>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Policy Name</Text>
                            <Text style={styles.modalValue}>{selectedPolicy.name}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Default</Text>
                            <Text style={styles.modalValue}>{selectedPolicy.is_default ? 'Yes' : 'No'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Overtime Multiplier</Text>
                            <Text style={styles.modalValue}>{selectedPolicy.overtime_multiplier}x</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Late Deduction</Text>
                            <Text style={styles.modalValue}>₹{selectedPolicy.late_deduction_per_instance} per instance</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Absent Deduction</Text>
                            <Text style={styles.modalValue}>₹{selectedPolicy.absent_deduction_per_day} per day</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Leave Encashment</Text>
                            <Text style={styles.modalValue}>
                                {selectedPolicy.leave_encashment_enabled ? 'Enabled' : 'Disabled'}
                            </Text>
                        </View>
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
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    title: {
        flex: 1,
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        marginLeft: Spacing.sm,
    },
    addButton: {
        padding: Spacing.sm,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing['5xl'],
        gap: Spacing.md,
    },
    policyCard: {
        padding: Spacing.lg,
    },
    policyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    policyInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    policyName: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    policyDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: Colors.background.secondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
    },
    detailValue: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
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
    divider: {
        height: 1,
        backgroundColor: Colors.border.light,
        marginVertical: Spacing.sm,
    },
});
