import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { carwashApi, CreateBookingRequest } from '../services/carwashApi';
import { useUser } from '../contexts/UserContext';
import { useCars } from '../contexts/CarContext';

const { width } = Dimensions.get('window');

const BOOKING_SERVICES = [
  { 
    id: '1', 
    name: 'სრული სამრეცხაო', 
    price: '15₾', 
    duration: '30 წთ', 
    description: 'გარე და შიდა სრული გაწმენდა',
  },
  { 
    id: '2', 
    name: 'პრემიუმ სამრეცხაო', 
    price: '25₾', 
    duration: '45 წთ', 
    description: 'სრული გაწმენდა + ცვილის გამოყენება',
  },
  { 
    id: '3', 
    name: 'სწრაფი სამრეცხაო', 
    price: '8₾', 
    duration: '15 წთ', 
    description: 'მხოლოდ გარე გაწმენდა',
  },
  { 
    id: '4', 
    name: 'დეტალური სამრეცხაო', 
    price: '35₾', 
    duration: '60 წთ', 
    description: 'სრული დეტალური გაწმენდა',
  },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export default function BookingScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const { selectedCar } = useCars();
  const params = useLocalSearchParams();
  const location = params.location ? JSON.parse(params.location as string) : null;
  
  // Payment success detection
  const isPaymentSuccess = params.paymentSuccess === 'true';
  const paymentAmount = params.paymentAmount;
  const paymentOrderId = params.paymentOrderId;
  
  // Payment status state
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  

  
  // Log time slots config if available
  if (params.locationTimeSlotsConfig) {
    try {
      const timeSlotsConfig = JSON.parse(params.locationTimeSlotsConfig as string);
    } catch (error) {
      console.error('🔍 [BOOKING] Error parsing timeSlotsConfig:', error);
    }
  } else {
  }

  // Convert detailedServices to booking format
  const getDynamicServices = () => {
    try {
      if (params.locationDetailedServices) {
        const detailedServices = JSON.parse(params.locationDetailedServices as string);
        
        if (Array.isArray(detailedServices) && detailedServices.length > 0) {
          return detailedServices.map((service: any) => ({
            id: service.id,
            name: service.name,
            price: `${service.price}₾`,
            duration: `${service.duration} წთ`,
            description: service.description || `${service.name} სერვისი`,
          }));
        }
      }
    } catch (error) {
      console.error('🔍 [BOOKING] Error parsing detailedServices:', error);
    }
    
    // Fallback to static services
    return BOOKING_SERVICES;
  };

  const dynamicServices = getDynamicServices();

  // Generate dynamic time slots based on timeSlotsConfig
  const getDynamicTimeSlots = () => {
    try {
      if (params.locationTimeSlotsConfig) {
        const timeSlotsConfig = JSON.parse(params.locationTimeSlotsConfig as string);
        
        if (timeSlotsConfig.workingDays && timeSlotsConfig.interval) {
          const slots: string[] = [];
          const interval = timeSlotsConfig.interval || 30; // default 30 minutes
          
          const startHour = 9; // 09:00
          const endHour = 18;  // 18:00
          
          for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
              const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              slots.push(timeString);
            }
          }
          
          return slots;
        }
      }
    } catch (error) {
      console.error('🔍 [BOOKING] Error generating dynamic time slots:', error);
    }
    
    // Fallback to static time slots
    return TIME_SLOTS;
  };

  const dynamicTimeSlots = getDynamicTimeSlots();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Payment success effect
  useEffect(() => {
    if (isPaymentSuccess) {
      console.log('🎉 Payment Success detected! Showing payment success modal...');
      setPaymentCompleted(true); // გადახდა დასრულდა
      setShowPaymentSuccessModal(true);
      
      setTimeout(() => {
        setShowPaymentSuccessModal(false);
      }, 3000);
    }
  }, [isPaymentSuccess]);

  const styles = StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: '#FFFFFF' 
    },
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      paddingTop: 10,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'NotoSans_700Bold',
      color: '#111827',
      letterSpacing: -0.5,
    },
    titleUnderline: {
      width: 40,
      height: 3,
      backgroundColor: '#3B82F6',
      borderRadius: 2,
      marginTop: 4,
    },
    headerRight: {
      width: 40,
    },
    // Location Card Styles
    locationCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    locationImageContainer: {
      position: 'relative',
      height: 80,
    },
    locationImage: {
      width: '100%',
      height: '100%',
    },
    locationImageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      padding: 12,
    },
    locationBadges: {
      flexDirection: 'row',
      gap: 8,
    },
    locationCategoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    locationCategoryText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontFamily: 'NotoSans_700Bold',
    },
    locationOpenBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(34, 197, 94, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      gap: 4,
    },
    locationOpenDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    locationOpenText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontFamily: 'NotoSans_600SemiBold',
    },
    locationInfo: {
      padding: 12,
    },
    locationName: {
      fontSize: 16,
      fontFamily: 'NotoSans_700Bold',
      color: '#111827',
      marginBottom: 3,
    },
    locationAddress: {
      fontSize: 12,
      fontFamily: 'NotoSans_500Medium',
      color: '#6B7280',
      marginBottom: 6,
    },
    locationMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    locationRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationRatingText: {
      fontSize: 12,
      fontFamily: 'NotoSans_600SemiBold',
      color: '#111827',
    },
    locationReviewsText: {
      fontSize: 10,
      fontFamily: 'NotoSans_500Medium',
      color: '#6B7280',
    },
    locationDistance: {
      fontSize: 10,
      fontFamily: 'NotoSans_600SemiBold',
      color: '#3B82F6',
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      paddingHorizontal: 20,
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F3F4F6',
    },
    activeStepCircle: {
      backgroundColor: '#3B82F6',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    stepText: {
      fontSize: 10,
      fontFamily: 'NotoSans_600SemiBold',
      color: '#6C757D',
      textAlign: 'center',
      marginTop: 4,
    },
    stepLine: {
      height: 2,
      backgroundColor: '#E5E7EB',
      flex: 1,
      marginHorizontal: 12,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 16,
      color: '#1A1A1A',
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    serviceCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    selectedServiceCard: {
      borderColor: '#3B82F6',
      backgroundColor: '#F0F9FF',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    serviceName: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#111827',
      flex: 1,
      marginRight: 8,
    },
    servicePrice: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 16,
      color: '#3B82F6',
    },
    serviceDescription: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 8,
      lineHeight: 16,
    },
    serviceDuration: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 10,
      color: '#10B981',
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: '#D1FAE5',
    },
    dateContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dateCard: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      minWidth: 70,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    selectedDateCard: {
      borderColor: '#3B82F6',
      backgroundColor: '#F0F9FF',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    dateText: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 12,
      color: '#111827',
    },
    dayText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 10,
      color: '#6B7280',
      marginTop: 2,
    },
    timeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeSlot: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      minWidth: 65,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    selectedTimeSlot: {
      borderColor: '#3B82F6',
      backgroundColor: '#F0F9FF',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    timeText: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 12,
      color: '#111827',
    },
    selectedTimeText: {
      color: '#3B82F6',
    },
    summaryContainer: {
      backgroundColor: '#F8F9FA',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    summaryTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#212529',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      color: '#6C757D',
    },
    summaryValue: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 12,
      color: '#212529',
    },
    totalPrice: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 16,
      color: '#3B82F6',
    },
    nextButton: {
      backgroundColor: '#3B82F6',
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 18,
      borderRadius: 14,
      alignItems: 'center',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    nextButtonText: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    disabledButton: {
      backgroundColor: '#9CA3AF',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    backButtonStep: {
      backgroundColor: '#F8F9FA',
      marginHorizontal: 20,
      marginBottom: 12,
      paddingVertical: 18,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    backButtonText: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 14,
      color: '#6C757D',
      letterSpacing: -0.2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      marginHorizontal: 20,
      maxWidth: width - 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 20,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    modalTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 20,
      color: '#1A1A1A',
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    modalSubtitle: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 14,
      color: '#6C757D',
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    bookingDetails: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#F0F0F0',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    detailLabel: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      color: '#6C757D',
    },
    detailValue: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 12,
      color: '#212529',
    },
    modalButton: {
      backgroundColor: '#3B82F6',
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    modalButtonText: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    bogPaymentButton: {
      backgroundColor: '#22C55E',
      marginHorizontal: 20,
      marginBottom: 12,
      paddingVertical: 18,
      borderRadius: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    bogPaymentButtonText: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    modalText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 16,
      color: '#374151',
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 24,
    },
    modalSubText: {
      fontFamily: 'NotoSans_400Regular',
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    // Payment Status Styles
    paymentStatusContainer: {
      marginHorizontal: 20,
      marginBottom: 12,
    },
    paymentStatusCard: {
      backgroundColor: '#F0FDF4',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#BBF7D0',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    paymentStatusInfo: {
      flex: 1,
      marginLeft: 12,
    },
    paymentStatusTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#166534',
      marginBottom: 4,
    },
    paymentStatusText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      color: '#15803D',
      lineHeight: 16,
    },
  });

  const getDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' }),
        day: date.toLocaleDateString('ka-GE', { weekday: 'short' }),
        fullDate: date.toISOString().split('T')[0],
      });
    }
    return dates;
  };

  const getSelectedService = () => {
    return dynamicServices.find(service => service.id === selectedService);
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

  const handleNextStep = () => {
    if (currentStep === 1 && selectedService) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedDate && selectedTime) {
      handleConfirmBooking();
    }
  };

  const handleBackStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const showSuccessModalWithAnimation = () => {
    setShowSuccessModal(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSuccessModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      // Navigate back with refresh flag
      router.back();
      // Trigger refresh on carwash page
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)/carwash',
          params: { refresh: 'true' }
        });
      }, 100);
    });
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ სერვისი, თარიღი და დრო');
      return;
    }

    if (!isAuthenticated || !user) {
      Alert.alert('შეცდომა', 'გთხოვთ ჯერ შეხვიდეთ სისტემაში');
      return;
    }

    try {
      const service = getSelectedService();
      if (!service || !location) return;

      const bookingData: CreateBookingRequest = {
        userId: user.id,
        locationId: location.id,
        locationName: location.name,
        locationAddress: location.address,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: parseInt(service.price.replace('₾', '')),
        bookingDate: new Date(selectedDate).getTime(),
        bookingTime: selectedTime,
        carInfo: {
          make: selectedCar?.make || 'Toyota',
          model: selectedCar?.model || 'Camry',
          year: String(selectedCar?.year || '2020'),
          licensePlate: selectedCar?.plateNumber || 'TB-123-AB',
          color: 'შავი'
        },
        customerInfo: {
          name: user.name || 'მომხმარებელი',
          phone: user.phone || '',
          email: user.email
        }
      };

      // ჯავშნის შექმნა backend-ში
      await carwashApi.createBooking(bookingData);
      
      // Payment success-ის შემთხვევაში სხვანაირი მესიჯი
      if (isPaymentSuccess) {
        Alert.alert(
          'წარმატება! 🎉', 
          'გადახდა წარმატებით განხორციელდა და ჯავშანი დადასტურებულია!',
          [
            {
              text: 'კარგი',
              onPress: () => {
                router.push({
                  pathname: '/(tabs)/carwash',
                  params: { refresh: 'true' }
                });
              }
            }
          ]
        );
      } else {
        // ჩვეულებრივი success modal
        showSuccessModalWithAnimation();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('შეცდომა', 'ჯავშნის შექმნისას მოხდა შეცდომა');
    }
  };

  const handleBOGPayment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ სერვისი, თარიღი და დრო');
      return;
    }

    if (!isAuthenticated || !user) {
      Alert.alert('შეცდომა', 'გთხოვთ ჯერ შეხვიდეთ სისტემაში');
      return;
    }

    const service = getSelectedService();
    if (!service || !location) return;

    const servicePrice = parseInt(service.price.replace('₾', ''));
    
    // გადავიყვანოთ payment-card სქრინზე
    const bookingMetadata = {
      serviceId: service.id,
      serviceName: service.name,
      locationId: location.id,
      locationName: location.name,
      selectedDate: selectedDate,
      selectedTime: selectedTime,
      bookingType: 'carwash'
    };

    router.push({
      pathname: '/payment-card',
      params: {
        amount: servicePrice.toString(),
        description: `CarWash ჯავშანი - ${service.name} - ${location.name}`,
        context: 'carwash',
        orderId: `carwash_booking_${user.id}_${Date.now()}`,
        successUrl: '/booking-success',
        metadata: JSON.stringify(bookingMetadata)
      }
    });
  };

  const renderStep1 = () => {
  
    return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>აირჩიეთ სერვისი</Text>
        {dynamicServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              selectedService === service.id && styles.selectedServiceCard
            ]}
            onPress={() => setSelectedService(service.id)}
          >
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>{service.price}</Text>
            </View>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <Text style={styles.serviceDuration}>{service.duration}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    );
  };

  const renderStep2 = () => {
    return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>აირჩიეთ თარიღი</Text>
        <View style={styles.dateContainer}>
          {getDates().map((dateInfo) => (
            <TouchableOpacity
              key={dateInfo.fullDate}
              style={[
                styles.dateCard,
                selectedDate === dateInfo.fullDate && styles.selectedDateCard
              ]}
              onPress={() => setSelectedDate(dateInfo.fullDate)}
            >
              <Text style={styles.dateText}>{dateInfo.date}</Text>
              <Text style={styles.dayText}>{dateInfo.day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>აირჩიეთ დრო</Text>
        <View style={styles.timeContainer}>
          {dynamicTimeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.selectedTimeSlot
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeText,
                selectedTime === time && styles.selectedTimeText
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {(selectedDate || selectedTime) && (
        <View style={styles.section}>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>ჯავშნის დეტალები</Text>
            {selectedService && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>სერვისი:</Text>
                <Text style={styles.summaryValue}>{getSelectedService()?.name}</Text>
              </View>
            )}
            {selectedDate && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>თარიღი:</Text>
                <Text style={styles.summaryValue}>{selectedDate}</Text>
              </View>
            )}
            {selectedTime && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>დრო:</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
            )}
            {selectedService && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ფასი:</Text>
                <Text style={styles.totalPrice}>{getSelectedService()?.price}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
    );
  };

  const renderSuccessModal = () => {
    const service = getSelectedService();
    const selectedDateFormatted = selectedDate ? new Date(selectedDate).toLocaleDateString('ka-GE', { 
      day: 'numeric', 
      month: 'long' 
    }) : '';
    
    return (
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideSuccessModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              { 
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            
            <Text style={styles.modalTitle}>წარმატებული დაჯავშნა! 🎉</Text>
            <Text style={styles.modalSubtitle}>
              თქვენი ჯავშანი წარმატებით დადასტურებულია
            </Text>
            
            <View style={styles.bookingDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ლოკაცია:</Text>
                <Text style={styles.detailValue}>{location?.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>მისამართი:</Text>
                <Text style={styles.detailValue}>{location?.address}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>სერვისი:</Text>
                <Text style={styles.detailValue}>{service?.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>თარიღი:</Text>
                <Text style={styles.detailValue}>{selectedDateFormatted}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>დრო:</Text>
                <Text style={styles.detailValue}>{selectedTime}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ფასი:</Text>
                <Text style={[styles.detailValue, { color: '#3B82F6' }]}>{service?.price}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={hideSuccessModal}
            >
              <Text style={styles.modalButtonText}>კარგი</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Modern Header */}
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {currentStep === 1 ? 'სერვისის არჩევა' : 'თარიღი და დრო'}
            </Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <View style={styles.headerRight} />
        </View>
        
        {location && (
          <View style={styles.locationCard}>
            <View style={styles.locationImageContainer}>
              <Image source={{ uri: location.image }} style={styles.locationImage} />
              <View style={styles.locationImageOverlay}>
                <View style={styles.locationBadges}>
                  <View style={[styles.locationCategoryBadge, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.locationCategoryText}>{location.category}</Text>
                  </View>
                  {location.isOpen && (
                    <View style={styles.locationOpenBadge}>
                      <View style={styles.locationOpenDot} />
                      <Text style={styles.locationOpenText}>ღიაა</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
              <View style={styles.locationMeta}>
                <View style={styles.locationRating}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.locationRatingText}>{location.rating}</Text>
                  <Text style={styles.locationReviewsText}>({location.reviews})</Text>
                </View>
                <Text style={styles.locationDistance}>{location.distance}</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.container}>

      <View style={styles.stepIndicator}>
        <View style={[
          styles.stepCircle,
          currentStep >= 1 && styles.activeStepCircle
        ]}>
          <Ionicons 
            name={currentStep >= 1 ? 'checkmark' : 'ellipse'} 
            size={16} 
            color={currentStep >= 1 ? '#FFFFFF' : '#6C757D'} 
          />
        </View>
        <View style={styles.stepLine} />
        <View style={[
          styles.stepCircle,
          currentStep >= 2 && styles.activeStepCircle
        ]}>
          <Ionicons 
            name={currentStep >= 2 ? 'checkmark' : 'ellipse'} 
            size={16} 
            color={currentStep >= 2 ? '#FFFFFF' : '#6C757D'} 
          />
        </View>
      </View>

      {currentStep === 1 ? renderStep1() : renderStep2()}

      {currentStep === 1 ? (
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedService && styles.disabledButton
          ]}
          onPress={handleNextStep}
          disabled={!selectedService}
        >
          <Text style={styles.nextButtonText}>
            შემდეგი ({selectedService ? getSelectedService()?.price : 'აირჩიეთ სერვისი'})
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.backButtonStep}
            onPress={handleBackStep}
          >
            <Text style={styles.backButtonText}>უკან</Text>
          </TouchableOpacity>
          
          {/* BOG გადახდის ღილაკი - მხოლოდ თუ გადახდა არ მოხდა */}
          {!paymentCompleted && (
            <TouchableOpacity
              style={[
                styles.bogPaymentButton,
                (!selectedDate || !selectedTime) && styles.disabledButton
              ]}
              onPress={handleBOGPayment}
              disabled={!selectedDate || !selectedTime}
            >
              <Ionicons name="card" size={16} color="#FFFFFF" />
              <Text style={styles.bogPaymentButtonText}>
                BOG გადახდა ({selectedService ? getSelectedService()?.price : '0₾'})
              </Text>
            </TouchableOpacity>
          )}
          
          {/* გადახდის სტატუსი - თუ გადახდა მოხდა */}
          {paymentCompleted && (
            <View style={styles.paymentStatusContainer}>
              <View style={styles.paymentStatusCard}>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                <View style={styles.paymentStatusInfo}>
                  <Text style={styles.paymentStatusTitle}>გადახდა წარმატებულია! 🎉</Text>
                  <Text style={styles.paymentStatusText}>
                    თქვენი გადახდა {paymentAmount}₾ წარმატებით განხორციელდა
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!selectedDate || !selectedTime) && styles.disabledButton
            ]}
            onPress={handleNextStep}
            disabled={!selectedDate || !selectedTime}
          >
            <Text style={styles.nextButtonText}>
              უფასო დადასტურება
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
      
      {renderSuccessModal()}
      
      {/* Payment Success Modal */}
      {showPaymentSuccessModal && (
        <Modal
          visible={showPaymentSuccessModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
              </View>
              <Text style={styles.modalTitle}>გადახდა წარმატებულია! 🎉</Text>
              <Text style={styles.modalText}>
                თქვენი გადახდა წარმატებით განხორციელდა ({paymentAmount}₾)
              </Text>
              <Text style={styles.modalSubText}>
                ახლა შეგიძლიათ ჯავშნის დადასტურება
              </Text>
            </View>
          </View>
        </Modal>
      )}
      
    </SafeAreaView>
  );
}
