// PayrollPro Theme Constants
// Matching the web app's indigo/blue color palette

import { TextStyle } from 'react-native';

export const Colors = {
    // Primary palette (indigo)
    primary: {
        50: '#EEF2FF',
        100: '#E0E7FF',
        200: '#C7D2FE',
        300: '#A5B4FC',
        400: '#818CF8',
        500: '#6366F1',
        600: '#4F46E5',
        700: '#4338CA',
        800: '#3730A3',
        900: '#312E81',
    },
    // Secondary palette (slate/gray)
    secondary: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },
    // Semantic colors
    success: {
        light: '#D1FAE5',
        main: '#10B981',
        dark: '#059669',
    },
    warning: {
        light: '#FEF3C7',
        main: '#F59E0B',
        dark: '#D97706',
    },
    error: {
        light: '#FEE2E2',
        main: '#EF4444',
        dark: '#DC2626',
    },
    info: {
        light: '#DBEAFE',
        main: '#3B82F6',
        dark: '#2563EB',
    },
    // Background
    background: {
        primary: '#FFFFFF',
        secondary: '#F8FAFC',
        tertiary: '#F1F5F9',
    },
    // Text
    text: {
        primary: '#1E293B',
        secondary: '#64748B',
        tertiary: '#94A3B8',
        inverse: '#FFFFFF',
    },
    // Border
    border: {
        light: '#E2E8F0',
        medium: '#CBD5E1',
        dark: '#94A3B8',
    },
    // Accent colors
    accent: {
        green: '#10B981',
        orange: '#F59E0B',
        red: '#EF4444',
        yellow: '#EAB308',
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    full: 9999,
};


export const Typography = {
    // Font sizes
    size: {
        xs: 12,
        sm: 14,
        md: 16,
        base: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 30,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },
    // Font weights - typed for React Native TextStyle
    weight: {
        normal: '400' as TextStyle['fontWeight'],
        medium: '500' as TextStyle['fontWeight'],
        semibold: '600' as TextStyle['fontWeight'],
        bold: '700' as TextStyle['fontWeight'],
    },
    // Line heights
    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
};

export default {
    Colors,
    Spacing,
    BorderRadius,
    Typography,
    Shadows,
};
