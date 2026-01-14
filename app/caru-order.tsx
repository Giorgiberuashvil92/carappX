import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Image,
  ImageBackground,
  StatusBar,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCars } from '@/contexts/CarContext';
import { useUser } from '@/contexts/UserContext';
import { marteApi } from '@/services/marteApi';

const { width, height } = Dimensions.get('window');

const ASSISTANT_LEVELS = [
  {
    id: 'standard',
    title: 'STANDARD',
    icon: 'construct-outline',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    price: '20₾',
    time: '15-30 წუთი',
    description: 'ზოგადი პრობლემები - ბატარეა, საბურავები',
    features: ['ძირითადი ხელსაწყოები', 'სწრაფი სერვისი', 'ზოგადი რეპარატი']
  },
  {
    id: 'premium',
    title: 'PREMIUM',
    icon: 'star-outline',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'],
    price: '30₾',
    time: '30-45 წუთი',
    description: 'რთული პრობლემები - ძრავი, ტრანსმისია',
    features: ['სპეციალისტები', 'პროფესიონალური ხელსაწყოები', 'გამოცდილი ხელოსნები']
  },
  {
    id: 'elite',
    title: 'ELITE',
    icon: 'diamond-outline',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    price: '50₾',
    time: '45-60 წუთი',
    description: 'მაგისტრები - ყველაზე გამოცდილი',
    features: ['6 თვე გარანტია', 'VIP სერვისი', 'პრემიუმ მომსახურება']
  }
];

const PROBLEM_CATEGORIES = [
  {
    id: 'engine',
    title: 'ძრავი',
    icon: 'settings-outline',
    problems: ['ვერ იწყება', 'ჩამორჩება', 'ტრანსმისია']
  },
  {
    id: 'electrical',
    title: 'ელექტრო',
    icon: 'flash-outline',
    problems: ['ბატარეა', 'ფარები', 'გენერატორი']
  },
  {
    id: 'tires',
    title: 'ბორბლები',
    icon: 'disc-outline',
    problems: ['შეცვლა', 'პუნქტურა', 'ბალანსი']
  },
  {
    id: 'heating',
    title: 'გათბობა',
    icon: 'thermometer-outline',
    problems: ['რადიატორი', 'კონდიციონერი', 'გაჟონვა']
  }
];

