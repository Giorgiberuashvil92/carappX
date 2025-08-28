import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
  const params = useLocalSearchParams();
  const location = params.location ? JSON.parse(params.location as string) : null;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 10,
      paddingBottom: 20,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
    },
    locationInfo: {
      backgroundColor: '#F8FAFC',
      padding: 16,
      borderRadius: 8,
      marginBottom: 24,
    },
    locationName: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
      marginBottom: 4,
    },
    locationAddress: {
      fontSize: 14,
      fontFamily: 'Poppins_400Regular',
      color: '#6B7280',
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    stepText: {
      fontSize: 12,
      fontFamily: 'Poppins_500Medium',
      color: '#6B7280',
      textAlign: 'center',
    },
    stepLine: {
      height: 2,
      backgroundColor: '#E5E7EB',
      flex: 1,
      marginHorizontal: 12,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
      marginBottom: 16,
    },
    serviceCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    selectedServiceCard: {
      borderColor: '#3B82F6',
      backgroundColor: '#F0F9FF',
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    serviceName: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
      flex: 1,
    },
    servicePrice: {
      fontSize: 18,
      fontFamily: 'Poppins_700Bold',
      color: '#3B82F6',
    },
    serviceDescription: {
      fontSize: 14,
      fontFamily: 'Poppins_400Regular',
      color: '#6B7280',
      marginBottom: 8,
    },
    serviceDuration: {
      fontSize: 12,
      fontFamily: 'Poppins_500Medium',
      color: '#10B981',
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    dateContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dateCard: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      minWidth: 70,
    },
    selectedDateCard: {
      borderColor: '#3B82F6',
      backgroundColor: '#F0F9FF',
    },
    dateText: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
    },
    dayText: {
      fontSize: 12,
      fontFamily: 'Poppins_400Regular',
      color: '#6B7280',
      marginTop: 2,
    },
    timeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeSlot: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
    },
    selectedTimeSlot: {
      borderColor: '#3B82F6',
      backgroundColor: '#F0F9FF',
    },
    timeText: {
      fontSize: 14,
      fontFamily: 'Poppins_500Medium',
      color: '#1F2937',
    },
    selectedTimeText: {
      color: '#3B82F6',
    },
    summaryContainer: {
      backgroundColor: '#F8FAFC',
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      fontFamily: 'Poppins_400Regular',
      color: '#6B7280',
    },
    summaryValue: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
    },
    totalPrice: {
      fontSize: 18,
      fontFamily: 'Poppins_700Bold',
      color: '#3B82F6',
    },
    nextButton: {
      backgroundColor: '#111827',
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    nextButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
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
      backgroundColor: '#F3F4F6',
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    backButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#6B7280',
      letterSpacing: -0.2,
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
    return BOOKING_SERVICES.find(service => service.id === selectedService);
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

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ სერვისი, თარიღი და დრო');
      return;
    }

    const service = getSelectedService();
    Alert.alert(
      'წარმატებული დაჯავშნა! 🎉',
      `თქვენი ჯავშანი დადასტურებულია ${location?.name}-ში ${selectedDate} ${selectedTime}-ზე\n\nსერვისი: ${service?.name}\nფასი: ${service?.price}`,
      [
        {
          text: 'კარგი',
          onPress: () => {
            router.back();
          }
        }
      ]
    );
  };

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>აირჩიეთ სერვისი</Text>
        {BOOKING_SERVICES.map((service) => (
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

  const renderStep2 = () => (
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
          {TIME_SLOTS.map((time) => (
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentStep === 1 ? 'სერვისის არჩევა' : 'თარიღი და დრო'}
          </Text>
        </View>
        
        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationAddress}>{location.address}</Text>
          </View>
        )}
      </View>

      <View style={styles.stepIndicator}>
        <View style={styles.stepCircle}>
          <Ionicons 
            name={currentStep >= 1 ? 'checkmark' : 'ellipse'} 
            size={16} 
            color={currentStep >= 1 ? '#FFFFFF' : '#6B7280'} 
          />
        </View>
        <View style={[
          styles.stepCircle,
          { backgroundColor: currentStep >= 1 ? '#3B82F6' : '#F3F4F6' }
        ]}>
          <Ionicons 
            name={currentStep >= 1 ? 'checkmark' : 'ellipse'} 
            size={16} 
            color={currentStep >= 1 ? '#FFFFFF' : '#6B7280'} 
          />
        </View>
        <View style={styles.stepLine} />
        <View style={[
          styles.stepCircle,
          { backgroundColor: currentStep >= 2 ? '#3B82F6' : '#F3F4F6' }
        ]}>
          <Ionicons 
            name={currentStep >= 2 ? 'checkmark' : 'ellipse'} 
            size={16} 
            color={currentStep >= 2 ? '#FFFFFF' : '#6B7280'} 
          />
        </View>
        <View style={styles.stepLine} />
        <View style={[
          styles.stepCircle,
          { backgroundColor: currentStep >= 2 ? '#3B82F6' : '#F3F4F6' }
        ]}>
          <Ionicons 
            name={currentStep >= 2 ? 'checkmark' : 'ellipse'} 
            size={16} 
            color={currentStep >= 2 ? '#FFFFFF' : '#6B7280'} 
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
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!selectedDate || !selectedTime) && styles.disabledButton
            ]}
            onPress={handleNextStep}
            disabled={!selectedDate || !selectedTime}
          >
            <Text style={styles.nextButtonText}>
              დადასტურება ({selectedService ? getSelectedService()?.price : '0₾'})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
