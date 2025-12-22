import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import API_BASE_URL from '../../config/api';
import Colors from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface RentalCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  images: string[];
  description: string;
  features: string[];
  transmission: string;
  fuelType: string;
  seats: number;
  location: string;
  address?: string;
  phone: string;
  email?: string;
  ownerId?: string;
  ownerName?: string;
  available: boolean;
  rating: number;
  reviews: number;
  deposit: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  extras?: {
    childSeat?: number;
    additionalDriver?: number;
    navigation?: number;
    insurance?: number;
  };
}

export default function CarRentalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors['light'];

  const [car, setCar] = useState<RentalCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCarDetails();
    }
  }, [id]);

  // Format phone number: +995533123456 -> 533 123 456
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    
    // Remove +995 prefix if exists
    let cleaned = phone.replace(/^\+995/, '').replace(/\s/g, '');
    
    // Format as: 533 123 456
    if (cleaned.length >= 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
    }
    return cleaned;
  };

  // Handle phone call
  const handleCall = (phone: string) => {
    const phoneNumber = `tel:${phone.replace(/\s/g, '')}`;
    
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('შეცდომა', 'ტელეფონზე დარეკვა შეუძლებელია');
        }
      })
      .catch((err) => console.error('Error opening phone dialer:', err));
  };

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/car-rental/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch car details');
      }
      
      const data = await response.json();
      setCar(data);
    } catch (err) {
      console.error('Error fetching car details:', err);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>ჩატვირთვა...</Text>
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>მანქანა ვერ მოიძებნა</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>უკან დაბრუნება</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          <Image
            source={{ uri: car.images[selectedImageIndex] || car.images[0] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.headerBackButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Availability Badge */}
          <View style={[styles.availabilityBadge, !car.available && styles.unavailableBadge]}>
            <Ionicons
              name={car.available ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color="#fff"
            />
            <Text style={styles.availabilityText}>
              {car.available ? 'ხელმისაწვდომი' : 'დაკავებული'}
            </Text>
          </View>

          {/* Image Indicators */}
          {car.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {car.images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.indicator,
                    selectedImageIndex === index && styles.indicatorActive
                  ]}
                />
              ))}
            </View>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.brand}>{car.brand}</Text>
                <Text style={styles.model}>{car.model} ({car.year})</Text>
                <Text style={styles.category}>{car.category}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.ratingText}>{car.rating.toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({car.reviews})</Text>
              </View>
            </View>
          </View>

          {/* Specs Row */}
          <View style={styles.specsCard}>
            <View style={styles.specItem}>
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
              <Text style={styles.specLabel}>ტრანსმისია</Text>
              <Text style={styles.specValue}>{car.transmission}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Ionicons name="speedometer-outline" size={24} color="#6B7280" />
              <Text style={styles.specLabel}>საწვავი</Text>
              <Text style={styles.specValue}>{car.fuelType}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Ionicons name="people-outline" size={24} color="#6B7280" />
              <Text style={styles.specLabel}>ადგილები</Text>
              <Text style={styles.specValue}>{car.seats}</Text>
            </View>
          </View>

          {/* Price Card */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceAmount}>{car.pricePerDay}₾</Text>
                <Text style={styles.priceUnit}>ერთ დღეში</Text>
              </View>
              {car.pricePerWeek && (
                <View style={styles.altPrice}>
                  <Text style={styles.altPriceText}>{car.pricePerWeek}₾/კვირა</Text>
                </View>
              )}
            </View>
            {car.deposit > 0 && (
              <View style={styles.depositInfo}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.depositText}>დეპოზიტი: {car.deposit}₾</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>აღწერა</Text>
            <Text style={styles.description}>{car.description}</Text>
          </View>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>მახასიათებლები</Text>
              <View style={styles.featuresGrid}>
                {car.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Extras */}
          {car.extras && Object.keys(car.extras).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>დამატებითი სერვისები</Text>
              <View style={styles.extrasContainer}>
                {car.extras.childSeat && (
                  <View style={styles.extraItem}>
                    <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
                    <Text style={styles.extraText}>ბავშვის სავარძელი</Text>
                    <Text style={styles.extraPrice}>{car.extras.childSeat}₾/დღე</Text>
                  </View>
                )}
                {car.extras.additionalDriver && (
                  <View style={styles.extraItem}>
                    <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
                    <Text style={styles.extraText}>დამატებითი მძღოლი</Text>
                    <Text style={styles.extraPrice}>{car.extras.additionalDriver}₾/დღე</Text>
                  </View>
                )}
                {car.extras.navigation && (
                  <View style={styles.extraItem}>
                    <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
                    <Text style={styles.extraText}>GPS ნავიგაცია</Text>
                    <Text style={styles.extraPrice}>{car.extras.navigation}₾/დღე</Text>
                  </View>
                )}
                {car.extras.insurance && (
                  <View style={styles.extraItem}>
                    <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
                    <Text style={styles.extraText}>დამატებითი დაზღვევა</Text>
                    <Text style={styles.extraPrice}>{car.extras.insurance}₾/დღე</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>მდებარეობა</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={24} color="#EF4444" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>{car.location}</Text>
                {car.address && (
                  <Text style={styles.addressText}>{car.address}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>კონტაქტი</Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleCall(car.phone)}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={20} color="#10B981" />
              <Text style={styles.contactText}>{formatPhoneNumber(car.phone)}</Text>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {car.email && (
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => Linking.openURL(`mailto:${car.email}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="mail" size={20} color="#6366F1" />
                <Text style={styles.contactText}>{car.email}</Text>
                <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#111827',
    fontFamily: 'Inter',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  imageGalleryContainer: {
    width: width,
    height: height * 0.4,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  headerBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  availabilityBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  unavailableBadge: {
    backgroundColor: '#EF4444',
  },
  availabilityText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  brand: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  model: {
    fontSize: 28,
    fontFamily: 'Inter',
    color: '#111827',
    letterSpacing: -1,
    marginTop: 4,
  },
  category: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#111827',
  },
  reviewsText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  specsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  specDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  specValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 36,
    fontFamily: 'Inter',
    color: '#111827',
    letterSpacing: -1.5,
  },
  priceUnit: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  altPrice: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  altPriceText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Inter',
  },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  depositText: {
    fontSize: 14,
    color: '#92400E',
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    fontFamily: 'Inter',
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter',
  },
  extrasContainer: {
    gap: 10,
  },
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  extraText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter',
  },
  extraPrice: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter',
  },
});

