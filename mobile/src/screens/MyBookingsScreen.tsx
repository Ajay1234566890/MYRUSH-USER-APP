import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { bookingsApi } from '../api/venues';
import { useAuthStore } from '../store/authStore';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Booking {
    id: string;
    venue_name: string;
    venue_location: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    number_of_players: number;
    team_name: string | null;
    special_requests: string | null;
    total_amount: number;
    status: string;
    created_at: string;
}

const MyBookingsScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled'

    const loadBookings = async (statusFilter?: string) => {
        try {
            if (!user?.id) {
                console.error('User not authenticated');
                setBookings([]);
                return;
            }

            let filter: string | undefined;
            switch (activeTab) {
                case 'upcoming':
                    filter = 'confirmed';
                    break;
                case 'completed':
                    filter = 'completed';
                    break;
                case 'cancelled':
                    filter = 'cancelled';
                    break;
                default:
                    filter = undefined;
            }

            const result = await bookingsApi.getUserBookings(user.id, filter);
            if (result.success) {
                setBookings(result.data || []);
            } else {
                console.error('Error loading bookings:', result.error);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return colors.success;
            case 'pending':
                return colors.accent;
            case 'completed':
                return colors.primary;
            case 'cancelled':
            case 'refunded':
                return colors.error;
            default:
                return colors.gray[500];
        }
    };

    const getStatusBadgeText = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            });
        }
    };

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'completed', label: 'Completed' },
        { key: 'cancelled', label: 'Cancelled' },
    ];

    const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => (
        <TouchableOpacity
            style={styles.bookingCard}
            activeOpacity={0.8}
            onPress={() => {
                // Could navigate to booking details
                console.log('Booking pressed:', booking.id);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <Text style={styles.statusText}>{getStatusBadgeText(booking.status)}</Text>
                </View>
                <Text style={styles.bookingDate}>{formatDate(booking.booking_date)}</Text>
            </View>

            <Text style={styles.venueName}>{booking.venue_name}</Text>
            <Text style={styles.venueLocation}>{booking.venue_location}</Text>

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={moderateScale(16)} color={colors.text.secondary} />
                    <Text style={styles.detailText}>
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={moderateScale(16)} color={colors.text.secondary} />
                    <Text style={styles.detailText}>{booking.number_of_players} players</Text>
                </View>
            </View>

            {booking.team_name && (
                <View style={styles.detailItem}>
                    <Ionicons name="shield-outline" size={moderateScale(16)} color={colors.text.secondary} />
                    <Text style={styles.detailText}>{booking.team_name}</Text>
                </View>
            )}

            {booking.special_requests && (
                <View style={styles.detailItem}>
                    <Ionicons name="chatbox-outline" size={moderateScale(16)} color={colors.text.secondary} />
                    <Text style={styles.detailText}>{booking.special_requests}</Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.amountText}>₹{booking.total_amount}</Text>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="ellipsis-horizontal" size={moderateScale(20)} color={colors.text.secondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading your bookings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={{ width: wp(10) }} />
            </View>

            {/* Tab Filters */}
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            activeTab === tab.key && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.activeTabText,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bookings List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {bookings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={moderateScale(64)} color={colors.gray[300]} />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'all' ? 'No bookings found' :
                                activeTab === 'upcoming' ? 'No upcoming bookings' :
                                    activeTab === 'completed' ? 'No completed bookings' : 'No cancelled bookings'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'all' ? 'Your bookings will appear here once you make them' : 'Try changing the filter'}
                        </Text>
                    </View>
                ) : (
                    bookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                    ))
                )}

                {/* Spacer for bottom */}
                <View style={{ height: hp(10) }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
    },
    loadingText: {
        marginTop: hp(2),
        fontSize: fontScale(16),
        color: colors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(6),
        paddingBottom: hp(2),
        backgroundColor: colors.background.primary,
    },
    backButton: {
        width: wp(10),
        height: wp(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: colors.text.primary,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    tabButton: {
        flex: 1,
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        borderRadius: moderateScale(20),
        alignItems: 'center',
        marginHorizontal: wp(1),
    },
    activeTabButton: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: fontScale(12),
        fontWeight: '600',
        color: colors.text.secondary,
    },
    activeTabText: {
        color: colors.white,
    },
    scrollContent: {
        padding: wp(5),
        paddingTop: hp(2),
    },
    bookingCard: {
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(16),
        padding: wp(4),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    statusBadge: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.5),
        borderRadius: moderateScale(12),
    },
    statusText: {
        fontSize: fontScale(11),
        fontWeight: '700',
        color: colors.white,
    },
    bookingDate: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.secondary,
    },
    venueName: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    venueLocation: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        marginBottom: hp(1.5),
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: hp(1),
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: wp(4),
        marginBottom: hp(0.5),
    },
    detailText: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
        marginLeft: wp(1),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(1),
        paddingTop: hp(1),
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    amountText: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: colors.primary,
    },
    actionButton: {
        padding: wp(1),
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: hp(10),
    },
    emptyTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: hp(2),
        marginBottom: hp(1),
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        textAlign: 'center',
        maxWidth: wp(60),
    },
});

export default MyBookingsScreen;
