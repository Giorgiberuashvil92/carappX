import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { carwashApi, CarwashBooking } from '../services/carwashApi';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

// Mock bookings data
const USER_BOOKINGS = [
  {
    id: '1',
    locationName: 'CAR WASH CENTER',
    serviceName: 'სრული სამრეცხაო',
    date: 'დღეს',
    time: '15:30',
    price: '15₾',
    status: 'მიმდინარე',
    statusColor: '#1D4ED8',
    address: 'კოსტავას ქუჩა 70 (პეკინი)',
    rating: 3.67,
    reviews: 124,
  },
  {
    id: '2',
    locationName: 'ALL CLEAN',
    serviceName: 'პრემიუმ სამრეცხაო',
    date: 'გუშინ',
    time: '10:15',
    price: '25₾',
    status: 'დასრულებული',
    statusColor: '#047857',
    address: 'ბალანჩივაძის ქუჩა 22',
    rating: 5.0,
    reviews: 89,
  },
  {
    id: '3',
    locationName: 'LUCKY WASH',
    serviceName: 'დეტალური სამრეცხაო',
    date: 'ხვალ',
    time: '14:00',
    price: '35₾',
    status: 'დაჯავშნილი',
    statusColor: '#D97706',
    address: 'ვაჟა-ფშაველას 15',
    rating: 4.33,
    reviews: 203,
  },
  {
    id: '4',
    locationName: 'MZ CARWASH',
    serviceName: 'სწრაფი სამრეცხაო',
    date: '15 დეკემბერი',
    time: '12:30',
    price: '8₾',
    status: 'დაჯავშნილი',
    statusColor: '#D97706',
    address: 'აღმაშენებლის 23',
    rating: 4.7,
    reviews: 67,
  },
  {
    id: '5',
    locationName: 'GLOSS',
    serviceName: 'პროფესიონალური სამრეცხაო',
    date: '20 დეკემბერი',
    time: '16:45',
    price: '20₾',
    status: 'დაჯავშნილი',
    statusColor: '#D97706',
    address: 'დიდუბის 12',
    rating: 4.7,
    reviews: 156,
  },
];

