// HR tab navigator layout
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Icon } from '../../components/Icon';
import { Colors, Typography } from '../../constants/theme';
import { useAuth } from '../../lib/auth';

export default function HRLayout() {
    const { isAuthenticated, isLoading, user } = useAuth();

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

    // Only allow HR users
    if (user?.role !== 'hr') {
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
                    paddingBottom: 8,
                    height: 65,
                },
                tabBarLabelStyle: {
                    fontSize: Typography.size.xs,
                    fontWeight: '500' as const,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="employees"
                options={{
                    title: 'Employees',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="users" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="payroll"
                options={{
                    title: 'Payroll',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="wallet" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaves"
                options={{
                    title: 'Leaves',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="calendar" size={size} color={color} />
                    ),
                }}
            />
            {/* Hidden tabs - not shown in tab bar */}
            <Tabs.Screen
                name="shifts"
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
