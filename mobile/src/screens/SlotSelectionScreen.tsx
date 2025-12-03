import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

type SlotSelectionRouteProp = RouteProp<RootStackParamList, 'SlotSelection'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const SlotSelectionScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<SlotSelectionRouteProp>();
    const [selectedDate, setSelectedDate] = useState(24);
    const [selectedSlot, setSelectedSlot] = useState('12:00 PM');
    const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10)); // November 2025
    const [cartItems, setCartItems] = useState(1);

    const venueName = route.params?.venue?.name || 'Play Arena HSR';
    const pitchName = 'Pitch 1';

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true });
        }

        return days;
    };

    const timeSlots = [
        '08:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '01:00 PM', '02:00 PM',
        '03:00 PM', '04:00 PM', '05:00 PM',
    ];

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleConfirmBooking = () => {
        navigation.navigate('BookingDetails', {
            venue: venueName,
            venueObject: route.params?.venue,
            pitch: pitchName,
            date: selectedDate,
            month: monthNames[currentMonth.getMonth()],
            monthIndex: currentMonth.getMonth(),
            year: currentMonth.getFullYear(),
            timeSlot: selectedSlot,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{venueName}</Text>
                    <Text style={styles.headerSubtitle}>{pitchName}</Text>
                </View>
                <View style={{ width: wp(10) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Calendar */}
                <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setMonth(newDate.getMonth() - 1);
                                setCurrentMonth(newDate);
                            }}
                        >
                            <Ionicons name="chevron-back" size={moderateScale(24)} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setMonth(newDate.getMonth() + 1);
                                setCurrentMonth(newDate);
                            }}
                        >
                            <Ionicons name="chevron-forward" size={moderateScale(24)} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Week Days */}
                    <View style={styles.weekDaysRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                            <Text key={index} style={styles.weekDayText}>{day}</Text>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {generateCalendarDays().map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayCell,
                                    !item.isCurrentMonth && styles.dayCellInactive,
                                    selectedDate === item.day && item.isCurrentMonth && styles.dayCellSelected,
                                ]}
                                onPress={() => item.isCurrentMonth && setSelectedDate(item.day)}
                                disabled={!item.isCurrentMonth}
                            >
                                <Text
                                    style={[
                                        styles.dayText,
                                        !item.isCurrentMonth && styles.dayTextInactive,
                                        selectedDate === item.day && item.isCurrentMonth && styles.dayTextSelected,
                                    ]}
                                >
                                    {item.day}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Available Slots */}
                <View style={styles.slotsContainer}>
                    <Text style={styles.slotsTitle}>
                        Available Slots for Nov {selectedDate}
                    </Text>
                    <View style={styles.slotsGrid}>
                        {timeSlots.map((slot, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.slotButton,
                                    selectedSlot === slot && styles.slotButtonSelected,
                                ]}
                                onPress={() => setSelectedSlot(slot)}
                            >
                                <Text
                                    style={[
                                        styles.slotText,
                                        selectedSlot === slot && styles.slotTextSelected,
                                    ]}
                                >
                                    {slot}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Spacer */}
                <View style={{ height: hp(15) }} />
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <View style={styles.totalPriceContainer}>
                    <Text style={styles.totalPriceLabel}>Total Price</Text>
                    <Text style={styles.totalPriceAmount}>₹900</Text>
                </View>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmBooking}
                >
                    <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                </TouchableOpacity>
            </View>

            {/* Floating Cart Button */}
            {cartItems > 0 && (
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart" size={moderateScale(24)} color="#fff" />
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
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(6),
        paddingBottom: hp(2),
        backgroundColor: '#fff',
    },
    backButton: {
        width: wp(10),
        height: wp(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: fontScale(13),
        color: '#999',
        marginTop: 2,
    },
    calendarContainer: {
        backgroundColor: '#fff',
        margin: wp(5),
        marginTop: hp(2),
        borderRadius: moderateScale(20),
        padding: wp(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(3),
    },
    monthText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#333',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: hp(2),
    },
    weekDayText: {
        fontSize: fontScale(13),
        color: '#999',
        fontWeight: '500',
        width: width / 9,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: width / 9,
        height: hp(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: hp(0.5),
    },
    dayCellInactive: {
        opacity: 0.3,
    },
    dayCellSelected: {
        backgroundColor: colors.primary,
        borderRadius: moderateScale(20),
    },
    dayText: {
        fontSize: fontScale(14),
        color: '#333',
    },
    dayTextInactive: {
        color: '#ccc',
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    slotsContainer: {
        paddingHorizontal: wp(5),
        marginTop: hp(1),
    },
    slotsTitle: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(2),
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    slotButton: {
        width: '31%',
        backgroundColor: '#fff',
        borderRadius: moderateScale(12),
        paddingVertical: hp(2),
        marginBottom: hp(1.5),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    slotButtonSelected: {
        backgroundColor: colors.primary,
    },
    slotText: {
        fontSize: fontScale(13),
        fontWeight: '600',
        color: '#333',
    },
    slotTextSelected: {
        color: '#fff',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        paddingBottom: hp(3),
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    totalPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    totalPriceLabel: {
        fontSize: fontScale(14),
        color: '#999',
    },
    totalPriceAmount: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#333',
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
    confirmButtonText: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#fff',
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
        backgroundColor: '#FF4757',
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: fontScale(10),
        fontWeight: '700',
        color: '#fff',
    },
});

export default SlotSelectionScreen;
