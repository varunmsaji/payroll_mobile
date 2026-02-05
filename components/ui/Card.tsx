// Card component with elevated style
import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    variant?: 'elevated' | 'outlined' | 'filled';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    onPress,
    style,
    variant = 'elevated',
    padding = 'md',
}) => {
    const cardStyles = [
        styles.base,
        styles[`variant_${variant}`],
        styles[`padding_${padding}`],
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },

    // Variants
    variant_elevated: {
        backgroundColor: Colors.background.primary,
        ...Shadows.md,
    },
    variant_outlined: {
        backgroundColor: Colors.background.primary,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    variant_filled: {
        backgroundColor: Colors.background.secondary,
    },

    // Padding
    padding_none: {
        padding: 0,
    },
    padding_sm: {
        padding: Spacing.sm,
    },
    padding_md: {
        padding: Spacing.lg,
    },
    padding_lg: {
        padding: Spacing.xl,
    },
});

export default Card;
