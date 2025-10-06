import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCars } from '@/contexts/CarContext';

const { width } = Dimensions.get('window');

export default function AILandingScreen() {
  const { selectedCar, cars } = useCars();
  const [showCarPicker, setShowCarPicker] = useState(false);
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

  const handleServicePress = (service: string) => {
    router.push(`/service-form?service=${service}`);
  };

  const services = [
    {
      id: 'parts',
      title: 'ნაწილები',
      subtitle: 'მოძიება',
      icon: 'construct-outline',
      gradient: ['#10B981', '#059669'],
    },
    {
      id: 'mechanic',
      title: 'ხელოსანი',
      subtitle: 'სერვისი',
      icon: 'build-outline',
      gradient: ['#3B82F6', '#1D4ED8'],
    },
    {
      id: 'tow',
      title: 'ევაკუატორი',
      subtitle: 'გამოძახება',
      icon: 'car-outline',
      gradient: ['#F59E0B', '#D97706'],
    },
    {
      id: 'rental',
      title: 'ქირაობა',
      subtitle: 'მანქანა',
      icon: 'car-sport-outline',
      gradient: ['#8B5CF6', '#7C3AED'],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
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
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>მოგესალმებით</Text>
                <Text style={styles.heroSubtitle}>
                  აირჩიეთ საჭირო სერვისი
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Finance Banner */}
          <Animated.View style={styles.financeBannerSection}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.financeBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.financeBannerContent}>
                <View style={styles.financeBannerIcon}>
                  <Ionicons name="card" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.financeBannerText}>
                  <Text style={styles.financeBannerTitle}>განვადება 0% პროცენტით</Text>
                  <Text style={styles.financeBannerSubtitle}>
                    ყველა სერვისზე ხელმისაწვდომია
                  </Text>
                </View>
                <View style={styles.financeBannerBadge}>
                  <Text style={styles.financeBannerBadgeText}>0%</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Car Selection */}
          <Animated.View style={styles.carSection}>
            <Pressable 
              style={styles.carCard}
              onPress={() => setShowCarPicker(true)}
            >
              <LinearGradient
                colors={['rgba(55, 65, 81, 0.3)', 'rgba(75, 85, 99, 0.3)']}
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
                        {selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'აირჩიეთ მანქანა'}
                      </Text>
                      <Text style={styles.carMeta}>
                        {selectedCar ? `${selectedCar.year} • ${selectedCar.plateNumber}` : 'დააჭირეთ არჩევისთვის'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.changeButton}>
                    <Ionicons name="swap-horizontal" size={20} color="#6366F1" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Quick Links */}
          <View style={styles.quickLinksContainer}>
            <Pressable
              style={styles.quickLink}
              onPress={() => router.push('/all-requests')}
            >
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.2)', 'rgba(79, 70, 229, 0.2)']}
                style={styles.quickLinkGradient}
              >
                <Ionicons name="list" size={18} color="#FFFFFF" />
                <Text style={styles.quickLinkText}>ჩემი მოთხოვნები</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.quickLink}
              onPress={() => router.push('/partner-dashboard?partnerType=store')}
            >
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.2)']}
                style={styles.quickLinkGradient}
              >
                <Ionicons name="business" size={18} color="#FFFFFF" />
                <Text style={styles.quickLinkText}>მაღაზიის პანელი</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Services Grid */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>რა გჭირდებათ?</Text>
            <View style={styles.servicesGrid}>
              {services.map((service) => (
                <View
                  key={service.id}
                  style={styles.serviceCard}
                >
                  <Pressable
                    style={styles.servicePressable}
                    onPress={() => handleServicePress(service.id)}
                  >
                    <LinearGradient
                      colors={service.gradient as [string, string]}
                      style={styles.serviceGradient}
                    >
                      <View style={styles.serviceContent}>
                        <View style={styles.serviceIconContainer}>
                          <Ionicons name={service.icon as any} size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
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
                <Pressable
                  key={car.id}
                  style={[
                    styles.carRow,
                    selectedCar?.id === car.id && styles.carRowActive
                  ]}
                  onPress={() => {
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
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowCarPicker(false)}
            >
              <Text style={styles.closeButtonText}>დახურვა</Text>
            </Pressable>
          </View>
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
  content: {
    padding: 20,
    gap: 24,
  },

  // Hero Section
  heroSection: {
    marginTop: 10,
  },
  heroGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    gap: 4,
  },
  heroTitle: {
    fontFamily: 'NotoSans_800ExtraBold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Finance Banner
  financeBannerSection: {
    marginTop: 8,
  },
  financeBannerGradient: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  financeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  financeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeBannerText: {
    flex: 1,
  },
  financeBannerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  financeBannerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  financeBannerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  financeBannerBadgeText: {
    fontFamily: 'NotoSans_800ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Car Section
  carSection: {
    marginTop: 4,
  },
  carCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  carGradient: {
    padding: 16,
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
    fontFamily: 'NotoSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  carMeta: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
  },
  changeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Services Section
  servicesSection: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: (width - 52) / 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  servicePressable: {
    flex: 1,
  },
  serviceGradient: {
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  serviceContent: {
    alignItems: 'center',
    gap: 12,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  serviceSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Quick Links
  quickLinksContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  quickLink: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quickLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  quickLinkText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
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
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  carRowMeta: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#6366F1',
  },
});
