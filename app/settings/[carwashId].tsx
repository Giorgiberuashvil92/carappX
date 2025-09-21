import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import API_BASE_URL from '../../config/api';
import { CarwashLocation } from '@/services/carwashLocationApi';

const { width } = Dimensions.get('window');

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

interface WorkingHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { carwashId } = useLocalSearchParams<{ carwashId: string }>();
  
  const [carwash, setCarwash] = useState<CarwashLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Basic Info
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  
  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Service>({
    id: '',
    name: '',
    price: 0,
    duration: 30
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Working Hours
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([
    { day: 'ორშაბათი', open: '09:00', close: '18:00', isOpen: true },
    { day: 'სამშაბათი', open: '09:00', close: '18:00', isOpen: true },
    { day: 'ოთხშაბათი', open: '09:00', close: '18:00', isOpen: true },
    { day: 'ხუთშაბათი', open: '09:00', close: '18:00', isOpen: true },
    { day: 'პარასკევი', open: '09:00', close: '18:00', isOpen: true },
    { day: 'შაბათი', open: '09:00', close: '18:00', isOpen: true },
    { day: 'კვირა', open: '10:00', close: '16:00', isOpen: false },
  ]);

  // Load carwash data
  useEffect(() => {
    const loadCarwashData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Carwash data from backend:', data);
          setCarwash(data);
          setName(data.name || '');
          setAddress(data.address || '');
          setDescription(data.description || '');
          setPhone(data.phone || '');
          
          // Load services if available
          console.log('🔍 Services data:', data.services);
          console.log('🔍 Detailed services data:', data.detailedServices);
          if (data.detailedServices && Array.isArray(data.detailedServices)) {
            setServices(data.detailedServices);
          } else if (data.services && Array.isArray(data.services)) {
            setServices(data.services);
          } else {
            // If no services, initialize with empty array
            setServices([]);
          }
        }
      } catch (error) {
        console.error('Error loading carwash data:', error);
        Alert.alert('შეცდომა', 'სამრეცხაოს მონაცემების ჩატვირთვა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
    };

    if (carwashId) {
      loadCarwashData();
    }
  }, [carwashId]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        name,
        address,
        description,
        phone,
        detailedServices: services, // Use detailedServices field
        timeSlotsConfig: {
          workingDays: workingHours.map(hour => ({
            day: hour.day,
            startTime: hour.open,
            endTime: hour.close,
            isWorking: hour.isOpen
          })),
          interval: 30,
          breakTimes: []
        },
        updatedAt: Date.now() // Required field for backend
      };

      const response = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Show success alert with navigation
        Alert.alert(
          'წარმატება ✅', 
          'პარამეტრები წარმატებით შეინახა',
          [
            {
              text: 'კარგი',
              onPress: () => {
                // Navigate back to management screen
                router.back();
              }
            }
          ]
        );
        
        // Update local carwash data
        if (carwash) {
          setCarwash({ ...carwash, ...updateData } as unknown as CarwashLocation);
        }
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        'შეცდომა ❌', 
        'პარამეტრების შენახვა ვერ მოხერხდა'
      );
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (newService.name.trim() && newService.price > 0) {
      const service: Service = {
        ...newService,
        id: `service_${Date.now()}`
      };
      setServices([...services, service]);
      setNewService({ id: '', name: '', price: 0, duration: 30 });
    }
  };

  const editService = (service: Service) => {
    setEditingService(service);
    setNewService(service);
  };

  const updateService = () => {
    if (editingService && newService.name.trim() && newService.price > 0) {
      const updatedServices = services.map(s => 
        s.id === editingService.id ? { ...newService, id: editingService.id } : s
      );
      setServices(updatedServices);
      setEditingService(null);
      setNewService({ id: '', name: '', price: 0, duration: 30 });
    }
  };

  const cancelEdit = () => {
    setEditingService(null);
    setNewService({ id: '', name: '', price: 0, duration: 30 });
  };

  const removeService = (serviceId: string) => {
    setServices(services.filter(s => s.id !== serviceId));
  };

  const updateWorkingHours = (dayIndex: number, field: keyof WorkingHours, value: any) => {
    const updated = [...workingHours];
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    setWorkingHours(updated);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>მონაცემების ჩატვირთვა...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>პარამეტრები</Text>
            <Text style={styles.headerSubtitle}>{carwash?.name}</Text>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveSettings}
            disabled={saving}
          >
            <Ionicons 
              name={saving ? "hourglass-outline" : "checkmark"} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ძირითადი ინფორმაცია</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>სამრეცხაოს სახელი</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="მაგ: სუპერ სამრეცხაო"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>მისამართი</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="მაგ: რუსთაველის გამზ. 12"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ტელეფონი</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="მაგ: +995 599 123 456"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>აღწერა</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="სამრეცხაოს შესახებ..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>სერვისები</Text>
            
            {services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDetails}>
                    {service.price}₾ • {service.duration} წუთი
                  </Text>
                </View>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => editService(service)}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeService(service.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.addServiceContainer}>
              <View style={styles.newServiceInputs}>
                <TextInput
                  style={[styles.textInput, styles.serviceInput]}
                  value={newService.name}
                  onChangeText={(text) => setNewService({...newService, name: text})}
                  placeholder="სერვისის სახელი"
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={[styles.textInput, styles.priceInput]}
                  value={newService.price.toString()}
                  onChangeText={(text) => setNewService({...newService, price: Number(text) || 0})}
                  placeholder="ფასი"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.textInput, styles.durationInput]}
                  value={newService.duration.toString()}
                  onChangeText={(text) => setNewService({...newService, duration: Number(text) || 30})}
                  placeholder="წუთი"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={editingService ? updateService : addService}
              >
                <Ionicons 
                  name={editingService ? "checkmark" : "add"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              {editingService && (
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Working Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>სამუშაო საათები</Text>
            
            {workingHours.map((schedule, index) => (
              <View key={schedule.day} style={styles.workingHoursCard}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{schedule.day}</Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, schedule.isOpen && styles.toggleButtonActive]}
                    onPress={() => updateWorkingHours(index, 'isOpen', !schedule.isOpen)}
                  >
                    <Text style={[styles.toggleText, schedule.isOpen && styles.toggleTextActive]}>
                      {schedule.isOpen ? 'ღია' : 'დახურული'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {schedule.isOpen && (
                  <View style={styles.timeInputs}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>დაწყება</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={schedule.open}
                        onChangeText={(text) => updateWorkingHours(index, 'open', text)}
                        placeholder="09:00"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>დასრულება</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={schedule.close}
                        onChangeText={(text) => updateWorkingHours(index, 'close', text)}
                        placeholder="18:00"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Edit Service Modal */}
        <Modal
          visible={!!editingService}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelEdit}
        >
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>სერვისის რედაქტირება</Text>
                <TouchableOpacity onPress={cancelEdit} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>სახელი</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newService.name}
                    onChangeText={(text) => setNewService({...newService, name: text})}
                    placeholder="სერვისის სახელი"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ფასი (₾)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newService.price.toString()}
                    onChangeText={(text) => setNewService({...newService, price: Number(text) || 0})}
                    placeholder="ფასი"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ხანგრძლივობა (წუთი)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newService.duration.toString()}
                    onChangeText={(text) => setNewService({...newService, duration: Number(text) || 30})}
                    placeholder="ხანგრძლივობა"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelModalButton} onPress={cancelEdit}>
                  <Text style={styles.cancelModalText}>გაუქმება</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalButton} onPress={updateService}>
                  <Text style={styles.saveModalText}>შენახვა</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'NotoSans_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addServiceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  newServiceInputs: {
    flex: 1,
    gap: 12,
  },
  serviceInput: {
    flex: 1,
  },
  priceInput: {
    width: 80,
  },
  durationInput: {
    width: 80,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workingHoursCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  toggleButtonActive: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  saveModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveModalText: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
});
