// Employee Home Screen - Redesigned
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
    const [data, setData] = useState<EmployeeDashboardData>({
        todayAttendance: null,
        currentShift: null,
        leaveBalance: { annual: 20, sick: 10, personal: 5 }, // Mock data
        pendingLeaves: 0,
    });
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [duration, setDuration] = useState('0.0');

    // Face Attendance State
    const [showFaceCamera, setShowFaceCamera] = useState(false);
    const [cameraPurpose, setCameraPurpose] = useState<'attendance' | 'geo_attendance'>('attendance');
    const [showOnboardModal, setShowOnboardModal] = useState(false);

    // Timer Ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.employee_id) return;

        try {
            // Get today's date
            const today = new Date().toISOString().split('T')[0];

            // Fetch today's attendance
            const attendanceRes = await apiClient.attendance.getToday(user.employee_id);
            const todayAttendance = attendanceRes.data;

            // Determine Check-in status
            // If we have a check-in but NO check-out, we are currently checked in.
            const isCheckedInNow = !!todayAttendance?.check_in && !todayAttendance?.check_out;
            setIsCheckedIn(isCheckedInNow);

            // Fetch current shift assignment
            try {
                const shiftRes = await apiClient.shifts.assignments.getEmployeeShift(user.employee_id);
                console.log('Shift Data:', shiftRes.data);
                // API returns the object directly, not an array
                const currentShift = shiftRes.data;

                // If the response is the object itself (as per curl output), use it. 
                // We need to handle potential null/undefined if no shift is assigned.
                setData(prev => ({ ...prev, currentShift: currentShift || null }));
            } catch (err) {
                console.error('Error fetching shift:', err);
                // If error, set currentShift to null but don't fail everything
                setData(prev => ({ ...prev, currentShift: null }));
            }

            // Fetch pending leaves count
            const leavesRes = await apiClient.leaves.requests(user.employee_id, { status: 'pending' });
            const pendingLeaves = leavesRes.data?.length || 0;

            // Fetch leave balances
            const currentYear = new Date().getFullYear();
            const balanceRes = await apiClient.leaves.getBalance(user.employee_id, currentYear);
            console.log('[Home] Leave Balance:', balanceRes.data);

            // Map balance data to our local state structure
            const balances = { annual: 0, sick: 0, personal: 0 };
            if (Array.isArray(balanceRes.data)) {
                balanceRes.data.forEach((item: any) => {
                    const typeName = item.leave_type_name?.toLowerCase() || '';
                    if (typeName.includes('annual')) balances.annual = item.remaining;
                    else if (typeName.includes('sick')) balances.sick = item.remaining;
                    else if (typeName.includes('personal') || typeName.includes('casual')) balances.personal = item.remaining;
                });
            }

            setData(prev => ({
                ...prev,
                todayAttendance,
                // currentShift is already updated via its own setData call above
                leaveBalance: balances,
                pendingLeaves,
            }));
        } catch (error) {
            console.error('Error fetching employee dashboard:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
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
                const diffHrs = (now - start) / (1000 * 60 * 60);
                setDuration(diffHrs.toFixed(1));
            } else if (data.todayAttendance?.work_hours || data.todayAttendance?.net_hours) {
                const hours = data.todayAttendance?.work_hours || data.todayAttendance?.net_hours || 0;
                setDuration(hours.toFixed(1));
            } else {
                setDuration('0.0');
            }
        };

        updateDuration(); // Initial call

        if (isCheckedIn) {
            timerRef.current = setInterval(updateDuration, 60000); // Update every minute
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
                // Check Out
                await apiClient.attendance.checkOut(user.employee_id);
                Alert.alert('Success', 'Checked out successfully.');
            } else {
                // Check In
                await apiClient.attendance.checkIn(user.employee_id);
                Alert.alert('Success', 'Checked in successfully.');
            }
            fetchData();
        } catch (error: any) {
            console.error('Manual punch error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update attendance.');
        }
    };

    const handleFaceAttendanceTrigger = (type: 'attendance' | 'geo_attendance') => {
        console.log('[Home] handleFaceAttendanceTrigger called with type:', type);
        setCameraPurpose(type);
        setShowFaceCamera(true);
        console.log('[Home] setShowFaceCamera(true) called');
    };

    const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

    const handleFaceCaptured = async (uri: string) => {
        console.log('[handleFaceCaptured] Called with URI:', uri);
        console.log('[handleFaceCaptured] User employee_id:', user?.employee_id);

        if (!user?.employee_id) {
            console.log('[handleFaceCaptured] No employee_id, returning early');
            return;
        }
        setIsMarkingAttendance(true);

        try {
            console.log('[handleFaceCaptured] Creating FormData...');
            const formData = new FormData();
            const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
            console.log('[handleFaceCaptured] File URI for FormData:', fileUri);

            formData.append('file', {
                uri: fileUri,
                name: 'attendance.jpg',
                type: 'image/jpeg',
            } as any);

            const eventTime = new Date().toISOString();
            console.log('[handleFaceCaptured] Event time:', eventTime);
            console.log('[handleFaceCaptured] Camera purpose:', cameraPurpose);

            if (cameraPurpose === 'geo_attendance') {
                console.log('[handleFaceCaptured] Requesting location permission...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Location is required for Geo Attendance.');
                    setIsMarkingAttendance(false);
                    return;
                }

                console.log('[handleFaceCaptured] Getting current position...');
                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                console.log('[handleFaceCaptured] Location:', location.coords);

                console.log('[handleFaceCaptured] Calling geoPunch API...');
                const response = await apiClient.faceAttendance.geoPunch(
                    formData,
                    eventTime,
                    location.coords.latitude,
                    location.coords.longitude
                );
                console.log('[handleFaceCaptured] geoPunch API response:', response.data);
            } else {
                console.log('[handleFaceCaptured] Calling face_attendance/punch API...');
                const response = await apiClient.faceAttendance.punch(formData, eventTime);
                console.log('[handleFaceCaptured] punch API response:', response.data);
            }

            console.log('[handleFaceCaptured] Success! Showing alert...');
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
            console.log('[handleFaceCaptured] Request failed:', error.message);
            console.log('[handleFaceCaptured] Error response:', error.response?.data);
            console.log('[handleFaceCaptured] Error status:', error.response?.status);

            // Check for specific 400 error (e.g. Late check-in not allowed)
            if (error.response?.status === 400) {
                const message = error.response?.data?.detail || error.response?.data?.message || 'Attendance request rejected.';
                Alert.alert('Attendance Alert', message, [{ text: 'OK' }]);
            } else {
                Alert.alert(
                    'Attendance Failed',
                    error.response?.data?.detail || error.response?.data?.message || 'Failed to mark attendance. Please try again.',
                    [{ text: 'Try Again' }]
                );
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
            hour12: false
        });
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.dateText}>{currentDate}</Text>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName}>{user?.first_name || 'Employee'} {user?.last_name || ''}</Text>
                    </View>
                    <View style={styles.profileContainer}>
                        <Image
                            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.first_name || 'User'}` }}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineBadge} />
                    </View>
                </View>

                {/* Today's Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View>
                            <Text style={styles.statusTitle}>Today's Status</Text>
                            <Text style={styles.shiftText}>
                                {data.currentShift?.shift_name || 'Regular Shift'} • {data.currentShift?.start_time || '09:00'} - {data.currentShift?.end_time || '17:00'}
                            </Text>
                        </View>
                        <View style={styles.calendarIconBg}>
                            <Icon name="calendar" size={24} color={Colors.primary[600]} />
                        </View>
                    </View>

                    <View style={styles.statusMetrics}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>CHECK IN</Text>
                            <Text style={[styles.metricValue, isCheckedIn ? styles.textPrimary : styles.textInactive]}>
                                {formatTime(data.todayAttendance?.check_in)}
                            </Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>CHECK OUT</Text>
                            <Text style={[styles.metricValue, !isCheckedIn && data.todayAttendance?.check_out ? styles.textPrimary : styles.textInactive]}>
                                {formatTime(data.todayAttendance?.check_out)}
                            </Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
                            <Text style={styles.metricLabel}>DURATION</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={styles.metricValuePrimary}>{duration}</Text>
                                <Text style={styles.metricUnit}>h</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Manual Punch Button */}
                <TouchableOpacity
                    style={[
                        styles.punchButton,
                        isCheckedIn ? styles.punchButtonOut : styles.punchButtonIn
                    ]}
                    onPress={handleManualPunch}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={isCheckedIn
                            ? ['rgba(255,255,255,0.2)', 'transparent']
                            : ['rgba(255,255,255,0.2)', 'transparent']
                        }
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.punchIconCircle}>
                        <Icon
                            name={isCheckedIn ? 'clock' : 'clock'}
                            size={28}
                            color={Colors.text.inverse}
                        />
                    </View>
                    <Text style={styles.punchButtonText}>
                        {isCheckedIn ? 'Punch Out' : 'Punch In'}
                    </Text>
                </TouchableOpacity>

                {/* Attendance Actions Grid */}
                <View style={styles.gridContainer}>
                    <TouchableOpacity
                        style={[styles.gridButton, styles.bgBlue]}
                        onPress={() => handleFaceAttendanceTrigger('attendance')}
                    >
                        <Icon name="camera" size={28} color={Colors.text.inverse} />
                        <Text style={styles.gridButtonText}>Face Attendance</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridButton, styles.bgIndigo]}
                        onPress={() => handleFaceAttendanceTrigger('geo_attendance')}
                    >
                        <Icon name="map-pin" size={28} color={Colors.text.inverse} />
                        <Text style={styles.gridButtonText}>Geo Attendance</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.gridButtonFull, styles.registerButton]}
                        onPress={() => setShowOnboardModal(true)}
                    >
                        <Icon name="user-plus" size={24} color={Colors.text.secondary} />
                        <Text style={styles.registerButtonText}>Register Face</Text>
                    </TouchableOpacity>
                </View>

                {/* Leave Balance */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Leave Balance</Text>
                        <TouchableOpacity onPress={() => router.push('/(employee)/my-leaves')}>
                            <Text style={styles.linkText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.leaveRow}>
                        <View style={styles.leaveItem}>
                            <Text style={styles.leaveValue}>{data.leaveBalance.annual}</Text>
                            <Text style={styles.leaveLabel}>Annual</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.leaveItem}>
                            <Text style={styles.leaveValue}>{data.leaveBalance.sick}</Text>
                            <Text style={styles.leaveLabel}>Sick</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.leaveItem}>
                            {data.pendingLeaves > 0 && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{data.pendingLeaves} Pending</Text>
                                </View>
                            )}
                            <Text style={styles.leaveValue}>{data.leaveBalance.personal}</Text>
                            <Text style={styles.leaveLabel}>Personal</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Links */}
                <View style={styles.quickLinksContainer}>
                    <Text style={styles.linksTitle}>Quick Links</Text>
                    <View style={styles.linksList}>
                        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(employee)/my-attendance')}>
                            <View style={[styles.linkIconBg, { backgroundColor: Colors.primary[50] }]}>
                                <Icon name="calendar" size={20} color={Colors.primary[600]} />
                            </View>
                            <View style={styles.linkContent}>
                                <Text style={styles.linkTitle}>Attendance History</Text>
                                <Text style={styles.linkSubtitle}>View past records</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(employee)/my-payslips')}>
                            <View style={[styles.linkIconBg, { backgroundColor: Colors.success.light }]}>
                                <Icon name="wallet" size={20} color={Colors.success.dark} />
                            </View>
                            <View style={styles.linkContent}>
                                <Text style={styles.linkTitle}>Payslips</Text>
                                <Text style={styles.linkSubtitle}>Download PDFs</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(employee)/my-shift')}>
                            <View style={[styles.linkIconBg, { backgroundColor: Colors.warning.light }]}>
                                <Icon name="clock" size={20} color={Colors.warning.dark} />
                            </View>
                            <View style={styles.linkContent}>
                                <Text style={styles.linkTitle}>Shift Details</Text>
                                <Text style={styles.linkSubtitle}>Upcoming schedule</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Add some bottom padding */}
                <View style={{ height: Spacing['4xl'] }} />

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
        backgroundColor: Colors.background.secondary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
        gap: Spacing.xl,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        fontWeight: '500',
        marginBottom: 2,
    },
    greeting: {
        fontSize: Typography.size.lg,
        fontWeight: '700',
        color: Colors.text.primary,
        lineHeight: 28,
    },
    userName: {
        fontSize: Typography.size.lg,
        fontWeight: '700',
        color: Colors.text.primary,
        lineHeight: 28,
    },
    profileContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: Colors.background.primary,
        backgroundColor: Colors.border.light,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        backgroundColor: Colors.success.main,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: Colors.background.primary,
    },

    // Status Card
    statusCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing.xl,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    statusTitle: {
        fontSize: Typography.size.lg,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    shiftText: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        fontWeight: '500',
        marginTop: 4,
    },
    calendarIconBg: {
        backgroundColor: Colors.primary[50], // primary/10
        padding: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    statusMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricItem: {
        flex: 1,
        gap: 4,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metricValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    metricValuePrimary: {
        fontSize: Typography.size['2xl'],
        fontWeight: '700',
        color: Colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    textPrimary: {
        color: Colors.text.primary,
    },
    textInactive: {
        color: Colors.text.tertiary,
    },
    metricUnit: {
        fontSize: Typography.size.sm,
        color: Colors.text.tertiary,
        marginLeft: 2,
        marginBottom: 4,
    },
    metricDivider: {
        width: 1,
        height: '80%',
        backgroundColor: Colors.border.light,
        marginHorizontal: Spacing.md,
    },

    // Punch Button
    punchButton: {
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        ...Shadows.md,
        overflow: 'hidden',
        height: 72,
    },
    punchButtonIn: {
        backgroundColor: Colors.accent.green, // Emerald 500 equivalent
        shadowColor: Colors.accent.green,
    },
    punchButtonOut: {
        backgroundColor: Colors.accent.red, // Rose 500 equivalent
        shadowColor: Colors.accent.red,
    },
    punchIconCircle: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: BorderRadius.full,
    },
    punchButtonText: {
        color: Colors.text.inverse,
        fontSize: Typography.size.xl,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Grid Actions
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    gridButton: {
        flex: 1,
        minWidth: (width - 64) / 2, // 2 columns accounting for padding (32*2)
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 100,
        ...Shadows.md,
    },
    gridButtonFull: {
        width: '100%',
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        height: 56,
    },
    bgBlue: {
        backgroundColor: '#3B82F6', // Blue 500
        shadowColor: '#3B82F6',
    },
    bgIndigo: {
        backgroundColor: Colors.primary[600],
        shadowColor: Colors.primary[600],
    },
    gridButtonText: {
        color: Colors.text.inverse,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    registerButton: {
        backgroundColor: Colors.background.primary,
        borderWidth: 2,
        borderColor: Colors.border.light,
        borderStyle: 'dashed',
    },
    registerButtonText: {
        color: Colors.text.secondary,
        fontSize: Typography.size.sm,
        fontWeight: '700',
    },

    // Section Card (Leave Balance)
    sectionCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing.lg,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.size.md,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    linkText: {
        fontSize: Typography.size.xs,
        fontWeight: '700',
        color: Colors.primary[600],
    },
    leaveRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leaveItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    leaveValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: '800',
        color: Colors.text.primary,
    },
    leaveLabel: {
        fontSize: Typography.size.xs,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    verticalDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.border.light,
    },
    badgeContainer: {
        position: 'absolute',
        top: -12,
        right: 0,
        backgroundColor: Colors.accent.red,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        borderColor: Colors.background.primary,
        zIndex: 1,
    },
    badgeText: {
        color: Colors.text.inverse,
        fontSize: 9,
        fontWeight: '700',
    },

    // Quick Links
    quickLinksContainer: {
        gap: Spacing.md,
    },
    linksTitle: {
        fontSize: Typography.size.md,
        fontWeight: '700',
        color: Colors.text.primary,
        paddingHorizontal: Spacing.xs,
    },
    linksList: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: Colors.border.light,
        ...Shadows.sm,
        overflow: 'hidden',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    linkIconBg: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    linkTitle: {
        fontSize: Typography.size.sm,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    linkSubtitle: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
    },
    separator: {
        height: 1,
        backgroundColor: Colors.border.light,
        marginLeft: 72, // Align with text
    },
});
