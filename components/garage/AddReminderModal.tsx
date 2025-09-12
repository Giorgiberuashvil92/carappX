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

interface ReminderData {
  title: string;
  description: string;
  carId: string;
  reminderDate: string;
  reminderTime: string;
  type: string;
  priority: string;
}

interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onAddReminder: (reminderData: ReminderData) => void;
  cars: Array<{ id: string; make: string; model: string; plateNumber: string }>;
}

const REMINDER_TYPES = [
  { id: 'service', name: 'სერვისი', icon: 'build-outline', color: '#111827', accent: '#3B82F6' },
  { id: 'oil', name: 'ზეთის შეცვლა', icon: 'water-outline', color: '#111827', accent: '#10B981' },
  { id: 'tires', name: 'ტირეების შემოწმება', icon: 'ellipse-outline', color: '#111827', accent: '#8B5CF6' },
  { id: 'battery', name: 'ბატარეის შემოწმება', icon: 'battery-half-outline', color: '#111827', accent: '#F59E0B' },
  { id: 'insurance', name: 'დაზღვევა', icon: 'shield-outline', color: '#111827', accent: '#EF4444' },
  { id: 'inspection', name: 'ტექდათვალიერება', icon: 'search-outline', color: '#111827', accent: '#06B6D4' },
];

const PRIORITY_LEVELS = [
  { id: 'low', name: 'დაბალი', color: '#10B981', icon: 'arrow-down' },
  { id: 'medium', name: 'საშუალო', color: '#F59E0B', icon: 'remove' },
  { id: 'high', name: 'მაღალი', color: '#EF4444', icon: 'arrow-up' },
];

