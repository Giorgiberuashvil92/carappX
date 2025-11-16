import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import API_BASE_URL from '../../config/api';
import { CarwashLocation } from '@/services/carwashLocationApi';

const { width } = Dimensions.get('window');

interface CarwashBooking {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  bookingDate: number;
  bookingTime: string;
  carInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    color?: string;
  };
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  estimatedDuration?: number;
  specialRequests?: string[];
  actualDuration?: number;
  rating?: number;
  review?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export default function BookingsScreen() {
  const router = useRouter();
  const { carwashId } = useLocalSearchParams();
  const [carwash, setCarwash] = useState<CarwashLocation | null>(null);
  const [bookings, setBookings] = useState<CarwashBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<CarwashBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const sortBookings = (list: CarwashBooking[]) => {
    const isActive = (status: string) =>
      status === 'pending' || status === 'confirmed' || status === 'in_progress';
    return [...list].sort((a, b) => {
      const aActive = isActive(a.status);
      const bActive = isActive(b.status);
      if (aActive !== bActive) return aActive ? -1 : 1;
      if (a.bookingDate !== b.bookingDate) return a.bookingDate - b.bookingDate;
      if (a.bookingTime && b.bookingTime) return a.bookingTime.localeCompare(b.bookingTime);
      return 0;
    });
  };

  // Load carwash and bookings data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load carwash info
        const carwashResponse = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}`);
        if (carwashResponse.ok) {
          const carwashData = await carwashResponse.json();
          setCarwash(carwashData);
        }

        // Load bookings
        const bookingsResponse = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}/bookings`);
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData);
          setFilteredBookings(sortBookings(bookingsData));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('შეცდომა', 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
    };

    if (carwashId) {
      loadData();
    }
  }, [carwashId]);

  // Filter bookings based on selected filter
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredBookings(sortBookings(bookings));
    } else {
      setFilteredBookings(
        sortBookings(bookings.filter(booking => booking.status === selectedFilter)),
      );
    }
  }, [selectedFilter, bookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload bookings
      const bookingsResponse = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}/bookings`);
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
        setFilteredBookings(sortBookings(bookingsData));
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/carwash/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: newStatus as any }
              : booking
          )
        );
        
        Alert.alert('წარმატება', 'ჯავშნის სტატუსი წარმატებით შეიცვალა');
      } else {
        throw new Error('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('შეცდომა', 'ჯავშნის სტატუსის შეცვლა ვერ მოხერხდა');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'მოლოდინში';
      case 'confirmed': return 'დადასტურებული';
      case 'in_progress': return 'მიმდინარე';
      case 'completed': return 'დასრულებული';
      case 'cancelled': return 'გაუქმებული';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'in_progress': return 'play-circle-outline';
      case 'completed': return 'checkmark-done-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderBookingCard = ({ item }: { item: CarwashBooking }) => (
    <View style={styles.modernBookingCard}>
      {/* Modern Header with Status */}
      <LinearGradient
        colors={[getStatusColor(item.status) + '15', getStatusColor(item.status) + '05']}
        style={styles.modernCardHeader}
      >
        <View style={styles.modernCustomerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitial}>{item.customerInfo.name.charAt(0)}</Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.modernCustomerName}>{item.customerInfo.name}</Text>
            <View style={styles.contactInfo}>
              <Ionicons name="call" size={12} color="#6b7280" />
              <Text style={styles.modernContactText}>{item.customerInfo.phone}</Text>
            </View>
            {item.customerInfo.email && (
              <View style={styles.contactInfo}>
                <Ionicons name="mail" size={12} color="#6b7280" />
                <Text style={styles.modernContactText}>{item.customerInfo.email}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={[styles.modernStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={14} 
            color="#FFFFFF" 
          />
          <Text style={styles.modernStatusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </LinearGradient>

      {/* Car & Service Info in Grid */}
      <View style={styles.modernInfoGrid}>
        <View style={styles.modernInfoCard}>
          <View style={styles.modernInfoHeader}>
            <View style={[styles.modernInfoIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="car-sport" size={16} color="#3b82f6" />
            </View>
            <Text style={styles.modernInfoTitle}>მანქანა</Text>
          </View>
          <Text style={styles.modernCarModel}>{item.carInfo.make} {item.carInfo.model}</Text>
          <Text style={styles.modernCarDetails}>{item.carInfo.year} • {item.carInfo.licensePlate}</Text>
          {item.carInfo.color && (
            <Text style={styles.modernCarColor}>{item.carInfo.color}</Text>
          )}
        </View>

        <View style={styles.modernInfoCard}>
          <View style={styles.modernInfoHeader}>
            <View style={[styles.modernInfoIcon, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="construct" size={16} color="#10b981" />
            </View>
            <Text style={styles.modernInfoTitle}>სერვისი</Text>
          </View>
          <Text style={styles.modernServiceName}>{item.serviceName}</Text>
          <Text style={styles.modernServicePrice}>{item.servicePrice}₾</Text>
          {item.estimatedDuration && (
            <Text style={styles.modernServiceDuration}>{item.estimatedDuration} წუთი</Text>
          )}
        </View>
      </View>

      {/* Date & Time */}
      <View style={styles.modernDateTimeSection}>
        <View style={styles.modernDateTimeCard}>
          <View style={styles.modernDateTimeHeader}>
            <Ionicons name="calendar" size={16} color="#667eea" />
            <Text style={styles.modernDateTimeTitle}>თარიღი</Text>
          </View>
          <Text style={styles.modernDateTimeValue}>{formatDate(item.bookingDate)}</Text>
        </View>
        <View style={styles.modernDateTimeCard}>
          <View style={styles.modernDateTimeHeader}>
            <Ionicons name="time" size={16} color="#f59e0b" />
            <Text style={styles.modernDateTimeTitle}>დრო</Text>
          </View>
          <Text style={styles.modernDateTimeValue}>{item.bookingTime}</Text>
        </View>
      </View>

      {/* Special Requests */}
      {item.specialRequests && item.specialRequests.length > 0 && (
        <View style={styles.modernSpecialRequests}>
          <View style={styles.modernSpecialRequestsHeader}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.modernSpecialRequestsTitle}>განსაკუთრებული მოთხოვნები</Text>
          </View>
          <View style={styles.modernSpecialRequestsList}>
            {item.specialRequests.map((request, index) => (
              <View key={index} style={styles.modernSpecialRequestItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.modernSpecialRequestText}>{request}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Notes */}
      {item.notes && (
        <View style={styles.modernNotesSection}>
          <View style={styles.modernNotesHeader}>
            <Ionicons name="document-text" size={16} color="#6b7280" />
            <Text style={styles.modernNotesTitle}>შენიშვნა</Text>
          </View>
          <Text style={styles.modernNotesText}>{item.notes}</Text>
        </View>
      )}

      {/* Rating & Review */}
      {item.rating && item.review && (
        <View style={styles.modernRatingSection}>
          <View style={styles.modernRatingHeader}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.modernRatingTitle}>შეფასება</Text>
          </View>
          <View style={styles.modernRatingContent}>
            <View style={styles.modernRatingStars}>
              {[...Array(5)].map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < item.rating! ? "star" : "star-outline"}
                  size={16}
                  color="#f59e0b"
                />
              ))}
              <Text style={styles.modernRatingValue}>{item.rating}/5</Text>
            </View>
            <Text style={styles.modernReviewText}>{item.review}</Text>
          </View>
        </View>
      )}

      {/* Modern Actions */}
      <View style={styles.modernActionsContainer}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.modernActionButton, styles.modernConfirmButton]}
              onPress={() => updateBookingStatus(item.id, 'confirmed')}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.modernActionText}>დადასტურება</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modernActionButton, styles.modernCancelButton]}
              onPress={() => updateBookingStatus(item.id, 'cancelled')}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
              <Text style={styles.modernActionText}>გაუქმება</Text>
            </TouchableOpacity>
          </>
        )}
        
        {item.status === 'confirmed' && (
          <TouchableOpacity 
            style={[styles.modernActionButton, styles.modernStartButton]}
            onPress={() => updateBookingStatus(item.id, 'in_progress')}
          >
            <Ionicons name="play" size={18} color="#FFFFFF" />
            <Text style={styles.modernActionText}>დაწყება</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'in_progress' && (
          <TouchableOpacity 
            style={[styles.modernActionButton, styles.modernCompleteButton]}
            onPress={() => updateBookingStatus(item.id, 'completed')}
          >
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.modernActionText}>დასრულება</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.modernEmptyState}>
      <LinearGradient
        colors={['#667eea20', '#764ba220']}
        style={styles.modernEmptyIcon}
      >
        <Ionicons name="calendar-outline" size={48} color="#667eea" />
      </LinearGradient>
      <Text style={styles.modernEmptyTitle}>ჯავშნები ჯერ არ არის</Text>
      <Text style={styles.modernEmptySubtitle}>
        ამ სამრეცხაოსთვის ჯავშნები ჯერ არ მიღებულა
      </Text>
      <View style={styles.modernEmptyActions}>
        <TouchableOpacity style={styles.modernEmptyButton}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.modernEmptyButtonText}>პრომოციის დაწყება</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>იტვირთება...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.modernBackButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.modernHeaderTitle}>ჯავშნების მართვა</Text>
            {carwash && (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText}>{carwash.name}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.modernFilterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Floating Stats Cards */}
        {bookings.length > 0 && (
          <View style={styles.floatingStatsContainer}>
            <View style={styles.floatingStatCard}>
              <View style={styles.floatingStatIcon}>
                <Ionicons name="calendar" size={20} color="#667eea" />
              </View>
              <Text style={styles.floatingStatValue}>{bookings.length}</Text>
              <Text style={styles.floatingStatLabel}>სულ</Text>
            </View>
            <View style={styles.floatingStatCard}>
              <View style={styles.floatingStatIcon}>
                <Ionicons name="time" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.floatingStatValue}>{bookings.filter(b => b.status === 'pending').length}</Text>
              <Text style={styles.floatingStatLabel}>მოლოდინში</Text>
            </View>
            <View style={styles.floatingStatCard}>
              <View style={styles.floatingStatIcon}>
                <Ionicons name="play-circle" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.floatingStatValue}>{bookings.filter(b => b.status === 'in_progress').length}</Text>
              <Text style={styles.floatingStatLabel}>მიმდინარე</Text>
            </View>
            <View style={styles.floatingStatCard}>
              <View style={styles.floatingStatIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
              <Text style={styles.floatingStatValue}>{bookings.filter(b => b.status === 'completed').length}</Text>
              <Text style={styles.floatingStatLabel}>დასრულებული</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Modern Filter Panel */}
      {showFilters && (
        <View style={styles.modernFilterPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modernFilterScroll}>
            {[
              { key: 'all', label: 'ყველა', icon: 'apps', color: '#6b7280' },
              { key: 'pending', label: 'მოლოდინში', icon: 'time', color: '#f59e0b' },
              { key: 'confirmed', label: 'დადასტურებული', icon: 'checkmark-circle', color: '#3b82f6' },
              { key: 'in_progress', label: 'მიმდინარე', icon: 'play-circle', color: '#8b5cf6' },
              { key: 'completed', label: 'დასრულებული', icon: 'checkmark-done', color: '#10b981' },
              { key: 'cancelled', label: 'გაუქმებული', icon: 'close-circle', color: '#ef4444' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.modernFilterChip,
                  selectedFilter === filter.key && styles.modernFilterChipActive,
                  { borderColor: filter.color }
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <View style={[
                  styles.modernFilterIcon,
                  { backgroundColor: selectedFilter === filter.key ? filter.color : 'transparent' }
                ]}>
                  <Ionicons 
                    name={filter.icon as any} 
                    size={16} 
                    color={selectedFilter === filter.key ? '#FFFFFF' : filter.color} 
                  />
                </View>
                <Text style={[
                  styles.modernFilterText,
                  selectedFilter === filter.key && styles.modernFilterTextActive,
                  { color: selectedFilter === filter.key ? filter.color : '#6b7280' }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Modern Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.modernListContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Modern Header Styles
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modernBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  modernHeaderTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modernFilterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  floatingStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  floatingStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  floatingStatValue: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 2,
  },
  floatingStatLabel: {
    fontSize: 11,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  // Modern Filter Panel
  modernFilterPanel: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernFilterScroll: {
    paddingHorizontal: 20,
  },
  modernFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    marginRight: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernFilterChipActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  modernFilterIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernFilterText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
  },
  modernFilterTextActive: {
    color: '#3B82F6',
  },
  // Modern List Container
  modernListContainer: {
    padding: 20,
    paddingTop: 16,
  },
  // Modern Booking Card
  modernBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  modernCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modernCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerInitial: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  customerDetails: {
    flex: 1,
  },
  modernCustomerName: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  modernContactText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modernStatusText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  // Modern Info Grid
  modernInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modernInfoCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  modernInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modernInfoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernInfoTitle: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  modernCarModel: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  modernCarDetails: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  modernCarColor: {
    fontSize: 11,
    fontFamily: 'NotoSans_500Medium',
    color: '#9CA3AF',
  },
  modernServiceName: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  modernServicePrice: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#10B981',
    marginBottom: 2,
  },
  modernServiceDuration: {
    fontSize: 11,
    fontFamily: 'NotoSans_500Medium',
    color: '#9CA3AF',
  },
  // Modern Date & Time
  modernDateTimeSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  modernDateTimeCard: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  modernDateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  modernDateTimeTitle: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#0369A1',
  },
  modernDateTimeValue: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#0C4A6E',
  },
  // Modern Special Requests
  modernSpecialRequests: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernSpecialRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modernSpecialRequestsTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#92400E',
  },
  modernSpecialRequestsList: {
    gap: 8,
  },
  modernSpecialRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernSpecialRequestText: {
    fontSize: 13,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    flex: 1,
  },
  // Modern Notes
  modernNotesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modernNotesTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#374151',
  },
  modernNotesText: {
    fontSize: 13,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    lineHeight: 18,
  },
  // Modern Rating
  modernRatingSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modernRatingTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#92400E',
  },
  modernRatingContent: {
    gap: 8,
  },
  modernRatingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernRatingValue: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginLeft: 8,
  },
  modernReviewText: {
    fontSize: 13,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Modern Actions
  modernActionsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modernActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modernActionText: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  modernConfirmButton: {
    backgroundColor: '#10B981',
  },
  modernCancelButton: {
    backgroundColor: '#EF4444',
  },
  modernStartButton: {
    backgroundColor: '#3B82F6',
  },
  modernCompleteButton: {
    backgroundColor: '#10B981',
  },
  // Modern Empty State
  modernEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  modernEmptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  modernEmptyTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modernEmptySubtitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modernEmptyActions: {
    gap: 12,
  },
  modernEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modernEmptyButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  customerEmail: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  serviceInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    gap: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
    marginBottom: 4,
  },
  bookingActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  carInfoSection: {
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  carDetails: {
    gap: 8,
  },
  carDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carDetailLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  carDetailValue: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
  },
  serviceInfoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  serviceDetails: {
    gap: 8,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetailLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  serviceDetailValue: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
  },
  specialRequestsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  specialRequestsList: {
    gap: 8,
  },
  specialRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialRequestText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    flex: 1,
  },
  notesSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    lineHeight: 20,
  },
  ratingSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  ratingDetails: {
    gap: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
