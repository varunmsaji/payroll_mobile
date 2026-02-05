// Badge component for status indicators
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    text: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'neutral',
    size = 'md',
    style,
}) => {
    return (
        <View style={[styles.base, styles[`variant_${variant}`], styles[`size_${size}`], style]}>
            <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
                {text}
            </Text>
        </View>
    );
};

// Helper function to get badge variant from status string
export const getStatusVariant = (status: string): BadgeVariant => {
    const statusLower = status.toLowerCase();

    if (['approved', 'active', 'present', 'paid', 'completed', 'success'].includes(statusLower)) {
        return 'success';
    }
    if (['pending', 'draft', 'half_day', 'late'].includes(statusLower)) {
        return 'warning';
    }
    if (['rejected', 'inactive', 'absent', 'error', 'failed'].includes(statusLower)) {
        return 'error';
    }
    if (['leave', 'on_leave', 'generated'].includes(statusLower)) {
        return 'info';
    }
    return 'neutral';
};

const styles = StyleSheet.create({
    base: {
        alignSelf: 'flex-start',
        borderRadius: BorderRadius.full,
    },

    // Sizes
    size_sm: {
        paddingVertical: 2,
        paddingHorizontal: Spacing.sm,
    },
    size_md: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
    },

    // Variants
    variant_success: {
        backgroundColor: Colors.success.light,
    },
    variant_warning: {
        backgroundColor: Colors.warning.light,
    },
    variant_error: {
        backgroundColor: Colors.error.light,
    },
    variant_info: {
        backgroundColor: Colors.info.light,
    },
    variant_neutral: {
        backgroundColor: Colors.secondary[100],
    },

    // Text
    text: {
        fontWeight: Typography.weight.medium,
    },
    text_success: {
        color: Colors.success.dark,
    },
    text_warning: {
        color: Colors.warning.dark,
    },
    text_error: {
        color: Colors.error.dark,
    },
    text_info: {
        color: Colors.info.dark,
    },
    text_neutral: {
        color: Colors.text.secondary,
    },

    // Text sizes
    textSize_sm: {
        fontSize: Typography.size.xs,
    },
    textSize_md: {
        fontSize: Typography.size.sm,
    },
});

export default Badge;