export default function AddReminderModal({ visible, onClose, onAddReminder, cars }: AddReminderModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [reminderData, setReminderData] = useState<ReminderData>({
    title: '',
    description: '',
    carId: '',
    reminderDate: '',
    reminderTime: '',
    type: '',
    priority: 'medium',
  });
  
  // DateTimePicker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Advanced Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;

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
      setCurrentStep(1);
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
        Animated.timing(blurAnim, {
          toValue: 1,
          duration: 600,
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
        Animated.timing(blurAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / 4,
      duration: 600,
      useNativeDriver: false,
    }).start();

    // Rotate animation for step change
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleInputChange = (field: keyof ReminderData, value: string) => {
    setReminderData(prev => ({ ...prev, [field]: value }));
    
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleInputChange('reminderDate', formattedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
      const formattedTime = selectedTime.toTimeString().slice(0, 5);
      handleInputChange('reminderTime', formattedTime);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!reminderData.title || !reminderData.carId || !reminderData.reminderDate || !reminderData.type) {
      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    onAddReminder(reminderData);
    handleClose();
  };

  const handleClose = () => {
    setReminderData({
      title: '',
      description: '',
      carId: '',
      reminderDate: '',
      reminderTime: '',
      type: '',
      priority: 'medium',
    });
    setCurrentStep(1);
    onClose();
  };

  const getTypeDescription = (typeId: string) => {
    switch (typeId) {
      case 'service': return 'რეგულარული მოვლა';
      case 'oil': return 'ძრავის ზეთის შეცვლა';
      case 'tires': return 'ტირეების მდგომარეობა';
      case 'battery': return 'ბატარეის ტესტირება';
      case 'insurance': return 'დაზღვევის განახლება';
      case 'inspection': return 'ტექნიკური დათვალიერება';
      default: return 'შეხსენების ტიპი';
    }
  };

  const getPriorityDescription = (priorityId: string) => {
    switch (priorityId) {
      case 'low': return 'ჩვეულებრივი მნიშვნელობა';
      case 'medium': return 'საშუალო მნიშვნელობა';
      case 'high': return 'მაღალი მნიშვნელობა';
      default: return 'პრიორიტეტი';
    }
  };

  const renderStepIndicator = () => (
    <Animated.View 
      style={[
        styles.stepIndicator,
        {
          opacity: fadeAnim,
          transform: [
            { 
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }
          ]
        }
      ]}
    >
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepDot,
            currentStep >= step && styles.stepDotActive
          ]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </Animated.View>
  );

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Animated.View 
          style={[
            styles.stepIconContainer,
            {
              transform: [
                { scale: scaleAnim },
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }
              ]
            }
          ]}
        >
          <View style={styles.stepIconWrapper}>
            <Ionicons name="car-sport" size={32} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Text style={styles.stepTitle}>აირჩიეთ მანქანა</Text>
        <Text style={styles.stepSubtitle}>რომელ მანქანასთან არის დაკავშირებული შეხსენება?</Text>
      </View>

      <View style={styles.carsContainer}>
        {cars.map((car, index) => (
          <Animated.View
            key={car.id}
            style={[
              styles.carItem,
              reminderData.carId === car.id && styles.carItemSelected,
              {
                transform: [
                  { scale: reminderData.carId === car.id ? cardScaleAnim : 1 }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.carItemTouchable}
              onPress={() => handleInputChange('carId', car.id)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.carItemContent,
                reminderData.carId === car.id && styles.carItemContentSelected
              ]}>
                {/* Car Image Placeholder */}
                <View style={[
                  styles.carImageContainer,
                  { backgroundColor: reminderData.carId === car.id ? 'rgba(255,255,255,0.1)' : 'rgba(17, 24, 39, 0.05)' }
                ]}>
                  <Ionicons 
                    name="car-sport" 
                    size={32} 
                    color={reminderData.carId === car.id ? "#FFFFFF" : "#111827"} 
                  />
                </View>
                
                {/* Car Info */}
                <View style={styles.carInfo}>
                  <Text style={[
                    styles.carMake,
                    { color: reminderData.carId === car.id ? "#FFFFFF" : "#111827" }
                  ]}>
                    {car.make}
                  </Text>
                  <Text style={[
                    styles.carModel,
                    { color: reminderData.carId === car.id ? "rgba(255,255,255,0.9)" : "#6B7280" }
                  ]}>
                    {car.model}
                  </Text>
                  <View style={styles.carDetails}>
                    <View style={[
                      styles.carDetailBadge,
                      { backgroundColor: reminderData.carId === car.id ? 'rgba(255,255,255,0.2)' : 'rgba(17, 24, 39, 0.1)' }
                    ]}>
                      <Ionicons 
                        name="card" 
                        size={12} 
                        color={reminderData.carId === car.id ? "#FFFFFF" : "#6B7280"} 
                      />
                      <Text style={[
                        styles.carPlate,
                        { color: reminderData.carId === car.id ? "#FFFFFF" : "#6B7280" }
                      ]}>
                        {car.plateNumber}
                      </Text>
                    </View>
                    <View style={[
                      styles.carDetailBadge,
                      { backgroundColor: reminderData.carId === car.id ? 'rgba(255,255,255,0.2)' : 'rgba(17, 24, 39, 0.1)' }
                    ]}>
                      <Ionicons 
                        name="calendar" 
                        size={12} 
                        color={reminderData.carId === car.id ? "#FFFFFF" : "#6B7280"} 
                      />
                      <Text style={[
                        styles.carYear,
                        { color: reminderData.carId === car.id ? "#FFFFFF" : "#6B7280" }
                      ]}>
                        2020
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Selection Indicator */}
                <View style={[
                  styles.selectionIndicator,
                  reminderData.carId === car.id && styles.selectionIndicatorActive
                ]}>
                  {reminderData.carId === car.id ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <View style={styles.selectionDot} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Animated.View 
          style={[
            styles.stepIconContainer,
            {
              transform: [
                { scale: scaleAnim },
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }
              ]
            }
          ]}
        >
          <View style={styles.stepIconWrapper}>
            <Ionicons name="settings" size={32} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Text style={styles.stepTitle}>შეხსენების ტიპი</Text>
        <Text style={styles.stepSubtitle}>რა სახის შეხსენება გინდათ?</Text>
      </View>

      <View style={styles.typesContainer}>
        {REMINDER_TYPES.map((type, index) => (
          <Animated.View
            key={type.id}
            style={[
              styles.typeItem,
              reminderData.type === type.id && styles.typeItemSelected,
              {
                transform: [
                  { scale: reminderData.type === type.id ? cardScaleAnim : 1 }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.typeItemTouchable}
              onPress={() => handleInputChange('type', type.id)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.typeItemContent,
                reminderData.type === type.id && styles.typeItemContentSelected
              ]}>
                {/* Icon Container with Accent Color */}
                <View style={[
                  styles.typeIconContainer,
                  { 
                    backgroundColor: reminderData.type === type.id ? type.accent : 'rgba(17, 24, 39, 0.05)',
                    borderColor: type.accent
                  }
                ]}>
                  <Ionicons 
                    name={type.icon as any} 
                    size={24} 
                    color={reminderData.type === type.id ? "#FFFFFF" : type.accent} 
                  />
                </View>
                
                {/* Type Info */}
                <View style={styles.typeInfo}>
                  <Text style={[
                    styles.typeTitle,
                    { color: reminderData.type === type.id ? "#FFFFFF" : "#111827" }
                  ]}>
                    {type.name}
                  </Text>
                  <Text style={[
                    styles.typeDescription,
                    { color: reminderData.type === type.id ? "rgba(255,255,255,0.8)" : "#6B7280" }
                  ]}>
                    {getTypeDescription(type.id)}
                  </Text>
                </View>
                
                {/* Selection Indicator */}
                <View style={[
                  styles.typeSelectionIndicator,
                  reminderData.type === type.id && styles.typeSelectionIndicatorActive
                ]}>
                  {reminderData.type === type.id ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <View style={styles.typeSelectionDot} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Animated.View 
          style={[
            styles.stepIconContainer,
            {
              transform: [
                { scale: scaleAnim },
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }
              ]
            }
          ]}
        >
          <View style={styles.stepIconWrapper}>
            <Ionicons name="create" size={32} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Text style={styles.stepTitle}>შეხსენების დეტალები</Text>
        <Text style={styles.stepSubtitle}>შეავსეთ შეხსენების ინფორმაცია</Text>
      </View>

      <View style={styles.detailsForm}>
        {/* Title Section */}
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="text" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>სათაური</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>*</Text>
            </View>
          </View>
          <View style={styles.enhancedInputContainer}>
            <TextInput
              style={styles.enhancedTextInput}
              placeholder="მაგ: ზეთის შეცვლა"
              placeholderTextColor="rgba(17, 24, 39, 0.5)"
              value={reminderData.title}
              onChangeText={(value) => handleInputChange('title', value)}
            />
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>აღწერა</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>ოფციონალური</Text>
            </View>
          </View>
          <View style={styles.enhancedInputContainer}>
            <TextInput
              style={[styles.enhancedTextInput, styles.enhancedTextArea]}
              placeholder="დამატებითი ინფორმაცია შეხსენების შესახებ..."
              placeholderTextColor="rgba(17, 24, 39, 0.5)"
              value={reminderData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Priority Section */}
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="flag" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>პრიორიტეტი</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>ოფციონალური</Text>
            </View>
          </View>
          <View style={styles.priorityContainer}>
            {PRIORITY_LEVELS.map((priority) => (
              <Animated.View
                key={priority.id}
                style={[
                  styles.priorityItem,
                  reminderData.priority === priority.id && styles.priorityItemSelected,
                  {
                    transform: [
                      { scale: reminderData.priority === priority.id ? cardScaleAnim : 1 }
                    ]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.priorityItemTouchable}
                  onPress={() => handleInputChange('priority', priority.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.priorityItemContent,
                    reminderData.priority === priority.id && styles.priorityItemContentSelected
                  ]}>
                    <View style={[
                      styles.priorityIconContainer,
                      { backgroundColor: reminderData.priority === priority.id ? 'rgba(255,255,255,0.2)' : priority.color + '20' }
                    ]}>
                      <Ionicons 
                        name={priority.icon as any} 
                        size={20} 
                        color={reminderData.priority === priority.id ? "#FFFFFF" : priority.color} 
                      />
                    </View>
                    <View style={styles.priorityInfo}>
                      <Text style={[
                        styles.priorityTitle,
                        { color: reminderData.priority === priority.id ? "#FFFFFF" : "#111827" }
                      ]}>
                        {priority.name}
                      </Text>
                      <Text style={[
                        styles.priorityDescription,
                        { color: reminderData.priority === priority.id ? "rgba(255,255,255,0.8)" : "#6B7280" }
                      ]}>
                        {getPriorityDescription(priority.id)}
                      </Text>
                    </View>
                    <View style={[
                      styles.prioritySelectionIndicator,
                      reminderData.priority === priority.id && styles.prioritySelectionIndicatorActive
                    ]}>
                      {reminderData.priority === priority.id ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <View style={styles.prioritySelectionDot} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Animated.View 
          style={[
            styles.stepIconContainer,
            {
              transform: [
                { scale: scaleAnim },
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }
              ]
            }
          ]}
        >
          <View style={styles.stepIconWrapper}>
            <Ionicons name="calendar" size={32} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Text style={styles.stepTitle}>თარიღი და დრო</Text>
        <Text style={styles.stepSubtitle}>როდის გსურთ შეხსენების მიღება?</Text>
      </View>

      <View style={styles.dateTimeForm}>
        {/* Date Section */}
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>თარიღი</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>*</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.enhancedInputContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dateTimeInput}>
              <Text style={[
                styles.dateTimeText,
                !reminderData.reminderDate && styles.placeholderText
              ]}>
                {reminderData.reminderDate || 'აირჩიეთ თარიღი'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Time Section */}
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="time" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>დრო</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>ოფციონალური</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.enhancedInputContainer}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dateTimeInput}>
              <Text style={[
                styles.dateTimeText,
                !reminderData.reminderTime && styles.placeholderText
              ]}>
                {reminderData.reminderTime || 'აირჩიეთ დრო'}
              </Text>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>შეხსენების შეჯამება</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>მანქანა:</Text>
            <Text style={styles.summaryValue}>
              {cars.find(car => car.id === reminderData.carId)?.make} {cars.find(car => car.id === reminderData.carId)?.model}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>ტიპი:</Text>
            <Text style={styles.summaryValue}>
              {REMINDER_TYPES.find(type => type.id === reminderData.type)?.name}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>სათაური:</Text>
            <Text style={styles.summaryValue}>{reminderData.title}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>თარიღი:</Text>
            <Text style={styles.summaryValue}>{reminderData.reminderDate}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

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
                <Text style={styles.modalTitle}>ახალი შეხსენება</Text>
                <Text style={styles.modalSubtitle}>ნაბიჯი {currentStep} / 4</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: progressAnim }
                  ]} 
                />
              </View>
            </View>

            {/* Step Indicator */}
            {renderStepIndicator()}
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.contentContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderCurrentStep()}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigation}>
            <View style={styles.navigationContainer}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                  <Ionicons name="chevron-back" size={20} color="#6B7280" />
                  <Text style={styles.backButtonText}>უკან</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.nextButtonContainer}>
                {currentStep < 4 ? (
                  <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                    <Text style={styles.nextButtonText}>შემდეგი</Text>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>დამატება</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Smart Date Time Picker */}
      {showDatePicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>📅 როდის გსურთ შეხსენება?</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.optionsGrid}>
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleInputChange('reminderDate', tomorrow.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="calendar" size={24} color="#10B981" />
                </View>
                <Text style={styles.optionTitle}>ხვალ</Text>
                <Text style={styles.optionSubtitle}>ერთი დღე</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  handleInputChange('reminderDate', nextWeek.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="calendar" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.optionTitle}>შემდეგ კვირას</Text>
                <Text style={styles.optionSubtitle}>7 დღე</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  handleInputChange('reminderDate', nextMonth.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="calendar" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.optionTitle}>შემდეგ თვეს</Text>
                <Text style={styles.optionSubtitle}>1 თვე</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  const next3Months = new Date();
                  next3Months.setMonth(next3Months.getMonth() + 3);
                  handleInputChange('reminderDate', next3Months.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="calendar" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.optionTitle}>3 თვეში</Text>
                <Text style={styles.optionSubtitle}>3 თვე</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {showTimePicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>⏰ რა დროს გსურთ შეხსენება?</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.optionsGrid}>
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  handleInputChange('reminderTime', '08:00');
                  setShowTimePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="sunny" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.optionTitle}>🌅 დილა</Text>
                <Text style={styles.optionSubtitle}>8:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  handleInputChange('reminderTime', '09:00');
                  setShowTimePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="sunny" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.optionTitle}>🌅 დილა</Text>
                <Text style={styles.optionSubtitle}>9:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  handleInputChange('reminderTime', '12:00');
                  setShowTimePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="sunny" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.optionTitle}>☀️ შუადღე</Text>
                <Text style={styles.optionSubtitle}>12:00</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => {
                  handleInputChange('reminderTime', '18:00');
                  setShowTimePicker(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="moon" size={24} color="#6366F1" />
                </View>
                <Text style={styles.optionTitle}>🌆 საღამო</Text>
                <Text style={styles.optionSubtitle}>18:00</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 3,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#111827',
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#111827',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stepContent: {
    flex: 1,
    paddingTop: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIconContainer: {
    marginBottom: 12,
  },
  stepIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  carsContainer: {
    gap: 16,
  },
  carItem: {
    marginBottom: 6,
  },
  carItemSelected: {
    transform: [{ scale: 1.02 }],
  },
  carItemTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  carItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  carItemContentSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  carImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  carInfo: {
    flex: 1,
    gap: 4,
  },
  carMake: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
  },
  carModel: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    marginBottom: 6,
  },
  carDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  carDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  carPlate: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  carYear: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorActive: {
    backgroundColor: '#10B981',
  },
  selectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  typesContainer: {
    gap: 16,
  },
  typeItem: {
    marginBottom: 6,
  },
  typeItemSelected: {
    transform: [{ scale: 1.02 }],
  },
  typeItemTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  typeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  typeItemContentSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  typeInfo: {
    flex: 1,
    gap: 4,
  },
  typeTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
  },
  typeDescription: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
  },
  typeSelectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectionIndicatorActive: {
    backgroundColor: '#10B981',
  },
  typeSelectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
  },
  detailsForm: {
    gap: 32,
  },
  detailSection: {
    gap: 16,
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
  enhancedTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    minHeight: 56,
  },
  dateTimeText: {
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: 'rgba(17, 24, 39, 0.5)',
  },
  priorityContainer: {
    gap: 12,
  },
  priorityItem: {
    marginBottom: 6,
  },
  priorityItemSelected: {
    transform: [{ scale: 1.02 }],
  },
  priorityItemTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  priorityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  priorityItemContentSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  priorityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  priorityInfo: {
    flex: 1,
    gap: 2,
  },
  priorityTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
  },
  priorityDescription: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
  },
  prioritySelectionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioritySelectionIndicatorActive: {
    backgroundColor: '#10B981',
  },
  prioritySelectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
  },
  dateTimeForm: {
    gap: 24,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#6B7280',
  },
  nextButtonContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
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
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    minWidth: width * 0.8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  pickerContent: {
    gap: 16,
  },
  pickerInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  pickerButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});