import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCars } from '@/contexts/CarContext';
import { useUser } from '@/contexts/UserContext';
import { requestsApi } from '@/services/requestsApi';

type ServiceType = 'parts' | 'mechanic' | 'tow' | 'rental';

interface FormData {
  carId: string;
  carMake: string;
  carModel: string;
  carYear: string;
  // Common
  location: string;
  // Parts
  partName?: string;
  description?: string;
  // Mechanic
  problemTitle?: string;
  problemDescription?: string;
  // Tow (minimal)
  towNotes?: string;
  // Rental
  rentalCarType?: string;
  rentalPeriod?: string;
  budget?: string;
}

export default function ServiceFormScreen() {
  const { service } = useLocalSearchParams<{ service: ServiceType }>();
  const { selectedCar, cars } = useCars();
  const { user } = useUser();
  
  const [formData, setFormData] = useState<FormData>({
    carId: selectedCar?.id || '',
    carMake: selectedCar?.make || '',
    carModel: selectedCar?.model || '',
    carYear: selectedCar?.year?.toString() || '',
    location: '',
    // defaults per service
    partName: '',
    description: '',
    problemTitle: '',
    problemDescription: '',
    towNotes: '',
    rentalCarType: '',
    rentalPeriod: '',
    budget: '',
  });
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCarSelection, setShowCarSelection] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (selectedCar) {
      setFormData(prev => ({
        ...prev,
        carId: selectedCar.id,
        carMake: selectedCar.make,
        carModel: selectedCar.model,
        carYear: selectedCar.year?.toString() || '',
      }));
    }
  }, [selectedCar]);

  const getServiceTitle = () => {
    switch (service) {
      case 'parts':
        return 'ნაწილების მოძიება';
      case 'mechanic':
        return 'ხელოსნის მოძიება';
      case 'tow':
        return 'ევაკუატორის გამოძახება';
      case 'rental':
        return 'მანქანის ქირაობა';
      default:
        return 'სერვისის მოთხოვნა';
    }
  };

  const getServiceIcon = () => {
    switch (service) {
      case 'parts':
        return 'construct-outline';
      case 'mechanic':
        return 'build-outline';
      case 'tow':
        return 'car-outline';
      case 'rental':
        return 'car-sport-outline';
      default:
        return 'help-outline';
    }
  };

  const getServiceColor = () => {
    switch (service) {
      case 'parts':
        return ['#10B981', '#059669'];
      case 'mechanic':
        return ['#3B82F6', '#1D4ED8'];
      case 'tow':
        return ['#F59E0B', '#D97706'];
      case 'rental':
        return ['#8B5CF6', '#7C3AED'];
      default:
        return ['#6366F1', '#4F46E5'];
    }
  };

  const getProblemPlaceholder = () => {
    switch (service) {
      case 'parts':
        return 'აღწერეთ დეტალები ან განსაკუთრებული მოთხოვნები (არასავალდებულო)';
      case 'mechanic':
        return 'პრობლემის დეტალური აღწერა';
      case 'tow':
        return 'შენიშვნები ევაკუატორისთვის (არასავალდებულო)';
      case 'rental':
        return 'დამატებითი მოთხოვნები ქირაობაზე (არასავალდებულო)';
      default:
        return 'აღწერეთ რა გჭირდებათ...';
    }
  };

  const getLocationPlaceholder = () => {
    switch (service) {
      case 'parts':
        return 'აირჩიეთ მდებარეობა (არასავალდებულო)';
      case 'mechanic':
        return 'აირჩიეთ მდებარეობა';
      case 'tow':
        return 'აირჩიეთ მიმდინარე მდებარეობა';
      case 'rental':
        return 'აირჩიეთ გადაცემის ადგილი';
      default:
        return 'მდებარეობა';
    }
  };

  const handleSubmit = async () => {
    if (!formData.carId) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ მანქანა');
      return;
    }
    // Per-service required validations
    if (service === 'parts') {
      if (!formData.partName?.trim()) {
        Alert.alert('შეცდომა', 'გთხოვთ მიუთითოთ ნაწილის დასახელება');
        return;
      }
    } else if (service === 'mechanic') {
      if (!formData.problemTitle?.trim()) {
        Alert.alert('შეცდომა', 'გთხოვთ მიუთითოთ პრობლემის დასახელება');
        return;
      }
      if (!formData.problemDescription?.trim()) {
        Alert.alert('შეცდომა', 'გთხოვთ აღწერეთ პრობლემა');
        return;
      }
    } else if (service === 'tow') {
      if (!formData.location?.trim()) {
        Alert.alert('შეცდომა', 'ევაკუატორისთვის აირჩიეთ მდებარეობა');
        return;
      }
    } else if (service === 'rental') {
      if (!formData.rentalCarType?.trim()) {
        Alert.alert('შეცდომა', 'გთხოვთ მიუთითოთ მანქანის ტიპი');
        return;
      }
      if (!formData.rentalPeriod?.trim()) {
        Alert.alert('შეცდომა', 'გთხოვთ მიუთითოთ პერიოდი');
        return;
      }
      if (!formData.location?.trim()) {
        Alert.alert('შეცდომა', 'გთხოვთ აირჩიეთ მდებარეობა');
        return;
      }
    }

    if (!user?.id) {
      Alert.alert('შეცდომა', 'მომხმარებელი არ არის ავტორიზებული');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        userId: user.id,
        vehicle: {
          make: formData.carMake,
          model: formData.carModel,
          year: formData.carYear || '2020',
        },
        partName: service === 'parts' ? (formData.partName || '') : (service === 'rental' ? (formData.rentalCarType || '') : (service === 'mechanic' ? (formData.problemTitle || '') : '')),
        description: service === 'parts' ? (formData.description || '') : (service === 'mechanic' ? (formData.problemDescription || '') : (service === 'tow' ? (formData.towNotes || '') : (formData.description || ''))),
        location: formData.location || undefined,
        service: service,
        urgency: 'medium',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await requestsApi.createRequest(requestData as any);
      
      Alert.alert('წარმატება', 'მოთხოვნა წარმატებით გაიგზავნა!', [
        {
          text: 'კარგი',
          onPress: () => {
            router.replace({
              pathname: '/all-requests',
              params: {
                newRequest: 'true',
                service: service,
              },
            });
          }
        }
      ]);
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('შეცდომა', 'მოთხოვნის გაგზავნისას მოხდა შეცდომა. გთხოვთ სცადოთ თავიდან.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={getServiceColor() as [string, string]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              
              <View style={styles.serviceInfo}>
                <View style={styles.serviceIconContainer}>
                  <Ionicons name={getServiceIcon() as any} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.serviceTitle}>{getServiceTitle()}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Form */}
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Car Selection */}
          <Animated.View
            style={[
              styles.inputCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.inputLabel}>მანქანა *</Text>
            <Pressable
              style={styles.carSelectionButton}
              onPress={() => setShowCarSelection(true)}
            >
              <View style={styles.carSelectionContent}>
                <Ionicons name="car-outline" size={20} color="#6366F1" />
                <Text style={styles.carSelectionText}>
                  {formData.carMake && formData.carModel 
                    ? `${formData.carMake} ${formData.carModel} (${formData.carYear})`
                    : 'აირჩიეთ მანქანა'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          </Animated.View>

          {/* Dynamic Fields */}
          <Animated.View
            style={[
              styles.inputCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {service === 'parts' && (
              <>
                <Text style={styles.inputLabel}>ნაწილის დასახელება *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.partName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, partName: text }))}
                  placeholder="მაგ: ძრავის ფილტრი, ბრეიკის დაფარნი..."
                  placeholderTextColor="#9CA3AF"
                />
                <View style={{ height: 12 }} />
                <Text style={styles.inputLabel}>დამატებითი აღწერა</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder={getProblemPlaceholder()}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </>
            )}

            {service === 'mechanic' && (
              <>
                <Text style={styles.inputLabel}>პრობლემის დასახელება *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.problemTitle}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, problemTitle: text }))}
                  placeholder="მაგ: ძრავი არ იწყება"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={{ height: 12 }} />
                <Text style={styles.inputLabel}>პრობლემის აღწერა *</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={formData.problemDescription}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, problemDescription: text }))}
                  placeholder={getProblemPlaceholder()}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </>
            )}

            {service === 'tow' && (
              <>
                <Text style={styles.inputLabel}>შენიშვნები (არასავალდებულო)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={formData.towNotes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, towNotes: text }))}
                  placeholder={getProblemPlaceholder()}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </>
            )}

            {service === 'rental' && (
              <>
                <Text style={styles.inputLabel}>მანქანის ტიპი *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.rentalCarType}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, rentalCarType: text }))}
                  placeholder="მაგ: სედანი, SUV, ვანი..."
                  placeholderTextColor="#9CA3AF"
                />
                <View style={{ height: 12 }} />
                <Text style={styles.inputLabel}>პერიოდი *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.rentalPeriod}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, rentalPeriod: text }))}
                  placeholder="მაგ: 3 დღე, 1 კვირა"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={{ height: 12 }} />
                <Text style={styles.inputLabel}>ბიუჯეტი (არასავალდებულო)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.budget}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, budget: text }))}
                  placeholder="მაგ: 100-150 ლარი/დღე"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </>
            )}
          </Animated.View>

          {/* Location (Picker) */}
          <Animated.View
            style={[
              styles.inputCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.inputLabel}>მდებარეობა</Text>
            <Pressable
              style={styles.carSelectionButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <View style={styles.carSelectionContent}>
                <Ionicons name="location-outline" size={20} color="#6366F1" />
                <Text style={styles.carSelectionText}>
                  {formData.location ? formData.location : getLocationPlaceholder()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Submit Button */}
        <Animated.View 
          style={[
            styles.submitContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Pressable
            style={[styles.submitButton, { opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={getServiceColor() as [string, string]}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'მოთხოვნის გაგზავნა...' : 'მოთხოვნის გაგზავნა'}
              </Text>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Car Selection Modal */}
      <Modal
        visible={showCarSelection}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCarSelection(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>მანქანის არჩევა</Text>
            <Pressable onPress={() => setShowCarSelection(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {cars.map((car) => (
              <Pressable
                key={car.id}
                style={[
                  styles.carOption,
                  formData.carId === car.id && styles.carOptionSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    carId: car.id,
                    carMake: car.make,
                    carModel: car.model,
                    carYear: car.year?.toString() || '',
                  }));
                  setShowCarSelection(false);
                }}
              >
                <View style={styles.carInfo}>
                  <Text style={styles.carMakeModel}>
                    {car.make} {car.model}
                  </Text>
                  <Text style={styles.carYear}>{car.year}</Text>
                </View>
                {formData.carId === car.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>მდებარეობა</Text>
            <Pressable onPress={() => setShowLocationPicker(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.modalLabel}>მისამართი</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="მაგ: თბილისი, ვაჟა ფშაველას 10"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Pressable
              style={styles.submitButton}
              onPress={() => {
                setShowLocationPicker(false);
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>დადასტურება</Text>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>

            <View style={{ height: 16 }} />

            <Pressable
              style={styles.submitButton}
              onPress={async () => {
                try {
                  // Try to get current location (placeholder: rely on permissions outside)
                  // In real use, use expo-location. Here keep simple UX.
                  setFormData(prev => ({ ...prev, location: 'ჩემი მიმდინარე მდებარეობა' }));
                  setShowLocationPicker(false);
                } catch {
                  setShowLocationPicker(false);
                }
              }}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.submitButtonGradient}
              >
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>ამოიღე ჩემი ლოკაცია</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // Header
  header: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
  },

  // Form
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContent: {
    paddingVertical: 20,
    gap: 20,
  },
  inputCard: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  multilineInput: {
    minHeight: 100,
  },
  carSelectionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carSelectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  carSelectionText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Submit
  submitContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  carOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  carOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  carInfo: {
    flex: 1,
  },
  carMakeModel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  carYear: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
  },
});