import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import { BookingDetailsModal, CancelBookingModal, ReBookModal } from '../components/BookingDialogs';

const { width, height } = Dimensions.get('window');

// Mock bookings data
const USER_BOOKINGS = [
  {
    id: '1',
    title: 'Premium Car Wash',
    date: 'დღეს',
    time: '15:30',
    price: '15₾',
    status: 'მიმდინარე',
    statusColor: '#1D4ED8',
    gradientColor: '#3B82F6',
    icon: 'car-sport',
  },
  {
    id: '2',
    title: 'Express Car Wash',
    date: 'გუშინ',
    time: '10:15',
    price: '8₾',
    status: 'დასრულებული',
    statusColor: '#047857',
    gradientColor: '#10B981',
    icon: 'flash',
  },
  {
    id: '3',
    title: 'Luxury Auto Spa',
    date: 'ხვალ',
    time: '14:00',
    price: '25₾',
    status: 'დაჯავშნილი',
    statusColor: '#D97706',
    gradientColor: '#F59E0B',
    icon: 'diamond',
  },
  {
    id: '4',
    title: 'Quick & Clean',
    date: '15 დეკემბერი',
    time: '12:30',
    price: '12₾',
    status: 'დაჯავშნილი',
    statusColor: '#D97706',
    gradientColor: '#F59E0B',
    icon: 'speedometer',
  },
  {
    id: '5',
    title: 'Professional Car Care',
    date: '20 დეკემბერი',
    time: '16:45',
    price: '20₾',
    status: 'დაჯავშნილი',
    statusColor: '#D97706',
    gradientColor: '#F59E0B',
    icon: 'shield-checkmark',
  },
];

