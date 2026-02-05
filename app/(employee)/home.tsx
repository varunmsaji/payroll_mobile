// Employee Home Screen - Personal dashboard
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Attendance, ShiftAssignment, Leave } from '../../types';
import FaceCamera from '../../components/FaceCamera';
import OnboardModal from '../../components/OnboardModal';

interface EmployeeDashboardData {
    todayAttendance: Attendance | null;
    currentShift: ShiftAssignment | null;
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
        leaveBalance: { annual: 20, sick: 10, personal: 5 },
        pendingLeaves: 0,
    });
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    // Face Attendance State
    const [showFaceCamera, setShowFaceCamera] = useState(false);
    const [cameraPurpose, setCameraPurpose] = useState<'attendance' | 'geo_attendance'>('attendance');
    const [showOnboardModal, setShowOnboardModal] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.employee_id) return;

        try {
            // Get today's date
            const today = new Date().toISOString().split('T')[0];

            // Fetch today's attendance
            const attendanceRes = await apiClient.attendance.list({
                employee_id: user.employee_id,
                date: today,
            });
            const todayAttendance = attendanceRes.data?.length > 0 ? attendanceRes.data[0] : null;
            setIsCheckedIn(!!todayAttendance?.check_in && !todayAttendance?.check_out);

            // Fetch current shift assignment
            const shiftRes = await apiClient.shifts.assignments.list({
                employee_id: user.employee_id,
            });
            const currentShift = shiftRes.data?.length > 0 ? shiftRes.data[0] : null;

            // Fetch pending leaves
            const leavesRes = await apiClient.leaves.list({
                employee_id: user.employee_id,
                status: 'pending',
            });
            const pendingLeaves = leavesRes.data?.length || 0;

            setData({
                todayAttendance,
                currentShift,
                leaveBalance: { annual: 20, sick: 10, personal: 5 }, // TODO: Get from API
                pendingLeaves,
            });
        } catch (error) {
            console.error('Error fetching employee dashboard:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleCheckIn = async () => {
        if (!user?.employee_id) return;
        try {
            await apiClient.attendance.checkIn(user.employee_id);
            setIsCheckedIn(true);
            fetchData();
        } catch (error) {
            console.error('Check-in error:', error);
        }
    };

    const handleCheckOut = async () => {
        // Standard check-out without face for now, or use same face logic if needed.
        // For this task, we'll keep standard check-out but add face options to check-in.
        if (!user?.employee_id) return;
        try {
            await apiClient.attendance.checkOut(user.employee_id);
            setIsCheckedIn(false);
            fetchData();
        } catch (error) {
            console.error('Check-out error:', error);
        }
    };

    const handleFaceAttendanceTrigger = (type: 'attendance' | 'geo_attendance') => {
        setCameraPurpose(type);
        setShowFaceCamera(true);
    };

    const handleFaceCaptured = async (uri: string) => {
        setShowFaceCamera(false);
        if (!user?.employee_id) return;

        try {
            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                name: 'attendance.jpg',
                type: 'image/jpeg',
            } as any);

            const eventTime = new Date().toISOString();

            if (cameraPurpose === 'geo_attendance') {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Location is required for Geo Attendance.');
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
                await apiClient.faceAttendance.punch(formData, eventTime);
            }

            Alert.alert('Success', 'Attendance marked successfully!');
            fetchData();
        } catch (error: any) {
            console.error('Attendance error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to mark attendance.');
        }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '--:--';
        return new Date(timeString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName}>Employee</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Icon name="logout" size={24} color={Colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                {/* Today's Status Card */}
                <View style={styles.statusCard}>
                    <Text style={styles.sectionTitle}>Today's Status</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusItem}>
                            <Icon name="clock" size={20} color={Colors.primary[600]} />
                            <Text style={styles.statusLabel}>Check In</Text>
                            <Text style={styles.statusValue}>
                                {formatTime(data.todayAttendance?.check_in)}
                            </Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <Icon name="clock" size={20} color={Colors.accent.orange} />
                            <Text style={styles.statusLabel}>Check Out</Text>
                            <Text style={styles.statusValue}>
                                {formatTime(data.todayAttendance?.check_out)}
                            </Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <Icon name="clock" size={20} color={Colors.accent.green} />
                            <Text style={styles.statusLabel}>Hours</Text>
                            <Text style={styles.statusValue}>
                                {data.todayAttendance?.work_hours?.toFixed(1) || '0.0'}h
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    {/* Standard Check-In/Out */}
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            isCheckedIn ? styles.checkOutButton : styles.checkInButton,
                        ]}
                        onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
                    >
                        <Icon
                            name={isCheckedIn ? 'logout' : 'clock'}
                            size={24}
                            color={Colors.text.inverse}
                        />
                        <Text style={styles.actionButtonText}>
                            {isCheckedIn ? 'Check Out' : 'Check In'}
                        </Text>
                    </TouchableOpacity>

                    {/* Face Attendance Options - Only show when not checked in */}
                    {!isCheckedIn && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.faceButton]}
                                onPress={() => handleFaceAttendanceTrigger('attendance')}
                            >
                                <Icon name="camera" size={24} color={Colors.text.inverse} />
                                <Text style={styles.actionButtonText}>Face In</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.geoButton]}
                                onPress={() => handleFaceAttendanceTrigger('geo_attendance')}
                            >
                                <Icon name="map-pin" size={24} color={Colors.text.inverse} />
                                <Text style={styles.actionButtonText}>Geo In</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Registration Button (Temporary for testing) */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.registerButton, { marginBottom: Spacing.md }]}
                    onPress={() => setShowOnboardModal(true)}
                >
                    <Icon name="user-plus" size={24} color={Colors.text.inverse} />
                    <Text style={styles.actionButtonText}>Register Face</Text>
                </TouchableOpacity>

                <View style={[styles.actionsContainer, { marginTop: 0 }]}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.applyLeaveButton]}
                        onPress={() => router.push('/(employee)/my-leaves')}
                    >
                        <Icon name="calendar" size={24} color={Colors.text.inverse} />
                        <Text style={styles.actionButtonText}>Apply Leave</Text>
                    </TouchableOpacity>
                </View>

                {/* Leave Balance */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Leave Balance</Text>
                    <View style={styles.leaveBalanceRow}>
                        <View style={styles.leaveItem}>
                            <Text style={styles.leaveCount}>{data.leaveBalance.annual}</Text>
                            <Text style={styles.leaveLabel}>Annual</Text>
                        </View>
                        <View style={styles.leaveItem}>
                            <Text style={styles.leaveCount}>{data.leaveBalance.sick}</Text>
                            <Text style={styles.leaveLabel}>Sick</Text>
                        </View>
                        <View style={styles.leaveItem}>
                            <Text style={styles.leaveCount}>{data.leaveBalance.personal}</Text>
                            <Text style={styles.leaveLabel}>Personal</Text>
                        </View>
                    </View>
                    {data.pendingLeaves > 0 && (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>
                                {data.pendingLeaves} pending request{data.pendingLeaves > 1 ? 's' : ''}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Current Shift */}
                {data.currentShift && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Current Shift</Text>
                        <View style={styles.shiftInfo}>
                            <Icon name="clock" size={20} color={Colors.primary[600]} />
                            <Text style={styles.shiftName}>
                                {data.currentShift.shift_name || 'Regular Shift'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Quick Links */}
                <View style={styles.quickLinks}>
                    <TouchableOpacity
                        style={styles.quickLink}
                        onPress={() => router.push('/(employee)/my-attendance')}
                    >
                        <Icon name="calendar" size={20} color={Colors.primary[600]} />
                        <Text style={styles.quickLinkText}>View Attendance</Text>
                        <Icon name="chevron-right" size={16} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickLink}
                        onPress={() => router.push('/(employee)/my-payslips')}
                    >
                        <Icon name="wallet" size={20} color={Colors.primary[600]} />
                        <Text style={styles.quickLinkText}>View Payslips</Text>
                        <Icon name="chevron-right" size={16} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickLink}
                        onPress={() => router.push('/(employee)/my-shift')}
                    >
                        <Icon name="clock" size={20} color={Colors.primary[600]} />
                        <Text style={styles.quickLinkText}>View Shift Details</Text>
                        <Icon name="chevron-right" size={16} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <FaceCamera
                visible={showFaceCamera}
                onCapture={handleFaceCaptured}
                onClose={() => setShowFaceCamera(false)}
                purpose={cameraPurpose}
                instruction={cameraPurpose === 'geo_attendance' ? 'Capture Face & Location' : 'Capture Face for Attendance'}
            />

            <OnboardModal
                visible={showOnboardModal}
                onClose={() => setShowOnboardModal(false)}
                onSuccess={() => {
                    setShowOnboardModal(false);
                    fetchData();
                }}
            />
        </SafeAreaView >
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
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    greeting: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
    },
    userName: {
        fontSize: Typography.size.xl,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    logoutButton: {
        padding: Spacing.sm,
    },
    statusCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: Typography.size.md,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusItem: {
        flex: 1,
        alignItems: 'center',
    },
    statusDivider: {
        width: 1,
        backgroundColor: Colors.border.light,
    },
    statusLabel: {
        fontSize: Typography.size.xs,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    statusValue: {
        fontSize: Typography.size.lg,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: Spacing.xs,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    checkInButton: {
        backgroundColor: Colors.accent.green,
    },
    checkOutButton: {
        backgroundColor: Colors.accent.orange,
    },
    applyLeaveButton: {
        backgroundColor: Colors.primary[600],
    },
    actionButtonText: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.text.inverse,
    },
    faceButton: {
        backgroundColor: Colors.primary[500],
    },
    geoButton: {
        backgroundColor: Colors.primary[700],
    },
    registerButton: {
        backgroundColor: Colors.text.primary,
    },
    card: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    leaveBalanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    leaveItem: {
        alignItems: 'center',
    },
    leaveCount: {
        fontSize: Typography.size.xxl,
        fontWeight: '700',
        color: Colors.primary[600],
    },
    leaveLabel: {
        fontSize: Typography.size.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    pendingBadge: {
        backgroundColor: Colors.accent.orange + '20',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.sm,
        alignSelf: 'center',
        marginTop: Spacing.md,
    },
    pendingText: {
        fontSize: Typography.size.xs,
        color: Colors.accent.orange,
        fontWeight: '500',
    },
    shiftInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    shiftName: {
        fontSize: Typography.size.md,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    quickLinks: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    quickLink: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    quickLinkText: {
        flex: 1,
        fontSize: Typography.size.sm,
        color: Colors.text.primary,
        marginLeft: Spacing.sm,
    },
});
