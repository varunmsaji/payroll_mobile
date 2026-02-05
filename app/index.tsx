import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth';
import { Colors } from '../constants/theme';

export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary[600]} />
            </View>
        );
    }

    // if (isAuthenticated) {
    //     return <Redirect href="/(tabs)/dashboard" />;
    // }

    return (
        <View style={styles.container}>
            <Text style={{ fontSize: 24 }}>Debug: Loading...</Text>
            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary[600]} />
            ) : (
                <Text>Auth State: {isAuthenticated ? 'Logged In' : 'Logged Out'}</Text>
            )}
        </View>
    );
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
