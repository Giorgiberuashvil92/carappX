import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, StatusBar, Dimensions, Animated, Share, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const title = (params.title as string) || 'Standard Cleaning Services';
  const latitude = Number(params.lat ?? 41.7151);
  const longitude = Number(params.lng ?? 44.8271);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `შეამოწმეთ ${title} - ${params.address || 'თბილისი'}`,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCall = () => {
    const phoneNumber = params.phone as string;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Image Gallery Header */}
      <View style={styles.imageHeader}>
        <Image 
          source={{ uri: params.image as string || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop' }} 
          style={styles.headerImage}
          resizeMode="cover"
        />
        <LinearGradient 
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']} 
          style={StyleSheet.absoluteFill} 
        />
        
        {/* Top Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topRightButtons}>
            <TouchableOpacity style={styles.circleButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: params.isOpen === 'true' ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>
            {params.isOpen === 'true' ? 'ღიაა' : 'დახურულია'}
          </Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheet}>
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{params.rating || '4.9'}</Text>
              <Text style={styles.reviewsText}>({params.reviews || '89'} რევიუ)</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.quickStatText}>{params.distance || '1.2 კმ'}</Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.quickStatText}>{params.waitTime || '10 წთ'}</Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="car-outline" size={16} color="#6B7280" />
              <Text style={styles.quickStatText}>{params.category || 'Premium'}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>აღწერა</Text>
            <Text style={styles.paragraph}>{params.description || 'პრემიუმ ხარისხის მომსახურება, სწრაფად და უსაფრთხოდ. არჩევანი შენი მანქანისთვის საუკეთესოა.'}</Text>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>მისამართი</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.addressText}>{params.address || 'თბილისი, ვაკე'}</Text>
            </View>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>სერვისები</Text>
            <View style={styles.servicesGrid}>
              {params.services ? (() => {
                try {
                  const services = JSON.parse(params.services as string);
                  return Array.isArray(services) ? services.map((service: string, index: number) => (
                    <View key={index} style={styles.serviceChip}>
                      <Text style={styles.serviceChipText}>{service}</Text>
                    </View>
                  )) : null;
                } catch (error) {
                  console.error('Error parsing services:', error);
                  return null;
                }
              })() : (
                <>
                  <View style={styles.serviceChip}><Text style={styles.serviceChipText}>შიდა რეცხვა</Text></View>
                  <View style={styles.serviceChip}><Text style={styles.serviceChipText}>გარე რეცხვა</Text></View>
                  <View style={styles.serviceChip}><Text style={styles.serviceChipText}>ვაკუუმი</Text></View>
                  <View style={styles.serviceChip}><Text style={styles.serviceChipText}>ცვილის ფენა</Text></View>
                </>
              )}
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ფუნქციები</Text>
            <View style={styles.featuresList}>
              {params.features ? JSON.parse(params.features as string).map((feature: string, index: number) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              )) : (
                <>
                  <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={16} color="#10B981" /><Text style={styles.featureText}>WiFi</Text></View>
                  <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={16} color="#10B981" /><Text style={styles.featureText}>პარკინგი</Text></View>
                  <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={16} color="#10B981" /><Text style={styles.featureText}>ღამის სერვისი</Text></View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.priceTag}><Text style={styles.priceText}>{params.price || '15₾'}</Text></View>
          <Text style={styles.priceHint}>საწყისი ფასი</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.primaryButton}
          onPress={() => {
            // Create location object for booking
            const locationObject = {
              id: params.id || '1',
              name: title,
              address: params.address || 'თბილისი',
              rating: parseFloat(params.rating as string) || 4.9,
              reviews: parseInt(params.reviews as string) || 89,
              distance: params.distance || '1.2 კმ',
              price: params.price || '15₾',
              image: params.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
              category: params.category || 'Premium',
              isOpen: params.isOpen === 'true',
              waitTime: params.waitTime || '10 წთ',
              features: params.features ? JSON.parse(params.features as string) : [],
              services: params.services ? JSON.parse(params.services as string) : [],
              detailedServices: params.detailedServices ? JSON.parse(params.detailedServices as string) : [],
              timeSlotsConfig: (location as any)?.timeSlotsConfig || {},
              availableSlots: (location as any)?.availableSlots || [],
              realTimeStatus: (location as any)?.realTimeStatus || {},
              workingHours: (location as any)?.workingHours || '09:00 - 18:00',
              latitude: parseFloat(params.lat as string) || 41.7151,
              longitude: parseFloat(params.lng as string) || 44.8271,
            };

            const bookingParams = {
              location: JSON.stringify(locationObject),
              locationName: title,
              locationAddress: params.address || 'თბილისი',
              locationRating: params.rating || '4.9',
              locationReviews: params.reviews || '89',
              locationDistance: params.distance || '1.2 კმ',
              locationPrice: params.price || '15₾',
              locationImage: params.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
              locationCategory: params.category || 'Premium',
              locationIsOpen: params.isOpen || 'true',
              locationWaitTime: params.waitTime || '10 წთ',
              locationFeatures: params.features || '[]',
              locationServices: params.services || '[]',
              locationDetailedServices: params.detailedServices || '[]',
              locationTimeSlotsConfig: params.timeSlotsConfig || '{}',
              locationAvailableSlots: params.availableSlots || '[]',
              locationRealTimeStatus: params.realTimeStatus || '{}',
              locationWorkingHours: params.workingHours || '09:00 - 18:00',
            };
            
            console.log('🔍 [DETAILS] Navigating to booking with params:', bookingParams);
            console.log('🔍 [DETAILS] Location object:', locationObject);
            console.log('🔍 [DETAILS] All params:', params);
            console.log('🔍 [DETAILS] timeSlotsConfig from location:', (location as any)?.timeSlotsConfig);
            
            router.push({
              pathname: '/booking',
              params: bookingParams
            });
          }}
        >
          <Text style={styles.primaryButtonText}>დაჯავშნა</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  imageHeader: { 
    height: 300, 
    backgroundColor: '#E5E7EB', 
    overflow: 'hidden',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 58 : 20, 
    left: 16, 
    right: 16,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    zIndex: 10,
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  circleButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    alignItems: 'center', 
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: '#111827',
  },
  sheet: { 
    marginTop: -20, 
    marginHorizontal: 16, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 20, 
    elevation: 8 
  },
  headerInfo: {
    marginBottom: 16,
  },
  title: { 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 24, 
    color: '#111827',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
  },
  reviewsText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: { 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 18, 
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: { 
    fontFamily: 'NotoSans_400Regular', 
    color: '#4B5563', 
    lineHeight: 22,
    fontSize: 15,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  serviceChipText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#1E40AF',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#374151',
  },
  footer: { 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  priceTag: { 
    backgroundColor: '#111827', 
    borderRadius: 10, 
    paddingHorizontal: 10, 
    paddingVertical: 6 
  },
  priceText: { 
    color: '#FFFFFF', 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 14 
  },
  priceHint: { 
    fontFamily: 'NotoSans_500Medium', 
    fontSize: 12, 
    color: '#6B7280' 
  },
  primaryButton: { 
    backgroundColor: '#0B0B0E', 
    borderRadius: 16, 
    paddingVertical: 16, 
    paddingHorizontal: 22, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 16, 
    elevation: 10 
  },
  primaryButtonText: { 
    color: '#FFFFFF', 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 15 
  },
});


