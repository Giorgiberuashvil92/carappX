import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCars } from '../../contexts/CarContext';
import { useToast } from '../../contexts/ToastContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AddReminderModal from '../../components/garage/AddReminderModal';
import { uploadCarImage } from '../../utils/cloudinaryUpload';

const { width, height } = Dimensions.get('window');

interface UICar {
  id: string;
  brand: string;
  model: string;
  year: string;
  vin?: string;
  licensePlate: string;
  mileage: number;
  fuelType: string;
  image?: string;
  color: string;
  nextService?: Date;
  insurance?: Date;
  inspection?: Date;
  healthScore?: number;
  points?: number;
}

interface ServiceRecord {
  id: string;
  carId: string;
  type: string;
  date: Date;
  mileage: number;
  cost: number;
  description: string;
  location?: string;
  pointsEarned?: number;
}

interface Reminder {
  id: string;
  carId: string;
  type: 'service' | 'insurance' | 'inspection' | 'oil';
  title: string;
  date: Date;
  notified: boolean;
  priority?: 'low' | 'medium' | 'high';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  pointsReward: number;
  progress?: number;
  maxProgress?: number;
  category: 'mileage' | 'service' | 'eco' | 'social';
}

const CAR_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'პირველი 10K',
    description: '10,000 კმ გავლილი',
    icon: 'road',
    isUnlocked: true,
    pointsReward: 100,
    category: 'mileage',
  },
  {
    id: '2',
    title: 'ეკო მძღოლი',
    description: '5 ეკო მგზავრობა',
    icon: 'leaf',
    isUnlocked: false,
    pointsReward: 150,
    progress: 3,
    maxProgress: 5,
    category: 'eco',
  },
  {
    id: '3',
    title: 'სერვის მასტერი',
    description: '10 დროული სერვისი',
    icon: 'wrench',
    isUnlocked: false,
    pointsReward: 200,
    progress: 7,
    maxProgress: 10,
    category: 'service',
  },
];

// მანქანების მონაცემები dropdown-ებისთვის
const CAR_BRANDS = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia',
  'Volkswagen', 'Ford', 'Chevrolet', 'Mazda', 'Subaru', 'Lexus', 'Infiniti', 'Acura',
  'Porsche', 'Jaguar', 'Land Rover', 'Volvo', 'Saab', 'Opel', 'Peugeot', 'Renault',
  'Fiat', 'Alfa Romeo', 'Lancia', 'Skoda', 'Seat', 'Dacia', 'Lada', 'UAZ'
];