export default function BookingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [pressedButtons, setPressedButtons] = useState<{ [key: string]: boolean }>({});
  
  // Custom dialog states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReBookModal, setShowReBookModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#F8FAFC',
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingBottom: 32,
      backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#F8FAFC',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 36,
      fontFamily: 'Poppins_800Bold',
      color: colors.text,
      letterSpacing: -1.5,
    },
    backButton: {
      width: 52,
      height: 52,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    headerSubtitle: {
      fontSize: 18,
      fontFamily: 'Poppins_400Regular',
      color: colors.secondary,
      lineHeight: 26,
      opacity: 0.8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 0,
      paddingBottom: 20,
    },
    bookingCard: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
      borderRadius: 28,
      padding: 28,
      marginBottom: 24,
      width: '100%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 32,
      elevation: 12,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
      position: 'relative',
      overflow: 'hidden',
    },
    bookingCardGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      borderRadius: 3,
    },
    bookingCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    bookingCardLeft: {
      flex: 1,
      marginRight: 16,
    },
    bookingCardIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    bookingCardTitle: {
      fontSize: 22,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
      lineHeight: 30,
      marginBottom: 4,
    },
    bookingCardStatus: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    bookingCardStatusActive: {
      backgroundColor: '#1E40AF',
      borderWidth: 1,
      borderColor: '#3B82F6',
    },
    bookingCardStatusCompleted: {
      backgroundColor: '#065F46',
      borderWidth: 1,
      borderColor: '#10B981',
    },
    bookingCardStatusBooked: {
      backgroundColor: '#92400E',
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    bookingCardStatusText: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    bookingCardInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    bookingCardDateContainer: {
      alignItems: 'flex-start',
    },
    bookingCardDate: {
      fontSize: 15,
      fontFamily: 'Poppins_500Medium',
      color: colors.secondary,
      marginBottom: 8,
      opacity: 0.8,
    },
    bookingCardTime: {
      fontSize: 26,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
      letterSpacing: -0.5,
    },
    bookingCardPriceContainer: {
      alignItems: 'flex-end',
    },
    bookingCardPrice: {
      fontSize: 32,
      fontFamily: 'Poppins_800Bold',
      color: colors.text,
      marginBottom: 6,
      letterSpacing: -1,
    },
    bookingCardPriceLabel: {
      fontSize: 14,
      fontFamily: 'Poppins_500Medium',
      color: colors.secondary,
      opacity: 0.7,
    },
    bookingCardActions: {
      flexDirection: 'row',
      gap: 16,
    },
    bookingCardButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    bookingCardButtonPressed: {
      backgroundColor: '#2563EB',
      transform: [{ scale: 0.98 }],
    },
    bookingCardButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    bookingCardButtonSecondary: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    bookingCardButtonSecondaryPressed: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      transform: [{ scale: 0.98 }],
    },
    bookingCardButtonTextSecondary: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.text,
      letterSpacing: 0.5,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyStateIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 36,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    emptyStateTitle: {
      fontSize: 28,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    emptyStateText: {
      fontSize: 17,
      fontFamily: 'Poppins_400Regular',
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 28,
      opacity: 0.8,
    },
  });

  const handleBookingDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCancelBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleReBook = (booking: any) => {
    setSelectedBooking(booking);
    setShowReBookModal(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'მიმდინარე':
        return [styles.bookingCardStatus, styles.bookingCardStatusActive];
      case 'დასრულებული':
        return [styles.bookingCardStatus, styles.bookingCardStatusCompleted];
      case 'დაჯავშნილი':
        return [styles.bookingCardStatus, styles.bookingCardStatusBooked];
      default:
        return [styles.bookingCardStatus, styles.bookingCardStatusBooked];
    }
  };

  const getStatusTextStyle = (status: string) => {
    return styles.bookingCardStatusText;
  };

  const getActionButton = (booking: any) => {
    if (booking.status === 'დასრულებული') {
      return (
        <TouchableOpacity 
          style={[
            styles.bookingCardButtonSecondary,
            pressedButtons[`rebook${booking.id}`] && styles.bookingCardButtonSecondaryPressed
          ]}
          onPress={() => handleReBook(booking)}
          onPressIn={() => setPressedButtons(prev => ({ ...prev, [`rebook${booking.id}`]: true }))}
          onPressOut={() => setPressedButtons(prev => ({ ...prev, [`rebook${booking.id}`]: false }))}
          activeOpacity={0.8}
        >
          <Text style={styles.bookingCardButtonTextSecondary}>კვლავ დაჯავშნა</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity 
          style={[
            styles.bookingCardButtonSecondary,
            pressedButtons[`cancel${booking.id}`] && styles.bookingCardButtonSecondaryPressed
          ]}
          onPress={() => handleCancelBooking(booking)}
          onPressIn={() => setPressedButtons(prev => ({ ...prev, [`cancel${booking.id}`]: true }))}
          onPressOut={() => setPressedButtons(prev => ({ ...prev, [`cancel${booking.id}`]: false }))}
          activeOpacity={0.8}
        >
          <Text style={styles.bookingCardButtonTextSecondary}>გაუქმება</Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ჩემი ჯავშნები</Text>
          <View style={{ width: 52 }} />
        </View>
        <Text style={styles.headerSubtitle}>თქვენი ყველა ჯავშანი ერთ ადგილას</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {USER_BOOKINGS.length > 0 ? (
          USER_BOOKINGS.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={[styles.bookingCardGradient, { backgroundColor: booking.gradientColor }]} />
              <View style={styles.bookingCardHeader}>
                <View style={styles.bookingCardLeft}>
                  <View style={styles.bookingCardIcon}>
                    <Ionicons name={booking.icon as any} size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.bookingCardTitle}>{booking.title}</Text>
                </View>
                <View style={getStatusStyle(booking.status)}>
                  <Text style={getStatusTextStyle(booking.status)}>{booking.status}</Text>
                </View>
              </View>
              <View style={styles.bookingCardInfo}>
                <View style={styles.bookingCardDateContainer}>
                  <Text style={styles.bookingCardDate}>{booking.date}</Text>
                  <Text style={styles.bookingCardTime}>{booking.time}</Text>
                </View>
                <View style={styles.bookingCardPriceContainer}>
                  <Text style={styles.bookingCardPrice}>{booking.price}</Text>
                  <Text style={styles.bookingCardPriceLabel}>ფასი</Text>
                </View>
              </View>
              <View style={styles.bookingCardActions}>
                <TouchableOpacity 
                  style={[
                    styles.bookingCardButton,
                    pressedButtons[`details${booking.id}`] && styles.bookingCardButtonPressed
                  ]}
                  onPress={() => handleBookingDetails(booking)}
                  onPressIn={() => setPressedButtons(prev => ({ ...prev, [`details${booking.id}`]: true }))}
                  onPressOut={() => setPressedButtons(prev => ({ ...prev, [`details${booking.id}`]: false }))}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookingCardButtonText}>დეტალები</Text>
                </TouchableOpacity>
                {getActionButton(booking)}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="calendar-outline" size={40} color={colors.secondary} />
            </View>
            <Text style={styles.emptyStateTitle}>ჯავშნები არ არის</Text>
            <Text style={styles.emptyStateText}>
              თქვენ ჯერ არ გაქვთ დაჯავშნილი სამრეცხაო. გადადით მთავარ გვერდზე და დაჯავშნეთ პირველი ჯავშანი!
            </Text>
          </View>
        )}
      </ScrollView>

      <BookingDetailsModal
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        booking={selectedBooking}
      />
      <CancelBookingModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          console.log('Booking cancelled:', selectedBooking);
        }}
        booking={selectedBooking}
      />
      <ReBookModal
        visible={showReBookModal}
        onClose={() => setShowReBookModal(false)}
        onConfirm={() => {
          setShowReBookModal(false);
          console.log('Booking re-booked:', selectedBooking);
        }}
        booking={selectedBooking}
      />
    </View>
  );
}
