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
}

export default function FaceCamera({ visible, onCapture, onClose, purpose, instruction }: FaceCameraProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [facing, setFacing] = useState<CameraType>('front');

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
    }, [visible, permission]);

    const handleTakePhoto = async () => {
        if (!cameraRef.current || isCapturing) return;

        try {
            setIsCapturing(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
                skipProcessing: true,
            });

            if (photo?.uri) {
                onCapture(photo.uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
            console.error('Capture error:', error);
        } finally {
            setIsCapturing(false);
        }
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
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
            </View>
        </Modal>
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
});