const CAR_MODELS: { [key: string]: string[] } = {
  'BMW': ['X1', 'X3', 'X5', 'X7', '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'Z4', 'i3', 'i8'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'CLA', 'CLS', 'AMG GT', 'EQC'],
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'Prius', 'RAV4', 'Highlander', '4Runner', 'Sequoia', 'Tacoma', 'Tundra', 'Sienna', 'Avalon', 'C-HR', 'Venza'],
  'Honda': ['Civic', 'Accord', 'Insight', 'CR-V', 'Pilot', 'Passport', 'Ridgeline', 'HR-V', 'Fit', 'Odyssey', 'NSX', 'CR-Z'],
  'Nissan': ['Versa', 'Sentra', 'Altima', 'Maxima', 'Kicks', 'Rogue', 'Murano', 'Pathfinder', 'Armada', 'Frontier', 'Titan', '370Z', 'GT-R', 'Leaf'],
  'Hyundai': ['Accent', 'Elantra', 'Sonata', 'Veloster', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Nexo', 'Genesis', 'Ioniq'],
  'Kia': ['Rio', 'Forte', 'Optima', 'Stinger', 'Soul', 'Sportage', 'Sorento', 'Telluride', 'Niro', 'Cadenza', 'K900'],
  'Volkswagen': ['Jetta', 'Passat', 'Arteon', 'Golf', 'GTI', 'Beetle', 'Tiguan', 'Atlas', 'ID.4', 'Touareg'],
  'Ford': ['Fiesta', 'Focus', 'Fusion', 'Mustang', 'EcoSport', 'Escape', 'Edge', 'Explorer', 'Expedition', 'F-150', 'Ranger', 'Bronco'],
  'Chevrolet': ['Spark', 'Sonic', 'Cruze', 'Malibu', 'Impala', 'Camaro', 'Corvette', 'Trax', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban', 'Silverado'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'MX-5 Miata', 'CX-3', 'CX-30', 'CX-5', 'CX-9'],
  'Subaru': ['Impreza', 'Legacy', 'WRX', 'BRZ', 'Crosstrek', 'Forester', 'Outback', 'Ascent'],
  'Lexus': ['IS', 'ES', 'GS', 'LS', 'UX', 'NX', 'RX', 'GX', 'LX', 'LC', 'RC'],
  'Infiniti': ['Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX60', 'QX80'],
  'Acura': ['ILX', 'TLX', 'RLX', 'RDX', 'MDX', 'NSX'],
  'Porsche': ['718', '911', 'Panamera', 'Macan', 'Cayenne', 'Taycan'],
  'Jaguar': ['XE', 'XF', 'XJ', 'F-PACE', 'E-PACE', 'I-PACE', 'F-TYPE'],
  'Land Rover': ['Range Rover Evoque', 'Range Rover Velar', 'Range Rover Sport', 'Range Rover', 'Discovery Sport', 'Discovery', 'Defender'],
  'Volvo': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90'],
  'Saab': ['9-3', '9-5', '9-7X'],
  'Opel': ['Corsa', 'Astra', 'Insignia', 'Crossland', 'Grandland', 'Mokka'],
  'Peugeot': ['208', '308', '508', '2008', '3008', '5008'],
  'Renault': ['Clio', 'Megane', 'Talisman', 'Captur', 'Kadjar', 'Koleos'],
  'Fiat': ['500', 'Panda', 'Tipo', '500X', '500L'],
  'Alfa Romeo': ['Giulietta', 'Giulia', 'Stelvio', '4C'],
  'Lancia': ['Ypsilon', 'Delta'],
  'Skoda': ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq'],
  'Seat': ['Ibiza', 'Leon', 'Toledo', 'Arona', 'Ateca', 'Tarraco'],
  'Dacia': ['Sandero', 'Logan', 'Duster', 'Lodgy', 'Dokker'],
  'Lada': ['Granta', 'Vesta', 'XRAY', 'Largus', '4x4'],
  'UAZ': ['Patriot', 'Hunter', 'Pickup', 'Cargo']
};

const CAR_SUBMODELS: { [key: string]: { [key: string]: string[] } } = {
  'BMW': {
    '3 Series': ['320i', '325i', '330i', '335i', 'M3'],
    '4 Series': ['420i', '430i', '440i', 'M4'],
    '5 Series': ['520i', '525i', '530i', '535i', '540i', '550i', 'M5'],
    '6 Series': ['630i', '640i', '650i', 'M6'],
    '7 Series': ['730i', '740i', '750i', '760i', 'M760Li'],
    '8 Series': ['840i', '850i', 'M8'],
    'X3': ['xDrive20i', 'xDrive30i', 'xDrive35i', 'M40i'],
    'X5': ['xDrive30i', 'xDrive40i', 'xDrive50i', 'M50i', 'X5M'],
    'X7': ['xDrive40i', 'xDrive50i', 'M50i', 'X7M'],
  },
  'Mercedes-Benz': {
    'A-Class': ['A180', 'A200', 'A220', 'A250', 'A35 AMG', 'A45 AMG'],
    'C-Class': ['C180', 'C200', 'C220', 'C250', 'C300', 'C350', 'C43 AMG', 'C63 AMG'],
    'E-Class': ['E200', 'E220', 'E250', 'E300', 'E350', 'E400', 'E500', 'E53 AMG', 'E63 AMG'],
    'S-Class': ['S350', 'S400', 'S450', 'S500', 'S600', 'S63 AMG', 'S65 AMG'],
    'GLC': ['GLC200', 'GLC220', 'GLC250', 'GLC300', 'GLC43 AMG', 'GLC63 AMG'],
    'GLE': ['GLE300', 'GLE350', 'GLE400', 'GLE450', 'GLE500', 'GLE53 AMG', 'GLE63 AMG'],
    'GLS': ['GLS350', 'GLS400', 'GLS450', 'GLS500', 'GLS63 AMG'],
    'G-Class': ['G350', 'G500', 'G63 AMG'],
  },
  'Audi': {
    'A3': ['30 TFSI', '35 TFSI', '40 TFSI', 'S3', 'RS3'],
    'A4': ['30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI', 'S4', 'RS4'],
    'A5': ['30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI', 'S5', 'RS5'],
    'A6': ['30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI', 'S6', 'RS6'],
    'A7': ['35 TFSI', '40 TFSI', '45 TFSI', 'S7', 'RS7'],
    'A8': ['50 TFSI', '55 TFSI', '60 TFSI', 'S8'],
    'Q3': ['30 TFSI', '35 TFSI', '40 TFSI', 'RS Q3'],
    'Q5': ['40 TFSI', '45 TFSI', '50 TFSI', 'SQ5', 'RS Q5'],
    'Q7': ['45 TFSI', '50 TFSI', '55 TFSI', 'SQ7'],
    'Q8': ['50 TFSI', '55 TFSI', 'RS Q8'],
  },
  'Toyota': {
    'Corolla': ['1.6', '1.8 Hybrid', '2.0 Hybrid'],
    'Camry': ['2.5', '3.5 V6', '2.5 Hybrid'],
    'RAV4': ['2.0', '2.5', '2.5 Hybrid', 'Prime'],
    'Prius': ['1.8 Hybrid', 'Prime'],
  }
};

const CAR_YEARS = Array.from({ length: 25 }, (_, i) => (2024 - i).toString());

export default function GarageScreen() {
  const { cars: apiCars, selectedCar: apiSelectedCar, reminders: apiReminders, addCar: apiAddCar, removeCar: apiRemoveCar, selectCar: apiSelectCar, addReminder: apiAddReminder } = useCars();
  const { success, error, warning, info } = useToast();

  const [cars, setCars] = useState<UICar[]>([]);
  const [selectedCar, setSelectedCar] = useState<UICar | null>(null);
  // დროებით ვიზუალის ცდა: ყველა მანქანა რენდერდეს "დამატების" ქარდის სტილში
  const [useAddStyleCards] = useState<boolean>(true);

  const getFallbackCarImage = (make?: string) => {
    const carImages: { [key: string]: string } = {
      'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1600&auto=format&fit=crop',
      'Mercedes-Benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1600&auto=format&fit=crop',
      'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1600&auto=format&fit=crop',
      'Toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1600&auto=format&fit=crop',
      'Honda': 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?q=80&w=1600&auto=format&fit=crop',
      'Nissan': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1600&auto=format&fit=crop',
      'Ford': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1600&auto=format&fit=crop',
      'Volkswagen': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1600&auto=format&fit=crop',
      'Hyundai': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop',
      'Kia': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1600&auto=format&fit=crop',
      'Mazda': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1600&auto=format&fit=crop',
      'Subaru': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1600&auto=format&fit=crop',
      'Lexus': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop',
      'Porsche': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop',
    };
    if (make && carImages[make]) return carImages[make];
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop';
  };
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([
    {
      id: '1',
      carId: '1',
      type: 'ზეთის შეცვლა',
      date: new Date('2024-09-01'),
      mileage: 44500,
      cost: 120,
      description: 'სრული ზეთის შეცვლა და ფილტრები',
      location: 'BMW Service Center',
      pointsEarned: 25,
    },
    {
      id: '2',
      carId: '1',
      type: 'ტექდათვალიერება',
      date: new Date('2024-06-15'),
      mileage: 42000,
      cost: 50,
      description: 'წლიური ტექნიკური დათვალიერება',
      location: 'სახელმწიფო ტექცენტრი',
      pointsEarned: 50,
    }
  ]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  const [addCarModalVisible, setAddCarModalVisible] = useState(false);
  const [editCarModalVisible, setEditCarModalVisible] = useState(false);
  const [addReminderModalVisible, setAddReminderModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'stats' | 'achievements'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [editingCarData, setEditingCarData] = useState<Partial<UICar>>({});
  
  // Dropdown states
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showSubmodelDropdown, setShowSubmodelDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newCarData, setNewCarData] = useState<Partial<UICar & { submodel: string }>>({
    fuelType: 'ბენზინი',
    color: '#3B82F6',
  });
  const [newServiceData, setNewServiceData] = useState<Partial<ServiceRecord>>({
    type: 'სერვისი',
    date: new Date(),
  });

  // API -> UI მാც്ცინგი
  useEffect(() => {
    const mappedCars: UICar[] = (apiCars || []).map((c) => ({
      id: c.id,
      brand: c.make,
      model: c.model,
      year: String(c.year ?? ''),
      vin: undefined,
      licensePlate: c.plateNumber,
      mileage: 0,
      fuelType: 'ბენზინი',
      image: c.imageUri || undefined, // მხოლოდ cloudinary URL ან undefined
      color: '#3B82F6',
      nextService: c.nextService ? new Date(c.nextService) : undefined,
      healthScore: 90,
      points: 0,
    }));
    setCars(mappedCars);

    // აირჩიე API არჩეული ან პირველი
    if (apiSelectedCar) {
      const found = mappedCars.find((x) => x.id === apiSelectedCar.id) || null;
      setSelectedCar(found);
    } else if (mappedCars.length && !selectedCar) {
      setSelectedCar(mappedCars[0]);
    }
  }, [apiCars, apiSelectedCar]);

  useEffect(() => {
    const mappedReminders: Reminder[] = (apiReminders || []).map((r) => ({
      id: r.id,
      carId: r.carId,
      type: (r.type as any) || 'service',
      title: r.title,
      date: new Date(r.reminderDate),
      notified: r.isCompleted || false,
      priority: (r.priority as any) || 'low',
    }));
    setReminders(mappedReminders);
  }, [apiReminders]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const calculateStats = () => {
    if (!selectedCar || serviceHistory.length === 0) {
      return { 
        totalCost: 0, 
        avgMonthly: 0, 
        servicesCount: 0,
        totalPoints: 0,
        fuelEfficiency: 0,
        avgCostPerKm: 0,
      };
    }
    
    const carServices = serviceHistory.filter(s => s.carId === selectedCar.id);
    const totalCost = carServices.reduce((sum, s) => sum + s.cost, 0);
    const totalPoints = carServices.reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
    const avgMonthly = totalCost / 12;
    const avgCostPerKm = selectedCar.mileage > 0 ? (totalCost / selectedCar.mileage).toFixed(4) : 0;
    
    return {
      totalCost,
      avgMonthly: avgMonthly.toFixed(2),
      servicesCount: carServices.length,
      totalPoints,
      fuelEfficiency: 8.5, // Mock data
      avgCostPerKm,
    };
  };

  const stats = calculateStats();

  // ფოტოს არჩევა და cloudinary-ზე ავტვირთვა
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // ოპტიმიზაციისთვის
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        
        setNewCarData({ ...newCarData, image: localUri });
        
        // cloudinary-ზე ავტვირთვა
        setIsUploadingImage(true);
        const uploadResult = await uploadCarImage(localUri);
        
        if (uploadResult.success && uploadResult.url) {
          setNewCarData({ ...newCarData, image: uploadResult.url });
          success('✅ ფოტო ავტვირთულია', 'ფოტო წარმატებით ავტვირთულია cloudinary-ზე');
        } else {
          error('შეცდომა', uploadResult.error || 'ფოტოს ავტვირთვა ვერ მოხერხდა');
        }
      }
    } catch (err) {
      error('შეცდომა', 'ფოტოს არჩევა ვერ მოხერხდა');
      console.error('Image picker error:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ფოტოს არჩევა და cloudinary-ზე ავტვირთვა (რედაქტირებისთვის)
  const pickImageForEdit = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // ოპტიმიზაციისთვის
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        
        // დროებით ლოკალური URI-ს ჩვენება
        setEditingCarData({ ...editingCarData, image: localUri });
        
        // cloudinary-ზე ავტვირთვა
        setIsUploadingImage(true);
        const uploadResult = await uploadCarImage(localUri);
        
        if (uploadResult.success && uploadResult.url) {
          setEditingCarData({ ...editingCarData, image: uploadResult.url });
          success('✅ ფოტო ავტვირთულია', 'ფოტო წარმატებით ავტვირთულია cloudinary-ზე');
        } else {
          error('შეცდომა', uploadResult.error || 'ფოტოს ავტვირთვა ვერ მოხერხდა');
        }
      }
    } catch (err) {
      error('შეცდომა', 'ფოტოს არჩევა ვერ მოხერხდა');
      console.error('Image picker error:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // მანქანის დამატება
  const addCar = async () => {
    try {
      await apiAddCar({
        make: newCarData.brand || '',
        model: newCarData.model || '',
        year: parseInt((newCarData.year as string) || '0'),
        plateNumber: newCarData.licensePlate || '',
        imageUri: newCarData.image, // cloudinary URL ან undefined
      });

      setNewCarData({ fuelType: 'ბენზინი', color: '#3B82F6' });
      setAddCarModalVisible(false);
      success('🎉 გილოცავთ!', 'ახალი მანქანა წარმატებით დაემატა!');
    } catch (e) {
      error('შეცდომა', 'მანქანის დამატება ვერ მოხერხდა');
    }
  };

  // შეხსენების დამატება
  const addReminder = async (reminderData: any) => {
    try {
      await apiAddReminder(reminderData);
      setAddReminderModalVisible(false);
      success('✅ წარმატება!', 'შეხსენება წარმატებით დაემატა!');
    } catch (e) {
      error('შეცდომა', 'შეხსენების დამატება ვერ მოხერხდა');
    }
  };

  // მანქანის რედაქტირების დაწყება
  const startEditingCar = (car: UICar) => {
    setEditingCarId(car.id);
    setEditingCarData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      licensePlate: car.licensePlate,
      fuelType: car.fuelType,
      color: car.color,
      mileage: car.mileage,
      vin: car.vin,
      image: car.image,
    });
    setEditCarModalVisible(true);
  };

  // მანქანის რედაქტირების შენახვა
  const saveCarEdit = async () => {
    if (!editingCarId) return;
    
    try {
      // TODO: API call to update car
      setCars(prev => prev.map(car => 
        car.id === editingCarId 
          ? { ...car, ...editingCarData }
          : car
      ));
      setEditingCarId(null);
      setEditingCarData({});
      setEditCarModalVisible(false);
      success('✅ წარმატება!', 'მანქანის ინფორმაცია განახლდა!');
    } catch (e) {
      error('შეცდომა', 'მანქანის განახლება ვერ მოხერხდა');
    }
  };

  // მანქანის რედაქტირების გაუქმება
  const cancelCarEdit = () => {
    setEditingCarId(null);
    setEditingCarData({});
    setEditCarModalVisible(false);
  };

  // Dropdown ფუნქციები
  const selectBrand = (brand: string) => {
    setNewCarData({ ...newCarData, brand, model: '', submodel: '' }); // Reset model and submodel when brand changes
    setShowBrandDropdown(false);
  };

  const selectModel = (model: string) => {
    setNewCarData({ ...newCarData, model, submodel: '' }); // Reset submodel when model changes
    setShowModelDropdown(false);
  };

  const selectSubmodel = (submodel: string) => {
    setNewCarData({ ...newCarData, submodel });
    setShowSubmodelDropdown(false);
  };

  const selectYear = (year: string) => {
    setNewCarData({ ...newCarData, year });
    setShowYearDropdown(false);
  };

  const getAvailableModels = () => {
    return newCarData.brand ? (CAR_MODELS[newCarData.brand] || []) : [];
  };

  const getAvailableSubmodels = () => {
    if (!newCarData.brand || !newCarData.model) return [];
    return CAR_SUBMODELS[newCarData.brand]?.[newCarData.model] || [];
  };

  // მანქანის წაშლა
  const deleteCar = (carId: string) => {
    Alert.alert(
      'წაშლის დადასტურება',
      'ნამდვილად გსურთ ამ მანქანის წაშლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRemoveCar(carId);
              success('✅ წარმატება!', 'მანქანა წარმატებით წაიშალა!');
            } catch (e) {
              error('შეცდომა', 'წაშლა ვერ მოხერხდა');
            }
          }
        }
      ]
    );
  };

  // სერვისის დამატება
  const addService = () => {
    if (!selectedCar) return;
    
    const pointsEarned = Math.floor(Math.random() * 50) + 10;
    const newService: ServiceRecord = {
      id: Date.now().toString(),
      carId: selectedCar.id,
      type: newServiceData.type || 'სერვისი',
      date: newServiceData.date || new Date(),
      mileage: parseInt(newServiceData.mileage?.toString() || '0'),
      cost: parseFloat(newServiceData.cost?.toString() || '0'),
      description: newServiceData.description || '',
      location: newServiceData.location,
      pointsEarned,
    };
    
    setServiceHistory([newService, ...serviceHistory]);
    setNewServiceData({ type: 'სერვისი', date: new Date() });
    setServiceModalVisible(false);
    
    success('✅ სერვისი დამატებულია', `მიიღეთ +${pointsEarned} ქულა!`);
  };

  // გაზიარება
  const handleShare = async (type: string) => {
    try {
      let message = '';
      switch (type) {
        case 'car':
          message = `ჩემი ${selectedCar?.brand} ${selectedCar?.model} (${selectedCar?.year}) 🚗\n${selectedCar?.mileage.toLocaleString()} კმ გარბენი\nჯანმრთელობის ქულა: ${selectedCar?.healthScore}%`;
          break;
        case 'achievement':
          message = `ახალი მიღწევა გავაკეთე CarAppX-ში! 🏆`;
          break;
        case 'stats':
          message = `ჩემი გარაჟის სტატისტიკა:\n${stats.servicesCount} სერვისი\n${stats.totalPoints} ქულა\n${stats.totalCost}₾ დახარჯული`;
          break;
      }
      
      await Share.share({
        message: message,
        title: 'CarAppX გარაჟი'
      });
    } catch (err) {
      error('შეცდომა', 'გაზიარება ვერ მოხერხდა');
    }
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: '#0F0F0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
      backgroundColor: '#0F0F0F',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    marginBottom: 24,
  },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
    letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: '#9CA3AF',
      marginTop: 4,
      letterSpacing: 0.5,
  },
  headerButtons: {
      flexDirection: 'row',
    gap: 12,
  },
    iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
      backgroundColor: 'rgba(55, 65, 81, 0.4)',
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
    // Tabs
    tabContainer: {
      flexDirection: 'row',
    paddingHorizontal: 20,
      marginBottom: 20,
      gap: 8,
    },
    tab: {
      width: (width - 52) / 4 + 20,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    tabText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#9CA3AF',
    },
    activeTabText: {
      color: '#6366F1',
    },
    // Car Selector
    carSelector: {
      marginBottom: 24,
    },
    carSelectorScroll: {
    paddingHorizontal: 20,
    },
    carCard: {
      width: width * 0.8,
      height: 200,
      borderRadius: 24,
      marginRight: 16,
      overflow: 'hidden',
    shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    selectedCarCard: {
      borderWidth: 3,
      borderColor: '#6366F1',
    },
    selectedAddCarCard: {
      borderWidth: 2,
      borderColor: 'rgba(99, 102, 241, 0.8)',
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
    },
    carCardGradient: {
    flex: 1,
      padding: 20,
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    },
    infoOverlay: {
      backgroundColor: 'rgba(55, 65, 81, 0.35)',
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.35)',
      borderRadius: 16,
      padding: 12,
      gap: 10,
    },
    overlayTopRow: {
    flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    overlayBottomRow: {
    flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    carHealthBar: {
      position: 'absolute',
      top: 20,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    carHealthScore: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    carHealthLabel: {
      fontSize: 8,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
    },
    carBrand: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    carModel: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 4,
    },
    carDetails: {
    flexDirection: 'row',
      justifyContent: 'space-between',
    alignItems: 'center',
    },
    carPlate: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
    },
    carPlateText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    carMileage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    },
    carMileageText: {
      color: '#FFFFFF',
    fontSize: 14,
      fontWeight: '600',
    },
    carPoints: {
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
      gap: 4,
    },
    carPointsText: {
      color: '#F59E0B',
      fontSize: 14,
      fontWeight: '700',
    },
    addCarCard: {
      width: width * 0.8,
      height: 200,
      borderRadius: 24,
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(156, 163, 175, 0.3)',
    alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginRight: 16,
    },
    addStyleOverlay: {
      backgroundColor: 'transparent',
      padding: 16,
      borderRadius: 16,
      borderWidth: 0,
      borderColor: 'transparent',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      gap: 10,
    },
    cardHeaderRow: {
    flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    cardSubtitle: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: 2,
    },
    editChip: {
    flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(55, 65, 81, 0.5)',
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.35)',
    },
    editFloating: {
    flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      position: 'absolute',
      top: 12,
      right: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(17, 24, 39, 0.45)',
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.35)',
      zIndex: 2,
    },
    editChipText: {
      color: '#E5E7EB',
      fontWeight: '700',
      fontSize: 12,
    },
    // Inline Edit Styles
    editHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      zIndex: 2,
    },
    editInputsContainer: {
      flex: 1,
      gap: 8,
    },
    editInput: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter',
    },
    editPillsRow: {
      flexDirection: 'row',
      gap: 8,
      position: 'absolute',
      bottom: 60,
      left: 16,
      right: 16,
      zIndex: 2,
    },
    editPillInput: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Inter',
      textAlign: 'center',
    },
    editActionsRow: {
      flexDirection: 'row',
      gap: 12,
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      zIndex: 2,
    },
    saveButton: {
      flex: 1,
      backgroundColor: '#10B981',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Inter',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    cancelButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Inter',
    },
    // Modal Actions
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      paddingHorizontal: 20,
    },
    cancelModalButton: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelModalButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    saveModalButton: {
      flex: 1,
      backgroundColor: '#10B981',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    saveModalButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    // Dropdown Styles
    dropdownContainer: {
      marginBottom: 16,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#374151',
      borderWidth: 1,
      borderColor: '#4B5563',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 50,
    },
    dropdownText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
    },
    dropdownPlaceholder: {
      color: '#9CA3AF',
    },
    dropdownDisabled: {
      opacity: 0.5,
    },
    dropdownList: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      backgroundColor: '#374151',
      borderWidth: 1,
      borderColor: '#4B5563',
      borderRadius: 12,
      maxHeight: 200,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    dropdownScroll: {
      maxHeight: 200,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#4B5563',
    },
    dropdownItemText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
    },
    pillsRow: {
    flexDirection: 'row',
      gap: 8,
      width: '100%',
      justifyContent: 'flex-start',
    },
    pill: {
    flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(55, 65, 81, 0.4)',
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.3)',
    },
    pillText: {
      color: '#E5E7EB',
      fontSize: 12,
      fontWeight: '600',
    },
    actionsRow: {
    flexDirection: 'row',
      gap: 10,
    },
    actionGhostBtn: {
    flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.35)',
    },
    actionGhostText: {
      color: '#E5E7EB',
      fontWeight: '700',
      fontSize: 12,
    },
    addCarText: {
      fontSize: 16,
      color: '#9CA3AF',
      marginTop: 12,
      fontWeight: '600',
    },
    deleteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(239,68,68,0.9)',
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Stats Cards
    statsContainer: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    gap: 12,
  },
    statCard: {
      width: (width - 52) / 2,
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
      borderRadius: 20,
    padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.2)',
    shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    },
    statCardLarge: {
      width: '100%',
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    marginBottom: 4,
  },
    statLabel: {
      fontSize: 12,
      color: '#9CA3AF',
    fontWeight: '500',
    },
    statChange: {
      fontSize: 11,
      color: '#10B981',
      marginTop: 4,
      fontWeight: '600',
    },
    // Quick Actions
    quickActions: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    actionsGrid: {
    flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 16,
      padding: 16,
    alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
    shadowRadius: 8,
      elevation: 2,
    },
    actionText: {
      fontSize: 12,
      color: '#E5E7EB',
      fontWeight: '600',
    },
    // Reminders
    remindersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
    remindersList: {
      gap: 12,
    },
    reminderCard: {
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 16,
    padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
    shadowRadius: 8,
      elevation: 2,
    },
    highPriorityReminder: {
      borderColor: 'rgba(239, 68, 68, 0.3)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    reminderIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
    reminderContent: {
    flex: 1,
  },
    reminderTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    marginBottom: 4,
  },
    reminderDate: {
      fontSize: 13,
    color: '#9CA3AF',
  },
    reminderDays: {
      fontSize: 11,
      color: '#F59E0B',
      marginTop: 2,
      fontWeight: '600',
    },
    reminderAction: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
    },
    reminderActionText: {
    fontSize: 12,
      color: '#6366F1',
      fontWeight: '600',
  },
    // Empty Reminders State
    emptyRemindersState: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyRemindersCard: {
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.2)',
      borderStyle: 'dashed',
      width: '100%',
      maxWidth: 300,
    },
    emptyRemindersIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyRemindersTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyRemindersSubtitle: {
      fontSize: 14,
      color: '#9CA3AF',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    emptyRemindersButton: {
      backgroundColor: '#6366F1',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    emptyRemindersButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    // History
  historySection: {
      paddingHorizontal: 20,
      marginBottom: 24,
  },
    historyCard: {
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 16,
    padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
    shadowRadius: 8,
      elevation: 2,
  },
    historyHeader: {
    flexDirection: 'row',
      justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
    historyType: {
    fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    historyCost: {
      fontSize: 18,
      fontWeight: '700',
      color: '#22C55E',
    },
    historyPoints: {
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 4,
    },
    historyPointsText: {
    fontSize: 12,
      color: '#F59E0B',
      fontWeight: '600',
    },
    historyDetails: {
      gap: 8,
    },
    historyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
      gap: 8,
    },
    historyDetailText: {
      fontSize: 13,
      color: '#9CA3AF',
    },
    // Achievements
    achievementSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    achievementsScroll: {
      paddingRight: 20,
    },
    achievementCard: {
      width: 140,
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 16,
    padding: 16,
      marginRight: 12,
      alignItems: 'center',
    borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.2)',
    },
    unlockedAchievement: {
      borderColor: 'rgba(16, 185, 129, 0.3)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    achievementIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
      marginBottom: 12,
    },
    achievementTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    marginBottom: 4,
  },
    achievementProgress: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 4,
    },
    // Modal
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#1A1A1A',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 8,
      maxHeight: height * 0.9,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: '#4B5563',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    modalBody: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#E5E7EB',
      marginBottom: 8,
    },
    input: {
      backgroundColor: 'rgba(55, 65, 81, 0.4)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
    borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.2)',
      color: '#FFFFFF',
  },
    colorPicker: {
    flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    colorOption: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    selectedColor: {
      borderColor: '#6366F1',
    },
    imagePickerButton: {
      backgroundColor: 'rgba(55, 65, 81, 0.3)',
      borderRadius: 12,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(156, 163, 175, 0.3)',
    },
    selectedImage: {
      width: '100%',
      height: 120,
      borderRadius: 12,
    },
    uploadOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    uploadText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: '#6366F1',
    borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
    shadowRadius: 8,
      elevation: 4,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    emptyState: {
      padding: 40,
    alignItems: 'center',
  },
    emptyStateText: {
    fontSize: 16,
      color: '#9CA3AF',
      textAlign: 'center',
      marginTop: 16,
    },
    emptyStateButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: '#6366F1',
    borderRadius: 12,
    },
    emptyStateButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  // დღეების გამოთვლა შეხსენებისთვის
  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // პრიორიტეტის ფერი
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>ჩემი გარაჟი</Text>
              <Text style={styles.headerSubtitle}>GARAGE MANAGEMENT</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setAddReminderModalVisible(true)}
              >
                <Ionicons name="alarm-outline" size={20} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => setEditMode(!editMode)}>
                <Ionicons name={editMode ? "checkmark" : "create-outline"} size={20} color="#E5E7EB" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setAchievementsModalVisible(true)}
              >
                <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleShare('stats')}
              >
                <Ionicons name="share-social-outline" size={20} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
          >
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                მიმოხილვა
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                ისტორია
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
              onPress={() => setActiveTab('stats')}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
                სტატისტიკა
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
              onPress={() => setActiveTab('achievements')}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
                მიღწევები
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Car Selector */}
        <View style={styles.carSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carSelectorScroll}
            snapToInterval={width * 0.8 + 16}
            decelerationRate="fast"
          >
            {cars.length > 0 && cars.map((car) => (
              <Animated.View
                key={car.id}
                style={[
                  useAddStyleCards ? styles.addCarCard : styles.carCard,
                  selectedCar?.id === car.id && (useAddStyleCards ? styles.selectedAddCarCard : styles.selectedCarCard),
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCar(car);
                    apiSelectCar({ id: car.id, make: car.brand, model: car.model, year: parseInt(car.year || '0'), plateNumber: car.licensePlate, imageUri: car.image || '', lastService: car.nextService, nextService: car.nextService } as any);
                  }}
                  activeOpacity={0.9}
                  style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                >
                  {useAddStyleCards ? (
                    <>
                      {car.image ? (
                        <Image
                          source={{ uri: car.image }}
                          resizeMode="cover"
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4 }}
                        />
                      ) : (
                        <Image
                          source={{ uri: getFallbackCarImage(car.brand) }}
                          resizeMode="cover"
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4 }}
                        />
                      )}
                      <TouchableOpacity style={styles.editFloating} onPress={() => startEditingCar(car)}>
                        <Ionicons name="create-outline" size={14} color="#E5E7EB" />
                        <Text style={styles.editChipText}>რედაქტირება</Text>
                      </TouchableOpacity>
                      <View style={styles.addStyleOverlay}>
                        <View style={styles.cardHeaderRow}>
                          <View>
                            <Text style={styles.cardTitle}>{car.brand} {car.model}</Text>
                            <Text style={styles.cardSubtitle}>{car.year}</Text>
                          </View>
                        </View>

                        <View style={styles.pillsRow}>
                          <View style={[styles.pill, { paddingHorizontal: 12 }]}>
                            <Ionicons name="pricetag-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.pillText}>{car.licensePlate}</Text>
                          </View>
                          <View style={styles.pill}>
                            <Ionicons name="color-palette-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.pillText}>{car.fuelType}</Text>
                          </View>
                        </View>
                      </View>
                    </>
                  ) : null}
                </TouchableOpacity>
              </Animated.View>
            ))}
            
            {/* Add Car Button */}
            <TouchableOpacity 
              style={styles.addCarCard}
              onPress={() => setAddCarModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={48} color="#9CA3AF" />
              <Text style={styles.addCarText}>მანქანის დამატება</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {activeTab === 'overview' && selectedCar && (
          <>
            {/* Quick actions trimmed as requested */}

            {/* Reminders */}
            <View style={styles.remindersSection}>
              <Text style={styles.sectionTitle}>მომავალი შეხსენებები</Text>
              
              {reminders.filter(r => r.carId === selectedCar.id).length > 0 ? (
                <View style={styles.remindersList}>
                  {reminders
                    .filter(r => r.carId === selectedCar.id)
                    .map((reminder) => (
                      <Animated.View 
                        key={reminder.id} 
                        style={[
                          styles.reminderCard,
                          reminder.priority === 'high' && styles.highPriorityReminder,
                          {
                            opacity: fadeAnim,
                            transform: [{ translateX: slideAnim }],
                          },
                        ]}
                      >
                        <View style={[
                          styles.reminderIcon,
                          { backgroundColor: `rgba(${reminder.type === 'service' ? '99, 102, 241' : 
                                                      reminder.type === 'insurance' ? '34, 197, 94' : '245, 158, 11'}, 0.2)` }
                        ]}>
                          <Ionicons 
                            name={reminder.type === 'service' ? 'build-outline' : 
                                  reminder.type === 'insurance' ? 'shield-checkmark-outline' : 
                                  'calendar-outline'} 
                            size={20} 
                            color={getPriorityColor(reminder.priority)} 
                          />
                        </View>
                        <View style={styles.reminderContent}>
                          <Text style={styles.reminderTitle}>{reminder.title}</Text>
                          <Text style={styles.reminderDate}>
                            {reminder.date.toLocaleDateString('ka-GE')}
                          </Text>
                          <Text style={styles.reminderDays}>
                            {getDaysUntil(reminder.date)} დღეში
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.reminderAction}>
                          <Text style={styles.reminderActionText}>დეტალები</Text>
                        </TouchableOpacity>
                      </Animated.View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyRemindersState}>
                  <View style={styles.emptyRemindersCard}>
                    <View style={styles.emptyRemindersIcon}>
                      <Ionicons name="alarm-outline" size={32} color="#6366F1" />
                    </View>
                    <Text style={styles.emptyRemindersTitle}>შეხსენებები არ არის</Text>
                    <Text style={styles.emptyRemindersSubtitle}>
                      ისტორიაში დაამატე პირველი შეხსენება
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyRemindersButton}
                      onPress={() => setAddReminderModalVisible(true)}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.emptyRemindersButtonText}>შეხსენების დამატება</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {activeTab === 'history' && selectedCar && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>სერვისის ისტორია</Text>
            {serviceHistory
              .filter(s => s.carId === selectedCar.id)
              .map((service) => (
                <Animated.View 
                  key={service.id} 
                  style={[
                    styles.historyCard,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyType}>{service.type}</Text>
                      {service.pointsEarned && (
                        <View style={styles.historyPoints}>
                          <Text style={styles.historyPointsText}>+{service.pointsEarned} ქულა</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.historyCost}>{service.cost}₾</Text>
                  </View>
                  <View style={styles.historyDetails}>
                    <View style={styles.historyDetailRow}>
                      <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                      <Text style={styles.historyDetailText}>
                        {service.date.toLocaleDateString('ka-GE')}
                      </Text>
                    </View>
                    <View style={styles.historyDetailRow}>
                      <Ionicons name="speedometer-outline" size={16} color="#9CA3AF" />
                      <Text style={styles.historyDetailText}>
                        {service.mileage.toLocaleString()} კმ
                      </Text>
                    </View>
                    {service.location && (
                      <View style={styles.historyDetailRow}>
                        <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                        <Text style={styles.historyDetailText}>{service.location}</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
            ))}
            
            {serviceHistory.filter(s => s.carId === selectedCar.id).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color="#4B5563" />
                <Text style={styles.emptyStateText}>
                  ჯერ არ არის სერვისის ისტორია
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => setServiceModalVisible(true)}
                >
                  <Text style={styles.emptyStateButtonText}>დაამატე პირველი</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && selectedCar && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>სტატისტიკა</Text>
            <View style={styles.statsGrid}>
              <Animated.View 
                style={[
                  styles.statCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                  <Ionicons name="cash-outline" size={20} color="#22C55E" />
                </View>
                <Text style={styles.statValue}>{stats.totalCost}₾</Text>
                <Text style={styles.statLabel}>სულ ხარჯი</Text>
                <Text style={styles.statChange}>↑ 12% ბოლო თვეში</Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.statCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Ionicons name="trending-up" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{stats.avgMonthly}₾</Text>
                <Text style={styles.statLabel}>საშუალო თვიური</Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.statCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                  <Ionicons name="construct-outline" size={20} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>{stats.servicesCount}</Text>
                <Text style={styles.statLabel}>სერვისები</Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.statCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                  <Ionicons name="star" size={20} color="#EC4899" />
                </View>
                <Text style={styles.statValue}>{stats.totalPoints}</Text>
                <Text style={styles.statLabel}>დაგროვებული ქულები</Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.statCard,
                  styles.statCardLarge,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <MaterialCommunityIcons name="fuel" size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{stats.fuelEfficiency} ლ/100კმ</Text>
                <Text style={styles.statLabel}>საწვავის მოხმარება</Text>
                <Text style={styles.statChange}>↓ 5% გაუმჯობესება</Text>
              </Animated.View>
            </View>
          </View>
        )}

        {activeTab === 'achievements' && (
          <View style={styles.achievementSection}>
            <Text style={styles.sectionTitle}>მიღწევები</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {CAR_ACHIEVEMENTS.map((achievement) => (
                <Animated.View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    achievement.isUnlocked && styles.unlockedAchievement,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: cardScaleAnim }],
                    },
                  ]}
                >
                  <View style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.isUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)' }
                  ]}>
                    <FontAwesome5 
                      name={achievement.icon} 
                      size={20} 
                      color={achievement.isUnlocked ? '#10B981' : '#6B7280'} 
                    />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  {achievement.progress && (
                    <Text style={styles.achievementProgress}>
                      {achievement.progress}/{achievement.maxProgress}
                    </Text>
                  )}
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Car Modal */}
      <Modal
        visible={addCarModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddCarModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ახალი მანქანა</Text>
              <TouchableOpacity onPress={() => setAddCarModalVisible(false)}>
                <Ionicons name="close" size={24} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ფოტო</Text>
                <TouchableOpacity 
                  style={[styles.imagePickerButton, isUploadingImage && { opacity: 0.7 }]} 
                  onPress={pickImage}
                  disabled={isUploadingImage}
                >
                  {newCarData.image ? (
                    <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image source={{ uri: newCarData.image }} style={styles.selectedImage} />
                      {isUploadingImage && (
                        <View style={styles.uploadOverlay}>
                          <ActivityIndicator size="large" color="#6366F1" />
                          <Text style={styles.uploadText}>ავტვირთვა...</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <>
                      {isUploadingImage ? (
                        <>
                          <ActivityIndicator size="large" color="#6366F1" />
                          <Text style={{ color: '#6366F1', marginTop: 8, fontWeight: '600' }}>ავტვირთვა...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                          <Text style={{ color: '#9CA3AF', marginTop: 8 }}>ფოტოს დამატება</Text>
                        </>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ბრენდი</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowBrandDropdown(!showBrandDropdown)}
                  >
                    <Text style={[styles.dropdownText, !newCarData.brand && styles.dropdownPlaceholder]}>
                      {newCarData.brand || 'აირჩიეთ ბრენდი'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  {showBrandDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                        {CAR_BRANDS.map((brand) => (
                          <TouchableOpacity
                            key={brand}
                            style={styles.dropdownItem}
                            onPress={() => selectBrand(brand)}
                          >
                            <Text style={styles.dropdownItemText}>{brand}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>მოდელი</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.dropdownButton, !newCarData.brand && styles.dropdownDisabled]}
                    onPress={() => newCarData.brand && setShowModelDropdown(!showModelDropdown)}
                    disabled={!newCarData.brand}
                  >
                    <Text style={[styles.dropdownText, !newCarData.model && styles.dropdownPlaceholder]}>
                      {newCarData.model || (newCarData.brand ? 'აირჩიეთ მოდელი' : 'ჯერ აირჩიეთ ბრენდი')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  {showModelDropdown && newCarData.brand && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                        {getAvailableModels().map((model) => (
                          <TouchableOpacity
                            key={model}
                            style={styles.dropdownItem}
                            onPress={() => selectModel(model)}
                          >
                            <Text style={styles.dropdownItemText}>{model}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* ქვემოდელის dropdown - მხოლოდ თუ არის ქვემოდელები */}
              {getAvailableSubmodels().length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ქვემოდელი</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity 
                      style={[styles.dropdownButton, (!newCarData.brand || !newCarData.model) && styles.dropdownDisabled]}
                      onPress={() => (newCarData.brand && newCarData.model) && setShowSubmodelDropdown(!showSubmodelDropdown)}
                      disabled={!newCarData.brand || !newCarData.model}
                    >
                      <Text style={[styles.dropdownText, !newCarData.submodel && styles.dropdownPlaceholder]}>
                        {newCarData.submodel || ((newCarData.brand && newCarData.model) ? 'აირჩიეთ ქვემოდელი' : 'ჯერ აირჩიეთ მოდელი')}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    
                    {showSubmodelDropdown && newCarData.brand && newCarData.model && (
                      <View style={styles.dropdownList}>
                        <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                          {getAvailableSubmodels().map((submodel) => (
                            <TouchableOpacity
                              key={submodel}
                              style={styles.dropdownItem}
                              onPress={() => selectSubmodel(submodel)}
                            >
                              <Text style={styles.dropdownItemText}>{submodel}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>წელი</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowYearDropdown(!showYearDropdown)}
                  >
                    <Text style={[styles.dropdownText, !newCarData.year && styles.dropdownPlaceholder]}>
                      {newCarData.year || 'აირჩიეთ წელი'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  {showYearDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                        {CAR_YEARS.map((year) => (
                          <TouchableOpacity
                            key={year}
                            style={styles.dropdownItem}
                            onPress={() => selectYear(year)}
                          >
                            <Text style={styles.dropdownItemText}>{year}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>სახელმწიფო ნომერი</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABC-123"
                  placeholderTextColor="#6B7280"
                  value={newCarData.licensePlate}
                  onChangeText={(text) => setNewCarData({...newCarData, licensePlate: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>გარბენი (კმ)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50000"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={newCarData.mileage?.toString()}
                  onChangeText={(text) => setNewCarData({...newCarData, mileage: parseInt(text) || 0})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VIN კოდი (არასავალდებულო)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VIN კოდი"
                  placeholderTextColor="#6B7280"
                  value={newCarData.vin}
                  onChangeText={(text) => setNewCarData({...newCarData, vin: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ფერი</Text>
                <View style={styles.colorPicker}>
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#1E40AF'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newCarData.color === color && styles.selectedColor
                      ]}
                      onPress={() => setNewCarData({...newCarData, color})}
                    />
                  ))}
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalButton} onPress={() => setAddCarModalVisible(false)}>
                  <Text style={styles.cancelModalButtonText}>გაუქმება</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalButton} onPress={addCar}>
                  <Text style={styles.saveModalButtonText}>დამატება</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Service Modal */}
      <Modal
        visible={serviceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>სერვისის დამატება</Text>
              <TouchableOpacity onPress={() => setServiceModalVisible(false)}>
                <Ionicons name="close" size={24} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>სერვისის ტიპი</Text>
                <TextInput
                  style={styles.input}
                  placeholder="მაგ: ზეთის შეცვლა, ტექდათვალიერება..."
                  placeholderTextColor="#6B7280"
                  value={newServiceData.type}
                  onChangeText={(text) => setNewServiceData({...newServiceData, type: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>თარიღი</Text>
                <TouchableOpacity style={styles.input}>
                  <Text style={{ color: '#FFFFFF' }}>
                    {newServiceData.date?.toLocaleDateString('ka-GE') || 'აირჩიეთ თარიღი'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>გარბენი სერვისის დროს</Text>
                <TextInput
                  style={styles.input}
                  placeholder="45000"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={newServiceData.mileage?.toString()}
                  onChangeText={(text) => setNewServiceData({...newServiceData, mileage: parseInt(text) || 0})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ღირებულება (₾)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="150"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={newServiceData.cost?.toString()}
                  onChangeText={(text) => setNewServiceData({...newServiceData, cost: parseFloat(text) || 0})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>მდებარეობა</Text>
                <TextInput
                  style={styles.input}
                  placeholder="სერვის ცენტრის დასახელება"
                  placeholderTextColor="#6B7280"
                  value={newServiceData.location}
                  onChangeText={(text) => setNewServiceData({...newServiceData, location: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>აღწერა</Text>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="დამატებითი ინფორმაცია..."
                  placeholderTextColor="#6B7280"
                  multiline
                  value={newServiceData.description}
                  onChangeText={(text) => setNewServiceData({...newServiceData, description: text})}
                />
              </View>
              
              <TouchableOpacity style={styles.submitButton} onPress={addService}>
                <Text style={styles.submitButtonText}>დამატება</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Car Modal */}
      <Modal
        visible={editCarModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditCarModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>მანქანის რედაქტირება</Text>
              <TouchableOpacity onPress={() => setEditCarModalVisible(false)}>
                <Ionicons name="close" size={24} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ფოტო</Text>
                <TouchableOpacity 
                  style={[styles.imagePickerButton, isUploadingImage && { opacity: 0.7 }]} 
                  onPress={pickImageForEdit}
                  disabled={isUploadingImage}
                >
                  {editingCarData.image ? (
                    <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image source={{ uri: editingCarData.image }} style={styles.selectedImage} />
                      {isUploadingImage && (
                        <View style={styles.uploadOverlay}>
                          <ActivityIndicator size="large" color="#6366F1" />
                          <Text style={styles.uploadText}>ავტვირთვა...</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <>
                      {isUploadingImage ? (
                        <>
                          <ActivityIndicator size="large" color="#6366F1" />
                          <Text style={{ color: '#6366F1', marginTop: 8, fontWeight: '600' }}>ავტვირთვა...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                          <Text style={{ color: '#9CA3AF', marginTop: 8 }}>ფოტოს შეცვლა</Text>
                        </>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ბრენდი</Text>
                <TextInput
                  style={styles.input}
                  placeholder="მაგ: BMW, Mercedes..."
                  placeholderTextColor="#6B7280"
                  value={editingCarData.brand}
                  onChangeText={(text) => setEditingCarData({...editingCarData, brand: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>მოდელი</Text>
                <TextInput
                  style={styles.input}
                  placeholder="მაგ: X5, E-Class..."
                  placeholderTextColor="#6B7280"
                  value={editingCarData.model}
                  onChangeText={(text) => setEditingCarData({...editingCarData, model: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>წელი</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={editingCarData.year}
                  onChangeText={(text) => setEditingCarData({...editingCarData, year: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>სახელმწიფო ნომერი</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABC-123"
                  placeholderTextColor="#6B7280"
                  value={editingCarData.licensePlate}
                  onChangeText={(text) => setEditingCarData({...editingCarData, licensePlate: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>გარბენი (კმ)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50000"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={editingCarData.mileage?.toString()}
                  onChangeText={(text) => setEditingCarData({...editingCarData, mileage: parseInt(text) || 0})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VIN კოდი (არასავალდებულო)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VIN კოდი"
                  placeholderTextColor="#6B7280"
                  value={editingCarData.vin}
                  onChangeText={(text) => setEditingCarData({...editingCarData, vin: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ფერი</Text>
                <View style={styles.colorPicker}>
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#1E40AF'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        editingCarData.color === color && styles.selectedColor
                      ]}
                      onPress={() => setEditingCarData({...editingCarData, color})}
                    />
                  ))}
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalButton} onPress={cancelCarEdit}>
                  <Text style={styles.cancelModalButtonText}>გაუქმება</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalButton} onPress={saveCarEdit}>
                  <Text style={styles.saveModalButtonText}>შენახვა</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Reminder Modal */}
      <AddReminderModal
        visible={addReminderModalVisible}
        onClose={() => setAddReminderModalVisible(false)}
        onAddReminder={addReminder}
        cars={cars.map(car => ({
          id: car.id,
          make: car.brand,
          model: car.model,
          plateNumber: car.licensePlate
        }))}
      />
    </View>
  );
}