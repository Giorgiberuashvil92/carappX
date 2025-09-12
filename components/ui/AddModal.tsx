import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeToLocation } from '../../utils/LocationBus';
import { Ionicons } from '@expo/vector-icons';
import carData from '../../data/carData.json';
import { addItemApi, DismantlerData, PartData, StoreData } from '../../services/addItemApi';
import PhotoPicker from './PhotoPicker';
import { useUser } from '../../contexts/UserContext';
import { carwashLocationApi } from '../../services/carwashLocationApi';
import photoService from '../../services/photoService';
import ServicesConfig, { CarwashService } from './ServicesConfig';
import TimeSlotsConfig, { TimeSlotsConfig as TimeSlotsConfigType } from './TimeSlotsConfig';
import RealTimeStatusConfig, { RealTimeStatus } from './RealTimeStatusConfig';

const { width } = Dimensions.get('window');

export type AddModalType = 'dismantler' | 'part' | 'store' | 'carwash';

export interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (type: AddModalType, data: any) => void;
  defaultType?: AddModalType;
}

interface AddModalStep {
  step: 'type-selection' | 'form';
  selectedType?: AddModalType;
}

const AddModal: React.FC<AddModalProps> = ({ visible, onClose, onSave, defaultType }) => {
  const [currentStep, setCurrentStep] = useState<AddModalStep>({ 
    step: defaultType ? 'form' : 'type-selection',
    selectedType: defaultType
  });
  const [formData, setFormData] = useState<any>({});
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const router = useRouter();
  const [hideModal, setHideModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const { user, updateUserRole, addToOwnedCarwashes } = useUser();
  React.useEffect(() => {
    const unsub = subscribeToLocation((e) => {
      if (e?.type === 'LOCATION_PICKED') {
        setFormData((prev: any) => ({
          ...prev,
          latitude: e.payload.latitude,
          longitude: e.payload.longitude,
          address: prev?.address || e.payload.address,
        }));
        setHideModal(false);
      }
    });
    return unsub;
  }, []);

  const resetModal = () => {
    setCurrentStep({ 
      step: defaultType ? 'form' : 'type-selection',
      selectedType: defaultType
    });
    setFormData({});
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleTypeSelect = (type: AddModalType) => {
    setCurrentStep({ step: 'form', selectedType: type });
    setFormData({});
  };

  const handleBack = () => {
    if (defaultType) {
      // If defaultType is provided, don't go back to type selection
      onClose();
    } else {
      setCurrentStep({ step: 'type-selection' });
      setFormData({});
    }
  };

  const handleSave = async () => {
    if (!currentStep.selectedType) return;
    
    const config = getFormConfig();
    const requiredFields = config.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.key]);

    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(field => field.label).join(', ');
      Alert.alert('შეცდომა', `გთხოვთ შეავსოთ ყველა სავალდებულო ველი: ${fieldLabels}`);
      return;
    }

    // Specific validation for dismantler
    if (currentStep.selectedType === 'dismantler') {
      if (formData.yearFrom && formData.yearTo && parseInt(formData.yearFrom) > parseInt(formData.yearTo)) {
        Alert.alert('შეცდომა', 'წლიდან არ შეიძლება იყოს უფრო დიდი ვიდრე წლამდე');
        return;
      }
    }

    try {
      setSaving(true);
      let response;
      
      // Process photos for upload before saving
      let uploadedPhotos: string[] = [];
      if (formData.photos && formData.photos.length > 0) {
        setUploadProgress('ფოტოების ატვირთვა...');
        console.log('Uploading photos...');
        uploadedPhotos = await photoService.processPhotosForSaving(formData.photos, 'carappx');
      }
      
      let uploadedImages: string[] = [];
      if (formData.images && formData.images.length > 0) {
        setUploadProgress('სურათების ატვირთვა...');
        console.log('Uploading images...');
        uploadedImages = await photoService.processPhotosForSaving(formData.images, 'carappx');
      }
      
      setUploadProgress('მონაცემების შენახვა...');
      
      switch (currentStep.selectedType) {
        case 'dismantler':
          // Normalize phone number format
          let dismantlerNormalizedPhone = formData.phone;
          if (dismantlerNormalizedPhone && !dismantlerNormalizedPhone.startsWith('+995') && !dismantlerNormalizedPhone.startsWith('995')) {
            dismantlerNormalizedPhone = '+995' + dismantlerNormalizedPhone;
          }
          
          const dismantlerData: DismantlerData = {
            brand: formData.brand,
            model: formData.model,
            yearFrom: parseInt(formData.yearFrom),
            yearTo: parseInt(formData.yearTo),
            photos: uploadedPhotos,
            description: formData.description,
            location: formData.location,
            phone: dismantlerNormalizedPhone,
            name: formData.name,
          };
          console.log('Sending dismantler data:', dismantlerData);
          response = await addItemApi.createDismantler(dismantlerData);
          console.log('Dismantler response:', response);
          break;
          
        case 'part':
          // Normalize phone number format
          let normalizedPhone = formData.phone;
          if (normalizedPhone && !normalizedPhone.startsWith('+995') && !normalizedPhone.startsWith('995')) {
            normalizedPhone = '+995' + normalizedPhone;
          }
          
          const partData: PartData = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            condition: formData.condition,
            price: formData.price,
            images: uploadedImages || [],
            seller: formData.name, // Using name as seller
            location: formData.location,
            phone: normalizedPhone,
            name: formData.name,
            brand: formData.brand,
            model: formData.model,
            year: formData.year ? parseInt(formData.year) : 0,
            partNumber: formData.partNumber,
            warranty: formData.warranty,
            isNegotiable: formData.isNegotiable || false,
          };
          console.log('Sending part data:', partData);
          response = await addItemApi.createPart(partData);
          break;
          
        case 'store':
          // Normalize phone number format
          let storeNormalizedPhone = formData.phone;
          if (storeNormalizedPhone && !storeNormalizedPhone.startsWith('+995') && !storeNormalizedPhone.startsWith('995')) {
            storeNormalizedPhone = '+995' + storeNormalizedPhone;
          }
          
          const storeData: StoreData = {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            images: uploadedImages,
            location: formData.location,
            address: formData.address,
            phone: storeNormalizedPhone,
            name: formData.name,
            workingHours: formData.workingHours,
            // optional geo, if later added from map
            latitude: formData.latitude,
            longitude: formData.longitude,
          };
          console.log('Sending store data:', storeData);
          response = await addItemApi.createStore(storeData);
          break;
          
        case 'carwash':
          // Normalize phone number format
          let carwashNormalizedPhone = formData.phone;
          if (carwashNormalizedPhone && !carwashNormalizedPhone.startsWith('+995') && !carwashNormalizedPhone.startsWith('995')) {
            carwashNormalizedPhone = '+995' + carwashNormalizedPhone;
          }
          
          const carwashData = {
            name: formData.name,
            phone: carwashNormalizedPhone,
            category: formData.category,
            location: formData.location,
            address: formData.address,
            price: parseFloat(formData.price) || 0,
            rating: parseFloat(formData.rating) || 4.5,
            reviews: parseInt(formData.reviews) || 0,
            services: formData.services, // ძველი ველი - backward compatibility
            detailedServices: formData.detailedServices || [], // ახალი დეტალური სერვისები
            features: formData.features,
            workingHours: formData.workingHours, // ძველი ველი - backward compatibility
            timeSlotsConfig: formData.timeSlotsConfig || {
              workingDays: [],
              interval: 30,
              breakTimes: []
            }, // ახალი დროის სლოტების კონფიგურაცია
            realTimeStatus: formData.realTimeStatus || {
              isOpen: true,
              currentWaitTime: 10,
              currentQueue: 0,
              estimatedWaitTime: 10,
              lastStatusUpdate: Date.now()
            }, // რეალური დროის სტატუსი
            images: uploadedImages,
            description: formData.description,
            latitude: formData.latitude,
            longitude: formData.longitude,
            isOpen: true, // ძველი ველი - backward compatibility
            distance: 0, // Will be calculated on frontend
            ownerId: user?.id || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          console.log('Sending carwash data:', carwashData);
          
          // Create carwash in backend
          const createdCarwash = await carwashLocationApi.createLocation(carwashData);
          
          // Update user role to owner
          if (user?.role !== 'owner') {
            await updateUserRole('owner');
          }
          
          // Add to owned carwashes
          await addToOwnedCarwashes(createdCarwash.id);
          
          response = { 
            success: true, 
            message: 'სამრეცხაო წარმატებით დაემატა!',
            data: createdCarwash
          };
          break;
          
        default:
          throw new Error('უცნობი ტიპი');
      }

      if (response.success) {
        Alert.alert(
          'წარმატება!',
          response.message,
          [
            {
              text: 'კარგი',
              onPress: () => {
                onSave(currentStep.selectedType!, response);
                handleClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('შეცდომა', response.message);
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        'შეცდომა',
        'შენახვისას დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.'
      );
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  const renderTypeSelection = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="add" size={24} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>ახალი დამატება</Text>
            <Text style={styles.headerSubtitle}>აირჩიეთ რას ამატებთ</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.typeGrid}>
          <TouchableOpacity 
            style={styles.typeCard} 
            onPress={() => handleTypeSelect('dismantler')}
            activeOpacity={0.95}
          >
            <View style={styles.typeIconContainer}>
              <Ionicons name="build" size={32} color="#3B82F6" />
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>დაშლილების განცხადება</Text>
              <Text style={styles.typeDescription}>ავტომობილის დაშლა და ნაწილების გაყიდვა</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.typeCard} 
            onPress={() => handleTypeSelect('part')}
            activeOpacity={0.95}
          >
            <View style={styles.typeIconContainer}>
              <Ionicons name="settings" size={32} color="#3B82F6" />
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>ნაწილი</Text>
              <Text style={styles.typeDescription}>ავტონაწილის გაყიდვა ან შეძენა</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.typeCard} 
            onPress={() => handleTypeSelect('store')}
            activeOpacity={0.95}
          >
            <View style={styles.typeIconContainer}>
              <Ionicons name="storefront" size={32} color="#3B82F6" />
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>მაღაზია</Text>
              <Text style={styles.typeDescription}>ავტონაწილების მაღაზიის რეგისტრაცია</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.typeCard} 
            onPress={() => handleTypeSelect('carwash')}
            activeOpacity={0.95}
          >
            <View style={styles.typeIconContainer}>
              <Ionicons name="car" size={32} color="#3B82F6" />
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>სამრეცხაო</Text>
              <Text style={styles.typeDescription}>სამრეცხაოს ლოკაციის დამატება</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  const getFormConfig = () => {
    // Extract brands from carData
    const carBrands = Object.keys(carData.brands);
    
    // Extract models based on selected brand
    const getModelsForBrand = (brand: string) => {
      if (!brand || !(carData.brands as any)[brand]) return [];
      return (carData.brands as any)[brand].models || [];
    };
    
    const selectedBrand = formData.brand;
    const carModels = selectedBrand ? getModelsForBrand(selectedBrand) : [];
    
    switch (currentStep.selectedType) {
      case 'dismantler':
        return {
          title: 'დაშლილების განცხადება',
          icon: 'build',
          fields: [
              { key: 'name', label: 'გამყიდველის სახელი', type: 'text', required: true, placeholder: 'მაგ. ნიკა მელაძე' },
            { key: 'brand', label: 'ბრენდი', type: 'select', required: true, options: carBrands },
            { key: 'model', label: 'მოდელი', type: 'select', required: true, options: carModels, disabled: !selectedBrand },
            { key: 'yearFrom', label: 'წლიდან', type: 'text', required: true, placeholder: 'მაგ. 2015' },
            { key: 'yearTo', label: 'წლამდე', type: 'text', required: true, placeholder: 'მაგ. 2020' },
            { key: 'photos', label: 'ფოტოები', type: 'photo', required: false },
            { key: 'description', label: 'აღწერა', type: 'textarea', required: true, placeholder: 'მანქანის მდგომარეობა, რა ნაწილები გაყიდვაშია...' },
            { key: 'location', label: 'მისამართი', type: 'location', required: true, placeholder: 'ქალაქი, რაიონი' },
            { key: 'phone', label: 'ტელეფონის ნომერი', type: 'phone', required: true, placeholder: '+995 XXX XXX XXX' },
          ]
        };
      case 'part':
        return {
          title: 'ნაწილის დამატება',
          icon: 'settings',
          fields: [
            { key: 'name', label: 'გამყიდველის სახელი', type: 'text', required: true, placeholder: 'მაგ. ნიკა მელაძე' },
            { key: 'phone', label: 'ტელეფონის ნომერი', type: 'phone', required: true, placeholder: '+995 XXX XXX XXX' },
            { key: 'brand', label: 'მანქანის ბრენდი', type: 'select', required: true, options: carBrands },
            { key: 'model', label: 'მანქანის მოდელი', type: 'select', required: true, options: carModels, disabled: !selectedBrand },
            { key: 'year', label: 'მანქანის წელი', type: 'text', required: true, placeholder: 'მაგ. 2018' },
            { key: 'title', label: 'ნაწილის დასახელება', type: 'text', required: true, placeholder: 'მაგ. წინა ფარა, ძრავა, საბურავი' },
            { key: 'category', label: 'კატეგორია', type: 'select', required: true, options: ['ძრავა', 'ტრანსმისია', 'ფარები', 'საბურავები', 'ბლოკ-ფარები', 'ინტერიერი', 'ელექტრონიკა', 'სხვა'] },
            { key: 'condition', label: 'მდგომარეობა', type: 'select', required: true, options: ['ახალი', 'ძალიან კარგი', 'კარგი', 'დამაკმაყოფილებელი'] },
            { key: 'price', label: 'ფასი (ლარი)', type: 'text', required: true, placeholder: 'მაგ. 150' },
            { key: 'images', label: 'ფოტოები', type: 'photo', required: false },
            { key: 'location', label: 'მისამართი (ქალაქი)', type: 'select', required: true, options: ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'ფოთი', 'ახალქალაქი', 'ოზურგეთი', 'ტყიბული', 'სხვა'] },
            { key: 'description', label: 'აღწერა', type: 'textarea', required: true, placeholder: 'ნაწილის დეტალური აღწერა, მდგომარეობა, ფასდაკლების შესაძლებლობა...' },
          ]
        };
      case 'store':
        return {
          title: 'მაღაზიის რეგისტრაცია',
          icon: 'storefront',
          fields: [
            { key: 'name', label: 'კონტაქტი (სახელი)', type: 'text', required: true, placeholder: 'მაგ. ნიკა მელაძე' },
            { key: 'phone', label: 'ტელეფონის ნომერი', type: 'phone', required: true, placeholder: '+995 XXX XXX XXX' },
            { key: 'title', label: 'მაღაზიის სახელი', type: 'text', required: true, placeholder: 'მაგ. AutoParts.ge' },
            { key: 'type', label: 'მაღაზიის ტიპი', type: 'select', required: true, options: ['ავტონაწილები', 'სამართ-დასახურებელი', 'რემონტი', 'სხვა'] },
            { key: 'images', label: 'ფოტოები', type: 'photo', required: false },
            { key: 'location', label: 'ქალაქი', type: 'select', required: true, options: ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'ფოთი', 'ახალქალაქი', 'ოზურგეთი', 'ტყიბული', 'სხვა'] },
            { key: 'address', label: 'ზუსტი მისამართი', type: 'location', required: true, placeholder: 'ქუჩა, ნომერი, რაიონი' },
            { key: 'description', label: 'აღწერა', type: 'textarea', required: true, placeholder: 'მაღაზიის აღწერა, მიწოდებული პროდუქტები, სერვისები...' },
            { key: 'workingHours', label: 'სამუშაო საათები', type: 'text', required: false, placeholder: 'მაგ. 09:00-19:00 (ორშ-პარ)' },
          ]
        };
      case 'carwash':
        return {
          title: 'სამრეცხაოს დამატება',
          icon: 'car',
          fields: [
            { key: 'name', label: 'სამრეცხაოს სახელი', type: 'text', required: true, placeholder: 'მაგ. "ზედა" სამრეცხაო' },
            { key: 'phone', label: 'ტელეფონის ნომერი', type: 'phone', required: true, placeholder: '+995 XXX XXX XXX' },
            { key: 'category', label: 'კატეგორია', type: 'select', required: true, options: ['Premium', 'Express', 'Luxury', 'Standard', 'Professional'] },
            { key: 'location', label: 'ქალაქი', type: 'select', required: true, options: ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'ფოთი', 'ახალქალაქი', 'ოზურგეთი', 'ტყიბული', 'სხვა'] },
            { key: 'address', label: 'ზუსტი მისამართი', type: 'location', required: true, placeholder: 'ქუჩა, ნომერი, რაიონი' },
            { key: 'price', label: 'ფასი (ლარი)', type: 'text', required: true, placeholder: 'მაგ. 25' },
            { key: 'rating', label: 'რეიტინგი', type: 'select', required: true, options: ['4.5', '4.6', '4.7', '4.8', '4.9', '5.0'] },
            { key: 'reviews', label: 'რევიუების რაოდენობა', type: 'text', required: true, placeholder: 'მაგ. 150' },
            { key: 'services', label: 'სერვისები', type: 'textarea', required: true, placeholder: 'შიდა/გარე რეცხვა, ზედაპირის დაცვა, ძრავის რეცხვა...' },
            { key: 'detailedServices', label: 'დეტალური სერვისები', type: 'services-config', required: false },
            { key: 'timeSlotsConfig', label: 'დროის სლოტების კონფიგურაცია', type: 'time-slots-config', required: false },
            { key: 'realTimeStatus', label: 'რეალური დროის სტატუსი', type: 'real-time-status-config', required: false },
            { key: 'features', label: 'ფუნქციები', type: 'textarea', required: false, placeholder: 'WiFi, ყავა, ლოჯი, ბავშვთა კუთხე...' },
            { key: 'workingHours', label: 'სამუშაო საათები', type: 'text', required: true, placeholder: 'მაგ. 08:00 - 20:00' },
            { key: 'images', label: 'ფოტოები', type: 'photo', required: false },
            { key: 'description', label: 'აღწერა', type: 'textarea', required: true, placeholder: 'სამრეცხაოს დეტალური აღწერა, სპეციალიზაცია, უპირატესობები...' },
          ]
        };
      default:
        return { title: '', icon: 'add', fields: [] };
    }
  };

  const renderForm = () => {
    const config = getFormConfig();

    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {!defaultType && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#3B82F6" />
              </TouchableOpacity>
            )}
            <View style={styles.iconBadge}>
              <Ionicons name={config.icon as any} size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.headerTitle}>{config.title}</Text>
              <Text style={styles.headerSubtitle}>შეავსეთ ინფორმაცია</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {config.fields.map((field, index) => (
              <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>
                
                {field.type === 'select' ? (
                  <TouchableOpacity 
                    style={[styles.selectInput, field.disabled && styles.selectInputDisabled]}
                    onPress={() => {
                      if (!field.disabled) {
                        setShowDropdown(field.key);
                      }
                    }}
                    disabled={field.disabled}
                  >
                    <Text style={[
                      styles.selectText, 
                      !formData[field.key] && styles.placeholder,
                      field.disabled && styles.selectTextDisabled
                    ]}>
                      {field.disabled && field.key === 'model' && !formData.brand ? 
                        'ჯერ აირჩიეთ ბრენდი' :
                        formData[field.key] || field.placeholder || `აირჩიეთ ${field.label.toLowerCase()}`
                      }
                    </Text>
                    <Ionicons 
                      name="chevron-down" 
                      size={20} 
                      color={field.disabled ? "#D1D5DB" : "#6B7280"} 
                    />
                  </TouchableOpacity>
                ) : field.type === 'photo' ? (
                  <PhotoPicker
                    onPhotosSelected={(photos) => {
                      setFormData({ ...formData, [field.key]: photos });
                    }}
                    maxPhotos={5}
                    folder="carappx"
                    initialPhotos={formData[field.key] || []}
                  />
                ) : field.type === 'services-config' ? (
                  <ServicesConfig
                    services={formData[field.key] || []}
                    onServicesChange={(services) => {
                      setFormData({ ...formData, [field.key]: services });
                    }}
                  />
                ) : field.type === 'time-slots-config' ? (
                  <TimeSlotsConfig
                    config={formData[field.key] || {
                      workingDays: [],
                      interval: 30,
                      breakTimes: []
                    }}
                    onConfigChange={(config) => {
                      setFormData({ ...formData, [field.key]: config });
                    }}
                  />
                ) : field.type === 'real-time-status-config' ? (
                  <RealTimeStatusConfig
                    status={formData[field.key] || {
                      isOpen: true,
                      currentWaitTime: 10,
                      currentQueue: 0,
                      estimatedWaitTime: 10,
                      lastStatusUpdate: Date.now()
                    }}
                    onStatusChange={(status) => {
                      setFormData({ ...formData, [field.key]: status });
                    }}
                  />
                ) : field.type === 'location' ? (
                  <View style={styles.locationContainer}>
                    <TextInput
                      style={styles.input}
                      value={formData[field.key] || ''}
                      onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                      placeholder={field.placeholder || `შეიყვანეთ ${field.label.toLowerCase()}`}
                    />
                    <TouchableOpacity 
                      style={styles.mapButton}
                      onPress={() => { setHideModal(true); router.push('/map?picker=1' as any); }}
                    >
                      <Ionicons name="location" size={20} color="#3B82F6" />
                      <Text style={styles.mapButtonText}>რუკა</Text>
                    </TouchableOpacity>
                  </View>
                ) : field.type === 'textarea' ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData[field.key] || ''}
                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                    placeholder={field.placeholder || `შეიყვანეთ ${field.label.toLowerCase()}`}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                ) : (
                  <TextInput
                    style={styles.input}
                    value={formData[field.key] || ''}
                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                    placeholder={field.placeholder || `შეიყვანეთ ${field.label.toLowerCase()}`}
                    keyboardType={field.type === 'phone' ? 'phone-pad' : 'default'}
                  />
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>შენახვა...</Text>
              </>
            ) : (
              <>
                <Text style={styles.saveBtnText}>შენახვა</Text>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal */}
        {showDropdown && (() => {
          const config = getFormConfig();
          const field = config.fields.find(f => f.key === showDropdown);
          if (!field || !field.options) return null;

          return (
            <Modal visible={true} transparent animationType="fade">
              <TouchableOpacity 
                style={styles.dropdownOverlay}
                activeOpacity={1}
                onPress={() => setShowDropdown(null)}
              >
                <View style={styles.dropdownModal}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>აირჩიეთ {field.label}</Text>
                    <TouchableOpacity onPress={() => setShowDropdown(null)}>
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                    {field.options.map((option: any, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dropdownOption,
                          formData[field.key] === option && styles.dropdownOptionSelected
                        ]}
                        onPress={() => {
                          const newFormData = { ...formData, [field.key]: option };
                          // If brand is changed, clear the model
                          if (field.key === 'brand' && formData.model) {
                            newFormData.model = '';
                          }
                          setFormData(newFormData);
                          setShowDropdown(null);
                        }}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          formData[field.key] === option && styles.dropdownOptionTextSelected
                        ]}>
                          {option}
                        </Text>
                        {formData[field.key] === option && (
                          <Ionicons name="checkmark" size={20} color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          );
        })()}

        {/* Map Modal */}
        {/* Subscribe to map picker selections */}
      </>
    );
  };

  return (
    <Modal visible={visible && !hideModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {currentStep.step === 'type-selection' ? renderTypeSelection() : renderForm()}
        
        {/* Upload Progress Overlay */}
        {saving && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadModal}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.uploadTitle}>ინფორმაციის შენახვა</Text>
              <Text style={styles.uploadProgress}>{uploadProgress}</Text>
              <Text style={styles.uploadNote}>გთხოვთ მოითმინოთ...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Type Selection
  typeGrid: {
    paddingVertical: 20,
    gap: 16,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Form
  formContainer: {
    paddingVertical: 20,
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
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
  selectInputDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  selectTextDisabled: {
    color: '#9CA3AF',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  photoInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  photoContent: {
    alignItems: 'center',
    gap: 8,
  },
  photoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  photoSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationContainer: {
    gap: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Dropdown Modal
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Map Modal
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mapConfirmBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  mapButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  mapLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  mapLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  mapSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  mapSearchText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Bottom Actions
  bottomActions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  
  // Upload Progress Overlay
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  uploadModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadProgress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AddModal;
