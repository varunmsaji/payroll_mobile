// Employee Home Screen - Redesigned Premium UI
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Platform,
    Dimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Attendance, EmployeeShiftDetails } from '../../types';
import FaceCamera from '../../components/FaceCamera';
import OnboardModal from '../../components/OnboardModal';

const { width } = Dimensions.get('window');

interface EmployeeDashboardData {
    todayAttendance: Attendance | null;
    currentShift: EmployeeShiftDetails | null;
    leaveBalance: {
        annual: number;
        sick: number;
        personal: number;
    };
    pendingLeaves: number;
}

export default function EmployeeHomeScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<EmployeeDashboardData>({
        todayAttendance: null,
        currentShift: null,
        leaveBalance: { annual: 0, sick: 0, personal: 0 },
        pendingLeaves: 0,
    });
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [duration, setDuration] = useState('00:00');

    // Face Attendance State
    const [showFaceCamera, setShowFaceCamera] = useState(false);
    const [cameraPurpose, setCameraPurpose] = useState<'attendance' | 'geo_attendance'>('attendance');
    const cameraPurposeRef = useRef<'attendance' | 'geo_attendance'>('attendance');
    const [showOnboardModal, setShowOnboardModal] = useState(false);

    // Ripple animation
    const rippleAnim = useRef(new Animated.Value(0)).current;

    // Timer Ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Start ripple animation
    useEffect(() => {
        const animateRipple = () => {
            rippleAnim.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rippleAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };
        animateRipple();
    }, []);

    const fetchData = useCallback(async () => {
        if (!user?.employee_id) {
            setIsLoading(false);
            setRefreshing(false);
            return;
        }

        setError(null);
        let hasError = false;

        // Fetch today's attendance - independent try-catch
        try {
            const attendanceRes = await apiClient.attendance.getToday(user.employee_id);
            const todayAttendance = attendanceRes?.data || null;
            const isCheckedInNow = !!todayAttendance?.check_in && !todayAttendance?.check_out;
            setIsCheckedIn(isCheckedInNow);
            setData(prev => ({ ...prev, todayAttendance }));
        } catch (err: any) {
            console.log('Attendance fetch skipped:', err?.response?.status || err.message);
            // 404 means no attendance record yet - not an error
            if (err?.response?.status !== 404) {
                hasError = true;
            }
            setIsCheckedIn(false);
            setData(prev => ({ ...prev, todayAttendance: null }));
        }

        // Fetch current shift assignment - independent try-catch
        try {
            const shiftRes = await apiClient.shifts.assignments.getEmployeeShift(user.employee_id);
            const currentShift = shiftRes?.data || null;
            setData(prev => ({ ...prev, currentShift }));
        } catch (err: any) {
            console.log('Shift fetch skipped:', err?.response?.status || err.message);
            setData(prev => ({ ...prev, currentShift: null }));
        }

        // Fetch pending leaves count - independent try-catch
        try {
            const leavesRes = await apiClient.leaves.requests(user.employee_id, { status: 'pending' });
            const pendingLeaves = Array.isArray(leavesRes?.data) ? leavesRes.data.length : 0;
            setData(prev => ({ ...prev, pendingLeaves }));
        } catch (err: any) {
            console.log('Leaves fetch skipped:', err?.response?.status || err.message);
            setData(prev => ({ ...prev, pendingLeaves: 0 }));
        }

        // Fetch leave balances - independent try-catch
        try {
            const currentYear = new Date().getFullYear();
            const balanceRes = await apiClient.leaves.getBalance(user.employee_id, currentYear);
            const balances = { annual: 0, sick: 0, personal: 0 };

            if (Array.isArray(balanceRes?.data)) {
                balanceRes.data.forEach((item: any) => {
                    const typeName = (item?.leave_type_name || '').toLowerCase();
                    const remaining = typeof item?.remaining === 'number' ? item.remaining : 0;
                    if (typeName.includes('annual')) balances.annual = remaining;
                    else if (typeName.includes('sick')) balances.sick = remaining;
                    else if (typeName.includes('personal') || typeName.includes('casual')) balances.personal = remaining;
                });
            }
            setData(prev => ({ ...prev, leaveBalance: balances }));
        } catch (err: any) {
            console.log('Balance fetch skipped:', err?.response?.status || err.message);
            setData(prev => ({ ...prev, leaveBalance: { annual: 0, sick: 0, personal: 0 } }));
        }

        if (hasError) {
            setError('Some data could not be loaded. Pull to refresh.');
        }

        setIsLoading(false);
        setRefreshing(false);
    }, [user?.employee_id]);

    useEffect(() => {
        if (user?.employee_id) {
            fetchData();
        }
    }, [fetchData, user?.employee_id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    // Duration Timer Logic
    useEffect(() => {
        const updateDuration = () => {
            if (isCheckedIn && data.todayAttendance?.check_in) {
                const start = new Date(data.todayAttendance.check_in).getTime();
                const now = new Date().getTime();
                const diffMs = now - start;
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                setDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
            } else if (data.todayAttendance?.work_hours || data.todayAttendance?.net_hours) {
                const hours = data.todayAttendance?.work_hours || data.todayAttendance?.net_hours || 0;
                const h = Math.floor(hours);
                const m = Math.round((hours - h) * 60);
                setDuration(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            } else {
                setDuration('00:00');
            }
        };

        updateDuration();

        if (isCheckedIn) {
            timerRef.current = setInterval(updateDuration, 60000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isCheckedIn, data.todayAttendance]);


    const handleManualPunch = async () => {
        if (!user?.employee_id) return;

        try {
            if (isCheckedIn) {
                await apiClient.attendance.checkOut(user.employee_id);
                Alert.alert('Success', 'Checked out successfully.');
            } else {
                await apiClient.attendance.checkIn(user.employee_id);
                Alert.alert('Success', 'Checked in successfully.');
            }
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update attendance.');
        }
    };

    const handleFaceAttendanceTrigger = (type: 'attendance' | 'geo_attendance') => {
        setCameraPurpose(type);
        cameraPurposeRef.current = type;
        setShowFaceCamera(true);
    };

    const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

    const handleFaceCaptured = async (uri: string) => {
        if (!user?.employee_id) return;
        setIsMarkingAttendance(true);

        // Read from ref to avoid stale closure issues
        const purpose = cameraPurposeRef.current;
        console.log('[handleFaceCaptured] purpose:', purpose);

        try {
            const formData = new FormData();
            const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');

            formData.append('file', {
                uri: fileUri,
                name: 'attendance.jpg',
                type: 'image/jpeg',
            } as any);

            const eventTime = new Date().toISOString();

            if (purpose === 'geo_attendance') {
                console.log('[handleFaceCaptured] Taking GEO path -> /geo_punch');
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Location is required for Geo Attendance.');
                    setIsMarkingAttendance(false);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

                await apiClient.faceAttendance.geoPunch(
                    formData,
                    eventTime,
                    location.coords.latitude,
                    location.coords.longitude
                );
            } else {
                console.log('[handleFaceCaptured] Taking FACE path -> /punch');
                await apiClient.faceAttendance.punch(formData, eventTime);
            }

            Alert.alert('Success', 'Attendance marked successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setShowFaceCamera(false);
                        fetchData();
                    }
                }
            ]);
        } catch (error: any) {
            if (error.response?.status === 400) {
                Alert.alert('Attendance Alert', error.response?.data?.detail || 'Attendance request rejected.');
            } else {
                Alert.alert('Attendance Failed', error.response?.data?.detail || 'Failed to mark attendance.');
            }
        } finally {
            setIsMarkingAttendance(false);
        }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '--:--';
        return new Date(timeString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatShiftTime = (timeStr?: string) => {
        if (!timeStr) return '--:--';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric'
    });

    const getAttendanceStatus = () => {
        if (!data.todayAttendance?.check_in) return { text: 'Not Checked In', color: Colors.text.tertiary };
        if (data.todayAttendance?.status === 'late') return { text: 'Late', color: Colors.accent.orange };
        return { text: 'On Time', color: Colors.accent.green };
    };

    const status = getAttendanceStatus();

    const rippleScale = rippleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
    });

    const rippleOpacity = rippleAnim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [0.4, 0, 0],
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.first_name || 'User'}` }}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineBadge} />
                    </View>
                    <View>
                        <Text style={styles.welcomeText}>WELCOME BACK</Text>
                        <Text style={styles.userName}>{user?.first_name || 'Employee'} {user?.last_name || ''}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Icon name="bell" size={22} color={Colors.text.primary} />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Date & Shift Info */}
                <View style={styles.dateSection}>
                    <View style={styles.dateRow}>
                        <Text style={styles.dateText}>Today, {currentDate.split(',')[1]?.trim()}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                        </View>
                    </View>
                    <View style={styles.shiftRow}>
                        <Icon name="clock" size={16} color={Colors.primary[600]} />
                        <Text style={styles.shiftText}>
                            Shift: {formatShiftTime(data.currentShift?.start_time)} - {formatShiftTime(data.currentShift?.end_time)}
                        </Text>
                    </View>
                </View>

                {/* Central Attendance Card */}
                <View style={styles.attendanceCard}>
                    <View style={styles.attendanceCardBg} />
                    <View style={styles.attendanceContent}>
                        {/* Status Text */}
                        <View style={styles.currentStatus}>
                            <Text style={styles.currentStatusLabel}>Current Status</Text>
                            <Text style={styles.currentStatusText}>
                                {isCheckedIn ? 'Checked In' : 'Checked Out'}
                            </Text>
                        </View>

                        {/* Hero Punch Button */}
                        <View style={styles.punchButtonContainer}>
                            {/* Ripple Effect */}
                            <Animated.View
                                style={[
                                    styles.rippleEffect,
                                    {
                                        transform: [{ scale: rippleScale }],
                                        opacity: rippleOpacity,
                                    },
                                ]}
                            />
                            <TouchableOpacity
                                style={styles.punchButton}
                                onPress={handleManualPunch}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#3b9eff', '#137fec']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                />
                                <Icon name="hand-pointer" size={36} color="#fff" />
                                <Text style={styles.punchButtonText}>
                                    {isCheckedIn ? 'PUNCH OUT' : 'PUNCH IN'}
                                </Text>
                                <Text style={styles.punchTimeHint}>
                                    {formatShiftTime(data.currentShift?.start_time)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Location Hint */}
                        <View style={styles.locationHint}>
                            <Icon name="map-pin" size={12} color={Colors.text.tertiary} />
                            <Text style={styles.locationText}>Near Office HQ</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#EBF5FF' }]}>
                            <Icon name="log-in" size={18} color={Colors.primary[600]} />
                        </View>
                        <Text style={styles.statLabel}>Clock In</Text>
                        <Text style={styles.statValue}>{formatTime(data.todayAttendance?.check_in)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                            <Icon name="log-out" size={18} color={Colors.accent.orange} />
                        </View>
                        <Text style={styles.statLabel}>Clock Out</Text>
                        <Text style={styles.statValue}>{formatTime(data.todayAttendance?.check_out)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
                            <Icon name="hourglass" size={18} color="#8B5CF6" />
                        </View>
                        <Text style={styles.statLabel}>Total Hrs</Text>
                        <Text style={styles.statValue}>{duration}</Text>
                    </View>
                </View>

                {/* Secondary Actions */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => handleFaceAttendanceTrigger('attendance')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                            <Icon name="camera" size={20} color="#6366F1" />
                        </View>
                        <View>
                            <Text style={styles.actionTitle}>Face Scan</Text>
                            <Text style={styles.actionSubtitle}>Verify ID</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => handleFaceAttendanceTrigger('geo_attendance')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F0FDFA' }]}>
                            <Icon name="map" size={20} color="#14B8A6" />
                        </View>
                        <View>
                            <Text style={styles.actionTitle}>Geo Log</Text>
                            <Text style={styles.actionSubtitle}>Location Check</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Register Face Button */}
                <TouchableOpacity
                    style={styles.registerFaceBtn}
                    onPress={() => setShowOnboardModal(true)}
                >
                    <Icon name="user-plus" size={20} color={Colors.text.secondary} />
                    <Text style={styles.registerFaceText}>Register Face</Text>
                </TouchableOpacity>

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
            </ScrollView>

            <FaceCamera
                visible={showFaceCamera}
                onCapture={handleFaceCaptured}
                onClose={() => !isMarkingAttendance && setShowFaceCamera(false)}
                purpose={cameraPurpose}
                instruction={cameraPurpose === 'geo_attendance' ? 'Capture Face & Location' : 'Capture Face for Attendance'}
                isSubmitting={isMarkingAttendance}
            />

            <OnboardModal
                visible={showOnboardModal}
                onClose={() => setShowOnboardModal(false)}
                onSuccess={() => {
                    setShowOnboardModal(false);
                    fetchData();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f7f8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        ...Shadows.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#137fec',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        backgroundColor: '#22c55e',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    welcomeText: {
        fontSize: 10,
        fontWeight: '500',
        color: Colors.text.tertiary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        backgroundColor: '#ef4444',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    dateSection: {
        gap: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateText: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    shiftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    shiftText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    attendanceCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        ...Shadows.md,
        overflow: 'hidden',
    },
    attendanceCardBg: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(19, 127, 236, 0.05)',
    },
    attendanceContent: {
        alignItems: 'center',
        gap: 24,
    },
    currentStatus: {
        alignItems: 'center',
        gap: 4,
    },
    currentStatusLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.tertiary,
    },
    currentStatusText: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    punchButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rippleEffect: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(19, 127, 236, 0.2)',
    },
    punchButton: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...Shadows.lg,
        shadowColor: '#137fec',
    },
    punchButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    punchTimeHint: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: '500',
    },
    locationHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    locationText: {
        fontSize: 11,
        color: Colors.text.tertiary,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 6,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.text.tertiary,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    actionSubtitle: {
        fontSize: 11,
        color: Colors.text.tertiary,
    },
    registerFaceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    registerFaceText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
});
