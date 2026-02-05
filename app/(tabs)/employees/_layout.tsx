// Employees stack layout
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function EmployeesLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background.secondary },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
