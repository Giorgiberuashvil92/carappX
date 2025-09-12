import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { carwashApi, CarwashBooking } from '../services/carwashApi';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;
  
  const [booking, setBooking] = useState<CarwashBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const bookingData = await carwashApi.getBookingById(bookingId);
      setBooking(bookingData);
    } catch (error) {
      console.error('Error loading booking details:', error);
      Alert.alert('შეცდომა', 'ჯავშნის დეტალების ჩატვირთვისას მოხდა შეცდომა');
    } finally {
      setLoading(false);
    }
  };

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
        return '#D97706';
      case 'confirmed':
        return '#1D4ED8';
      case 'in_progress':
        return '#059669';
      case 'completed':
        return '#047857';
      case 'cancelled':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const handleStatusAction = async (action: 'cancel' | 'confirm' | 'start' | 'complete') => {
    if (!booking) return;

    try {
      let updatedBooking: CarwashBooking;
      
      switch (action) {
        case 'cancel':
          updatedBooking = await carwashApi.cancelBooking(booking.id);
          break;
        case 'confirm':
          updatedBooking = await carwashApi.confirmBooking(booking.id);
          break;
        case 'start':
          updatedBooking = await carwashApi.startBooking(booking.id);
          break;
        case 'complete':
          updatedBooking = await carwashApi.completeBooking(booking.id);
          break;
        default:
          return;
      }
      
      setBooking(updatedBooking);
      Alert.alert('წარმატება', 'ჯავშნის სტატუსი წარმატებით განახლდა');
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('შეცდომა', 'სტატუსის განახლებისას მოხდა შეცდომა');
    }
  };

  const getActionButtons = () => {
    if (!booking) return null;

    const buttons = [];

    switch (booking.status) {
      case 'pending':
        buttons.push(
          <TouchableOpacity
            key="confirm"
            style={[styles.actionButton, { backgroundColor: '#1D4ED8' }]}
            onPress={() => handleStatusAction('confirm')}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>დადასტურება</Text>
          </TouchableOpacity>,
          <TouchableOpacity
            key="cancel"
            style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
            onPress={() => handleStatusAction('cancel')}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>გაუქმება</Text>
          </TouchableOpacity>
        );
        break;
      case 'confirmed':
        buttons.push(
          <TouchableOpacity
            key="start"
            style={[styles.actionButton, { backgroundColor: '#059669' }]}
            onPress={() => handleStatusAction('start')}
          >
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>დაწყება</Text>
          </TouchableOpacity>
        );
        break;
      case 'in_progress':
        buttons.push(
          <TouchableOpacity
            key="complete"
            style={[styles.actionButton, { backgroundColor: '#047857' }]}
            onPress={() => handleStatusAction('complete')}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>დასრულება</Text>
          </TouchableOpacity>
        );
        break;
    }

    return buttons;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>იტვირთება...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={styles.errorText}>ჯავშანი ვერ მოიძებნა</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#DC2626" />
            <Text style={styles.errorText}>უკან დაბრუნება</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const statusText = getStatusText(booking.status);
  const bookingDate = new Date(booking.bookingDate).toLocaleDateString('ka-GE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Modern Header */}
      <LinearGradient
        colors={['#111827', '#374151']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ჯავშნის დეტალები</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{statusText}</Text>
                </View>
                <Text style={styles.bookingId}>#{booking.id}</Text>
              </View>
              
              <Text style={styles.locationName}>{booking.locationName}</Text>
              <Text style={styles.serviceName}>{booking.serviceName}</Text>
              <Text style={styles.price}>{booking.servicePrice}₾</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.quickInfoContainer}>
          <View style={[styles.quickInfoCard, { backgroundColor: '#EBF8FF' }]}>
            <Ionicons name="calendar" size={24} color="#3B82F6" />
            <Text style={styles.quickInfoLabel}>თარიღი</Text>
            <Text style={styles.quickInfoValue}>{bookingDate}</Text>
          </View>

          <View style={[styles.quickInfoCard, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="time" size={24} color="#10B981" />
            <Text style={styles.quickInfoLabel}>დრო</Text>
            <Text style={styles.quickInfoValue}>{booking.bookingTime}</Text>
          </View>

          <View style={[styles.quickInfoCard, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="location" size={24} color="#F59E0B" />
            <Text style={styles.quickInfoLabel}>მისამართი</Text>
            <Text style={styles.quickInfoValue} numberOfLines={2}>{booking.locationAddress}</Text>
          </View>
        </View>

        {/* Car Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="car" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.sectionTitle}>მანქანის ინფორმაცია</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>მარკა & მოდელი</Text>
              <Text style={styles.infoValue}>{booking.carInfo.make} {booking.carInfo.model}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>წელი</Text>
              <Text style={styles.infoValue}>{booking.carInfo.year}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ნომერი</Text>
              <Text style={styles.infoValue}>{booking.carInfo.licensePlate}</Text>
            </View>
            
            {booking.carInfo.color && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ფერი</Text>
                <Text style={styles.infoValue}>{booking.carInfo.color}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.sectionTitle}>მომხმარებლის ინფორმაცია</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>სახელი</Text>
              <Text style={styles.infoValue}>{booking.customerInfo.name}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ტელეფონი</Text>
              <Text style={styles.infoValue}>{booking.customerInfo.phone}</Text>
            </View>
            
            {booking.customerInfo.email && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ელ-ფოსტა</Text>
                <Text style={styles.infoValue}>{booking.customerInfo.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {getActionButtons() && (
          <View style={styles.actionsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="flash" size={24} color="#EF4444" />
              </View>
              <Text style={styles.sectionTitle}>მოქმედებები</Text>
            </View>
            <View style={styles.actionButtonsContainer}>
              {getActionButtons()}
            </View>
          </View>
        )}

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="document-text" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>შენიშვნები</Text>
            </View>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 18,
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  heroCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bookingId: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  locationName: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceName: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  price: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  quickInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickInfoCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  quickInfoLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  quickInfoValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  notesContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});