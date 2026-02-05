// Settings index screen
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card } from '../../../components/ui';
import { Icon } from '../../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { useAuth } from '../../../lib/auth';

interface SettingsItemProps {
    title: string;
    subtitle?: string;
    icon: string;
    onPress: () => void;
    showBadge?: boolean;
    danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
    title,
    subtitle,
    icon,
    onPress,
    showBadge,
    danger,
}) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
        <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
            <Icon
                name={icon}
                size={20}
                color={danger ? Colors.error.main : Colors.primary[600]}
            />
        </View>
        <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, danger && styles.itemTitleDanger]}>{title}</Text>
            {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
        </View>
        {showBadge && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>New</Text>
            </View>
        )}
        <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
);

export default function SettingsScreen() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'admin': return 'Administrator';
            case 'hr': return 'HR Manager';
            case 'employee': return 'Employee';
            default: return 'User';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                </View>

                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Icon name="user" size={28} color={Colors.text.inverse} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{getRoleLabel()}</Text>
                            <Text style={styles.profileRole}>User ID: {user?.user_id}</Text>
                        </View>
                        <TouchableOpacity>
                            <Icon name="edit" size={20} color={Colors.primary[600]} />
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Policy Settings */}
                {(user?.role === 'admin' || user?.role === 'hr') && (
                    <>
                        <Text style={styles.sectionTitle}>Policies & Configuration</Text>
                        <Card style={styles.settingsCard}>
                            <SettingsItem
                                title="Payroll Policy"
                                subtitle="Overtime, deductions, encashment"
                                icon="wallet"
                                onPress={() => router.push('/(tabs)/settings/payroll-policy')}
                            />
                            <View style={styles.divider} />
                            <SettingsItem
                                title="Attendance Policy"
                                subtitle="Work hours, grace period, overtime"
                                icon="calendar"
                                onPress={() => router.push('/(tabs)/settings/attendance-policy')}
                            />
                            <View style={styles.divider} />
                            <SettingsItem
                                title="Workflows"
                                subtitle="Approval workflows"
                                icon="workflow"
                                onPress={() => router.push('/(tabs)/settings/workflows')}
                            />
                            <View style={styles.divider} />
                            <SettingsItem
                                title="Attendance Reconciliation"
                                subtitle="Fix attendance records"
                                icon="reconciliation"
                                onPress={() => router.push('/(tabs)/settings/attendance-reconciliation')}
                            />
                        </Card>
                    </>
                )}

                {/* App Settings */}
                <Text style={styles.sectionTitle}>App Settings</Text>
                <Card style={styles.settingsCard}>
                    <SettingsItem
                        title="Notifications"
                        subtitle="Push notifications, alerts"
                        icon="info"
                        onPress={() => { }}
                    />
                    <View style={styles.divider} />
                    <SettingsItem
                        title="Appearance"
                        subtitle="Theme, display options"
                        icon="eye"
                        onPress={() => { }}
                    />
                </Card>

                {/* Account */}
                <Text style={styles.sectionTitle}>Account</Text>
                <Card style={styles.settingsCard}>
                    <SettingsItem
                        title="Logout"
                        icon="logout"
                        onPress={handleLogout}
                        danger
                    />
                </Card>

                {/* App Version */}
                <Text style={styles.versionText}>PayrollPro v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    scrollContent: {
        paddingBottom: Spacing['5xl'],
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    title: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
    },
    profileCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    profileRole: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    settingsCard: {
        marginHorizontal: Spacing.lg,
        padding: 0,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerDanger: {
        backgroundColor: Colors.error.light,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
    },
    itemTitleDanger: {
        color: Colors.error.main,
    },
    itemSubtitle: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    badge: {
        backgroundColor: Colors.primary[600],
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    badgeText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.inverse,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.light,
        marginHorizontal: Spacing.lg,
    },
    versionText: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginTop: Spacing.xl,
    },
});
