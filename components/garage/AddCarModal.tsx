import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface CarData {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  color: string;
  fuelType: string;
  transmission: string;
}

interface AddCarModalProps {
  visible: boolean;
  onClose: () => void;
  onAddCar: (carData: CarData) => void;
}

const CAR_MAKES = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Nissan',
  'Ford', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru',
  'Lexus', 'Infiniti', 'Acura', 'Volvo', 'Jaguar', 'Porsche'
];

const FUEL_TYPES = ['ბენზინი', 'დიზელი', 'ჰიბრიდი', 'ელექტრო', 'გაზი'];
const TRANSMISSIONS = ['ავტომატი', 'მექანიკა', 'CVT'];
const COLORS = ['შავი', 'თეთრი', 'შავი', 'წითელი', 'ლურჯი', 'მწვანე', 'ყვითელი', 'ნაცარისფერი'];

export default function AddCarModal({ visible, onClose, onAddCar }: AddCarModalProps) {
  const [carData, setCarData] = useState<CarData>({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    color: '',
    fuelType: '',
    transmission: '',
  });

  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleInputChange = (field: keyof CarData, value: string) => {
    setCarData(prev => ({ ...prev, [field]: value }));
    
    // Card scale animation on selection
    Animated.sequence([
      Animated.timing(cardScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = () => {
    // Validation
    if (!carData.make || !carData.model || !carData.year || !carData.plateNumber) {
      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    if (carData.year.length !== 4 || isNaN(Number(carData.year))) {
      Alert.alert('შეცდომა', 'წელი უნდა იყოს 4 ციფრიანი');
      return;
    }

    const currentYear = new Date().getFullYear();
    const year = Number(carData.year);
    if (year < 1990 || year > currentYear + 1) {
      Alert.alert('შეცდომა', `წელი უნდა იყოს 1990-${currentYear + 1} დიაპაზონში`);
      return;
    }

    onAddCar(carData);
    handleClose();
  };

  const handleClose = () => {
    setCarData({
      make: '',
      model: '',
      year: '',
      plateNumber: '',
      color: '',
      fuelType: '',
      transmission: '',
    });
    setShowMakeDropdown(false);
    setShowFuelDropdown(false);
    setShowTransmissionDropdown(false);
    setShowColorDropdown(false);
    onClose();
  };

  const renderDropdown = (
    items: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    placeholder: string,
    isVisible: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownText, !selectedValue && styles.placeholderText]}>
          {selectedValue || placeholder}
        </Text>
        <Ionicons 
          name={isVisible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </TouchableOpacity>
      
      {isVisible && (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  selectedValue === item && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  onSelect(item);
                  onToggle();
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedValue === item && styles.dropdownItemTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      {/* Animated Background with Blur Effect */}
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: backgroundAnim,
          }
        ]}
      >
        <View style={styles.backgroundBlur} />
      </Animated.View>

      <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.modalTitle}>ახალი მანქანის დამატება</Text>
                <Text style={styles.modalSubtitle}>შეავსეთ მანქანის ინფორმაცია</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.contentContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View style={[styles.formContent, { opacity: fadeAnim }]}>
              {/* Make */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="car" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>მარკა</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>*</Text>
                  </View>
                </View>
                <View style={styles.enhancedInputContainer}>
                  {renderDropdown(
                    CAR_MAKES,
                    carData.make,
                    (value) => handleInputChange('make', value),
                    'აირჩიეთ მარკა',
                    showMakeDropdown,
                    () => setShowMakeDropdown(!showMakeDropdown)
                  )}
                </View>
              </View>

              {/* Model */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="document-text" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>მოდელი</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>*</Text>
                  </View>
                </View>
                <View style={styles.enhancedInputContainer}>
                  <TextInput
                    style={styles.enhancedTextInput}
                    placeholder="მაგ: Camry, X5, A4"
                    placeholderTextColor="rgba(17, 24, 39, 0.5)"
                    value={carData.model}
                    onChangeText={(value) => handleInputChange('model', value)}
                  />
                </View>
              </View>

              {/* Year */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="calendar" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>წელი</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>*</Text>
                  </View>
                </View>
                <View style={styles.enhancedInputContainer}>
                  <TextInput
                    style={styles.enhancedTextInput}
                    placeholder="მაგ: 2023"
                    placeholderTextColor="rgba(17, 24, 39, 0.5)"
                    value={carData.year}
                    onChangeText={(value) => handleInputChange('year', value)}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Plate Number */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>სანომრე ნიშანი</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>*</Text>
                  </View>
                </View>
                <View style={styles.enhancedInputContainer}>
                  <TextInput
                    style={styles.enhancedTextInput}
                    placeholder="მაგ: TB-123-AB"
                    placeholderTextColor="rgba(17, 24, 39, 0.5)"
                    value={carData.plateNumber}
                    onChangeText={(value) => handleInputChange('plateNumber', value.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Color */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="color-palette" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>ფერი</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>ოფციონალური</Text>
                  </View>
                </View>
                <View style={styles.enhancedInputContainer}>
                  {renderDropdown(
                    COLORS,
                    carData.color,
                    (value) => handleInputChange('color', value),
                    'აირჩიეთ ფერი',
                    showColorDropdown,
                    () => setShowColorDropdown(!showColorDropdown)
                  )}
                </View>
              </View>

              {/* Fuel Type */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="water" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>საწვავის ტიპი</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>ოფციონალური</Text>
                  </View>
                </View>
                <View style={styles.enhancedInputContainer}>
                  {renderDropdown(
                    FUEL_TYPES,
                    carData.fuelType,
                    (value) => handleInputChange('fuelType', value),
                    'აირჩიეთ საწვავის ტიპი',
                    showFuelDropdown,
                    () => setShowFuelDropdown(!showFuelDropdown)
                  )}
                </View>
              </View>

              {/* Transmission */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="settings" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>ტრანსმისია</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>ოფციონალური</Text>
                  </View>
                </View>
                <View style={styles.enhancedInputContainer}>
                  {renderDropdown(
                    TRANSMISSIONS,
                    carData.transmission,
                    (value) => handleInputChange('transmission', value),
                    'აირჩიეთ ტრანსმისია',
                    showTransmissionDropdown,
                    () => setShowTransmissionDropdown(!showTransmissionDropdown)
                  )}
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigation}>
            <View style={styles.navigationContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>გაუქმება</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>დამატება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundBlur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    height: height * 0.95,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: height * 0.05,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  formContent: {
    flex: 1,
    paddingTop: 20,
  },
  detailSection: {
    gap: 16,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  requiredBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requiredText: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  optionalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  optionalText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  enhancedInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  enhancedTextInput: {
    padding: 20,
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    minHeight: 56,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownButton: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
  },
  placeholderText: {
    color: 'rgba(17, 24, 39, 0.5)',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 9999,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
  },
  dropdownItemTextSelected: {
    color: '#3B82F6',
    fontFamily: 'NotoSans_600SemiBold',
  },
  navigation: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#6B7280',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
});
