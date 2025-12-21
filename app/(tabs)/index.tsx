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
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import SubscriptionModal from '../../components/ui/SubscriptionModal';
import API_BASE_URL from '../../config/api';
import ServiceCard from '../../components/ui/ServiceCard';
import CommunitySection from '../../components/ui/CommunitySection';
import ReminderSection from '../../components/ui/ReminderSection';
import StoriesRow from '../../components/ui/StoriesRow';
import StoryViewer from '../../components/ui/StoryViewer';
import StoryOverlay from '../../components/ui/StoryOverlay';
import NotificationsModal from '../../components/ui/NotificationsModal';
import RacingBanner from '../../components/ui/RacingBanner';
import DetailView, { DetailViewProps } from '../../components/DetailView';
import { useEffect } from 'react';
import { getResponsiveDimensions, getResponsiveCardWidth } from '../../utils/responsive';

// Get responsive dimensions
const { screenWidth, contentWidth, horizontalMargin, isTablet } = getResponsiveDimensions();
const H_MARGIN = 20;
const H_GAP = 16;
const POPULAR_CARD_WIDTH = contentWidth - (H_MARGIN * 2);


// Popular services are now fetched from API

export default function TabOneScreen() {
  const router = useRouter();
  // უბრალოდ light mode გამოვიყენოთ error-ის თავიდან ასაცილებლად
  const colors = Colors['light'];
  const { user } = useUser();
  const { subscription, hasActiveSubscription } = useSubscription();
  const displayFirstName = user?.name ? user.name.split(' ')[0] : '';
  const greetingText = React.useMemo(() => {
    const base = displayFirstName ? `გამარჯობა, ${displayFirstName}` : 'გამარჯობა';
    const maxChars = 20;
    const sliced = base.slice(0, Math.max(0, maxChars - 1)); // ვტოვებთ ადგილს ძახილისთვის
    return `${sliced}!`;
  }, [displayFirstName]);
  
  // Promo banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [openStoryIndex, setOpenStoryIndex] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  
  // Refresh stories when overlay closes (to update seen status)
  const refreshStories = React.useCallback(async () => {
    try {
      const userIdParam = user?.id ? `&userId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`${API_BASE_URL}/stories?highlight=true${userIdParam}`);
      const json = await res.json().catch(() => ({}));
      const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      // Log raw items array separately to see full content
      console.log('🔍 Full raw story object:', JSON.stringify(data[0], null, 2));
      if (data[0]?.items) {
        console.log('📦 Raw items array type:', typeof data[0].items);
        console.log('📦 Raw items array:', JSON.stringify(data[0].items, null, 2));
        console.log('📦 Raw items array length:', data[0].items?.length);
        console.log('📦 First item in raw array:', data[0].items?.[0]);
        console.log('📦 Items keys:', Object.keys(data[0].items || {}));
      } else {
        console.log('⚠️ No items field in story');
      }
      
      console.log('📚 Stories fetched from backend:', {
        rawData: data,
        storiesCount: data.length,
        firstStory: data[0] ? {
          id: data[0].id || data[0]._id,
          itemsCount: data[0].items?.length,
          itemsRaw: data[0].items, // Full raw items array
          items: data[0].items?.map((it: any) => ({
            id: it.id,
            _id: it._id,
            type: it.type,
            uri: it.uri,
            url: it.url,
            image: it.image,
            imageUrl: it.imageUrl,
            hasUri: !!it.uri,
            fullItem: it, // Full item object for debugging
          })),
        } : null,
      });
      const mapped = data.map((s: any) => ({
        id: String(s.id || s._id),
        author: { id: String(s.authorId || 'svc'), name: s.authorName || 'Story', avatar: s.authorAvatar },
        createdAt: Number(s.createdAt || Date.now()),
        items: Array.isArray(s.items) ? s.items.map((it: any) => {
          const uri = it.uri || it.url || it.image || it.imageUrl || (typeof it.image === 'object' && it.image?.uri) || '';
          return {
            id: String(it.id || it._id || Math.random()),
            type: it.type || 'image',
            uri: uri,
            durationMs: it.durationMs,
            caption: it.caption,
            poll: it.poll,
          };
        }) : [],
        highlight: !!s.highlight,
        category: s.category,
        seen: !!s.isSeen,
        internalImage: s.internalImage || undefined,
      }));
      
      setStories(mapped);
    } catch (error) {
      console.error('❌ Error fetching stories:', error);
    }
  }, [user?.id]);
  
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [nearbyServices, setNearbyServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state
  const [offers, setOffers] = useState<any[]>([]);
  const [offersLoading, setOffersLoading] = useState<boolean>(false);
  const [quickActionsIndex, setQuickActionsIndex] = useState(0);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const quickActionsList = [
    {
      key: 'assist',
      title: 'დახმარება',
      subtitle: 'ევაკუატორი და გზაზე სწრაფი დახმარება',
      icon: 'car-sport',
      colors: ['#2563EB', '#1D4ED8'],
      pill: '24/7',
      tag: 'სასწრაფო',
      route: '/caru-service' as any,
    },
    {
      key: 'wash',
      title: 'ავტო სამრეცხაო',
      subtitle: 'ბუქინგი უახლოეს სამრეცხაოში',
      icon: 'water',
      colors: ['#22C55E', '#16A34A'],
      pill: 'დაჯავშნა',
      tag: 'ახალი',
      route: '/(tabs)/carwash' as any,
    },
    {
      key: 'loyalty',
      title: 'ლოიალობის პროგრამა',
      subtitle: 'გულების დაგროვება და ფასდაკლებები',
      icon: 'star',
      colors: ['#F59E0B', '#D97706'],
      pill: 'ქულები',
      tag: 'ბონუსი',
      route: '/loyalty' as any,
    },
    {
      key: 'carfax',
      title: 'კარფაქსი',
      subtitle: 'ავტომობილის ისტორიის შემოწმება',
      icon: 'document-text',
      colors: ['#111827', '#0F172A'],
      pill: 'შემოწმება',
      tag: 'დაცვა',
      route: '/carfax' as any,
    },
  ];

  
  // Stories state
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    refreshStories();
  }, [refreshStories]);

  // Show subscription modal on main page load if user doesn't have active subscription
  React.useEffect(() => {
    if (user && !hasActiveSubscription && subscription?.plan === 'free') {
      // Show modal after a short delay to allow page to load
      const timer = setTimeout(() => {
        setShowSubscriptionModal(true);
      }, 2000); // 2 seconds delay
      
      return () => clearTimeout(timer);
    }
  }, [user, hasActiveSubscription, subscription?.plan]);
  
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (screenWidth - 60));
    setCurrentBannerIndex(index);
  };

  // Fetch popular services function
  const fetchServices = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/services/popular?limit=6`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      const formattedServices = data.map((service: any) => ({
        id: service.id,
        name: service.title, // title-ი name-ად
        location: service.location,
        rating: service.rating || 4.5, // default rating
        price: service.price 
          ? (typeof service.price === 'string' ? service.price : `${service.price}₾`)
          : undefined, // თუ price არ არის, undefined დავტოვოთ
        image: typeof service.images?.[0] === 'string'
          ? { uri: service.images[0] }
          : require('../../assets/images/car-bg.png'),
        images: service.images && Array.isArray(service.images) && service.images.length > 0
          ? service.images.map((img: any) => typeof img === 'string' ? img : (img?.uri || img))
          : undefined,
        category: service.category || service.type, // category ან type
        address: service.location, // location address-ად
        phone: service.phone || 'N/A',
        services: [], // დეტალური სერვისები
        isOpen: service.isOpen !== undefined ? service.isOpen : true, // default ღია
        waitTime: 0, // default wait time
        socialMedia: {}, // default social media
        reviews: service.reviews || Math.floor(Math.random() * 50) + 10, // random reviews თუ არ არის
        type: service.type, // ახალი ველი - სერვისის ტიპი
        description: service.description, // აღწერა
      }));
      
      console.log('🎉 Fetched services from new API:', formattedServices);
      setPopularServices(formattedServices);
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      // Fallback static data
      setPopularServices([
        {
          id: '1',
          name: 'ძმაკაცი მოტორსი',
          location: 'ვაჟა-ფშაველას გამზირი',
          rating: 4.8,
          price: '50₾',
          image: require('../../assets/images/car-bg.png'),
          category: 'ავტოსერვისი',
          type: 'carwash',
        }
      ]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchServices(true),
        refreshStories(),
        (async () => {
          setOffersLoading(true);
          try {
            if (!user?.id) return;
            const res = await fetch(`${API_BASE_URL}/offers?userId=${encodeURIComponent(user.id)}`);
            const json = await res.json().catch(() => ({}));
            const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
            setOffers(data);
          } finally { setOffersLoading(false); }
        })(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchServices, refreshStories]);

  

  React.useEffect(() => {
    fetchServices();
  }, []);

  // Initial offers load
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!user?.id) return;
        setOffersLoading(true);
        const res = await fetch(`${API_BASE_URL}/offers?userId=${encodeURIComponent(user.id)}`);
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (!active) return;
        setOffers(data);
      } finally { setOffersLoading(false); }
    })();
    return () => { active = false; };
  }, [user?.id]);

  React.useEffect(() => {
    let active = true;
    const loadUnread = async () => {
      try {
        if (!user?.id) return;
        const res = await fetch(`${API_BASE_URL}/notifications/user/${user.id}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        const list = Array.isArray(json?.data) ? json.data : [];
        const unread = list.filter((n: any) => n?.status !== 'read').length;
        setUnreadCount(unread);
      } catch {}
    };
    loadUnread();
    const t = setInterval(loadUnread, 30000);
    return () => { active = false; clearInterval(t); };
  }, [user?.id]);

  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    contentWrapper: {
      flex: 1,
      maxWidth: isTablet ? contentWidth : undefined,
      alignSelf: isTablet ? 'center' : 'stretch',
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
      paddingHorizontal: 8,
      paddingTop: 18,
      paddingBottom: 10,
      gap: 8,
    },
    quickActions: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    quickActionsScroll: {
      paddingHorizontal: 4,
      paddingVertical: 4,
      gap: 12,
    },
    quickActionCard: {
      width: 230,
      borderRadius: 18,
      overflow: 'hidden' as const,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 5,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
      position: 'relative' as const,
    },
    quickActionSurface: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 18,
      borderWidth: 0,
      gap: 10,
      minHeight: 128,
    },
    quickActionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      position: 'relative' as const,
    },
    quickActionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    quickActionTitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: '#0B1220',
      fontFamily: 'Inter',
      letterSpacing: -0.1,
      lineHeight: 18,
    },
    quickActionSubtitle: {
      fontSize: 12,
      color: '#6B7280',
      fontFamily: 'Inter',
      marginTop: 2,
      lineHeight: 16,
    },
    quickActionBadge: {
      position: 'absolute' as const,
      top: -6,
      right: -6,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.15)',
      zIndex: 2,
      color: '#FFFFFF',
    },
    quickActionBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    quickActionFooter: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    quickActionPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    quickActionPillText: {
      color: '#0B1220',
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    quickActionsIndicatorRow: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingTop: 10,
      paddingBottom: 2,
    },
    quickActionsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#E5E7EB',
    },
    quickActionsDotActive: {
      width: 16,
      backgroundColor: '#0F172A',
    },
    quickActionTextWrap: {
      flex: 1,
      paddingTop: 6,
      paddingRight: 64,
    },
    categoriesContainer: {
      paddingTop: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      color: '#1F2937',
      fontFamily: 'Inter',
      marginBottom: 18,
      fontWeight: '500' as const,
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
     
    // Social cards styles
    socialCard: {
      width: 320,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
    },
    
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingBottom: 12,
    },
    
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    
    profileAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    
    profileInfo: {
      gap: 2,
    },
    
    profileName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      fontFamily: 'Inter',
    },
    
    postTime: {
      fontSize: 12,
      color: '#6B7280',
      fontFamily: 'Inter',
    },
    
    moreButton: {
      padding: 4,
    },
    
    cardContent: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 12,
    },
    
    postText: {
      fontSize: 14,
      color: '#374151',
      lineHeight: 20,
      fontFamily: 'Inter',
    },
    
    postImage: {
      width: '100%',
      height: 180,
      borderRadius: 12,
    },
    
    offerBanner: {
      height: 80,
      borderRadius: 12,
      overflow: 'hidden',
    },
    
    offerGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    offerText: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      fontFamily: 'Inter',
    },
    
    interactionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    
    interactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    
    interactionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    
    interactionText: {
      fontSize: 13,
      color: '#6B7280',
      fontFamily: 'Inter',
      fontWeight: '500',
    },
    
    saveButton: {
      padding: 4,
    },
    
    subscriptionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      marginTop: 6,
      gap: 6,
      borderWidth: 1.5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      position: 'relative',
      overflow: 'hidden',
    },
    subscriptionGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 20,
    },
    // Modern Subscription CTA
    subscriptionCTA: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      backgroundColor: '#FFFFFF'
    },
    subscriptionCTABlur: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 14,
    },
    subscriptionCTAGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
      opacity: 0.08,
    },
    subscriptionCTAIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(59,130,246,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(59,130,246,0.25)'
    },
    subscriptionCTAContent: {
      flex: 1,
    },
    subscriptionCTATitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      fontFamily: 'Inter',
      letterSpacing: 0.2,
    },
    subscriptionCTASubtitle: {
      display: 'none',
    },
    premiumBadge: {
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
    },
    basicBadge: {
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
    },
    freeBadge: {
      backgroundColor: '#10B981',
      borderColor: '#059669',
    },
    
    subscriptionText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Inter',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.contentWrapper, { marginHorizontal: horizontalMargin }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']} // Android
            tintColor="#3B82F6" // iOS
            title="სერვისების განახლება..." // iOS
            titleColor="#6B7280" // iOS
          />
        }
      >
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
                {greetingText}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={14} color={colors.secondary} />
                <Text style={styles.smallLocation}>თბილისი, საქართველო</Text>
              </View>

              {/* Modern Subscription CTA */}
              {/* დროებით არ გვჭირდება პრემიუმ ღილაკი */}
              {/* {!hasActiveSubscription && ( */}
              {/*   <TouchableOpacity
                  onPress={() => setShowSubscriptionModal(true)}
                  activeOpacity={0.9}
                  style={styles.subscriptionCTA}
                >
                  <BlurView intensity={35} tint="light" style={styles.subscriptionCTABlur} />
                  <View style={styles.subscriptionCTAIconWrap}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.subscriptionCTAContent}>
                    <Text style={styles.subscriptionCTATitle}>გახდი პრემიუმ</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
                </TouchableOpacity>
              )} */}
              
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
/* ... */
              style={styles.roundIcon}
              onPress={() => router.push('/map')}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={18} color={'#111827'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.roundIcon}
              onPress={() => setNotificationsModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={18} color={'#111827'} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ინოვაციური Stories სექცია */}
        <View style={{ 
          paddingHorizontal: 5, 
          paddingTop: 10 , 
          paddingBottom: 24,
          marginBottom: 8 
        }}>
          
          {/* მარტივი Stories */}
          <StoriesRow 
            stories={stories} 
            onOpen={(idx) => { 
              setOpenStoryIndex(idx); 
              setOverlayVisible(true); 
            }} 
          />
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

        {/* ახალი სექცია - ჩვენი სერვისები */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>ჩვენი სერვისები</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
            snapToAlignment="start"
            decelerationRate="fast"
            onScroll={(e) => {
              const cardFull = 230 + 12; // width + gap
              const idx = Math.round(e.nativeEvent.contentOffset.x / cardFull);
              setQuickActionsIndex(Math.min(Math.max(idx, 0), quickActionsList.length - 1));
            }}
            scrollEventThrottle={16}
          >
            <View style={styles.quickActions}>
              {quickActionsList.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.quickActionCard}
                  activeOpacity={0.9}
                  onPress={() => router.push(action.route)}
                >
                  <LinearGradient
                    colors={action.colors as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionSurface}
                  >
                    <View style={styles.quickActionHeader}>
                      <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                        <Ionicons name={action.icon as any} size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.quickActionTextWrap}>
                        <Text style={[styles.quickActionTitle, { color: '#FFFFFF', lineHeight: 18 }]} numberOfLines={1} ellipsizeMode="tail">
                          {action.title}
                        </Text>
                        <Text style={[styles.quickActionSubtitle, { color: '#E5E7EB', lineHeight: 16 }]} numberOfLines={2} ellipsizeMode="tail">
                          {action.subtitle}
                        </Text>
                      </View>
                      <View style={styles.quickActionBadge}>
                        <Text style={styles.quickActionBadgeText}>{action.tag}</Text>
                      </View>
                    </View>

                    <View style={styles.quickActionFooter}>
                      <View style={[
                        styles.quickActionPill,
                        { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.28)', borderWidth: 1 }
                      ]}>
                        <Text style={[styles.quickActionPillText, { color: '#FFFFFF' }]}>{action.pill}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.86)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.quickActionsIndicatorRow}>
            {quickActionsList.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.quickActionsDot,
                  i === quickActionsIndex && styles.quickActionsDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </View>



        <ReminderSection />
        

      {/* Quick filter chips moved to Carwash screen */}
      <View style={styles.popularContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>პოპულარული სერვისები</Text>
          <TouchableOpacity onPress={() => router.push('/all-services')}>
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
                type={service.type} // ახალი ველი - სერვისის ტიპი
                onPress={() => {
                  setSelectedService(service);
                  setShowServiceModal(true);
                }}
              />
            ))
          )}
        </ScrollView>
      </View>


      <CommunitySection />


        <View style={{ height: 40 }} />
      </ScrollView>
      </View>

      {/* Story Overlay */}
      <StoryOverlay
        visible={overlayVisible && openStoryIndex !== null}
        stories={stories}
        initialIndex={openStoryIndex ?? 0}
        viewerUserId={user?.id}
        onClose={() => { 
          setOverlayVisible(false); 
          setOpenStoryIndex(null);
          refreshStories();
        }}
      />

      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
        }}
      />

      {/* Service Detail Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowServiceModal(false)}
      >
        {selectedService && (() => {
          const imgParam = typeof selectedService.image === 'string'
            ? selectedService.image
            : (selectedService.image && (selectedService.image as any).uri)
              ? (selectedService.image as any).uri : '';
          
          const serviceType = selectedService.type || 'carwash';
          const phone = selectedService.phone || undefined;
          const address = selectedService.address || selectedService.location || '';
          const basePrice = selectedService.price || undefined;
          
          // Dynamic features based on service type
          const getFeatures = () => {
            const baseFeatures = [
              { icon: 'checkmark-circle', label: 'ხარისხიანი სერვისი' },
              { icon: 'time', label: 'სწრაფი მომსახურება' },
            ];
            
            if (serviceType === 'carwash') {
              return [
                { icon: 'wifi', label: 'WiFi' },
                { icon: 'card', label: 'ბარათით გადახდა' },
                ...baseFeatures,
              ];
            } else if (serviceType === 'store' || serviceType === 'dismantler') {
              return [
                { icon: 'cash', label: 'ნაღდი ანგარიშსწორება' },
                { icon: 'car', label: 'ადგილზე მიტანა' },
                ...baseFeatures,
              ];
            } else if (serviceType === 'mechanic') {
              return [
                { icon: 'hammer', label: 'გამოცდილი ხელოსნები' },
                { icon: 'shield-checkmark', label: 'გარანტია' },
                ...baseFeatures,
              ];
            }
            
            return baseFeatures;
          };

          // Prepare images array
          const serviceImages = selectedService.images && Array.isArray(selectedService.images) && selectedService.images.length > 0
            ? selectedService.images.map((img: any) => typeof img === 'string' ? img : (img?.uri || img))
            : imgParam ? [imgParam] : [];

          const detailViewProps: DetailViewProps = {
            id: selectedService.id,
            title: selectedService.name,
            coverImage: imgParam,
            images: serviceImages.length > 0 ? serviceImages : undefined,
            serviceType: serviceType,
            rating: {
              value: selectedService.rating || 4.9,
              count: selectedService.reviews || 0,
            },
            distance: selectedService.distance || undefined,
            eta: selectedService.waitTime ? `${selectedService.waitTime} წთ` : undefined,
            price: basePrice ? { from: basePrice } : undefined,
            vendor: {
              phone: phone || undefined,
              location: { address: address },
            },
            sections: {
              description: selectedService.description || '',
              features: getFeatures(),
            },
            actions: {
              onBook: serviceType === 'carwash' ? () => {
                const loc = {
                  id: selectedService.id,
                  name: selectedService.name,
                  address: address,
                  image: imgParam,
                  category: selectedService.category || serviceType,
                  isOpen: Boolean(selectedService.isOpen),
                  rating: selectedService.rating || 0,
                  reviews: selectedService.reviews || 0,
                  distance: selectedService.distance || '',
                };
                const ds = selectedService.detailedServices || [];
                const tsc = selectedService.timeSlotsConfig || null;

                setShowServiceModal(false);
                router.push({
                  pathname: '/booking',
                  params: {
                    location: JSON.stringify(loc),
                    locationDetailedServices: JSON.stringify(ds),
                    locationTimeSlotsConfig: JSON.stringify(tsc),
                  },
                });
              } : undefined,
              onCall: phone ? () => Linking.openURL(`tel:${phone}`) : undefined,
              onFinance: (amount) => {
                const fallback = basePrice ? parseInt(String(basePrice).replace(/[^0-9]/g, '')) : 0;
                const a = amount || fallback || 0;
                setShowServiceModal(false);
                router.push(`/financing-request?requestId=${encodeURIComponent(selectedService.id)}&amount=${encodeURIComponent(String(a))}`);
              },
              onShare: () => {},
            },
            flags: {
              stickyCTA: true,
              showFinance: serviceType === 'carwash' || serviceType === 'store',
            },
          };

          return (
            <DetailView 
              {...detailViewProps} 
              onClose={() => setShowServiceModal(false)}
            />
          );
        })()}
      </Modal>

    </View>
  );
}