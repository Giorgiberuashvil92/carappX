import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { carBrandsApi } from '../../services/carBrandsApi';

// Car Data Types
type CarData = {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  photo?: string;
};

const CAR_MAKES = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Ford', 'Volkswagen', 'Nissan',
  'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus', 'Infiniti', 'Acura', 'Volvo',
  'Saab', 'Opel', 'Peugeot', 'Renault', 'Citroën', 'Fiat', 'Alfa Romeo', 'Lancia',
  'Skoda', 'Seat', 'Dacia', 'Chevrolet', 'Cadillac', 'Buick', 'Chrysler', 'Dodge',
  'Jeep', 'Ram', 'Lincoln', 'Tesla', 'Porsche', 'Ferrari', 'Lamborghini', 'Maserati',
  'Bentley', 'Rolls-Royce', 'Aston Martin', 'McLaren', 'Bugatti', 'Koenigsegg', 'Pagani', 'სხვა'
];

// CAR_MODELS loaded from API

const FUEL_OPTIONS = [
  { id: 'ბენზინი', icon: '🔥', color: '#FF6B6B' },
  { id: 'დიზელი', icon: '⛽', color: '#4ECDC4' },
  { id: 'ჰიბრიდი', icon: '🔋', color: '#45B7D1' },
  { id: 'ელექტრო', icon: '⚡', color: '#96CEB4' },
];

const GEARBOX_OPTIONS = [
  { id: 'ავტომატი', icon: '⚙️', color: '#FFEAA7' },
  { id: 'მექანიკა', icon: '🔧', color: '#DDA0DD' },
  { id: 'CVT', icon: '🔄', color: '#98D8C8' },
];

