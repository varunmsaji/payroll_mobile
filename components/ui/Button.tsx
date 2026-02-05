// Button component with variants
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    const buttonStyles = [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        styles[`text_${variant}`],
        styles[`textSize_${size}`],
        isDisabled && styles.textDisabled,
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' || variant === 'danger' ? Colors.text.inverse : Colors.primary[600]}
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    <Text style={textStyles}>{title}</Text>
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },

    // Variants
    variant_primary: {
        backgroundColor: Colors.primary[600],
    },
    variant_secondary: {
        backgroundColor: Colors.secondary[100],
    },
    variant_outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary[600],
    },
    variant_ghost: {
        backgroundColor: 'transparent',
    },
    variant_danger: {
        backgroundColor: Colors.error.main,
    },

    // Sizes
    size_sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    size_md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    size_lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
    },

    // Text
    text: {
        fontWeight: Typography.weight.semibold,
    },
    text_primary: {
        color: Colors.text.inverse,
    },
    text_secondary: {
        color: Colors.primary[700],
    },
    text_outline: {
        color: Colors.primary[600],
    },
    text_ghost: {
        color: Colors.primary[600],
    },
    text_danger: {
        color: Colors.text.inverse,
    },
    textDisabled: {
        opacity: 0.7,
    },

    // Text sizes
    textSize_sm: {
        fontSize: Typography.size.sm,
    },
    textSize_md: {
        fontSize: Typography.size.base,
    },
    textSize_lg: {
        fontSize: Typography.size.lg,
    },
});

export default Button;