export default function BookingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userBookings, setUserBookings] = useState<CarwashBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'მოლოდინში';
      case 'confirmed':
        return 'დადასტურებული';
      case 'in_progress':
        return 'მიმდინარე';
      case 'completed':
        return 'დასრულებული';
      case 'cancelled':
        return 'გაუქმებული';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#D97706'; // Orange
      case 'confirmed':
        return '#1D4ED8'; // Blue
      case 'in_progress':
        return '#059669'; // Green
      case 'completed':
        return '#047857'; // Dark Green
      case 'cancelled':
        return '#DC2626'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const loadUserBookings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setLoading(true);
      const bookings = await carwashApi.getAllBookings(user.id);
      setUserBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load user bookings on component mount
  useFocusEffect(
    useCallback(() => {
      loadUserBookings();
    }, [loadUserBookings])
  );

  const styles = StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: '#FFFFFF' 
    },
    container: { 
      flex: 1, 
      backgroundColor: '#FFFFFF' 
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F8F9FA',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#F0F0F0',
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    headerTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 20,
      color: '#1A1A1A',
      letterSpacing: -0.5,
    },
    filterButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    filterSection: {
      marginBottom: 24,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 18,
    },
    filterCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    filterIcon: {
      color: '#6C757D',
    },
    filterText: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 12,
      color: '#495057',
    },
    searchContainer: {
      flexDirection: 'row',
      gap: 14,
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      backgroundColor: '#F8F9FA',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontFamily: 'NotoSans_500Medium',
      fontSize: 14,
      color: '#1A1A1A',
      borderWidth: 1,
      borderColor: '#F0F0F0',
    },
    searchButton: {
      width: 56,
      height: 56,
      backgroundColor: '#3B82F6',
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    content: { 
      paddingHorizontal: 20, 
      paddingBottom: 32 
    },
    bookingCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      marginBottom: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    logoContainer: {
      alignItems: 'center',
      gap: 6,
    },
    logo: {
      width: 40,
      height: 40,
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E9ECEF',
    },
    logoText: {
      fontSize: 20,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingText: {
      fontSize: 11,
      fontFamily: 'NotoSans_600SemiBold',
      color: '#495057',
    },
    infoContainer: {
      flex: 1,
    },
    cardTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 12,
      color: '#212529',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    serviceName: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 11,
      color: '#6C757D',
      marginBottom: 8,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    cardAddress: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 11,
      color: '#6C757D',
    },
    bookingDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bookingDate: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 11,
      color: '#212529',
    },
    bookingTime: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 11,
      color: '#212529',
    },
    bookingPrice: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#3B82F6',
    },
    statusContainer: {
      alignItems: 'flex-end',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: '#F0F9FF',
      borderWidth: 1,
      borderColor: '#E0F2FE',
    },
    statusText: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 10,
      color: '#1D4ED8',
    },
    actionButton: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    actionButtonText: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 10,
      color: '#FFFFFF',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyStateIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F8F9FA',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E9ECEF',
    },
    emptyStateTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 18,
      color: '#1A1A1A',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 14,
      color: '#6C757D',
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const filteredBookings = useMemo(() => {
    let list = userBookings;
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(booking => 
        booking.locationName.toLowerCase().includes(q) || 
        booking.serviceName.toLowerCase().includes(q) ||
        booking.locationAddress.toLowerCase().includes(q)
      );
    }
    
    if (selectedFilter !== 'all') {
      list = list.filter(booking => {
        switch (selectedFilter) {
          case 'active':
            return booking.status === 'in_progress' || booking.status === 'confirmed' || booking.status === 'pending';
          case 'completed':
            return booking.status === 'completed';
          case 'cancelled':
            return booking.status === 'cancelled';
          default:
            return true;
        }
      });
    }
    
    return list;
  }, [userBookings, searchQuery, selectedFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserBookings();
    setRefreshing(false);
  }, [loadUserBookings]);

  const handleBookingDetails = (booking: CarwashBooking) => {
    router.push({
      pathname: '/booking-details',
      params: { bookingId: booking.id }
    });
  };

  const renderBookingCard = (booking: CarwashBooking) => {
    const statusColor = getStatusColor(booking.status);
    const statusText = getStatusText(booking.status);
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('ka-GE');
    
    return (
      <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        onPress={() => handleBookingDetails(booking)}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🚗</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.cardTitle}>{booking.locationName}</Text>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={10} color="#6C757D" />
              <Text style={styles.cardAddress}>{booking.locationAddress}</Text>
            </View>
            <View style={styles.bookingDetails}>
              <View style={styles.dateTimeContainer}>
                <Text style={styles.bookingDate}>{bookingDate}</Text>
                <Text style={styles.bookingTime}>{booking.bookingTime}</Text>
              </View>
              <Text style={styles.bookingPrice}>{booking.servicePrice}₾</Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { 
              backgroundColor: statusColor + '20',
              borderColor: statusColor + '40'
            }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>დეტალები</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={18} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ჩემი ჯავშნები</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <View style={styles.filterCard}>
                <Ionicons name="calendar" size={16} style={styles.filterIcon} />
                <View>
                  <Text style={styles.filterText}>ყველა ჯავშანი</Text>
                  <Text style={[styles.filterText, { fontSize: 10, marginTop: 2 }]}>
                    {USER_BOOKINGS.length} ჯავშანი
                  </Text>
                </View>
              </View>
              <View style={styles.filterCard}>
                <Ionicons name="time" size={16} style={styles.filterIcon} />
                <View>
                  <Text style={styles.filterText}>ფილტრი</Text>
                  <Text style={[styles.filterText, { fontSize: 10, marginTop: 2 }]}>
                    სტატუსის მიხედვით
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="ძებნა ჯავშნებში..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        >
          {filteredBookings.length > 0 ? (
            filteredBookings.map(booking => renderBookingCard(booking))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="calendar-outline" size={32} color="#6C757D" />
              </View>
              <Text style={styles.emptyStateTitle}>ჯავშნები არ მოიძებნა</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 
                  'ძებნის შედეგები არ მოიძებნა. სცადეთ სხვა საკვანძო სიტყვები.' :
                  'თქვენ ჯერ არ გაქვთ დაჯავშნილი სამრეცხაო. გადადით მთავარ გვერდზე და დაჯავშნეთ პირველი ჯავშანი!'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}