// Add Car Modal Content
export const AddCarModalContent: React.FC<{
  onAddCar: (car: CarData) => void;
  onCancel: () => void;
}> = ({ onAddCar, onCancel }) => {
  const [car, setCar] = useState<CarData>({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    color: '',
    fuelType: '',
    transmission: '',
    photo: undefined,
  });

  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [CAR_MODELS, setCAR_MODELS] = useState<{ [key: string]: string[] }>({});
  const [CAR_MAKES, setCAR_MAKES] = useState<string[]>([]);

  // Load car brands and models from API
  useEffect(() => {
    const loadCarBrands = async () => {
      try {
        const brandsList = await carBrandsApi.getBrandsList();
        const brands = brandsList.map(b => b.name);
        const modelsMap: { [key: string]: string[] } = {};
        brandsList.forEach(brand => {
          modelsMap[brand.name] = brand.models || [];
        });
        setCAR_MAKES(brands);
        setCAR_MODELS(modelsMap);
      } catch (err) {
        console.error('Error loading car brands:', err);
        // Fallback to static data if API fails
        setCAR_MAKES(CAR_MAKES);
      }
    };
    loadCarBrands();
  }, []);

  const handleChange = (key: keyof CarData, value: string) => {
    setCar(prev => {
      const newCar = { ...prev, [key]: value };
      
      if (key === 'make') {
        newCar.model = '';
        setFilteredModels(CAR_MODELS[value] || []);
        setShowModelDropdown(false);
      }
      
      return newCar;
    });
  };

  const selectMake = (make: string) => {
    handleChange('make', make);
    setShowMakeDropdown(false);
  };

  const selectModel = (model: string) => {
    handleChange('model', model);
    setShowModelDropdown(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('შეცდომა', 'გამოყენების უფლება საჭიროა ფოტოების ასარჩევად');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleChange('photo', result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('შეცდომა', 'კამერის გამოყენების უფლება საჭიროა');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleChange('photo', result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'ფოტოს არჩევა',
      'როგორ გინდათ ფოტოს ატვირთვა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        { text: 'კამერა', onPress: takePhoto },
        { text: 'გალერეა', onPress: pickImage },
      ]
    );
  };

  const removePhoto = () => {
    handleChange('photo', '');
  };

  const isValid = () => {
    return car.make && car.model && car.year && car.plateNumber;
  };

  const submit = () => {
    if (!isValid()) return;
    onAddCar(car);
    onCancel();
  };

  return (
    <View style={styles.modalContent}>
      {/* Photo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ფოტო</Text>
        <TouchableOpacity style={styles.photoContainer} onPress={showImageOptions}>
          {car.photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: car.photo }} style={styles.photoImage} />
              <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
              <Text style={styles.photoPlaceholderText}>ფოტოს დამატება</Text>
              <Text style={styles.photoPlaceholderSubtext}>შეეხეთ ასარჩევად</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ძირითადი ინფორმაცია</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.dropdownContainer}>
            <Text style={styles.inputLabel}>მარკა *</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowMakeDropdown(!showMakeDropdown)}
            >
              <Text style={[styles.dropdownText, !car.make && styles.placeholderText]}>
                {car.make || 'აირჩიეთ მარკა'}
              </Text>
              <Ionicons 
                name={showMakeDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            {showMakeDropdown && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {CAR_MAKES.length > 0 ? CAR_MAKES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.dropdownItem}
                      onPress={() => selectMake(item)}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  )) : (
                    <View style={styles.dropdownItem}>
                      <Text style={styles.dropdownItemText}>იტვირთება...</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
          <View style={styles.dropdownContainer}>
            <Text style={styles.inputLabel}>მოდელი *</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, !car.make && styles.dropdownButtonDisabled]}
              onPress={() => car.make && setShowModelDropdown(!showModelDropdown)}
              disabled={!car.make}
            >
              <Text style={[styles.dropdownText, !car.model && styles.placeholderText]}>
                {car.model || (car.make ? 'აირჩიეთ მოდელი' : 'ჯერ აირჩიეთ მარკა')}
              </Text>
              <Ionicons 
                name={showModelDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={car.make ? "#6B7280" : "#D1D5DB"} 
              />
            </TouchableOpacity>
            {showModelDropdown && car.make && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {filteredModels.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.dropdownItem}
                      onPress={() => selectModel(item)}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.inputLabel}>წელი *</Text>
            <TextInput
              style={styles.input}
              placeholder="2020"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={4}
              value={car.year}
              onChangeText={(text) => handleChange('year', text)}
            />
          </View>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.inputLabel}>ნომერი *</Text>
            <TextInput
              style={styles.input}
              placeholder="AB-123-CD"
              placeholderTextColor="#9CA3AF"
              value={car.plateNumber}
              onChangeText={(text) => handleChange('plateNumber', text)}
            />
          </View>
        </View>
      </View>

      {/* Fuel Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>საწვავის ტიპი</Text>
        <View style={styles.optionsContainer}>
          {FUEL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                car.fuelType === option.id && styles.optionButtonSelected
              ]}
              onPress={() => handleChange('fuelType', option.id)}
            >
              <Text style={styles.optionEmoji}>{option.icon}</Text>
              <Text style={[
                styles.optionButtonText,
                car.fuelType === option.id && styles.optionButtonTextSelected
              ]}>
                {option.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transmission */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>პრიორიტეტი</Text>
        <View style={styles.optionsContainer}>
          {GEARBOX_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                car.transmission === option.id && styles.optionButtonSelected
              ]}
              onPress={() => handleChange('transmission', option.id)}
            >
              <Text style={styles.optionEmoji}>{option.icon}</Text>
              <Text style={[
                styles.optionButtonText,
                car.transmission === option.id && styles.optionButtonTextSelected
              ]}>
                {option.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ფერი</Text>
        <TextInput
          style={styles.input}
          placeholder="მაგ: თეთრი, შავი, ლურჯი..."
          placeholderTextColor="#9CA3AF"
          value={car.color}
          onChangeText={(text) => handleChange('color', text)}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <StandardFooter
          onCancel={onCancel}
          onConfirm={submit}
          confirmText="დამატება"
          cancelText="გაუქმება"
          confirmDisabled={!isValid()}
        />
      </View>
    </View>
  );
};

// Add Reminder Modal Content
export const AddReminderModalContent: React.FC<{
  onAddReminder: (reminder: any) => void;
  onCancel: () => void;
}> = ({ onAddReminder, onCancel }) => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>
        Add Reminder Form Content
      </Text>
      <Text style={styles.placeholderDescription}>
        აქ გამოჩნდება შეხსენების დამატების ფორმა
      </Text>
    </View>
  );
};