export default function CaruServiceScreen() {
  const router = useRouter();
  const { selectedCar, cars, selectCar } = useCars();
  const { user } = useUser();

  // Set user ID for MARTE API
  useEffect(() => {
    if (user?.id) {
      marteApi.setUserId(user.id);
    }
  }, [user]);
  const [selectedAssistantLevel, setSelectedAssistantLevel] = useState<string | null>(null);
  const [selectedProblemCategory, setSelectedProblemCategory] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

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

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleOrderService = async () => {
    if (!selectedAssistantLevel) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ ავტოასისტენტის დონე');
      return;
    }
    if (!selectedProblemCategory) {
      Alert.alert('შეცდომა', 'გთხოვთ აღწეროთ პრობლემა');
      return;
    }
    if (!selectedCar) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ მანქანა');
      return;
    }
    if (!location.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ მისამართი');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ ტელეფონის ნომერი');
      return;
    }
    if (!user?.id) {
      Alert.alert('შეცდომა', 'მომხმარებელი არ არის ავტორიზებული');
      return;
    }

    const selectedLevel = ASSISTANT_LEVELS.find(l => l.id === selectedAssistantLevel);

    try {
      // Success animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Create order via API
      const orderData = {
        carId: selectedCar.id,
        carInfo: {
          make: selectedCar.make,
          model: selectedCar.model,
          year: selectedCar.year,
          plate: selectedCar.plateNumber,
        },
        assistantLevel: {
          id: selectedLevel!.id,
          title: selectedLevel!.title,
          price: parseInt(selectedLevel!.price),
        },
        problemDescription: selectedProblemCategory,
        contactInfo: {
          location: location.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        },
      };

      await marteApi.createOrder(orderData);

      // Show success modal instead of alert
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('შეცდომა', 'შეკვეთის შექმნისას მოხდა შეცდომა. გთხოვთ სცადოთ ხელახლა.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}


          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroHeader}>
                  <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>MARTE</Text>
                  <Text style={styles.heroSubtitle}>მართე • პერსონალური ავტოასისტენტი</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Finance Banner */}
          <Animated.View style={styles.financeBannerSection}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.financeBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.financeBannerContent}>
                <View style={styles.financeBannerIcon}>
                  <Ionicons name="car-sport" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.financeBannerText}>
                  <Text style={styles.financeBannerTitle}>პერსონალური ავტოასისტენტი</Text>
                  <Text style={styles.financeBannerSubtitle}>
                    მოვალ, მივიყვან, ავახორციელებ, ავაბრუნებ
                  </Text>
                </View>
                <View style={styles.financeBannerBadge}>
                  <Text style={styles.financeBannerBadgeText}>5 წუთი</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Car Selection */}
          <Animated.View style={styles.carSection}>
            <TouchableOpacity 
              style={styles.carCard}
              onPress={() => {
                if ((cars?.length || 0) === 0) {
                  router.push('/garage');
                } else {
                  setShowCarPicker(true);
                }
              }}
            >
              <LinearGradient
                colors={selectedCar ? ['rgba(34, 197, 94, 0.2)', 'rgba(22, 163, 74, 0.2)'] : ['rgba(55, 65, 81, 0.3)', 'rgba(75, 85, 99, 0.3)']}
                style={styles.carGradient}
              >
                <View style={styles.carContent}>
                  <View style={styles.carInfo}>
                    <View style={styles.carImageContainer}>
                      {selectedCar?.imageUri ? (
                        <Image source={{ uri: selectedCar.imageUri }} style={styles.carImage} />
                      ) : (
                        <View style={styles.carPlaceholder}>
                          <Ionicons name="car" size={24} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.carDetails}>
                      <Text style={styles.carTitle}>
                        {selectedCar
                          ? `${selectedCar.make} ${selectedCar.model}`
                          : (cars.length === 0 ? 'დაამატე მანქანა' : 'აირჩიეთ მანქანა')}
                      </Text>
                      <Text style={styles.carMeta}>
                        {selectedCar
                          ? `${selectedCar.year} • ${selectedCar.plateNumber}`
                          : (cars.length === 0 ? 'მოდალის გახსნა დამატებისთვის' : 'დააჭირეთ არჩევისთვის')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.changeButton}>
                    <Ionicons name="swap-horizontal" size={20} color={selectedCar ? "#22C55E" : "#6366F1"} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            {selectedCar && (
              <View style={styles.selectedCarBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.selectedCarText}>შერჩეული მანქანა</Text>
              </View>
            )}
          </Animated.View>

          {/* Assistant Levels Section */}
          <Animated.View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>აირჩიეთ ავტოასისტენტის დონე</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {ASSISTANT_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.assistantCard, selectedAssistantLevel === level.id && styles.assistantCardSelected]}
                  onPress={() => setSelectedAssistantLevel(level.id)}
                >
                  <LinearGradient
                    colors={selectedAssistantLevel === level.id ? level.gradient : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as any}
                    style={styles.assistantCardGradient}
                  >
                    <View style={styles.assistantHeader}>
                      <View style={styles.assistantIcon}>
                        <Ionicons name={level.icon as any} size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.assistantTitle}>{level.title}</Text>
                    </View>
                    <Text style={styles.assistantDescription}>{level.description}</Text>
                    <View style={styles.assistantFeatures}>
                      {level.features.map((feature, index) => (
                        <Text key={index} style={styles.assistantFeature}>• {feature}</Text>
                      ))}
                    </View>
                    <View style={styles.assistantMeta}>
                      <Text style={styles.assistantPrice}>{level.price}</Text>
                      <Text style={styles.assistantTime}>{level.time}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Problem Categories Section */}
          <Animated.View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>რა პრობლემა გაქვთ?</Text>
            <View style={styles.problemInputContainer}>
              <TextInput
                style={styles.problemInput}
                placeholder="აღწერეთ თქვენი პრობლემა დეტალურად..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={selectedProblemCategory || ''}
                onChangeText={setSelectedProblemCategory}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          {/* Contact Form */}
          <Animated.View style={styles.formSection}>
            <Text style={styles.sectionTitle}>კონტაქტური ინფორმაცია</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>მისამართი *</Text>
              <TextInput
                style={styles.input}
                placeholder="შეიყვანეთ თქვენი მისამართი"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={location}
                onChangeText={setLocation}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ტელეფონი</Text>
              <TextInput
                style={styles.input}
                placeholder="+995 XXX XXX XXX"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>დამატებითი ინფორმაცია</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="რაიმე სპეციალური მოთხოვნა..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </Animated.View>

          {/* Order Button */}
          <Animated.View style={styles.orderSection}>
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={handleOrderService}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.orderButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.orderButtonText}>შეუკვეთე სერვისი</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.orderNote}>
              ჩვენი ავტოასისტენტი 30 წუთში დაგიკავშირდებათ და გეტყვით ზუსტ დროს
            </Text>
          </Animated.View>

        </Animated.View>
      </ScrollView>

      {/* Car Picker Modal */}
      <Modal
        visible={showCarPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>აირჩიეთ მანქანა</Text>
            <ScrollView style={styles.carsList}>
              {cars.map((car) => (
                <TouchableOpacity
                  key={car.id}
                  style={[
                    styles.carRow,
                    selectedCar?.id === car.id && styles.carRowActive
                  ]}
                  onPress={() => {
                    selectCar(car);
                    setShowCarPicker(false);
                  }}
                >
                  <View style={styles.carRowImage}>
                    {car.imageUri ? (
                      <Image source={{ uri: car.imageUri }} style={styles.carRowThumb} />
                    ) : (
                      <View style={styles.carRowPlaceholder}>
                        <Ionicons name="car" size={20} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.carRowInfo}>
                    <Text style={styles.carRowTitle}>{car.make} {car.model}</Text>
                    <Text style={styles.carRowMeta}>{car.year} • {car.plateNumber}</Text>
                  </View>
                  {selectedCar?.id === car.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCarPicker(false)}
            >
              <Text style={styles.closeButtonText}>დახურვა</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.successModalCard,
              {
                opacity: fadeAnim,
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.successModalGradient}
            >
              <View style={styles.successModalContent}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
                </View>
                
                <Text style={styles.successTitle}>შეკვეთა მიღებულია! 🚗</Text>
                
                <Text style={styles.successMessage}>
                  თქვენი {selectedCar?.make} {selectedCar?.model}-ისთვის {ASSISTANT_LEVELS.find(l => l.id === selectedAssistantLevel)?.title} დონის ავტოასისტენტი შეკვეთილია.
                </Text>
                
                <Text style={styles.successSubMessage}>
                  ჩვენი ავტოასისტენტი 30 წუთში დაგიკავშირდებათ.
                </Text>

                <TouchableOpacity 
                  style={styles.successButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.replace('/caru-orders' as any);
                  }}
                >
                  <Text style={styles.successButtonText}>ჩემს შეკვეთებზე</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroTextContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  financeBannerSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  financeBannerGradient: {
    borderRadius: 16,
    padding: 16,
  },
  financeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  financeBannerText: {
    flex: 1,
  },
  financeBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  financeBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Outfit',
  },
  financeBannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  financeBannerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  carSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  carCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  carGradient: {
    padding: 12,
  },
  carContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  carImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carDetails: {
    flex: 1,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  carMeta: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Outfit',
  },
  changeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  selectedCarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
    fontFamily: 'Outfit',
  },
  servicesSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  serviceCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  serviceDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  serviceMeta: {
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  serviceTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Outfit',
  },
  
  // Horizontal Scroll Styles
  horizontalScroll: {
    marginHorizontal: -20,
    paddingVertical: 8,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
    alignItems: 'center',
  },
  
  // Assistant Level Cards
  assistantCard: {
    width: 240  ,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assistantCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  assistantCardGradient: {
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  assistantTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  assistantDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  assistantFeatures: {
    marginBottom: 12,
  },
  assistantFeature: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
    fontFamily: 'Outfit',
  },
  assistantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assistantPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  assistantTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Outfit',
  },

  // Problem Input
  problemInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  problemInput: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit',
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Problem Category Cards
  problemCard: {
    width: 140,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  problemCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  problemCardGradient: {
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  problemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  problemList: {
    gap: 4,
  },
  problemItem: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Outfit',
  },
  
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  orderSection: {
    paddingHorizontal: 20,
  },
  orderButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  orderButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  orderNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Outfit',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Outfit',
  },
  carsList: {
    maxHeight: 400,
  },
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  carRowActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  carRowImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
  },
  carRowThumb: {
    width: '100%',
    height: '100%',
  },
  carRowPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carRowInfo: {
    flex: 1,
  },
  carRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Outfit',
  },
  carRowMeta: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: 'Outfit',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    fontFamily: 'Outfit',
  },

  // Success Modal Styles
  successModalCard: {
    width: width * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
  },
  successModalGradient: {
    padding: 32,
    alignItems: 'center',
  },
  successModalContent: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  successSubMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});