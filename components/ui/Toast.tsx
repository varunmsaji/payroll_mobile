// Toast notification component
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { Icon } from '../Icon';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    visible: boolean;
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number;
    onDismiss: () => void;
}

const toastConfig: Record<ToastType, { icon: string; bgColor: string; iconColor: string }> = {
    success: {
        icon: 'check-circle',
        bgColor: Colors.success.light,
        iconColor: Colors.success.main,
    },
    error: {
        icon: 'alert-circle',
        bgColor: Colors.error.light,
        iconColor: Colors.error.main,
    },
    warning: {
        icon: 'warning',
        bgColor: Colors.warning.light,
        iconColor: Colors.warning.main,
    },
    info: {
        icon: 'info',
        bgColor: Colors.info.light,
        iconColor: Colors.info.main,
    },
};

export const Toast: React.FC<ToastProps> = ({
    visible,
    type = 'info',
    title,
    message,
    duration = 3000,
    onDismiss,
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Animate in
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
        });
    };

    if (!visible) return null;

    const config = toastConfig[type];

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: config.bgColor },
                { transform: [{ translateY }], opacity },
            ]}
        >
            <Icon name={config.icon} size={24} color={config.iconColor} />
            <View style={styles.content}>
                {title && <Text style={styles.title}>{title}</Text>}
                <Text style={styles.message}>{message}</Text>
            </View>
            <TouchableOpacity onPress={handleDismiss}>
                <Icon name="close" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: Spacing.lg,
        right: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
        ...Shadows.lg,
        zIndex: 9999,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    message: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
});

export default Toast;
