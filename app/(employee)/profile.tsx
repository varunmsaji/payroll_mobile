// Profile Screen - Employee profile settings
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
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../lib/auth';

export default function ProfileScreen() {
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
                    onPress: logout,
                },
            ]
        );
    };

    const menuItems = [
        {
            icon: 'users',
            title: 'Personal Information',
            subtitle: 'View your profile details',
            onPress: () => {
                Alert.alert('Coming Soon', 'This feature will be available soon.');
            },
        },
        {
            icon: 'settings',
            title: 'Preferences',
            subtitle: 'Notification and app settings',
            onPress: () => {
                Alert.alert('Coming Soon', 'This feature will be available soon.');
            },
        },
        {
            icon: 'help-circle',
            title: 'Help & Support',
            subtitle: 'Get help or contact support',
            onPress: () => {
                Alert.alert('Coming Soon', 'This feature will be available soon.');
            },
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Icon name="users" size={32} color={Colors.text.inverse} />
                        </View>
                    </View>
                    <Text style={styles.userName}>Employee</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                            {user?.role?.toUpperCase() || 'EMPLOYEE'}
                        </Text>
                    </View>
                    <Text style={styles.employeeId}>
                        Employee ID: {user?.employee_id || 'N/A'}
                    </Text>
                </View>

                {/* Menu Items */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index < menuItems.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuIconContainer}>
                                <Icon name={item.icon} size={20} color={Colors.primary[600]} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>PayrollPro</Text>
                    <Text style={styles.infoVersion}>Version 1.0.0</Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={20} color={Colors.accent.red} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
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
        padding: Spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    title: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
    },
    profileCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    roleBadge: {
        backgroundColor: Colors.primary[100],
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.sm,
    },
    roleText: {
        fontSize: Typography.size.xs,
        fontWeight: '600',
        color: Colors.primary[700],
    },
    employeeId: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    menuCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    menuSubtitle: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    infoCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    infoTitle: {
        fontSize: Typography.size.md,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    infoVersion: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.accent.red + '10',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    logoutText: {
        fontSize: Typography.size.md,
        fontWeight: '600',
        color: Colors.accent.red,
    },
});
