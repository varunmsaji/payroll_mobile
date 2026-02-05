// Settings stack layout
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background.secondary },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="payroll-policy" />
            <Stack.Screen name="attendance-policy" />
            <Stack.Screen name="workflows" />
            <Stack.Screen name="attendance-reconciliation" />
        </Stack>
    );
}
