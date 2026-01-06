import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  RefreshControl,
  StatusBar,
  ImageBackground,
  FlatList,
  Alert,
  Animated,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { carwashApi, CarwashBooking } from '../../services/carwashApi';
import { useUser } from '../../contexts/UserContext';
import { useCars } from '../../contexts/CarContext';
import { useToast } from '../../contexts/ToastContext';
import { carwashLocationApi } from '../../services/carwashLocationApi';
import API_BASE_URL from '../../config/api';

const { width, height } = Dimensions.get('window');

// UI Configuration - Static data for tabs
const FLOATING_TABS = [
  { id: 'locations', title: 'ავტოსერვისები', icon: 'build-outline' },
  { id: 'bookings', title: 'ჯავშნები', icon: 'calendar-outline' },
  { id: 'favorites', title: 'ფავორიტები', icon: 'heart-outline' },
];

// UI Configuration - Static data for filter features
const SERVICE_FEATURES = [
  { id: 'night', title: 'ღამის სერვისი', icon: 'moon-outline' },
  { id: 'parking', title: 'პარკინგი', icon: 'car-outline' },
  { id: 'wifi', title: 'WiFi', icon: 'wifi-outline' },
  { id: 'detailing', title: 'დეტეილინგი', icon: 'sparkles-outline' },
  { id: 'eco', title: 'ეკო', icon: 'leaf-outline' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateUserRole, addToOwnedCarwashes } = useUser();
  const { selectedCar, cars, selectCar } = useCars();
  const { success, error, warning } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userBookings, setUserBookings] = useState<CarwashBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(true);
  const [activeChip, setActiveChip] = useState<'top' | 'near' | 'cheap'>('top');
  const [openOnly, setOpenOnly] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const bannerHeight = useRef(new Animated.Value(180)).current;

  // New filter states
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDistance, setFilterDistance] = useState(10);
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 50000 });
  const [filterSortBy, setFilterSortBy] = useState('rating');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterServices, setFilterServices] = useState<string[]>([]);
  
  // Available categories and services for filtering
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const availableServiceTypes = [
    'ძრავის შეკეთება',
    'ტრანსმისიის შეკეთება',
    'ფარების შეკეთება',
    'საბურავების შეცვლა',
    'ბლოკ-ფარების შეკეთება',
    'ინტერიერის შეკეთება',
    'ელექტრონიკის შეკეთება',
    'ჰიდრავლიკის შეკეთება',
    'საბურავების დაბალანსება',
    'საწვავის სისტემის შეკეთება',
    'გაგრილების სისტემის შეკეთება',
    'საბრეიკო სისტემის შეკეთება',
    'საბურავების შეკეთება',
  ];
  
  // Floating tab state
  const [activeFloatingTab, setActiveFloatingTab] = useState<'locations' | 'bookings' | 'favorites' | 'my-services'>('locations');
  
  // Favorites state
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  
  // My services state
  const [myServices, setMyServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [showCarPicker, setShowCarPicker] = useState(false);
  
  // Load my services when user changes
  useEffect(() => {
    const loadMyServices = async () => {
      if (user?.role === 'owner' && user.ownedCarwashes?.length > 0) {
        try {
          const ownedServices = await carwashLocationApi.getLocationsByOwner(user.id);
          const filteredServices = ownedServices.filter((s: any) => 
            s.category === 'ავტოსერვისი' || s.category?.toLowerCase().includes('service')
          );
          setMyServices(filteredServices);
        } catch (error) {
          console.error('❌ [SERVICES] Error loading my services:', error);
          setMyServices([]);
        }
      } else {
        setMyServices([]);
      }
    };

    loadMyServices();
  }, [user?.role, user?.ownedCarwashes]);
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'car-wash':
        return 'water';
      case 'spray':
        return 'water-outline';
      case 'vacuum':
        return 'remove-circle-outline';
      case 'trash':
        return 'trash-outline';
      case 'wheel':
        return 'car-sport-outline';
      default:
        return 'build-outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'მოლოდინში';
      case 'confirmed':
        return 'დადასტურებული';
      case 'in_progress':
        return 'მიმდინარე';
      case 'completed':
        return 'დასრულებული';
      case 'cancelled':
        return 'გაუქმებული';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#D97706'; // Orange
      case 'confirmed':
        return '#1D4ED8'; // Blue
      case 'in_progress':
        return '#059669'; // Green
      case 'completed':
        return '#047857'; // Dark Green
      case 'cancelled':
        return '#DC2626'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  // Check if booking can be cancelled (more than 2 hours remaining and not started)
  const canCancelBooking = (booking: CarwashBooking) => {
    const now = new Date();
    const bookingDateTime = new Date(booking.bookingDate);
    
    // If booking is already completed, cancelled, or in progress, can't cancel
    if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'in_progress') {
      return false;
    }
    
    // Calculate time difference in hours
    const timeDiffInHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can cancel if more than 2 hours remaining
    return timeDiffInHours > 2;
  };

  // Cancel booking function
  const cancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/carwash/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        // Refresh bookings
        loadUserBookings();
        success('წარმატება', 'ჯავშნა წარმატებით გაუქმდა');
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      error('შეცდომა', 'ჯავშნის გაუქმება ვერ მოხერხდა');
    }
  };

  const toggleBanner = () => {
    const newExpandedState = !bannerExpanded;
    const toValue = newExpandedState ? 180 : 80;
    
    setBannerExpanded(newExpandedState);
    
    Animated.timing(bannerHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleChipPress = (chipId: 'top' | 'near' | 'cheap' | 'open') => {
    if (chipId === 'open') {
      setOpenOnly((prev) => !prev);
      return;
    }

    setActiveChip(chipId as 'top' | 'near' | 'cheap');

    switch (chipId) {
      case 'top':
        setFilterSortBy('rating');
        break;
      case 'near':
        setFilterSortBy('distance');
        setFilterDistance(8);
        break;
      case 'cheap':
        setFilterSortBy('price_low');
        break;
      default:
        break;
    }
  };

  // Filter locations - services are already filtered from backend
  const filteredLocations = useMemo(() => {
    // Services are already filtered from /services/list endpoint
    let list = [...allServices];
    
    // Category filter
    if (filterCategory) {
      list = list.filter(l => l.category === filterCategory);
    }
    
    if (filterServices.length > 0) {
      list = list.filter(l => {
        const serviceTypes = l.services || [];
        return filterServices.some(selectedService => 
          serviceTypes.includes(selectedService)
        );
      });
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.address.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }
    
    // Distance filter
    list = list.filter(l => {
      // Check if distance exists and is a string
      if (!l.distance || typeof l.distance !== 'string') {
        return true; // Include items without distance info
      }
      const dist = parseFloat(l.distance.replace(/[^\d.]/g, ''));
      return dist <= filterDistance;
    });
    
    if (openOnly) {
      list = list.filter((l) => l.isOpen);
    }
    
    // Price filter
    list = list.filter(l => {
      let price: number;
      if (typeof l.price === 'string') {
        price = parseInt(l.price.replace(/[^\d]/g, ''));
      } else if (typeof l.price === 'number') {
        price = l.price;
      } else {
        return true; // Include items without price info
      }
      return price >= filterPriceRange.min && price <= filterPriceRange.max;
    });
    
    return list;
  }, [allServices, searchQuery, selectedFeatures, filterDistance, filterPriceRange, openOnly, filterCategory, filterServices]);

  // Track search
  useEffect(() => {
    if (searchQuery.trim() && filteredLocations.length > 0) {
      analyticsService.logServiceSearched(searchQuery, filteredLocations.length);
    }
  }, [searchQuery, filteredLocations.length]);

  // Sort filtered locations
  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      switch (filterSortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          const priceA = parseInt(String(a.price || '0').replace(/[^\d]/g, ''));
          const priceB = parseInt(String(b.price || '0').replace(/[^\d]/g, ''));
          return priceA - priceB;
        case 'price_high':
          const priceAHigh = parseInt(String(a.price || '0').replace(/[^\d]/g, ''));
          const priceBHigh = parseInt(String(b.price || '0').replace(/[^\d]/g, ''));
          return priceBHigh - priceAHigh;
        case 'distance':
          const distanceA = parseFloat(String(a.distance || '0').replace(/[^\d.]/g, ''));
          const distanceB = parseFloat(String(b.distance || '0').replace(/[^\d.]/g, ''));
          return distanceA - distanceB;
        default:
          return 0;
      }
    });
  }, [filteredLocations, filterSortBy]);

  const loadUserBookings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setLoading(true);
      // Filter bookings to only show service-related bookings
      const allBookings = await carwashApi.getAllBookings(user.id);
      // Filter bookings - we'll show all bookings for now, or filter by location name
      // Since CarwashBooking doesn't have locationCategory, we'll show all bookings
      // In a real app, you'd need to fetch location details to filter by category
      setUserBookings(allBookings);
    } catch (err) {
      error('შეცდომა', 'ჯავშნების ჩატვირთვისას მოხდა შეცდომა');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadAllServices = useCallback(async () => {
    try {
      // Load all services from /services endpoint, then filter for auto services
      const response = await fetch(`${API_BASE_URL}/services`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔧 [SERVICES] Fetched all services:', data.length);
      
      // Ensure data is an array
      const servicesArray = Array.isArray(data) ? data : (data.data || []);
      
      // Filter only auto services (ავტოსერვისები)
      const autoServices = servicesArray.filter((service: any) => {
        const category = service.category || '';
        // Match "ავტოსერვისები" or "ავტოსერვისი" or contains "service"
        return category.includes('ავტოსერვის') || category.toLowerCase().includes('service');
      });
      
      console.log('🔧 [SERVICES] Filtered auto services:', autoServices.length);
      
      // Map backend service format to frontend format
      const services = autoServices.map((service: any) => ({
        id: service.id || service._id,
        name: service.name,
        description: service.description,
        category: service.category || 'ავტოსერვისი',
        location: service.location,
        address: service.address,
        phone: service.phone,
        price: service.price,
        rating: service.rating || 0,
        reviews: service.reviews || 0,
        images: service.images || [],
        avatar: service.avatar,
        services: service.services || [],
        features: service.features,
        isOpen: service.isOpen !== undefined ? service.isOpen : true,
        waitTime: service.waitTime,
        workingHours: service.workingHours,
        status: service.status || 'active',
        latitude: service.latitude,
        longitude: service.longitude,
      }));
      
      console.log('🔧 [SERVICES] Mapped services:', services.length);
      setAllServices(services);
    } catch (error) {
      console.error('❌ [SERVICES] Error loading services:', error);
      // Fallback to carwashLocationApi on error
      try {
        const allLocations = await carwashLocationApi.getAllLocations();
        const services = allLocations.filter((location: any) => 
          location.category === 'ავტოსერვისი' || 
          location.category?.toLowerCase().includes('service') ||
          location.category?.toLowerCase().includes('ავტოსერვისი')
        );
        setAllServices(services);
      } catch (fallbackError) {
        console.error('❌ [SERVICES] Fallback also failed:', fallbackError);
        setAllServices([]);
      }
    }
  }, []);

  // Load user bookings on component mount and when user changes
  useEffect(() => {
    loadUserBookings();
  }, [loadUserBookings]);

  // Load all services on component mount
  useEffect(() => {
    loadAllServices();
  }, [loadAllServices]);

  // Auto-refresh when screen comes into focus (e.g., after booking)
  useFocusEffect(
    useCallback(() => {
      loadUserBookings();
      loadAllServices();
    }, [loadUserBookings, loadAllServices])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadUserBookings(), loadAllServices()]);
    setRefreshing(false);
  }, [loadUserBookings, loadAllServices]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const bannerData = useMemo(() => [
    {
      id: '1',
      background: { uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' },
      gradient: ['rgba(0, 0, 0, 0.8)', 'rgba(139, 92, 246, 0.9)'],
      title: 'ჩემი ჯავშნები',
      bookings: userBookings.slice(0, 2),
    },
    {
      id: '2',
      background: { uri: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' },
      gradient: ['rgba(17, 24, 39, 0.8)', 'rgba(139, 92, 246, 0.9)'],
      title: 'აქტიური ჯავშნები',
      bookings: userBookings.slice(1, 3),
    },
  ], [userBookings]);

  const handleBooking = (location: any) => {
    // Create the same detailed params as in details.tsx
    const locationObject = {
      id: location.id,
      name: location.name,
      address: location.address,
      rating: location.rating,
      reviews: location.reviews,
      distance: location.distance,
      price: location.price,
      image: location.image,
      category: location.category || 'ავტოსერვისი',
      isOpen: location.isOpen,
      waitTime: location.waitTime,
      features: location.features || [],
      services: location.services || [],
      detailedServices: location.detailedServices || [],
      timeSlotsConfig: location.timeSlotsConfig || {},
      availableSlots: location.availableSlots || [],
      realTimeStatus: location.realTimeStatus || {},
      workingHours: location.workingHours || '09:00 - 18:00',
      latitude: location.latitude || 41.7151,
      longitude: location.longitude || 44.8271,
    };

    const bookingParams = {
      location: JSON.stringify(locationObject),
      locationName: location.name,
      locationAddress: location.address,
      locationRating: location.rating?.toString() || '4.9',
      locationReviews: location.reviews?.toString() || '89',
      locationDistance: location.distance || '1.2 კმ',
      locationPrice: location.price || '15₾',
      locationImage: location.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
      locationCategory: location.category || 'ავტოსერვისი',
      locationIsOpen: location.isOpen?.toString() || 'true',
      locationWaitTime: location.waitTime || 'მოლოდინი',
      locationFeatures: JSON.stringify(location.features || []),
      locationServices: JSON.stringify(location.services || []),
      locationDetailedServices: JSON.stringify(location.detailedServices || []),
      locationTimeSlotsConfig: JSON.stringify(location.timeSlotsConfig || {}),
      locationAvailableSlots: JSON.stringify(location.availableSlots || []),
      locationRealTimeStatus: JSON.stringify(location.realTimeStatus || {}),
      locationWorkingHours: location.workingHours || '09:00 - 18:00',
    };

    router.push({
      pathname: '/booking',
      params: bookingParams
    });
  };

  const handleBookingAction = async (bookingId: string, action: 'cancel' | 'confirm' | 'start' | 'complete') => {
    try {
      setLoading(true);
      let updatedBooking: CarwashBooking;
      
      switch (action) {
        case 'cancel':
          updatedBooking = await carwashApi.cancelBooking(bookingId);
          break;
        case 'confirm':
          updatedBooking = await carwashApi.confirmBooking(bookingId);
          break;
        case 'start':
          updatedBooking = await carwashApi.startBooking(bookingId);
          break;
        case 'complete':
          updatedBooking = await carwashApi.completeBooking(bookingId);
          break;
        default:
          throw new Error('Invalid action');
      }
      
      // Update local state
      setUserBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId ? updatedBooking : booking
        )
      );
      
      success('წარმატება', 'ჯავშანი წარმატებით განახლდა');
    } catch (err) {
      error('შეცდომა', 'ჯავშნის განახლებისას მოხდა შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Premium': '#8B5CF6',
      'Express': '#10B981',
      'Luxury': '#F59E0B',
      'Standard': '#6B7280',
      'Professional': '#8B5CF6',
      'ავტოსერვისი': '#8B5CF6', // service - purple
      'სამრეცხაო': '#3B82F6',   // carwash - blue
      'მაღაზია': '#10B981',      // store - green
    };
    return colors[category] || '#8B5CF6';
  };

  const resetFilters = () => {
    setFilterDistance(10);
    setFilterPriceRange({ min: 0, max: 50000 });
    setFilterSortBy('rating');
    setFilterCategory('');
    setFilterServices([]);
  };

  const applyFilters = () => {
    setFilterDistance(localFilterDistance);
    setFilterPriceRange(localFilterPriceRange);
    setFilterSortBy(localFilterSortBy);
    setFilterCategory(localFilterCategory);
    setFilterServices(localFilterServices);
    setShowFilterModal(false);
    
    // Track filter applied
    if (localFilterCategory) {
      analyticsService.logFilterApplied('category', localFilterCategory);
    }
    if (localFilterServices.length > 0) {
      analyticsService.logFilterApplied('services', localFilterServices.join(','));
    }
    if (localFilterSortBy) {
      analyticsService.logFilterApplied('sort_by', localFilterSortBy);
    }
  };

  const getFloatingTabIcon = (tab: string) => {
    switch (tab) {
      case 'locations': return 'build-outline';
      case 'bookings': return 'calendar-outline';
      case 'favorites': return 'heart-outline';
      default: return 'grid-outline';
    }
  };

  const handleFloatingTabChange = (tab: string) => {
    setActiveFloatingTab(tab as 'locations' | 'bookings' | 'favorites' | 'my-services');
  };

  const toggleFavorite = (locationId: string) => {
    setFavoriteLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const isFavorite = (locationId: string) => {
    return favoriteLocations.includes(locationId);
  };

  // Get data based on active tab
  const getTabData = () => {
    switch (activeFloatingTab) {
      case 'locations':
        return sortedLocations;
      case 'bookings':
        return userBookings;
      case 'favorites':
        return sortedLocations.filter(location => isFavorite(location.id));
      case 'my-services':
        return myServices;
      default:
        return sortedLocations;
    }
  };

  const handleLocationPress = (location: any) => {
    router.push({
      pathname: '/details',
      params: {
        id: location.id,
        type: 'service', // Service type for auto services
        title: location.name,
        lat: location.latitude || 41.7151,
        lng: location.longitude || 44.8271,
        rating: location.rating,
        distance: location.distance,
        price: location.price,
        address: location.address,
        description: location.description,
        features: JSON.stringify(location.features),
        category: location.category || 'ავტოსერვისი',
        isOpen: location.isOpen,
        waitTime: location.waitTime,
        reviews: location.reviews,
        services: JSON.stringify(location.services),
        detailedServices: JSON.stringify(location.detailedServices || []),
        timeSlotsConfig: JSON.stringify(location.timeSlotsConfig || {}),
        availableSlots: JSON.stringify(location.availableSlots || []),
        realTimeStatus: JSON.stringify(location.realTimeStatus || {}),
        workingHours: location.workingHours,
        image: location.images?.[0] || location.image,
      }
    });
  };

  // Local filter states for modal
  const [localFilterDistance, setLocalFilterDistance] = useState(filterDistance);
  const [localFilterPriceRange, setLocalFilterPriceRange] = useState(filterPriceRange);
  const [localFilterSortBy, setLocalFilterSortBy] = useState(filterSortBy);
  const [localFilterCategory, setLocalFilterCategory] = useState(filterCategory);
  const [localFilterServices, setLocalFilterServices] = useState(filterServices);

  useEffect(() => {
    setLocalFilterDistance(filterDistance);
    setLocalFilterPriceRange(filterPriceRange);
    setLocalFilterSortBy(filterSortBy);
    setLocalFilterCategory(filterCategory);
    setLocalFilterServices(filterServices);
  }, [filterDistance, filterPriceRange, filterSortBy, filterCategory, filterServices]);

  const renderFilterModal = () => {
    return (
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ფილტრები</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Distance Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>მანძილი</Text>
                <View style={styles.distanceContainer}>
                  <Text style={styles.filterDistanceText}>{localFilterDistance} კმ-ში</Text>
                  <View style={styles.distanceButtons}>
                    {[5, 10, 15, 20, 30, 50].map((dist) => (
                      <TouchableOpacity
                        key={dist}
                        style={[
                          styles.distanceButton,
                          localFilterDistance === dist && styles.distanceButtonActive,
                        ]}
                        onPress={() => setLocalFilterDistance(dist)}
                      >
                        <Text style={[
                          styles.distanceButtonText,
                          { color: localFilterDistance === dist ? '#FFFFFF' : '#6B7280' }
                        ]}>
                          {dist} კმ
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>კატეგორია</Text>
                <View style={styles.filterChipsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !localFilterCategory && styles.filterChipActive,
                    ]}
                    onPress={() => setLocalFilterCategory('')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: !localFilterCategory ? '#FFFFFF' : '#6B7280' }
                    ]}>
                      ყველა
                    </Text>
                  </TouchableOpacity>
                  {availableCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterChip,
                        localFilterCategory === category && styles.filterChipActive,
                      ]}
                      onPress={() => setLocalFilterCategory(category)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        { color: localFilterCategory === category ? '#FFFFFF' : '#6B7280' }
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Services Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>სერვისები</Text>
                <View style={styles.filterChipsContainer}>
                  {availableServiceTypes.map((serviceType) => (
                    <TouchableOpacity
                      key={serviceType}
                      style={[
                        styles.filterChip,
                        localFilterServices.includes(serviceType) && styles.filterChipActive,
                      ]}
                      onPress={() => {
                        if (localFilterServices.includes(serviceType)) {
                          setLocalFilterServices(localFilterServices.filter(s => s !== serviceType));
                        } else {
                          setLocalFilterServices([...localFilterServices, serviceType]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.filterChipText,
                        { color: localFilterServices.includes(serviceType) ? '#FFFFFF' : '#6B7280' }
                      ]}>
                        {serviceType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort By Filter */}
             
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => {
                  setLocalFilterDistance(10);
                  setLocalFilterPriceRange({ min: 0, max: 50000 });
                  setLocalFilterSortBy('rating');
                  resetFilters();
                }}
              >
                <Text style={styles.resetButtonText}>გასუფთავება</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => {
                  applyFilters();
                }}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>გამოყენება</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderLocationCard = ({ item: location }: { item: any }) => {
    const priceText = typeof location.price === 'string' ? location.price : `${location.price || 'ფასი'}₾`;

    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={() => handleLocationPress(location)}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: location.images?.[0] || location.image || 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=400&auto=format&fit=crop' }}
          style={styles.cardImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleSection}>
                <Text style={styles.cardTitle} numberOfLines={1}>{location.name}</Text>
                <View style={styles.cardRatingRow}>
                  <Ionicons name="star" size={14} color="#FDE68A" />
                  <Text style={styles.cardRating}>{location.rating?.toFixed(1) || '4.5'}</Text>
                  {location.reviews && (
                    <Text style={styles.cardReviews}>({location.reviews})</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(location.id);
                }}
                style={styles.favoriteButton}
              >
                <Ionicons 
                  name={isFavorite(location.id) ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isFavorite(location.id) ? "#EF4444" : "#FFFFFF"} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cardFooter}>
              <View style={styles.cardMetaRow}>
                {location.distance && (
                  <View style={styles.cardMetaItem}>
                    <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.cardMetaText}>{location.distance}</Text>
                  </View>
                )}
                {location.isOpen !== undefined && (
                  <View style={styles.cardMetaItem}>
                    <View style={[styles.statusDot, { backgroundColor: location.isOpen ? '#10B981' : '#EF4444' }]} />
                    <Text style={styles.cardMetaText}>
                      {location.isOpen ? 'ღიაა' : 'დახურულია'}
                    </Text>
                  </View>
                )}
              </View>
              {location.price && (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>{priceText}</Text>
                </View>
              )}
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.innovativeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Main Content with Header inside ScrollView */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Innovative Header */}
          <LinearGradient
            colors={['#F8FAFC', '#FFFFFF']}
            style={styles.innovativeHeader}
          >
            <SafeAreaView>
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.backBtn} onPress={() => {
                  router.back();
                }}>
                  <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                
                <View style={styles.headerCenter}>
                  <Text style={styles.innovativeTitle}>ავტოსერვისები</Text>
                  <View style={styles.titleUnderline} />
                </View>
                
                <View style={styles.headerRightSection}>
                  <TouchableOpacity 
                    style={styles.headerAddBtn}
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addBtnContent}>
                      <Ionicons name="build" size={20} color="#FFFFFF" />
                      <Ionicons name="add-circle" size={14} color="#FFFFFF" style={styles.addIcon} />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.addLabel}>სერვისის დამატება</Text>
                </View>
              </View>
              
              {/* Floating Tab Selector */}
              <View style={styles.floatingTabSelector}>
                {FLOATING_TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => handleFloatingTabChange(tab.id)}
                    style={[
                      styles.floatingTabItem,
                      activeFloatingTab === tab.id && styles.floatingTabItemActive
                    ]}
                  >
                    <View style={styles.tabIconWrapper}>
                      <Ionicons 
                        name={getFloatingTabIcon(tab.id) as any} 
                        size={20} 
                        color={activeFloatingTab === tab.id ? "#FFFFFF" : "#111827"} 
                      />
                    </View>
                    <Text style={[
                      styles.floatingTabItemText, 
                      activeFloatingTab === tab.id && styles.floatingTabItemTextActive
                    ]}>
                      {tab.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Search Section */}
              <View style={styles.aiSearchSection}>
                <View style={styles.searchWrap}>
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="ძებნა ავტოსერვისებში..."
                    placeholderTextColor="#6B7280"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Filter Button */}
                <TouchableOpacity 
                  style={styles.simpleFilterButton}
                  onPress={() => setShowFilterModal(true)}
                  activeOpacity={0.9}
                >
                  <View style={styles.simpleFilterContent}>
                    <View style={styles.simpleFilterLeft}>
                      <Ionicons name="options" size={20} color="#3B82F6" />
                      <Text style={styles.simpleFilterText}>ფილტრაცია</Text>
                    </View>
                    <View style={styles.simpleFilterRight}>
                      <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
          {/* Popular Services / Advertisement Cards */}
         

          {/* Top Services Section */}
    

          {/* All Services List */}
          {activeFloatingTab === 'locations' && sortedLocations.length > 0 && (
            <View style={styles.modernSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.modernSectionTitle}>ყველა სერვისი</Text>
              </View>
              <View style={styles.modernServicesContainer}>
                {sortedLocations.map((location, index) => (
                  <TouchableOpacity
                    key={location.id || index}
                    style={styles.modernServiceCard}
                    onPress={() => handleLocationPress(location)}
                    activeOpacity={0.9}
                  >
                    <ImageBackground 
                      source={{
                        uri: location.images?.[0] || location.image || 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=800&auto=format&fit=crop'
                      }}
                      style={styles.modernServiceBackgroundImage}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
                        style={styles.modernServiceGradientOverlay}
                      >
                        <View style={styles.modernServiceHeader}>
                          <View style={styles.modernServiceProfileSection}>
                            <View style={styles.modernServiceAvatarPlaceholder}>
                              {location.avatar ? (
                                <Image source={{ uri: location.avatar }} style={styles.modernServiceAvatar} />
                              ) : (
                                <View style={styles.modernServiceAvatarPlaceholderInner}>
                                  <Ionicons name="build" size={14} color="#FFFFFF" />
                                </View>
                              )}
                            </View>
                            <Text style={styles.modernServiceUsername} numberOfLines={1}>
                              {location.name}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleFavorite(location.id);
                            }}
                            style={styles.modernServiceLikeButton}
                          >
                            <Ionicons 
                              name={isFavorite(location.id) ? "heart" : "heart-outline"} 
                              size={10} 
                              color="#FFFFFF" 
                            />
                            <Text style={styles.modernServiceActionText}>0</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.modernServiceMainCard}>
                          <View style={styles.modernServiceInfoSection}>
                            <View style={styles.modernServiceCategoryButton}>
                              <Text style={styles.modernServiceCategoryText} numberOfLines={1}>
                                {location.category || 'ავტოსერვისი'}
                              </Text>
                            </View>
                            {location.price && (
                              <View style={styles.modernServicePriceButton}>
                                <Text style={styles.modernServicePriceText}>
                                  {typeof location.price === 'string' ? location.price : `${location.price}₾`}
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.modernServiceSeparator} />

                          <View style={styles.modernServiceTypeSection}>
                            <View style={styles.modernServiceTypeLeft}>
                              <View style={styles.modernServiceLocationRow}>
                                <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.modernServiceLocationText} numberOfLines={1}>
                                  {location.address || location.location || 'თბილისი'}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity 
                              style={styles.modernServiceCallButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                if (location.phone) {
                                  Linking.openURL(`tel:${location.phone}`);
                                }
                              }}
                            >
                              <Ionicons name="call-outline" size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.modernServiceActionsFooter}>
                            <View style={styles.modernServiceActionsLeft}>
                              <View style={styles.modernServiceRatingButton}>
                                <Ionicons name="star" size={10} color="#FDE68A" />
                                <Text style={styles.modernServiceRatingText}>
                                  {location.rating?.toFixed(1) || '4.5'}
                                </Text>
                              </View>
                              {location.isOpen !== undefined && (
                                <View style={[styles.modernServiceStatusBadge, location.isOpen ? styles.modernServiceStatusBadgeOpen : styles.modernServiceStatusBadgeClosed]}>
                                  <View style={[styles.modernServiceStatusDot, location.isOpen ? styles.modernServiceStatusDotOpen : styles.modernServiceStatusDotClosed]} />
                                  <Text style={styles.modernServiceStatusText}>
                                    {location.isOpen ? 'ღიაა' : 'დახურულია'}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeFloatingTab === 'bookings' ? (
            userBookings.length > 0 ? (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.modernSectionTitle}>ჩემი ჯავშნები</Text>
                </View>
                <View style={styles.bookingsScroll}>
                  {userBookings.map((booking, index) => (
                    <View key={booking.id || index} style={styles.modernBookingCard}>
                    <View style={styles.bookingCardTop}>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingName}>{booking.locationName}</Text>
                        <Text style={styles.bookingService}>{booking.serviceName}</Text>
                      </View>
                      <View style={[styles.bookingStatusPill, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                        <View style={[styles.bookingStatusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                        <Text style={[styles.bookingStatusLabel, { color: getStatusColor(booking.status) }]}>
                          {getStatusText(booking.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bookingMeta}>
                      <View style={styles.bookingMetaItem}>
                        <Ionicons name="calendar-outline" size={16} color="#64748B" />
                        <Text style={styles.bookingMetaText}>
                          {new Date(booking.bookingDate).toLocaleDateString('ka-GE')}
                        </Text>
                      </View>
                      <View style={styles.bookingMetaItem}>
                        <Ionicons name="time-outline" size={16} color="#64748B" />
                        <Text style={styles.bookingMetaText}>{booking.bookingTime}</Text>
                      </View>
                      <View style={styles.bookingMetaItem}>
                        <Text style={styles.bookingPriceLabel}>{booking.servicePrice}₾</Text>
                      </View>
                    </View>

                    <View style={styles.bookingActionsRow}>
                      <TouchableOpacity style={styles.bookingActionPill}>
                        <Ionicons name="call-outline" size={16} color="#8B5CF6" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.bookingActionPill}>
                        <Ionicons name="navigate-outline" size={16} color="#8B5CF6" />
                      </TouchableOpacity>
                      {canCancelBooking(booking) && (
                        <TouchableOpacity 
                          style={[styles.bookingActionPill, styles.bookingCancelPill]}
                          onPress={() => cancelBooking(booking.id)}
                        >
                          <Ionicons name="close" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
            ) : (
              <View style={styles.modernEmptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#3B82F6" />
                </View>
                <Text style={styles.emptyTitle}>ჯავშნები არ არის</Text>
                <Text style={styles.emptySubtitle}>დაჯავშნე ავტოსერვისი და აქ გამოჩნდება</Text>
              </View>
            )
          ) : activeFloatingTab === 'favorites' ? (
            getTabData().length > 0 ? (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.modernSectionTitle}>ფავორიტები</Text>
                </View>
                <View style={styles.modernServicesContainer}>
                  {getTabData().map((location, index) => (
                    <TouchableOpacity
                      key={location.id || index}
                      style={styles.modernServiceCard}
                      onPress={() => handleLocationPress(location)}
                      activeOpacity={0.9}
                    >
                      <ImageBackground 
                        source={{
                          uri: location.images?.[0] || location.image || 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=800&auto=format&fit=crop'
                        }}
                        style={styles.modernServiceBackgroundImage}
                        resizeMode="cover"
                      >
                        <LinearGradient
                          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
                          style={styles.modernServiceGradientOverlay}
                        >
                          <View style={styles.modernServiceHeader}>
                            <View style={styles.modernServiceProfileSection}>
                              <View style={styles.modernServiceAvatarPlaceholder}>
                                {location.avatar ? (
                                  <Image source={{ uri: location.avatar }} style={styles.modernServiceAvatar} />
                                ) : (
                                  <View style={styles.modernServiceAvatarPlaceholderInner}>
                                    <Ionicons name="build" size={14} color="#FFFFFF" />
                                  </View>
                                )}
                              </View>
                              <Text style={styles.modernServiceUsername} numberOfLines={1}>
                                {location.name}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                toggleFavorite(location.id);
                              }}
                              style={styles.modernServiceLikeButton}
                            >
                              <Ionicons 
                                name={isFavorite(location.id) ? "heart" : "heart-outline"} 
                                size={12} 
                                color="#FFFFFF" 
                              />
                              <Text style={styles.modernServiceActionText}>0</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.modernServiceMainCard}>
                            <View style={styles.modernServiceInfoSection}>
                              <View style={styles.modernServiceCategoryButton}>
                                <Text style={styles.modernServiceCategoryText} numberOfLines={1}>
                                  {location.category || 'ავტოსერვისი'}
                                </Text>
                              </View>
                              {location.price && (
                                <View style={styles.modernServicePriceButton}>
                                  <Text style={styles.modernServicePriceText}>
                                    {typeof location.price === 'string' ? location.price : `${location.price}₾`}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.modernServiceSeparator} />

                            <View style={styles.modernServiceTypeSection}>
                              <View style={styles.modernServiceTypeLeft}>
                                <View style={styles.modernServiceLocationRow}>
                                  <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                                  <Text style={styles.modernServiceLocationText} numberOfLines={1}>
                                    {location.address || location.location || 'თბილისი'}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity 
                                style={styles.modernServiceCallButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  if (location.phone) {
                                    Linking.openURL(`tel:${location.phone}`);
                                  }
                                }}
                              >
                                <Ionicons name="call-outline" size={12} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>

                            <View style={styles.modernServiceActionsFooter}>
                              <View style={styles.modernServiceActionsLeft}>
                                <View style={styles.modernServiceRatingButton}>
                                  <Ionicons name="star" size={10} color="#FDE68A" />
                                  <Text style={styles.modernServiceRatingText}>
                                    {location.rating?.toFixed(1) || '4.5'}
                                  </Text>
                                </View>
                                {location.isOpen !== undefined && (
                                  <View style={[styles.modernServiceStatusBadge, location.isOpen ? styles.modernServiceStatusBadgeOpen : styles.modernServiceStatusBadgeClosed]}>
                                    <View style={[styles.modernServiceStatusDot, location.isOpen ? styles.modernServiceStatusDotOpen : styles.modernServiceStatusDotClosed]} />
                                    <Text style={styles.modernServiceStatusText}>
                                      {location.isOpen ? 'ღიაა' : 'დახურულია'}
                                    </Text>
                                  </View>
                                )}
                                {(location.verified || location.status === 'verified') && (
                                  <View style={styles.modernServiceVerifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                    <Text style={styles.modernServiceVerifiedText}>ვერიფიცირებული</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        </LinearGradient>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.modernEmptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="heart-outline" size={48} color="#EF4444" />
                </View>
                <Text style={styles.emptyTitle}>ფავორიტები ცარიელია</Text>
                <Text style={styles.emptySubtitle}>მოიწონე ავტოსერვისები და აქ შეინახება</Text>
              </View>
            )
          ) : null}
        </ScrollView>

        {/* Filter Modal */}
        {renderFilterModal()}
      </View>
    </>
  );
}

// Styles - using similar structure to parts.tsx with light theme
const styles = StyleSheet.create({
  // Main Container
  innovativeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Innovative Header
  innovativeHeader: {
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  innovativeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 4,
  },
  headerRightSection: {
    alignItems: 'center',
    gap: 4,
  },
  addLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  headerAddBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addBtnContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1D4ED8',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  // Floating Tab Selector
  floatingTabSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  floatingTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 6,
  },
  floatingTabItemActive: {
    backgroundColor: '#111827',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTabItemText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
  },
  floatingTabItemTextActive: {
    color: '#FFFFFF',
  },

  // AI Search Section
  aiSearchSection: {
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  simpleFilterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  simpleFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  simpleFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  simpleFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  simpleFilterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simpleFilterBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  simpleFilterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },
  modernSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Modern Services Styles
  modernServicesContainer: {
    gap: 12,
  },
  modernServiceCard: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  modernServiceBackgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  modernServiceGradientOverlay: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  modernServiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modernServiceProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  modernServiceAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modernServiceAvatarPlaceholderInner: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernServiceAvatar: {
    width: '100%',
    height: '100%',
  },
  modernServiceUsername: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    flex: 1,
  },
  modernServiceLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  modernServiceActionText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  modernServiceMainCard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modernServiceInfoSection: {
    marginBottom: 6,
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  modernServiceCategoryButton: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
  },
  modernServiceCategoryText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  modernServicePriceButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
  },
  modernServicePriceText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  modernServiceSeparator: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 5,
  },
  modernServiceTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modernServiceTypeLeft: {
    flex: 1,
  },
  modernServiceLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  modernServiceLocationText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  modernServiceCallButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  modernServiceActionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  modernServiceActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modernServiceRatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  modernServiceRatingText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  modernServiceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernServiceStatusBadgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modernServiceStatusBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modernServiceStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  modernServiceStatusDotOpen: {
    backgroundColor: '#10B981',
  },
  modernServiceStatusDotClosed: {
    backgroundColor: '#EF4444',
  },
  modernServiceStatusText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  modernServiceVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modernServiceVerifiedText: {
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Inter',
    fontWeight: '700',
  },

  promoCardsContainer: {
    paddingRight: 20,
    gap: 16,
  },
  promoCard: {
    width: width * 0.85,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginRight: 16,
  },
  promoCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  promoCardImageStyle: {
    borderRadius: 16,
  },
  promoCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  promoCardContent: {
    alignItems: 'flex-start',
  },
  promoCardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
    backdropFilter: 'blur(10px)',
  },
  promoCardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  promoCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  promoCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  promoCardDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  promoCardDiscountText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  promoCardDiscountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  promoCardIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  promoCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  promoCardRatingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  horizontalCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDE68A',
  },
  cardReviews: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priceBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookingsScroll: {
    padding: 16,
    gap: 16,
  },
  modernBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  bookingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookingStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bookingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bookingStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bookingMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingMetaText: {
    fontSize: 14,
    color: '#64748B',
  },
  bookingPriceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  bookingActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bookingActionPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookingCancelPill: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  modernEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  distanceContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterDistanceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 40,
  },
  sliderWrapper: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    marginLeft: -10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  distanceButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceRangeContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B82F6',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

