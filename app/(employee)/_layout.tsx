// Employee tab navigator layout
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Colors, Typography } from '../../constants/theme';
import { useAuth } from '../../lib/auth';

export default function EmployeeLayout() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const insets = useSafeAreaInsets();

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary[600]} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    // Only allow employee users
    if (user?.role !== 'employee') {
        return <Redirect href="/login" />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary[600],
                tabBarInactiveTintColor: Colors.text.tertiary,
                tabBarStyle: {
                    backgroundColor: Colors.background.primary,
                    borderTopColor: Colors.border.light,
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 8),
                    height: 65 + Math.max(insets.bottom - 8, 0),
                },
                tabBarLabelStyle: {
                    fontSize: Typography.size.xs,
                    fontWeight: '500' as const,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="my-attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="my-payslips"
                options={{
                    title: 'Payslips',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="wallet" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="my-leaves"
                options={{
                    title: 'Leaves',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="users" size={size} color={color} />
                    ),
                }}
            />
            {/* Hidden tabs */}
            <Tabs.Screen
                name="my-shift"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background.primary,
    },
});