// Detail Modal Content
export const DetailModalContent: React.FC<{
  item: any;
  onContact?: () => void;
  onFavorite?: () => void;
}> = ({ item, onContact, onFavorite }) => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>
        Detail Content
      </Text>
      <Text style={styles.placeholderDescription}>
        აქ გამოჩნდება ნივთის დეტალური ინფორმაცია
      </Text>
    </View>
  );
};

// Filter Modal Content
export const FilterModalContent: React.FC<{
  onApply: (filters: any) => void;
  onReset: () => void;
  onCancel: () => void;
}> = ({ onApply, onReset, onCancel }) => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>
        Filter Content
      </Text>
      <Text style={styles.placeholderDescription}>
        აქ გამოჩნდება ფილტრების ფორმა
      </Text>
    </View>
  );
};

// Booking Details Modal Content
export const BookingDetailsModalContent: React.FC<{
  booking: any;
  onCancel: () => void;
  onReBook?: () => void;
}> = ({ booking, onCancel, onReBook }) => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>
        Booking Details Content
      </Text>
      <Text style={styles.placeholderDescription}>
        აქ გამოჩნდება ჯავშნის დეტალები
      </Text>
    </View>
  );
};

// Common Footer Components
export const StandardFooter: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  confirmStyle?: 'primary' | 'danger';
}> = ({ 
  onCancel, 
  onConfirm, 
  confirmText = 'დადასტურება',
  cancelText = 'გაუქმება',
  confirmDisabled = false,
  confirmStyle = 'primary'
}) => {
  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={onCancel}
      >
        <Text style={styles.cancelButtonText}>{cancelText}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.confirmButton,
          confirmStyle === 'danger' && styles.dangerButton,
          confirmDisabled && styles.disabledButton
        ]} 
        onPress={onConfirm}
        disabled={confirmDisabled}
      >
        <Text style={[
          styles.confirmButtonText,
          confirmStyle === 'danger' && styles.dangerButtonText,
          confirmDisabled && styles.disabledButtonText
        ]}>
          {confirmText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const ThreeButtonFooter: React.FC<{
  onCancel: () => void;
  onSecondary: () => void;
  onPrimary: () => void;
  secondaryText?: string;
  primaryText?: string;
  cancelText?: string;
}> = ({ 
  onCancel, 
  onSecondary, 
  onPrimary,
  secondaryText = 'მეორადი',
  primaryText = 'მთავარი',
  cancelText = 'გაუქმება'
}) => {
  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={onCancel}
      >
        <Text style={styles.cancelButtonText}>{cancelText}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={onSecondary}
      >
        <Text style={styles.secondaryButtonText}>{secondaryText}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.confirmButton} 
        onPress={onPrimary}
      >
        <Text style={styles.confirmButtonText}>{primaryText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Modal Content Styles
  modalContent: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit',
    marginBottom: 12,
  },
  
  // Photo Styles
  photoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoPreview: {
    position: 'relative',
    height: 160,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  photoPlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  photoPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit',
    marginTop: 8,
  },
  photoPlaceholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  
  // Input Styles
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Outfit',
    color: '#111827',
  },
  
  // Dropdown Styles
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 11,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Outfit',
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Outfit',
    color: '#374151',
  },
  
  // Options Styles
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  optionButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  optionButtonTextSelected: {
    color: '#6366F1',
  },
  
  // Footer Styles
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  
  // Placeholder Styles
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Outfit',
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  confirmButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Outfit',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});
