import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { useCars } from '../../contexts/CarContext';
import ServiceCard from '../../components/ui/ServiceCard';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import MiniServiceCard from '../../components/ui/MiniServiceCard';
import NearbyCard from '../../components/ui/NearbyCard';
import CommunitySection from '../../components/ui/CommunitySection';
import ReminderSection from '../../components/ui/ReminderSection';

const { width } = Dimensions.get('window');


// POPULAR_SERVICES ახლა API-დან მოვიღებთ

export default function TabOneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();
  
  // Promo banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // დინამიური სერვისები
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [nearbyServices, setNearbyServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(true);

  console.log(popularServices, 'პოპულარული სერვისები');
  
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (width - 60));
    setCurrentBannerIndex(index);
  };

  // API-დან პოპულარული სერვისების მიღება
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        // პოპულარული სერვისების endpoint
        const response = await fetch('http://192.168.1.73:4000/carwash/locations/popular?limit=6');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        
        const data = JSON.parse(text);
        
        // მონაცემების ფორმატირება
        // პოპულარობის ალგორითმი:
        // 1. რეიტინგი (40%) - მაღალი რეიტინგი = პოპულარული
        // 2. რევიუების რაოდენობა (25%) - მეტი რევიუ = უფრო პოპულარული
        // 3. ღიაა თუ არა (15%) - ღია სერვისები პრიორიტეტულია
        // 4. ფასის კონკურენტუნარიანობა (10%) - საშუალო ფასის მახლობლად
        // 5. სერვისების რაოდენობა (10%) - მეტი სერვისი = უკეთესი
        const formattedServices = data.map((location: any) => ({
          id: location.id,
          name: location.name,
          location: location.location,
          rating: location.rating,
          price: `${location.price}₾`,
          image: location.images?.[0] || require('../../assets/images/car-bg.png'),
          category: location.category,
          address: location.address,
          phone: location.phone,
          services: location.detailedServices || [],
          isOpen: location.realTimeStatus?.isOpen || location.isOpen,
          waitTime: location.realTimeStatus?.currentWaitTime || 0,
          socialMedia: location.socialMedia || {}, // Facebook, Instagram, Website
          reviews: location.reviews || 0,
        }));
        
        setPopularServices(formattedServices);
      } catch (error) {
        console.error('სერვისების ჩატვირთვის შეცდომა:', error);
        // fallback სტატიკური მონაცემები
        setPopularServices([
          {
            id: '1',
            name: 'ძმაკაცი მოტორსი',
            location: 'ვაჟა-ფშაველას გამზირი',
            rating: 4.8,
            price: '50₾',
            image: require('../../assets/images/car-bg.png'),
            category: 'ავტოსერვისი',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // API-დან ყველა ტიპის ახლოს მყოფი სერვისების მიღება
  React.useEffect(() => {
    const fetchNearbyServices = async () => {
      try {
        setNearbyLoading(true);
        
        // რეალური ლოკაციის მიღება (თუ ხელმისაწვდომია)
        let userLat = 41.7151; // თბილისის ცენტრალური კოორდინატები (fallback)
        let userLon = 44.8271;
        
        try {
          // Expo Location API-ს გამოყენება
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            userLat = location.coords.latitude;
            userLon = location.coords.longitude;
            console.log('მომხმარებლის ლოკაცია:', userLat, userLon);
            
            // თუ მომხმარებელი სან ფრანცისკოშია (Expo Go სიმულატორი), ვიყენებთ თბილისის კოორდინატებს
            if (userLat > 37 && userLat < 38 && userLon > -123 && userLon < -122) {
              console.log('მომხმარებელი სან ფრანცისკოშია, ვიყენებთ თბილისის კოორდინატებს');
              userLat = 41.7151;
              userLon = 44.8271;
            }
          }
        } catch (locationError) {
          console.log('ლოკაციის მიღება ვერ მოხერხდა, გამოიყენება default კოორდინატები');
        }
        
        console.log('გამოყენებული კოორდინატები:', userLat, userLon);
        
        // ახალი endpoint - ყველა ტიპის სერვისი
        const response = await fetch(`http://192.168.1.73:4000/carwash/locations/all-nearby?lat=${userLat}&lng=${userLon}&radius=10`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        
        const data = JSON.parse(text);
        console.log('API-დან მიღებული მონაცემები:', data.length, 'სერვისი');
        
        const formattedNearbyServices = data.map((service: any) => ({
          id: service.id,
          name: service.displayName || service.name || service.title,
          location: service.displayAddress || service.address || service.location,
          rating: service.displayRating || service.rating || 0,
          price: service.displayPrice || `${service.price}₾`,
          image: service.images?.[0] || require('../../assets/images/car-bg.png'),
          category: service.category || service.type,
          address: service.displayAddress || service.address,
          phone: service.phone,
          services: service.detailedServices || service.services || [],
          isOpen: service.isOpen,
          waitTime: service.waitTime || 0,
          socialMedia: service.socialMedia || {},
          reviews: service.displayReviews || service.reviews || 0,
          type: service.type, // 'carwash' ან 'store'
          distance: service.distance, // კილომეტრებში
          coordinates: service.coordinates,
        }));
        
        console.log('ფორმატირებული სერვისები:', formattedNearbyServices.length);
        setNearbyServices(formattedNearbyServices);
      } catch (error) {
        console.error('ახლოს მყოფი სერვისების ჩატვირთვის შეცდომა:', error);
        // fallback - პოპულარული სერვისების გამოყენება
        console.log('Fallback: Using popular services as nearby services');
        console.log('Popular services count:', popularServices.length);
        console.log('Popular services data:', popularServices);
        console.log('Setting nearby services to popular services');
        setNearbyServices(popularServices);
      } finally {
        setNearbyLoading(false);
      }
    };

    fetchNearbyServices();
  }, [popularServices]);

  type Category = { id: string; title: string; image: string };
  const CATEGORIES: Category[] = [
    { id: 'repair',     title: 'Repairing',  image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=600&auto=format&fit=crop' },
    { id: 'electrical', title: 'Electrical', image: 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=600&auto=format&fit=crop' },
    { id: 'cleaning',   title: 'Cleaning',   image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop' },
    { id: 'painting',   title: 'Painting',   image: 'https://images.unsplash.com/photo-1510414696678-2415ad8474aa?q=80&w=600&auto=format&fit=crop' },
  ];
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 24,
      backgroundColor: 'transparent',
    },
    profileRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 24,
    },
    avatarSmall: { 
      width: 48, 
      height: 48, 
      borderRadius: 24,
      backgroundColor: '#6366F1',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    userName: { 
      fontSize: 18, 
      fontFamily: 'Inter', 
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    smallLocation: { 
      fontSize: 13, 
      color: colors.secondary, 
      fontFamily: 'Inter',
      opacity: 0.8,
    },
    roundIcon: {
      width: 44, 
      height: 44, 
      borderRadius: 22, 
      backgroundColor: '#FFFFFF', 
      borderWidth: 1, 
      borderColor: '#E5E7EB',
      alignItems: 'center' as const, 
      justifyContent: 'center' as const,
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.08, 
      shadowRadius: 4, 
      elevation: 3,
    },
    promoScrollContainer: {
      paddingHorizontal: 20,
      gap: 16,
    },
    promoCard: {
      width: width - 60,
      backgroundColor: '#111827',
      borderRadius: 20,
      overflow: 'hidden' as const,
      height: 160,
      position: 'relative' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    promoImage: { position: 'absolute' as const, width: '100%', height: '100%' },
    promoOverlay: { ...StyleSheet.absoluteFillObject },
    promoContent: { position: 'absolute' as const, left: 16, top: 16, right: 16, bottom: 16, justifyContent: 'space-between' as const },
    promoBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#EF4444',
      marginBottom: 8,
    },
    promoBadgeText: {
      color: '#FFFFFF',
      fontFamily: 'Inter',
      fontSize: 11,
    },
    promoTitle: { 
      fontSize: 16, 
      lineHeight: 20, 
      color: '#FFFFFF', 
      fontFamily: 'Inter',
      marginBottom: 4,
    },
    promoSubtitle: { 
      color: '#E5E7EB', 
      fontFamily: 'Inter', 
      fontSize: 12,
      marginBottom: 8,
    },
    promoButton: { 
      alignSelf: 'flex-start', 
      backgroundColor: '#6366F1', 
      paddingHorizontal: 16, 
      paddingVertical: 8, 
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    promoButtonText: { 
      color: '#FFFFFF', 
      fontFamily: 'Inter', 
      fontSize: 12,
    },
    paginationContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginTop: 16,
      gap: 8,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#D1D5DB',
    },
    paginationDotActive: {
      backgroundColor: '#6366F1',
      width: 24,
    },
    recommendationCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    recommendationHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    recommendationTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#1E293B',
      marginLeft: 8,
    },
    recommendationText: {
      fontSize: 14,
      color: '#64748B',
      lineHeight: 20,
      marginBottom: 16,
    },
    recommendationButton: {
      backgroundColor: '#6366F1',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 8,
    },
    recommendationButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600' as const,
    },
    headerTop: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    headerButtons: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    userInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    avatarContainer: {
      position: 'relative' as const,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#3B82F6',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    onlineIndicator: {
      position: 'absolute' as const,
      right: 0,
      bottom: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#22C55E',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    greeting: {
      fontSize: 15,
      color: colors.secondary,
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    username: {
      fontSize: 26,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.5,
    },
    themeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    notificationBadge: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    notificationCount: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600' as const,
    },
    searchWrapper: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      marginBottom: 24,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 54,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    filterButton: {
      width: 54,
      height: 54,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    searchIcon: {
      marginRight: 10,
    },
    quickActionsContainer: {
      paddingHorizontal: 5,
      paddingTop: 24,
      paddingBottom: 20,
    },
    quickActions: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      alignItems: 'center' as const,
      gap: 8,
    },
    quickActionIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    quickActionText: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.secondary,
      textAlign: 'center' as const,
    },
    categoriesContainer: {
      paddingTop: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 20,
      color: colors.text,
      fontFamily: 'Inter',
      marginBottom: 16,
      fontWeight: '600' as const,
    },
    categoriesList: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    categoryCard: {
      alignItems: 'center' as const,
      marginRight: 16,
      padding: 16,
      borderRadius: 24,
      width: 110,
      borderWidth: 1,
      gap: 12,
    },
    categoryIcon: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    categoryName: {
      fontSize: 13,
      fontFamily: 'Poppins_600SemiBold',
      textAlign: 'center' as const,
      lineHeight: 18,
    },
    featuredContainer: {
      paddingTop: 32,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    featuredGrid: {
      gap: 16,
    },
    serviceCard: {
      height: 220,
      borderRadius: 24,
      overflow: 'hidden' as const,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 5,
    },
    serviceImage: {
      width: '100%',
      height: '100%',
    },
    serviceOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'flex-end' as const,
      padding: 20,
      paddingBottom: 24,
    },
    serviceContent: {
      gap: 12,
    },
    serviceName: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    serviceDetails: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 16,
    },
    locationContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    locationText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    ratingContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    ratingText: {
      fontSize: 12,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      fontFamily: 'Inter',
    },
    popularContainer: {
      paddingTop: 32,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    chipsRow: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 12,
    },
    mapBanner: {
      marginTop: 20,
      marginHorizontal: 20,
      backgroundColor: '#0B0B0E',
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    mapBannerTitle: { color: '#FFFFFF', fontFamily: 'Inter', fontSize: 14 },
    mapBannerSubtitle: { color: '#E5E7EB', fontFamily: 'Inter', fontSize: 11, marginTop: 4 },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    sectionAction: {
      fontSize: 13,
      fontFamily: 'Inter',
      color: colors.primary,
    },
    popularContent: {
      paddingHorizontal: 20,
      gap: 16,
    },
    popularCard: {
      width: 280,
      height: 200,
      borderRadius: 20,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    popularImage: {
      width: '100%',
      height: '100%',
    },
    popularOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: 16,
      justifyContent: 'space-between' as const,
    },
    popularHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
    },
    categoryBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryText: {
      fontSize: 11,
      fontFamily: 'Inter',
      color: '#FFFFFF',
    },
    ratingBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularName: {
      fontSize: 18,
      fontFamily: 'Inter',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      marginBottom: 8,
    },
    popularDetails: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    locationItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    priceContainer: {
      backgroundColor: '#22C55E',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    priceText: {
      fontSize: 12,
      fontFamily: 'Inter',
      color: '#FFFFFF',
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Header (new) */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => router.push('/two')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarSmall}>
              {user?.name ? (
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons name="person" size={20} color="#FFFFFF" />
              )}
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.userName}>
                გამარჯობა{user?.name ? `, ${user.name}` : ''}!
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={14} color={colors.secondary} />
                <Text style={styles.smallLocation}>თბილისი, საქართველო</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={styles.roundIcon}
              onPress={() => router.push('/map')}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={18} color={'#111827'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.roundIcon}
              onPress={() => router.push('/comments')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={18} color={'#111827'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Banners - Scrollable */}
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.promoScrollContainer}
          pagingEnabled={true}
          snapToInterval={361}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Banner 1 - Car Wash */}
          <View style={styles.promoCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=1200&auto=format&fit=crop' }} style={styles.promoImage} />
            <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]} style={styles.promoOverlay} />
            <View style={styles.promoContent}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>🔥 ფასდაკლება</Text>
              </View>
              <Text style={styles.promoTitle}>35% ფასდაკლება{'\n'}პირველ სერვისზე</Text>
              <Text style={styles.promoSubtitle}>სამრეცხაო სერვისები</Text>
              <TouchableOpacity style={styles.promoButton} onPress={() => router.push('/map')}>
                <Text style={styles.promoButtonText}>დაჯავშნა</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Banner 2 - Auto Service */}
          <View style={styles.promoCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop' }} style={styles.promoImage} />
            <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]} style={styles.promoOverlay} />
            <View style={styles.promoContent}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>⭐ პრემიუმი</Text>
              </View>
              <Text style={styles.promoTitle}>პრემიუმ ავტო{'\n'}სერვისი</Text>
              <Text style={styles.promoSubtitle}>პროფესიონალური მოვლა</Text>
              <TouchableOpacity style={styles.promoButton} onPress={() => router.push('/garage')}>
                <Text style={styles.promoButtonText}>შეუკვეთე</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Banner 3 - Technical Inspection */}
          <View style={styles.promoCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop' }} style={styles.promoImage} />
            <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]} style={styles.promoOverlay} />
            <View style={styles.promoContent}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>✅ ოფიციალური</Text>
              </View>
              <Text style={styles.promoTitle}>ტექდათვალიერება{'\n'}ოფიციალურად</Text>
              <Text style={styles.promoSubtitle}>სწრაფი და ხარისხიანი</Text>
              <TouchableOpacity style={styles.promoButton} onPress={() => router.push('/booking')}>
                <Text style={styles.promoButtonText}>დაჯავშნა</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Banner 4 - Loyalty Program */}
          <View style={styles.promoCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop' }} style={styles.promoImage} />
            <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]} style={styles.promoOverlay} />
            <View style={styles.promoContent}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>🏆 ლოიალობა</Text>
              </View>
              <Text style={styles.promoTitle}>მოაგროვე ქულები{'\n'}და მიიღე ჯილდოები</Text>
              <Text style={styles.promoSubtitle}>ყოველი სერვისი იძლევა ქულებს</Text>
              <TouchableOpacity style={styles.promoButton} onPress={() => router.push('/loyalty')}>
                <Text style={styles.promoButtonText}>ქულები</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {[0, 1, 2, 3].map((index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                currentBannerIndex === index && styles.paginationDotActive
              ]}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  x: index * (width - 60),
                  animated: true,
                });
              }}
            />
          ))}
        </View>

        {/* სწრაფი მოქმედებები */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>კატეგორიები</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/ai')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>AI</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/carwash')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#22C55E' }]}>
                <Ionicons name="water" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>სამრეცხაო</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/loyalty')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="star" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>ლოიალობა</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/fuel-stations')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="car" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>ბენზინი</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>



        <ReminderSection />

      {/* Community Section */}
     


      {/* Categories */}
     

      {/* Quick filter chips moved to Carwash screen */}
      <View style={styles.popularContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>პოპულარული სერვისები</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>ყველა</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularContent}>
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.secondary, fontFamily: 'Inter' }}>სერვისების ჩატვირთვა...</Text>
            </View>
          ) : (
            popularServices.map((service) => (
              <ServiceCard
                key={service.id}
                image={service.image}
                title={service.name}
                category={service.category}
                rating={service.rating}
                location={service.location}
                price={service.price}
                onPress={() => {
                  const detailsParams = {
                    // ძირითადი ინფორმაცია (carwash ფეიჯის მიხედვით)
                    id: service.id,
                    title: service.name,
                    lat: '41.7151', // თბილისის კოორდინატები
                    lng: '44.8271',
                    rating: service.rating?.toString() || '4.9',
                    distance: service.distance || '1.2 კმ',
                    price: service.price || '15₾',
                    address: service.address || service.location,
                    description: 'პრემიუმ ხარისხის მომსახურება, სწრაფად და უსაფრთხოდ. ჩვენი პროფესიონალური გუნდი უზრუნველყოფს შენი მანქანის სრულ გაწმენდას ყველაზე მოდერნული ტექნოლოგიების გამოყენებით.',
                    features: JSON.stringify(['WiFi', 'პარკინგი', 'ღამის სერვისი', 'ბარათით გადახდა', 'დაზღვეული', 'VIP ოთახი']),
                    category: service.category || 'სამრეცხაო',
                    isOpen: service.isOpen?.toString() || 'true',
                    waitTime: service.waitTime?.toString() || '10 წთ',
                    reviews: service.reviews?.toString() || '89',
                    services: JSON.stringify(service.services || ['შიდა რეცხვა', 'გარე რეცხვა', 'ვაკუუმი', 'ცვილის ფენა']),
                    detailedServices: JSON.stringify(service.services || []),
                    timeSlotsConfig: JSON.stringify({}),
                    availableSlots: JSON.stringify([]),
                    realTimeStatus: JSON.stringify({}),
                    workingHours: '09:00 - 18:00',
                    image: typeof service.image === 'string' ? service.image : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
                  };
                  
                  console.log('🔍 [POPULAR] Navigating to details with params:', detailsParams);
                  
                  router.push({ 
                    pathname: '/details', 
                    params: detailsParams
                  });
                }}
              />
            ))
          )}
        </ScrollView>
      </View>


      {/* Nearby quick list */}
      <View style={{ paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ახლოს შენთან</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>ყველა</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {nearbyLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.secondary, fontFamily: 'Inter' }}>ახლოს შენთან...</Text>
            </View>
          ) : (
            nearbyServices.map(s => (
              <NearbyCard 
                key={s.id} 
                image={s.image} 
                title={s.name} 
                subtitle={s.location} 
                rating={s.rating} 
                distance={s.distance ? `${s.distance.toFixed(1)} კმ` : `${s.waitTime || 5} წთ`} 
                price={s.price} 
                onPress={() => {
                  const detailsParams = { 
                    title: s.name,
                    type: s.type,
                    id: s.id,
                    rating: s.rating?.toString() || '4.9',
                    reviews: s.reviews?.toString() || '0',
                    address: s.address || s.location,
                    price: s.price,
                    image: s.image,
                    category: s.category,
                    isOpen: s.isOpen?.toString() || 'true',
                    waitTime: s.waitTime?.toString() || '10',
                    distance: s.distance ? `${s.distance.toFixed(1)} კმ` : '1.2 კმ',
                    description: s.description || 'პრემიუმ ხარისხის მომსახურება',
                    features: JSON.stringify(s.features || ['WiFi', 'პარკინგი', 'ღამის სერვისი']),
                    services: JSON.stringify(s.services || ['შიდა რეცხვა', 'გარე რეცხვა', 'ვაკუუმი']),
                    detailedServices: JSON.stringify(s.detailedServices || []),
                    workingHours: s.workingHours || '09:00 - 18:00',
                    phone: s.phone || '+995 32 123 4567',
                    lat: s.coordinates?.latitude?.toString() || '41.7151',
                    lng: s.coordinates?.longitude?.toString() || '44.8271',
                  };
                  
                  console.log('🔍 [NEARBY] Navigating to details with params:', detailsParams);
                  console.log('🔍 [NEARBY] Service data:', s);
                  
                  router.push({ 
                    pathname: '/details', 
                    params: detailsParams
                  });
                }} 
              />
            ))
          )}
        </ScrollView>
      </View>

      <CommunitySection />


      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}