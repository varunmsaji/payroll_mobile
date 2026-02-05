// Input component with label and error state
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Icon } from '../Icon';

interface InputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: string;
    rightIcon?: string;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    secureTextEntry,
    ...textInputProps
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const handleToggleSecure = () => {
        setIsSecure(!isSecure);
    };

    const inputContainerStyles = [
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
    ];

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={inputContainerStyles}>
                {leftIcon && (
                    <Icon
                        name={leftIcon}
                        size={20}
                        color={isFocused ? Colors.primary[600] : Colors.text.tertiary}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.text.tertiary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isSecure}
                    {...textInputProps}
                />

                {secureTextEntry && (
                    <TouchableOpacity onPress={handleToggleSecure}>
                        <Icon
                            name={isSecure ? 'eye-off' : 'eye'}
                            size={20}
                            color={Colors.text.tertiary}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !secureTextEntry && (
                    <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
                        <Icon
                            name={rightIcon}
                            size={20}
                            color={Colors.text.tertiary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
            {hint && !error && <Text style={styles.hint}>{hint}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.primary,
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    inputContainerFocused: {
        borderColor: Colors.primary[600],
        borderWidth: 2,
    },
    inputContainerError: {
        borderColor: Colors.error.main,
    },
    input: {
        flex: 1,
        fontSize: Typography.size.base,
        color: Colors.text.primary,
        paddingVertical: Spacing.md,
    },
    error: {
        fontSize: Typography.size.xs,
        color: Colors.error.main,
        marginTop: Spacing.xs,
    },
    hint: {
        fontSize: Typography.size.xs,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
});

export default Input;
