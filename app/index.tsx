import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth, getRedirectPathForRole } from '../lib/auth';
import { Colors } from '../constants/theme';

export default function Index() {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary[600]} />
            </View>
        );
    }

    if (isAuthenticated && user) {
        const redirectPath = getRedirectPathForRole(user.role);
        return <Redirect href={redirectPath as any} />;
    }

    return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
