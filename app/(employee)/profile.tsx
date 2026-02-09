// Profile Screen - Premium Settings UI
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Icon } from '../../components/Icon';
import { Colors, Shadows } from '../../constants/theme';
import { useAuth } from '../../lib/auth';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: () => logout() },
            ]
        );
    };

    const fullName = `${user?.first_name || 'Employee'} ${user?.last_name || ''}`.trim();
    const department = (user as any)?.department || 'General';
    const employeeId = user?.employee_id ? `#EMP-${user.employee_id}` : '#EMP-0000';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.first_name || 'User'}` }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Icon name="edit-2" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{fullName}</Text>
                    <View style={styles.departmentBadge}>
                        <Text style={styles.departmentText}>{department} Dept</Text>
                    </View>
                    <Text style={styles.employeeId}>ID: {employeeId}</Text>
                </View>

                {/* Schedule Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Schedule</Text>
                    <View style={styles.scheduleCard}>
                        <View style={styles.scheduleRow}>
                            <View style={styles.scheduleItem}>
                                <View style={styles.scheduleIcon}>
                                    <Icon name="calendar" size={20} color={Colors.primary[600]} />
                                </View>
                                <View>
                                    <Text style={styles.scheduleLabel}>WORK WEEK</Text>
                                    <Text style={styles.scheduleValue}>Mon - Fri</Text>
                                </View>
                            </View>
                            <View style={styles.scheduleDivider} />
                            <View style={styles.scheduleItem}>
                                <View style={styles.scheduleIcon}>
                                    <Icon name="clock" size={20} color={Colors.primary[600]} />
                                </View>
                                <View>
                                    <Text style={styles.scheduleLabel}>HOURS</Text>
                                    <Text style={styles.scheduleValue}>09:00 AM - 05:00 PM</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.menuCard}>
                        {/* Dark Mode */}
                        <View style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={styles.menuIcon}>
                                    <Icon name="moon" size={20} color={Colors.text.secondary} />
                                </View>
                                <Text style={styles.menuLabel}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#e2e8f0', true: Colors.primary[600] }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.menuDivider} />

                        {/* Push Notifications */}
                        <View style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={styles.menuIcon}>
                                    <Icon name="bell" size={20} color={Colors.text.secondary} />
                                </View>
                                <Text style={styles.menuLabel}>Push Notifications</Text>
                            </View>
                            <Switch
                                value={pushNotifications}
                                onValueChange={setPushNotifications}
                                trackColor={{ false: '#e2e8f0', true: Colors.primary[600] }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.menuDivider} />

                        {/* Email Alerts */}
                        <TouchableOpacity style={styles.menuItemLink}>
                            <View style={styles.menuItemLeft}>
                                <View style={styles.menuIcon}>
                                    <Icon name="mail" size={20} color={Colors.text.secondary} />
                                </View>
                                <Text style={styles.menuLabel}>Email Alerts</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.menuCard}>
                        {/* Change Password */}
                        <TouchableOpacity style={styles.menuItemLink}>
                            <View style={styles.menuItemLeft}>
                                <View style={styles.menuIcon}>
                                    <Icon name="lock" size={20} color={Colors.text.secondary} />
                                </View>
                                <Text style={styles.menuLabel}>Change Password</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        {/* Terms of Service */}
                        <TouchableOpacity style={styles.menuItemLink}>
                            <View style={styles.menuItemLeft}>
                                <View style={styles.menuIcon}>
                                    <Icon name="file-text" size={20} color={Colors.text.secondary} />
                                </View>
                                <Text style={styles.menuLabel}>Terms of Service</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Icon name="log-out" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>App Version 1.0.0</Text>
                </View>

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
            </ScrollView>
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
        backgroundColor: '#f6f7f8',
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 24,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 4,
        borderColor: '#fff',
        ...Shadows.md,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        ...Shadows.sm,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    departmentBadge: {
        backgroundColor: 'rgba(19, 127, 236, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 8,
    },
    departmentText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.primary[600],
    },
    employeeId: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.tertiary,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text.primary,
        paddingLeft: 4,
    },
    scheduleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scheduleItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    scheduleIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scheduleLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    scheduleValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    scheduleDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 16,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 64,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        ...Shadows.sm,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EF4444',
    },
    versionText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginTop: 16,
    },
});
