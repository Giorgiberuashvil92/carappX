import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Button from './ui/Button';
import { MechanicDTO } from '@/services/mechanicsApi';

const { width, height } = Dimensions.get('window');

interface MechanicBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (bookingData: MechanicBookingData) => void;
  mechanic: MechanicDTO | null;
}

export interface MechanicBookingData {
  mechanicId: string;
  mechanicName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  phone: string;
  notes?: string;
  price?: number;
}

// ხელმისაწვდომი სერვისები
const AVAILABLE_SERVICES = [
  'ძრავის შემოწმება',
  'შემუშავების შეცვლა',
  'ელექტრო სისტემის შემოწმება',
  'ზეთის შეცვლა',
  'ფილტრის შეცვლა',
  'აკუმულატორის შემოწმება',
  'საბურავის შემოწმება',
  'სხვა',
];

// ხელმისაწვდომი დროები
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30',
];

export const MechanicBookingModal: React.FC<MechanicBookingModalProps> = ({
  visible,
  onClose,
  onConfirm,
  mechanic,
}) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [customService, setCustomService] = useState('');

  const resetForm = () => {
    setSelectedService('');
    setSelectedDate('');
    setSelectedTime('');
    setLocation('');
    setPhone('');
    setNotes('');
    setCustomService('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = () => {
    if (!mechanic) return;

    // ვალიდაცია
    if (!selectedService && !customService.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ სერვისი');
      return;
    }

    if (!selectedDate) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ თარიღი');
      return;
    }

    if (!selectedTime) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ დრო');
      return;
    }

    if (!location.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ მდებარეობა');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ ტელეფონი');
      return;
    }

    const bookingData: MechanicBookingData = {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      service: selectedService || customService.trim(),
      date: selectedDate,
      time: selectedTime,
      location: location.trim(),
      phone: phone.trim(),
      notes: notes.trim() || undefined,
    };

    onConfirm(bookingData);
    resetForm();
    onClose();
  };

  if (!mechanic) return null;

  // მომავალი 7 დღის გენერაცია
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>მექანიკოსთან ჯავშნა</Text>
                <Text style={styles.headerSubtitle}>{mechanic.name}</Text>
              </View>
            </LinearGradient>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Mechanic Info */}
            <View style={styles.mechanicInfo}>
              <View style={styles.mechanicHeader}>
                <View style={styles.mechanicAvatar}>
                  {mechanic.avatar ? (
                    <Image source={{ uri: mechanic.avatar }} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person" size={32} color="#6B7280" />
                  )}
                </View>
                <View style={styles.mechanicDetails}>
                  <Text style={styles.mechanicName}>{mechanic.name}</Text>
                  <Text style={styles.mechanicSpecialty}>{mechanic.specialty}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{mechanic.rating?.toFixed(1) || '4.5'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Service Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>სერვისის არჩევა</Text>
              <View style={styles.servicesGrid}>
                {AVAILABLE_SERVICES.map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceChip,
                      selectedService === service && styles.serviceChipActive,
                    ]}
                    onPress={() => setSelectedService(service)}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        selectedService === service && styles.serviceChipTextActive,
                      ]}
                    >
                      {service}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {selectedService === 'სხვა' && (
                <TextInput
                  style={styles.customServiceInput}
                  placeholder="მიუთითეთ სერვისი..."
                  value={customService}
                  onChangeText={setCustomService}
                  placeholderTextColor="#9CA3AF"
                />
              )}
            </View>

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>თარიღის არჩევა</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.datesRow}>
                  {availableDates.map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('ka-GE', { weekday: 'short' });
                    const dayNumber = date.getDate();
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dateChip,
                          selectedDate === dateStr && styles.dateChipActive,
                        ]}
                        onPress={() => setSelectedDate(dateStr)}
                      >
                        <Text
                          style={[
                            styles.dateDayName,
                            selectedDate === dateStr && styles.dateChipTextActive,
                          ]}
                        >
                          {dayName}
                        </Text>
                        <Text
                          style={[
                            styles.dateDayNumber,
                            selectedDate === dateStr && styles.dateChipTextActive,
                          ]}
                        >
                          {dayNumber}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>დროის არჩევა</Text>
              <View style={styles.timesGrid}>
                {TIME_SLOTS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeChip,
                      selectedTime === time && styles.timeChipActive,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        selectedTime === time && styles.timeChipTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>მდებარეობა</Text>
              <TextInput
                style={styles.input}
                placeholder="მიუთითეთ მდებარეობა..."
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ტელეფონი</Text>
              <TextInput
                style={styles.input}
                placeholder="+995 XXX XXX XXX"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Notes Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>დამატებითი ინფორმაცია (არჩევითი)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="მიუთითეთ დამატებითი ინფორმაცია..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="ჯავშნა"
              onPress={handleConfirm}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  header: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: 0,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mechanicInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
  },
  mechanicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mechanicAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  mechanicDetails: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  mechanicSpecialty: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#3B82F6',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  serviceChipText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#374151',
  },
  serviceChipTextActive: {
    color: '#FFFFFF',
  },
  customServiceInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#111827',
    marginTop: 12,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  dateChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 60,
  },
  dateChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dateDayName: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateDayNumber: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#111827',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timeChipText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#374151',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
