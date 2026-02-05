// Root layout with AuthProvider and navigation
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="(hr)" />
                <Stack.Screen name="(employee)" />
            </Stack>
        </AuthProvider>
    );
}
