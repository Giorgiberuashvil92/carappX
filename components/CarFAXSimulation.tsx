import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface CarFAXSimulationProps {
  vinCode: string;
  onComplete: (carData: any) => void;
  onClose: () => void;
}

export default function CarFAXSimulation({ vinCode: propVinCode, onComplete, onClose }: CarFAXSimulationProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    'VIN კოდის შემოწმება...',
    'CarFAX ბაზაში ძებნა...',
    'მოხსენების მომზადება...',
    'ფაილის გენერაცია...',
    'წარმატებით დასრულდა!'
  ];

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
    ]).start();
  }, []);

  useEffect(() => {
    if (isSearching) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotate animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Step progression
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(stepInterval);
            setTimeout(() => {
              const mockCarData = generateMockCarData(propVinCode);
              onComplete(mockCarData);
            }, 1000);
            return prev;
          }
        });
      }, 2000);

      return () => clearInterval(stepInterval);
    }
  }, [isSearching]);


  const generateMockCarData = (vin: string) => {
    const makes = ['BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Ford', 'Chevrolet'];
    const models = ['X5', 'E-Class', 'A4', 'Camry', 'Civic', 'F-150', 'Silverado'];
    const years = [2020, 2021, 2022, 2023, 2024];
    
    const make = makes[Math.floor(Math.random() * makes.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const year = years[Math.floor(Math.random() * years.length)];
    
    return {
      vin: vin,
      make: make,
      model: model,
      year: year,
      mileage: Math.floor(Math.random() * 100000) + 10000,
      accidents: Math.floor(Math.random() * 3),
      owners: Math.floor(Math.random() * 3) + 1,
      serviceRecords: Math.floor(Math.random() * 15) + 5,
      titleStatus: 'Clean',
      lastServiceDate: '2024-01-15',
      reportId: 'CF' + Date.now(),
    };
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" translucent />
      
      <SafeAreaView style={styles.safeArea}>
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CarFAX მოხსენება</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.ScrollView 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Auto start searching */}
          {(() => {
            if (!isSearching) {
              // Auto start searching after component mounts
              setTimeout(() => setIsSearching(true), 500);
              return null;
            }
            return (
            <>
              {/* Searching Animation */}
              <View style={styles.searchingSection}>
                <Animated.View 
                  style={[
                    styles.searchingIcon,
                    {
                      transform: [
                        { scale: pulseAnim },
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
                  <Ionicons name="search" size={48} color="#8B5CF6" />
                </Animated.View>
                
                <Text style={styles.searchingTitle}>მოხსენების ძებნა...</Text>
                <Text style={styles.searchingSubtitle}>
                  VIN: {propVinCode.slice(0, 8)}...{propVinCode.slice(-4)}
                </Text>
              </View>

              {/* Progress Steps */}
              <View style={styles.stepsSection}>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={[
                      styles.stepIcon,
                      index <= currentStep && styles.stepIconActive
                    ]}>
                      {index < currentStep ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : index === currentStep ? (
                        <Animated.View
                          style={{
                            transform: [
                              {
                                rotate: rotateAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                })
                              }
                            ]
                          }}
                        >
                          <Ionicons name="sync" size={16} color="#FFFFFF" />
                        </Animated.View>
                      ) : (
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                      )}
                    </View>
                    <Text style={[
                      styles.stepText,
                      index <= currentStep && styles.stepTextActive
                    ]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </>
            );
          })()}
          <View style={{ height: 30 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F0F0F',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'transparent',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  // Searching Styles
  searchingSection: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  searchingSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  stepsSection: {
    marginTop: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepIconActive: {
    backgroundColor: '#8B5CF6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Inter',
  },
  stepText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    flex: 1,
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
});
