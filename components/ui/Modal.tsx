// Modal component - bottom sheet style for mobile
import React from 'react';
import {
    View,
    Text,
    Modal as RNModal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { Icon } from '../Icon';

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    showCloseButton?: boolean;
    fullScreen?: boolean;
    contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    title,
    children,
    showCloseButton = true,
    fullScreen = false,
    contentStyle,
}) => {
    return (
        <RNModal
            visible={visible}
            transparent={!fullScreen}
            animationType={fullScreen ? 'slide' : 'fade'}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {fullScreen ? (
                    <View style={styles.fullScreenContainer}>
                        <View style={styles.header}>
                            {showCloseButton && (
                                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                    <Icon name="close" size={24} color={Colors.text.primary} />
                                </TouchableOpacity>
                            )}
                            {title && <Text style={styles.title}>{title}</Text>}
                            <View style={styles.headerSpacer} />
                        </View>
                        <ScrollView
                            style={styles.fullScreenContent}
                            contentContainerStyle={contentStyle}
                            keyboardShouldPersistTaps="handled"
                        >
                            {children}
                        </ScrollView>
                    </View>
                ) : (
                    <TouchableWithoutFeedback onPress={onClose}>
                        <View style={styles.overlay}>
                            <TouchableWithoutFeedback>
                                <View style={[styles.bottomSheet, contentStyle]}>
                                    <View style={styles.handle} />
                                    {title && (
                                        <View style={styles.sheetHeader}>
                                            <Text style={styles.sheetTitle}>{title}</Text>
                                            {showCloseButton && (
                                                <TouchableOpacity onPress={onClose}>
                                                    <Icon name="close" size={24} color={Colors.text.secondary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                    <ScrollView
                                        style={styles.sheetContent}
                                        keyboardShouldPersistTaps="handled"
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {children}
                                    </ScrollView>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                )}
            </KeyboardAvoidingView>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: Colors.background.primary,
        borderTopLeftRadius: BorderRadius['2xl'],
        borderTopRightRadius: BorderRadius['2xl'],
        maxHeight: '90%',
        paddingBottom: Spacing['3xl'],
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.secondary[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    sheetTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
    },
    sheetContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
    },
    fullScreenContainer: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    closeButton: {
        padding: Spacing.sm,
    },
    title: {
        flex: 1,
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semibold,
        color: Colors.text.primary,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    fullScreenContent: {
        flex: 1,
    },
});

export default Modal;
