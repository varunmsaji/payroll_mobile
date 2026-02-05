// Loading indicator component
import React from 'react';
import {
    View,
    ActivityIndicator,
    Text,
    StyleSheet,
    ViewStyle,
    DimensionValue,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface LoadingProps {
    size?: 'small' | 'large';
    color?: string;
    text?: string;
    fullScreen?: boolean;
    style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
    size = 'large',
    color = Colors.primary[600],
    text,
    fullScreen = false,
    style,
}) => {
    const content = (
        <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );

    if (fullScreen) {
        return <View style={styles.fullScreen}>{content}</View>;
    }

    return content;
};

// Skeleton loader for content placeholders
export const Skeleton: React.FC<{
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}> = ({ width = '100%', height = 20, borderRadius = 4, style }) => {
    return (
        <View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                },
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    fullScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background.primary,
    },
    text: {
        marginTop: Spacing.md,
        fontSize: Typography.size.base,
        color: Colors.text.secondary,
    },
    skeleton: {
        backgroundColor: Colors.secondary[200],
    },
});

export default Loading;
