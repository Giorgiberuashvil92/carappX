import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const { height } = Dimensions.get('window');

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

type AddCarModalProps = {
  visible: boolean;
  onClose: () => void;
  onAddCar: (car: CarData) => void;
};

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

const CAR_MAKES = [
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Toyota',
  'Honda',
  'Ford',
  'Volkswagen',
  'Nissan',
  'Hyundai',
  'Kia',
  'Mazda',
  'Subaru',
  'Lexus',
  'Infiniti',
  'Acura',
  'Volvo',
  'Saab',
  'Opel',
  'Peugeot',
  'Renault',
  'Citroën',
  'Fiat',
  'Alfa Romeo',
  'Lancia',
  'Skoda',
  'Seat',
  'Dacia',
  'Chevrolet',
  'Cadillac',
  'Buick',
  'Chrysler',
  'Dodge',
  'Jeep',
  'Ram',
  'Lincoln',
  'Tesla',
  'Porsche',
  'Ferrari',
  'Lamborghini',
  'Maserati',
  'Bentley',
  'Rolls-Royce',
  'Aston Martin',
  'McLaren',
  'Bugatti',
  'Koenigsegg',
  'Pagani',
  'სხვა'
];

const CAR_MODELS: { [key: string]: string[] } = {
  'BMW': ['X5', 'X3', 'X1', '3 Series', '5 Series', '7 Series', 'X7', 'X6', 'i3', 'i8', 'Z4', 'M3', 'M5', 'M8'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS', 'AMG GT', 'Sprinter', 'Vito'],
  'Audi': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'RS3', 'RS4', 'RS6'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Avalon', '4Runner', 'Tacoma', 'Tundra', 'Sienna', 'Land Cruiser'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Passport', 'Odyssey', 'Ridgeline', 'Insight', 'Fit'],
  'Ford': ['F-150', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Mustang', 'Focus', 'Fiesta', 'Transit', 'Ranger'],
  'Volkswagen': ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Atlas', 'Beetle', 'Arteon', 'ID.4', 'Touareg'],
  'Nissan': ['Altima', 'Sentra', 'Rogue', 'Murano', 'Pathfinder', 'Armada', 'Versa', 'Maxima', '370Z', 'GT-R'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Accent', 'Veloster', 'Genesis', 'Kona'],
  'Kia': ['Forte', 'Optima', 'Sportage', 'Sorento', 'Telluride', 'Soul', 'Stinger', 'Niro', 'Seltos'],
  'სხვა': []
};

export default function AddCarModal({ visible, onClose, onAddCar }: AddCarModalProps) {
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

  const slideY = useRef(new Animated.Value(height)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 100 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: height, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setCar({ make: '', model: '', year: '', plateNumber: '', color: '', fuelType: '', transmission: '', photo: undefined });
      });
    }
  }, [visible]);

  const handleChange = (key: keyof CarData, value: string) => {
    setCar(prev => {
      const newCar = { ...prev, [key]: value };
      
      // If make changed, reset model and update available models
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
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="car-outline" size={24} color="#1F2937" />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>ახალი მანქანა</Text>
                <Text style={styles.subtitle}>შეიყვანეთ ინფორმაცია</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              <View style={styles.inputGroupHalf}>
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
                    <FlatList
                      data={CAR_MAKES}
                      keyExtractor={(item) => item}
                      style={styles.dropdownList}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => selectMake(item)}
                        >
                          <Text style={styles.dropdownItemText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>
              <View style={styles.inputGroupHalf}>
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
                    <FlatList
                      data={filteredModels}
                      keyExtractor={(item) => item}
                      style={styles.dropdownList}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => selectModel(item)}
                        >
                          <Text style={styles.dropdownItemText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
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
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>გაუქმება</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, !isValid() && styles.submitButtonDisabled]} 
            onPress={submit}
            disabled={!isValid()}
          >
            <Text style={[styles.submitButtonText, !isValid() && styles.submitButtonTextDisabled]}>
              დამატება
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.9,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
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
    fontFamily: 'Inter',
    marginTop: 8,
  },
  photoPlaceholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    color: '#111827',
  },
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
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter',
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
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
    fontFamily: 'Inter',
    color: '#374151',
  },
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
    fontFamily: 'Inter',
  },
  optionButtonTextSelected: {
    color: '#6366F1',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    fontFamily: 'Inter',
  },
  submitButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
});