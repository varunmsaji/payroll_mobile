// Auth context for PayrollPro mobile app
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage } from './storage';
import { apiClient } from './api';
import { AuthUser, UserRole } from '../types';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore auth state from secure storage on mount
    useEffect(() => {
        const restoreAuth = async () => {
            try {
                const token = await storage.getToken();
                const storedUser = await storage.getUser<AuthUser>();

                if (token && storedUser) {
                    // Validate token by calling /auth/me
                    try {
                        const response = await apiClient.auth.me();
                        setUser(response.data);
                    } catch {
                        // Token invalid, clear storage
                        await storage.clearAuth();
                    }
                }
            } catch (error) {
                console.error('Error restoring auth state:', error);
                await storage.clearAuth();
            } finally {
                setIsLoading(false);
            }
        };

        restoreAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await apiClient.auth.login(email, password);
            const { access_token, user: userData } = response.data;

            // Store token and user data
            await storage.setToken(access_token);
            await storage.setUser(userData);

            setUser(userData);

            return { success: true };
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Login failed. Please try again.';
            return { success: false, error: message };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiClient.auth.logout();
        } catch {
            // Ignore logout API errors
        } finally {
            await storage.clearAuth();
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper function to get redirect path based on role
export const getRedirectPathForRole = (role: UserRole): string => {
    switch (role) {
        case 'admin':
        case 'hr':
            return '/(tabs)/dashboard';
        case 'employee':
            return '/(tabs)/dashboard';
        default:
            return '/(tabs)/dashboard';
    }
};

export default AuthProvider;
