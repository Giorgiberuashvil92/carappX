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
import API_BASE_URL from '../../config/api';
import ServiceCard from '../../components/ui/ServiceCard';
import CommunitySection from '../../components/ui/CommunitySection';
import ReminderSection from '../../components/ui/ReminderSection';
import StoriesRow from '../../components/ui/StoriesRow';
import StoryViewer from '../../components/ui/StoryViewer';
import StoryOverlay from '../../components/ui/StoryOverlay';
import NotificationsModal from '../../components/ui/NotificationsModal';
import { mockStories } from '../../data/stories';

const { width } = Dimensions.get('window');
const H_MARGIN = 20;
const H_GAP = 16;
const POPULAR_CARD_WIDTH = width - (H_MARGIN * 2);


// POPULAR_SERVICES ახლა API-დან მოვიღებთ

export default function TabOneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();
  const displayFirstName = user?.name ? user.name.split(' ')[0] : '';
  
  // Promo banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [openStoryIndex, setOpenStoryIndex] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  
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
      width: 52, 
      height: 52, 
      borderRadius: 26,
      backgroundColor: '#6366F1',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
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
      width: 48, 
      height: 48, 
      borderRadius: 24, 
      backgroundColor: '#FFFFFF', 
      borderWidth: 1, 
      borderColor: '#E5E7EB',
      alignItems: 'center' as const, 
      justifyContent: 'center' as const,
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.12, 
      shadowRadius: 8, 
      elevation: 5,
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
      fontWeight: '600' as const,
      color: '#1E293B',
      marginLeft: 8,
      fontFamily: 'Inter',
    },
    recommendationText: {
      fontSize: 14,
      color: '#64748B',
      lineHeight: 20,
      marginBottom: 16,
      fontFamily: 'Inter',
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
      fontWeight: '500' as const,
      fontFamily: 'Inter',
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
      fontWeight: '600' as const,
      color: colors.text,
      letterSpacing: -0.5,
      fontFamily: 'Inter',
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
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    quickActionText: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: '#374151',
      textAlign: 'center' as const,
      fontFamily: 'Inter',
    },
    categoriesContainer: {
      paddingTop: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 22,
      color: '#1F2937',
      fontFamily: 'Inter',
      marginBottom: 18,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    categoriesList: {
      marginHorizontal: 0,
      paddingLeft: H_MARGIN,
      paddingRight: H_MARGIN,
    },
    categoryCard: {
      alignItems: 'center' as const,
      marginRight: H_GAP,
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
      fontFamily: 'Inter',
      fontWeight: '500' as const,
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
      fontWeight: '600' as const,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      fontFamily: 'Inter',
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
      paddingLeft: H_MARGIN,
      paddingRight: H_MARGIN,
      gap: H_GAP,
    },
    popularCard: {
      width: POPULAR_CARD_WIDTH,
      height: 220,
      borderRadius: 24,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    popularImage: {
      width: '100%',
      height: '100%',
    },
    popularOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      padding: 20,
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
    chatsContainer: {
      paddingTop: 8,
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 12,
    },
    chatCard: {
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(229, 231, 235, 0.35)',
      backgroundColor: 'rgba(17, 24, 39, 0.35)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    chatRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 12 },
    chatLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, flex: 1 },
    chatAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: 'rgba(229,231,235,0.25)' },
    chatInitials: { color: '#E5E7EB', fontFamily: 'Inter', fontSize: 12 },
    chatTitle: { color: '#F3F4F6', fontFamily: 'Inter', fontSize: 14, fontWeight: '700' as const },
    chatMeta: { color: '#D1D5DB', fontFamily: 'Inter', fontSize: 11, opacity: 0.8 },
    chatSnippet: { color: '#E5E7EB', fontFamily: 'Inter', fontSize: 12, marginTop: 4, opacity: 0.9 },
    unreadBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#EF4444', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    unreadText: { color: '#FFFFFF', fontFamily: 'Inter', fontSize: 11, fontWeight: '700' as const },
    bannerContainer: {
      paddingHorizontal: 20,
      marginTop: 20,
      marginBottom: 8,
    },
    promoBanner: {
      height: 160,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    bannerBackground: {
      flex: 1,
    },
    bannerImageStyle: {
      borderRadius: 20,
    },
    bannerOverlay: {
      flex: 1,
      padding: 20,
      justifyContent: 'space-between',
    },
    bannerContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    bannerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    bannerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },
    bannerBadgeText: {
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: '#FFFFFF',
    },
    bannerDiscount: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    discountText: {
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: '700',
      color: '#FFFFFF',
    },
    bannerMain: {
      flex: 1,
      justifyContent: 'center',
      marginVertical: 8,
    },
    bannerTitle: {
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 6,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    bannerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter',
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 20,
    },
    bannerFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bannerFeatures: {
      flexDirection: 'row',
      gap: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    featureText: {
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.9)',
    },
    bannerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B981',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      gap: 6,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    bannerButtonText: {
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
              <Text style={styles.userName} numberOfLines={1}>
                გამარჯობა{displayFirstName ? `, ${displayFirstName}` : ''}!
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
              onPress={() => setNotificationsModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={18} color={'#111827'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
          <StoriesRow stories={mockStories} onOpen={(idx) => { setOpenStoryIndex(idx); setOverlayVisible(true); }} />
        </View>

        {/* Credo Bank Financing Banner */}
        <View style={{ paddingHorizontal: 5, marginBottom: 16, marginTop: 16 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/financing-info')}
            style={{ borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 10 }}
          >
            <LinearGradient colors={["#1E293B", "#0F172A"]} style={{ paddingHorizontal: 16, paddingVertical: 24, minHeight: 160, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 8 }}>
                    <Text style={{ color: '#93C5FD', fontWeight: '700', fontSize: 11 }}>Credo Bank • 0%</Text>
                  </View>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.2, marginBottom: 8 }}>0%-იანი განვადება ყველაფერზე</Text>
                  <Text style={{ color: '#CBD5E1', fontSize: 13 }}>შეავსე მოკლე ფორმა და ჩვენი ოპერატორი დაგიკავშირდება</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 12 }}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
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
              onPress={() => { setOpenStoryIndex(0); setOverlayVisible(true); }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="play" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Stories</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>



        <ReminderSection />

        <StoryOverlay
          visible={overlayVisible && openStoryIndex !== null}
          stories={mockStories}
          initialIndex={openStoryIndex ?? 0}
          onClose={() => { setOverlayVisible(false); setOpenStoryIndex(null); }}
        />

        

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={POPULAR_CARD_WIDTH + H_GAP}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: 0 }}
          contentContainerStyle={styles.popularContent}
        >
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


      <CommunitySection />


        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Notifications Modal */}
      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />
    </View>
  );
}