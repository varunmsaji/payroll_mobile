import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Icon } from './Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

interface FaceCameraProps {
    visible: boolean;
    onCapture: (uri: string) => void;
    onClose: () => void;
    purpose: 'attendance' | 'registration' | 'geo_attendance';
    instruction: string;
    isSubmitting?: boolean;
}

export default function FaceCamera({ visible, onCapture, onClose, purpose, instruction, isSubmitting = false }: FaceCameraProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [facing, setFacing] = useState<CameraType>('front');

    // Debug: log the state
    console.log('[FaceCamera] visible:', visible, 'permission:', permission);

    useEffect(() => {
        console.log('[FaceCamera] useEffect - visible:', visible, 'permission granted:', permission?.granted);
        if (visible && !permission?.granted) {
            console.log('[FaceCamera] Requesting camera permission...');
            requestPermission();
        }
    }, [visible, permission]);

    const handleTakePhoto = async () => {
        console.log('[FaceCamera] handleTakePhoto called');
        console.log('[FaceCamera] cameraRef.current:', !!cameraRef.current);
        console.log('[FaceCamera] isCapturing:', isCapturing);

        if (!cameraRef.current || isCapturing) {
            console.log('[FaceCamera] Returning early - camera not ready or already capturing');
            return;
        }

        try {
            setIsCapturing(true);
            console.log('[FaceCamera] Taking picture...');
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
                skipProcessing: true,
            });

            console.log('[FaceCamera] Photo result:', photo);
            if (photo?.uri) {
                console.log('[FaceCamera] Calling onCapture with URI:', photo.uri);
                onCapture(photo.uri);
            } else {
                console.log('[FaceCamera] No photo URI received');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
            console.error('[FaceCamera] Capture error:', error);
        } finally {
            setIsCapturing(false);
        }
    };

    // If modal is not visible, don't render anything
    if (!visible) {
        return null;
    }

    // Show loading or permission request inside the modal
    if (!permission || !permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.permissionContainer}>
                    {!permission ? (
                        // Still loading permission status
                        <>
                            <ActivityIndicator size="large" color={Colors.primary[600]} />
                            <Text style={[styles.permissionText, { marginTop: Spacing.lg }]}>
                                Checking camera permission...
                            </Text>
                        </>
                    ) : (
                        // Permission not granted
                        <>
                            <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                            <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                                <Text style={styles.permissionButtonText}>Grant Permission</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing={facing}
                    ref={cameraRef}
                    onCameraReady={() => setCameraReady(true)}
                >
                    <View style={styles.overlay}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                                <Icon name="x" size={24} color={Colors.text.inverse} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setFacing(facing === 'front' ? 'back' : 'front')} style={styles.flipIcon}>
                                <Icon name="refresh-cw" size={24} color={Colors.text.inverse} />
                            </TouchableOpacity>
                        </View>

                        {/* Top Blur */}
                        <BlurView intensity={20} style={styles.blurTop} />

                        {/* Middle Section with Circle Cutout */}
                        <View style={styles.middleSection}>
                            <BlurView intensity={20} style={styles.blurSide} />
                            <View style={styles.circleContainer}>
                                <View style={styles.circle} />
                            </View>
                            <BlurView intensity={20} style={styles.blurSide} />
                        </View>

                        {/* Bottom Blur */}
                        <BlurView intensity={20} style={styles.blurBottom}>
                            <Text style={styles.instruction}>{instruction}</Text>

                            <TouchableOpacity
                                onPress={handleTakePhoto}
                                style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                                disabled={isCapturing}
                            >
                                {isCapturing ? (
                                    <ActivityIndicator color={Colors.primary[600]} />
                                ) : (
                                    <View style={styles.captureInner} />
                                )}
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                </CameraView>
                {isSubmitting && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary[600]} />
                        <Text style={styles.loadingText}>Verifying...</Text>
                    </View>
                )}
            </View>
        </Modal >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background.primary,
        padding: Spacing.xl,
    },
    permissionText: {
        fontSize: Typography.size.lg,
        textAlign: 'center',
        marginBottom: Spacing.lg,
        color: Colors.text.primary,
    },
    permissionButton: {
        backgroundColor: Colors.primary[600],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    permissionButtonText: {
        color: Colors.text.inverse,
        fontWeight: '600',
    },
    closeButton: {
        padding: Spacing.md,
    },
    closeButtonText: {
        color: Colors.text.secondary,
    },
    topBar: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        zIndex: 10,
    },
    closeIcon: {
        padding: Spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: BorderRadius.full,
    },
    flipIcon: {
        padding: Spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: BorderRadius.full,
    },
    blurTop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    middleSection: {
        height: CIRCLE_SIZE,
        flexDirection: 'row',
    },
    blurSide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    circleContainer: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        overflow: 'hidden',
    },
    circle: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth: 2,
        borderColor: Colors.accent.green,
        backgroundColor: 'transparent',
    },
    blurBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: Spacing.xl,
    },
    instruction: {
        color: Colors.text.inverse,
        fontSize: Typography.size.lg,
        textAlign: 'center',
        fontWeight: '600',
        paddingHorizontal: Spacing.xl,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonDisabled: {
        opacity: 0.7,
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.text.inverse,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    loadingText: {
        marginTop: Spacing.md,
        color: Colors.text.inverse,
        fontSize: Typography.size.lg,
        fontWeight: '600',
    },
});
