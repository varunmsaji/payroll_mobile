import React, { useState } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Icon } from './Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import FaceCamera from './FaceCamera';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth';

interface OnboardModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'details' | 'camera';
type PhotoStep = 'front' | 'left' | 'right';

export default function OnboardModal({ visible, onClose, onSuccess }: OnboardModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<Step>('details');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Camera state
    const [cameraVisible, setCameraVisible] = useState(false);
    const [photoStep, setPhotoStep] = useState<PhotoStep>('front');
    const [employeeId, setEmployeeId] = useState<string | null>(null); // To link subsequent photos
    const [isUploading, setIsUploading] = useState(false);

    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required for registration.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation({
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to get location.');
            console.error(error);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleStartCamera = () => {
        if (!firstName || !lastName || !phone || !location) {
            Alert.alert('Missing Details', 'Please fill in all fields and get location.');
            return;
        }
        setStep('camera');
        setPhotoStep('front');
        setCameraVisible(true);
    };

    const handlePhotoCaptured = async (uri: string) => {
        setCameraVisible(false);
        setIsUploading(true);

        try {
            const formData = new FormData();

            // Append file
            formData.append('file', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                name: `photo_${photoStep}.jpg`,
                type: 'image/jpeg',
            } as any);

            // Append common data
            formData.append('photo_type', photoStep);

            if (photoStep === 'front') {
                // First step data
                formData.append('first_name', firstName);
                formData.append('last_name', lastName);
                formData.append('phone', phone);
                formData.append('lat', location!.lat.toString());
                formData.append('lng', location!.lng.toString());
                formData.append('radius_m', '100'); // Default radius
            } else {
                // Subsequent steps need employee_id
                if (!employeeId) throw new Error('Employee ID missing for subsequent photos');
                formData.append('employee_id', employeeId);
            }

            console.log('Uploading photo:', photoStep);
            const response = await apiClient.faces.onboard(formData);
            console.log('Upload success:', response.data);

            if (photoStep === 'front') {
                setEmployeeId(response.data.employee_id || response.data.id); // Adjust based on actual API response
                setPhotoStep('left');
                setTimeout(() => setCameraVisible(true), 500);
            } else if (photoStep === 'left') {
                setPhotoStep('right');
                setTimeout(() => setCameraVisible(true), 500);
            } else {
                // Done
                Alert.alert('Success', 'Registration Completed!', [{ text: 'OK', onPress: onSuccess }]);
                onClose();
            }

        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.response?.data?.message || 'Something went wrong.');
            setCameraVisible(true); // Re-open camera on retry? Or stay on preview? 
            // Better to let user try again by reopening camera manually if we closed it.
            // But here we just show error.
        } finally {
            setIsUploading(false);
        }
    };

    const getCameraInstruction = () => {
        switch (photoStep) {
            case 'front': return 'Look straight at the camera';
            case 'left': return 'Turn your head slightly to the LEFT';
            case 'right': return 'Turn your head slightly to the RIGHT';
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Register User</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon name="x" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {isUploading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary[600]} />
                        <Text style={styles.loadingText}>Uploading {photoStep} photo...</Text>
                    </View>
                ) : step === 'details' ? (
                    <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="John"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Doe"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholder="+1234567890"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Work Location (Geo-fence Center)</Text>
                            {location ? (
                                <View style={styles.locationBox}>
                                    <Icon name="map-pin" size={20} color={Colors.accent.green} />
                                    <Text style={styles.locationText}>
                                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                    </Text>
                                    <TouchableOpacity onPress={getCurrentLocation} disabled={isLoadingLocation}>
                                        <Text style={styles.retryText}>Update</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.locationButton}
                                    onPress={getCurrentLocation}
                                    disabled={isLoadingLocation}
                                >
                                    {isLoadingLocation ? (
                                        <ActivityIndicator color={Colors.text.inverse} />
                                    ) : (
                                        <>
                                            <Icon name="map-pin" size={20} color={Colors.text.inverse} />
                                            <Text style={styles.locationButtonText}>Get Current Location</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity style={styles.continueButton} onPress={handleStartCamera}>
                            <Text style={styles.continueButtonText}>Continue to Face Capture</Text>
                            <Icon name="arrow-right" size={20} color={Colors.text.inverse} />
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    <View style={styles.stepsContainer}>
                        <Text style={styles.stepTitle}>Face Registration Step {photoStep === 'front' ? '1' : photoStep === 'left' ? '2' : '3'}/3</Text>
                        <Text style={styles.stepDesc}>We need to capture your face from 3 angles.</Text>

                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepDot, photoStep === 'front' && styles.stepActive, (photoStep === 'left' || photoStep === 'right') && styles.stepDone]} />
                            <View style={[styles.stepDot, photoStep === 'left' && styles.stepActive, photoStep === 'right' && styles.stepDone]} />
                            <View style={[styles.stepDot, photoStep === 'right' && styles.stepActive]} />
                        </View>

                        <TouchableOpacity style={styles.cameraButton} onPress={() => setCameraVisible(true)}>
                            <Icon name="camera" size={32} color={Colors.text.inverse} />
                            <Text style={styles.cameraButtonText}>Open Camera</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <FaceCamera
                    visible={cameraVisible}
                    onCapture={handlePhotoCaptured}
                    onClose={() => setCameraVisible(false)}
                    purpose="registration"
                    instruction={getCameraInstruction()}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    title: {
        fontSize: Typography.size.lg,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    closeButton: {
        padding: Spacing.sm,
    },
    form: {
        flex: 1,
    },
    formContent: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },
    inputGroup: {
        gap: Spacing.xs,
    },
    label: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    input: {
        backgroundColor: Colors.background.primary,
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.size.md,
        color: Colors.text.primary,
    },
    locationButton: {
        backgroundColor: Colors.primary[600],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    locationButtonText: {
        color: Colors.text.inverse,
        fontWeight: '600',
    },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accent.green + '20',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.accent.green,
    },
    locationText: {
        flex: 1,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    retryText: {
        color: Colors.primary[600],
        fontWeight: '600',
        fontSize: Typography.size.sm,
    },
    continueButton: {
        backgroundColor: Colors.primary[600],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    continueButtonText: {
        color: Colors.text.inverse,
        fontSize: Typography.size.md,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        color: Colors.text.secondary,
        fontSize: Typography.size.md,
    },
    stepsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    stepTitle: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    stepDesc: {
        textAlign: 'center',
        color: Colors.text.secondary,
        marginBottom: Spacing.xl,
    },
    stepIndicator: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing['3xl'],
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.border.medium,
    },
    stepActive: {
        backgroundColor: Colors.primary[600],
        transform: [{ scale: 1.2 }],
    },
    stepDone: {
        backgroundColor: Colors.accent.green,
    },
    cameraButton: {
        backgroundColor: Colors.primary[600],
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    cameraButtonText: {
        color: Colors.text.inverse,
        fontWeight: '600',
        fontSize: Typography.size.lg,
        marginTop: Spacing.sm,
    },
});
