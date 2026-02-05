// Login screen
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/auth';
import { Button, Input, Toast } from '../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Icon } from '../components/Icon';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        setError(null);

        console.log('Attempting login for:', email.trim());
        const result = await login(email.trim(), password);

        if (result.success) {
            router.replace('/(tabs)/dashboard');
        } else {
            setError(result.error || 'Login failed');
        }

        setIsLoading(false);
    };

    return (
        <LinearGradient
            colors={[Colors.primary[600], Colors.primary[800]]}
            style={styles.gradient}
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Icon name="wallet" size={48} color={Colors.text.inverse} />
                        </View>
                        <Text style={styles.title}>PayrollPro</Text>
                        <Text style={styles.subtitle}>HR Management System</Text>
                    </View>

                    {/* Login Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Welcome Back</Text>
                        <Text style={styles.cardSubtitle}>Sign in to continue</Text>

                        <View style={styles.form}>
                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                leftIcon="email"
                            />

                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                leftIcon="eye"
                            />

                            <Button
                                title={isLoading ? 'Signing in...' : 'Sign In'}
                                onPress={handleLogin}
                                loading={isLoading}
                                fullWidth
                                size="lg"
                            />
                        </View>

                        {/* Demo credentials hint */}
                        <View style={styles.hint}>
                            <Text style={styles.hintText}>Demo credentials:</Text>
                            <Text style={styles.hintCredential}>admin@example.com / admin123</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Error Toast */}
            <Toast
                visible={!!error}
                type="error"
                message={error || ''}
                onDismiss={() => setError(null)}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius['2xl'],
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.size['3xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.text.inverse,
    },
    subtitle: {
        fontSize: Typography.size.base,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: Spacing.xs,
    },
    card: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
    },
    cardTitle: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.text.primary,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: Typography.size.base,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginTop: Spacing.xs,
        marginBottom: Spacing.xl,
    },
    form: {
        gap: Spacing.sm,
    },
    hint: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: Colors.secondary[50],
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    hintText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    hintCredential: {
        fontSize: Typography.size.sm,
        color: Colors.primary[600],
        fontWeight: Typography.weight.medium,
        marginTop: Spacing.xs,
    },
});
