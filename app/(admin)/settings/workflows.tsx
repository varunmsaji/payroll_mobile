// Workflows screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Badge, getStatusVariant, Loading, Modal } from '../../../components/ui';
import { Icon } from '../../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { apiClient } from '../../../lib/api';
import { Workflow } from '../../../types';

export default function WorkflowsScreen() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

    const fetchWorkflows = useCallback(async () => {
        try {
            const response = await apiClient.workflows.list();
            setWorkflows(response.data.items || response.data || []);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            setWorkflows([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchWorkflows();
        setRefreshing(false);
    }, [fetchWorkflows]);

    const getWorkflowTypeLabel = (type: string) => {
        switch (type) {
            case 'leave_approval': return 'Leave Approval';
            case 'expense_approval': return 'Expense Approval';
            case 'timesheet_approval': return 'Timesheet Approval';
            default: return type;
        }
    };

    const renderWorkflow = ({ item }: { item: Workflow }) => (
        <Card style={styles.workflowCard} onPress={() => setSelectedWorkflow(item)}>
            <View style={styles.workflowRow}>
                <View style={styles.workflowIcon}>
                    <Icon name="workflow" size={24} color={Colors.primary[600]} />
                </View>
                <View style={styles.workflowInfo}>
                    <Text style={styles.workflowName}>{item.workflow_name}</Text>
                    <Text style={styles.workflowType}>{getWorkflowTypeLabel(item.workflow_type)}</Text>
                </View>
                <Badge
                    text={item.is_active ? 'Active' : 'Inactive'}
                    variant={item.is_active ? 'success' : 'neutral'}
                    size="sm"
                />
            </View>
            {item.description && (
                <Text style={styles.workflowDescription} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
        </Card>
    );

    if (isLoading) {
        return <Loading fullScreen text="Loading workflows..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Workflows</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Icon name="plus" size={20} color={Colors.primary[600]} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={workflows}
                keyExtractor={(item) => item.workflow_id.toString()}
                renderItem={renderWorkflow}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="workflow" size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyText}>No workflows configured</Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            <Modal
                visible={!!selectedWorkflow}
                onClose={() => setSelectedWorkflow(null)}
                title="Workflow Details"
            >
                {selectedWorkflow && (
                    <View style={styles.modalContent}>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Name</Text>
                            <Text style={styles.modalValue}>{selectedWorkflow.workflow_name}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Type</Text>
                            <Text style={styles.modalValue}>{getWorkflowTypeLabel(selectedWorkflow.workflow_type)}</Text>
                        </View>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Status</Text>
                            <Badge
                                text={selectedWorkflow.is_active ? 'Active' : 'Inactive'}
                                variant={selectedWorkflow.is_active ? 'success' : 'neutral'}
                            />
                        </View>
                        {selectedWorkflow.description && (
                            <View style={styles.modalFullRow}>
                                <Text style={styles.modalLabel}>Description</Text>
                                <Text style={styles.modalValue}>{selectedWorkflow.description}</Text>
                            </View>
                        )}
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
    listContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing['5xl'],
        gap: Spacing.md,
    },
    workflowCard: {
        padding: Spacing.lg,
    },
    workflowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    workflowIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    workflowInfo: {
        flex: 1,
    },
    workflowName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    workflowType: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    workflowDescription: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        marginTop: Spacing.md,
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
});
