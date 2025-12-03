import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { bookingsApi } from '../api/venues';
import { useAuthStore } from '../store/authStore';

type ReviewBookingRouteProp = RouteProp<RootStackParamList, 'ReviewBooking'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const ReviewBookingScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<ReviewBookingRouteProp>();
    const { user } = useAuthStore();
    const [cartItems, setCartItems] = useState(1);
    const [isBookingCreating, setIsBookingCreating] = useState(false);

    const { venue, date, month, timeSlot, numPlayers, teamName, specialRequests, venueObject } = route.params || {};

    // Generate player avatars
    const generatePlayerAvatars = () => {
        const totalPlayers = numPlayers || 2;
        const maxVisiblePlayers = 3;
        const visibleCount = Math.min(totalPlayers, maxVisiblePlayers);
        const remaining = totalPlayers - visibleCount;

        const players = [];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

        for (let i = 0; i < visibleCount; i++) {
            players.push({
                id: i,
                color: colors[i % colors.length],
                initial: String.fromCharCode(65 + i), // A, B, C...
            });
        }

        return { players, remaining };
    };

    const { players, remaining } = generatePlayerAvatars();

    const handleConfirmBooking = async () => {
        if (isBookingCreating) return;

        setIsBookingCreating(true);

        try {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            // Extract booking data from route params
            const venueData = venueObject || {};

            // Extract venue ID with better error handling
            const venueId = venueData.id || venueData.venue_id;

            if (!venueId) {
                console.error('❌ Missing venue ID in venueObject:', venueData);
                Alert.alert(
                    'Booking Error',
                    'Venue information is missing. Please go back and select the venue again.',
                    [{ text: 'OK' }]
                );
                setIsBookingCreating(false);
                return;
            }

            const bookingData = {
                userId: user.id,
                venueId: venueId,
                bookingDate: `${route.params?.year || new Date().getFullYear()}-${String((route.params?.monthIndex || new Date().getMonth()) + 1).padStart(2, '0')}-${String(date)?.padStart(2, '0')}`,
                startTime: timeSlot?.split(' - ')[0] || '10:00',
                durationMinutes: 60, // Default to 1 hour, could be calculated from timeSlot
                numberOfPlayers: numPlayers || 2,
                teamName: teamName,
                specialRequests: specialRequests,
            };

            console.log('Creating booking with data:', bookingData);

            // Call the API to create booking
            const result = await bookingsApi.createBooking(bookingData);

            if (result.success) {
                Alert.alert(
                    'Booking Confirmed!',
                    `Your booking has been successfully created with ID: ${result.data?.booking_id}\nAmount: ₹${result.data?.total_amount}`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Reset navigation stack to MainTabs (home screen)
                                navigation.dispatch(
                                    CommonActions.reset({
                                        index: 0,
                                        routes: [{ name: 'MainTabs' }],
                                    })
                                );
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Booking Failed',
                    result.error || 'Unable to create booking. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            Alert.alert(
                'Booking Failed',
                'An unexpected error occurred. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsBookingCreating(false);
        }
    };

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
                <Text style={styles.headerTitle}>Review Your Booking</Text>
                <View style={{ width: wp(10) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Location Card */}
                <View style={styles.reviewCard}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                        <Ionicons name="location" size={moderateScale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{venue}</Text>
                        <Text style={styles.cardSubtitle}>HSR Layout, Bengaluru</Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Date & Time Card */}
                <View style={styles.reviewCard}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                        <Ionicons name="calendar" size={moderateScale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Wednesday, {date}th {month}</Text>
                        <Text style={styles.cardSubtitle}>{timeSlot}</Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Players Card */}
                <View style={styles.reviewCard}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                        <Ionicons name="person" size={moderateScale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Players</Text>
                        <View style={styles.playersAvatarRow}>
                            {players.map((player, index) => (
                                <View
                                    key={player.id}
                                    style={[
                                        styles.playerAvatar,
                                        { backgroundColor: index === 0 ? colors.primary : colors.accent },
                                        index > 0 && { marginLeft: -wp(3) },
                                    ]}
                                >
                                    <Text style={styles.playerAvatarText}>{player.initial}</Text>
                                </View>
                            ))}
                            {remaining > 0 && (
                                <View
                                    style={[
                                        styles.playerAvatar,
                                        { backgroundColor: colors.gray[400], marginLeft: -wp(3) },
                                    ]}
                                >
                                    <Text style={[styles.playerAvatarText, { color: colors.white }]}>
                                        +{remaining}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Team Name Card (if provided) */}
                {teamName ? (
                    <View style={styles.reviewCard}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                            <Ionicons name="shield" size={moderateScale(24)} color={colors.primary} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Team Name</Text>
                            <Text style={styles.cardSubtitle}>{teamName}</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Special Requests Card (if provided) */}
                {specialRequests ? (
                    <View style={styles.reviewCard}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                            <Ionicons name="chatbox-ellipses" size={moderateScale(24)} color={colors.primary} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Special Requests</Text>
                            <Text style={styles.cardSubtitle}>{specialRequests}</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Spacer */}
                <View style={{ height: hp(15) }} />
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <View style={styles.totalCostContainer}>
                    <Text style={styles.totalCostLabel}>Total Cost</Text>
                    <Text style={styles.totalCostAmount}>₹900</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmButton, isBookingCreating && styles.confirmButtonDisabled]}
                    onPress={handleConfirmBooking}
                    disabled={isBookingCreating}
                >
                    {isBookingCreating ? (
                        <>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={styles.confirmButtonText}>Creating Booking...</Text>
                        </>
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Floating Cart Button */}
            {cartItems > 0 && (
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart" size={moderateScale(24)} color={colors.white} />
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartItems}</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
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
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.text.primary,
    },
    scrollContent: {
        padding: wp(5),
    },
    reviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
    iconContainer: {
        width: wp(13),
        height: wp(13),
        borderRadius: wp(6.5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
    },
    editText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.accent,
    },
    playersAvatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerAvatar: {
        width: wp(9),
        height: wp(9),
        borderRadius: wp(4.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background.primary,
    },
    playerAvatarText: {
        fontSize: fontScale(12),
        fontWeight: '700',
        color: colors.white,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background.primary,
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        paddingBottom: hp(3),
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    totalCostContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    totalCostLabel: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
    },
    totalCostAmount: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: colors.text.primary,
    },
    confirmButton: {
        backgroundColor: colors.primary,
        paddingVertical: hp(2),
        borderRadius: moderateScale(25),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonDisabled: {
        backgroundColor: colors.gray[400],
        shadowColor: colors.gray[400],
        shadowOpacity: 0.2,
    },
    confirmButtonText: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.white,
    },
    cartButton: {
        position: 'absolute',
        bottom: hp(16),
        right: wp(5),
        width: wp(15),
        height: wp(15),
        borderRadius: wp(7.5),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cartBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.error,
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: fontScale(10),
        fontWeight: '700',
        color: colors.white,
    },
});

export default ReviewBookingScreen;
