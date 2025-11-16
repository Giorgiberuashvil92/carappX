import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { carwashApi, CarwashBooking } from '../../services/carwashApi';
import { useUser } from '../../contexts/UserContext';
import { useCars } from '../../contexts/CarContext';
import { useToast } from '../../contexts/ToastContext';
import AddModal, { AddModalType } from '../../components/ui/AddModal';
import { carwashLocationApi } from '../../services/carwashLocationApi';
import API_BASE_URL from '../../config/api';

const { width, height } = Dimensions.get('window');




// UI Configuration - Static data for tabs
const FLOATING_TABS = [
  { id: 'locations', title: 'სამრეცხაოები', icon: 'car-outline' },
  { id: 'bookings', title: 'ჯავშნები', icon: 'calendar-outline' },
  { id: 'favorites', title: 'ფავორიტები', icon: 'heart-outline' },
];

// UI Configuration - Static data for filter features
const CAR_WASH_FEATURES = [
  { id: 'night', title: 'ღამის სერვისი', icon: 'moon-outline' },
  { id: 'parking', title: 'პარკინგი', icon: 'car-outline' },
  { id: 'wifi', title: 'WiFi', icon: 'wifi-outline' },
  { id: 'detailing', title: 'დეტეილინგი', icon: 'sparkles-outline' },
  { id: 'eco', title: 'ეკო', icon: 'leaf-outline' },
];

export default function CarWashScreen() {
  const router = useRouter();
  const { user, isAuthenticated, updateUserRole, addToOwnedCarwashes } = useUser();
  const { selectedCar, cars, selectCar } = useCars();
  const { success, error, warning } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userBookings, setUserBookings] = useState<CarwashBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const bannerHeight = useRef(new Animated.Value(180)).current;

  // New filter states
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDistance, setFilterDistance] = useState(10);
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 50000 });
  const [filterSortBy, setFilterSortBy] = useState('rating');
  
  // Floating tab state
  const [activeFloatingTab, setActiveFloatingTab] = useState<'locations' | 'bookings' | 'favorites' | 'my-carwashes'>('locations');
  
  // Favorites state
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  
  // My carwashes state
  const [myCarwashes, setMyCarwashes] = useState<any[]>([]);
  const [allCarwashes, setAllCarwashes] = useState<any[]>([]);
  const [showCarPicker, setShowCarPicker] = useState(false);
  
  // Load my carwashes when user changes
  useEffect(() => {
    const loadMyCarwashes = async () => {
      if (user?.role === 'owner' && user.ownedCarwashes?.length > 0) {
        try {
          // Load carwashes from backend
          const ownedCarwashes = await carwashLocationApi.getLocationsByOwner(user.id);
          setMyCarwashes(ownedCarwashes);
        } catch (error) {
          console.error('❌ [CARWASH] Error loading my carwashes:', error);
          setMyCarwashes([]);
        }
      } else {
        setMyCarwashes([]);
      }
    };

    loadMyCarwashes();
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
        return 'car-outline';
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

  const filteredLocations = useMemo(() => {
    
    let list = allCarwashes;
    
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
  }, [allCarwashes, searchQuery, selectedFeatures, filterDistance, filterPriceRange]);

  // Sort filtered locations
  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      switch (filterSortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
          const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
          return priceA - priceB;
        case 'price_high':
          const priceAHigh = parseInt(a.price.replace(/[^\d]/g, ''));
          const priceBHigh = parseInt(b.price.replace(/[^\d]/g, ''));
          return priceBHigh - priceAHigh;
        case 'distance':
          const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ''));
          const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ''));
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
      const bookings = await carwashApi.getAllBookings(user.id);
      setUserBookings(bookings);
    } catch (err) {
      error('შეცდომა', 'ჯავშნების ჩატვირთვისას მოხდა შეცდომა');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadAllCarwashes = useCallback(async () => {
    try {
      const carwashes = await carwashLocationApi.getAllLocations();
      setAllCarwashes(carwashes);
    } catch (error) {
      console.error('❌ [CARWASH] Error loading carwashes:', error);
      setAllCarwashes([]);
    }
  }, []);

  // Load user bookings on component mount and when user changes
  useEffect(() => {
    loadUserBookings();
  }, [loadUserBookings]);

  // Load all carwashes on component mount
  useEffect(() => {
    loadAllCarwashes();
  }, [loadAllCarwashes]);

  // Auto-refresh when screen comes into focus (e.g., after booking)
  useFocusEffect(
    useCallback(() => {
      loadUserBookings();
      loadAllCarwashes();
    }, [loadUserBookings, loadAllCarwashes])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadUserBookings(), loadAllCarwashes()]);
    setRefreshing(false);
  }, [loadUserBookings, loadAllCarwashes]);

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
      gradient: ['rgba(0, 0, 0, 0.8)', 'rgba(59, 130, 246, 0.9)'],
      title: 'ჩემი ჯავშნები',
      bookings: userBookings.slice(0, 2),
    },
    {
      id: '2',
      background: { uri: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' },
      gradient: ['rgba(17, 24, 39, 0.8)', 'rgba(37, 99, 235, 0.9)'],
      title: 'აქტიური ჯავშნები',
      bookings: userBookings.slice(1, 3),
    },
    {
      id: '3',
      background: { uri: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' },
      gradient: ['rgba(30, 41, 59, 0.8)', 'rgba(29, 78, 216, 0.9)'],
      title: 'პრემიუმ სერვისი',
      bookings: userBookings.slice(0, 2),
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
      category: location.category,
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
      locationCategory: location.category || 'სამრეცხაო',
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
      'Premium': '#3B82F6',
      'Express': '#10B981',
      'Luxury': '#F59E0B',
      'Standard': '#6B7280',
      'Professional': '#8B5CF6',
      'ავტოსერვისი': '#8B5CF6', // mechanic - purple
      'სამრეცხაო': '#3B82F6',   // carwash - blue
      'მაღაზია': '#10B981',      // store - green
    };
    return colors[category] || '#6B7280';
  };

  const resetFilters = () => {
    setFilterDistance(10);
    setFilterPriceRange({ min: 0, max: 50000 });
    setFilterSortBy('rating');
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const getFloatingTabIcon = (tab: string) => {
    switch (tab) {
      case 'locations': return 'car-outline';
      case 'bookings': return 'calendar-outline';
      case 'favorites': return 'heart-outline';
      default: return 'grid-outline';
    }
  };

  const handleFloatingTabChange = (tab: string) => {
    setActiveFloatingTab(tab as 'locations' | 'bookings' | 'favorites' | 'my-carwashes');
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
      case 'my-carwashes':
        return myCarwashes;
      default:
        return sortedLocations;
    }
  };

  const handleLocationPress = (location: any) => {
    console.log('🔍 [CARWASH] Location pressed:', location);
    console.log('🔍 [CARWASH] Location features:', location.features);
    console.log('🔍 [CARWASH] Location services:', location.services);
    console.log('🔍 [CARWASH] Location detailedServices:', location.detailedServices);
    
    // სერვისის ტიპის განსაზღვრება category-ს მიხედვით
    let serviceType = 'carwash'; // default
    if (location.category === 'ავტოსერვისი' || location.category?.toLowerCase().includes('mechanic')) {
      serviceType = 'mechanic';
    } else if (location.category?.toLowerCase().includes('store') || location.category?.toLowerCase().includes('მაღაზია')) {
      serviceType = 'store';
    } else if (location.category === 'Premium' || location.category?.toLowerCase().includes('carwash')) {
      serviceType = 'carwash';
    }
    
    console.log('🔍 [CARWASH] Determined service type:', serviceType, 'for category:', location.category);
    
    router.push({
      pathname: '/details',
      params: {
        id: location.id,
        type: serviceType, // დინამიური ტიპი category-ს მიხედვით
        title: location.name,
        lat: location.latitude || 41.7151,
        lng: location.longitude || 44.8271,
        rating: location.rating,
        distance: location.distance,
        price: location.price,
        address: location.address,
        description: location.description,
        features: JSON.stringify(location.features),
        category: location.category,
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

  const renderLocationCard = (location: any) => (
    <View key={location.id} style={styles.modernCardWithBackground}>
      {/* Background Image */}
      <ImageBackground 
        source={{ uri: location.images?.[0] || location.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }} 
        style={styles.modernBackgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
          style={styles.modernGradientOverlay}
        >
          {/* Header */}
          <View style={styles.modernHeader}>
            <View style={styles.modernProfileSection}>
              <View style={styles.modernAvatarPlaceholder}>
                <Image 
                  source={{ uri: location.images?.[0] || location.image }} 
                  style={styles.modernAvatar} 
                />
              </View>
              <Text style={styles.modernUsername}>{location.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.modernActionButton}
              onPress={(e) => {
                e.stopPropagation();
                // Toggle like functionality
                success('მოწონება', 'მოგეწონათ ეს სამრეცხაო! ❤️');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={16} color="#FFFFFF" />
              <Text style={styles.modernActionText}>{location.reviews || 200}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Main Card */}
          <TouchableOpacity 
            style={styles.modernMainCard}
            onPress={() => handleLocationPress(location)}
            activeOpacity={0.95}
          >
            {/* Location Info */}
            {/* <View style={styles.modernLocationSection}>
              <View style={styles.modernLocationRow}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <Text style={styles.modernCoordinates}>
                  {location.latitude || '41.717690'}, {location.longitude || '44.828039'}
                </Text>
              </View>
            </View> */}
            
            {/* Separator Line */}
            <View style={styles.modernSeparator} />
            
            {/* Rating Section with Call Button */}
            <View style={styles.modernRatingSection}>
              <View style={styles.modernRatingLeft}>
                {/* <Text style={styles.modernReviewsCount}>{location.reviews || 30}</Text> */}
                {/* <View style={styles.modernDot} /> */}
                {/* <View style={styles.modernStarRow}> */}
                  {/* <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.modernRating}>{location.rating || '4.6'}</Text>
                </View> */}
              </View>
              
              {/* Call Button */}
              <TouchableOpacity 
                style={styles.modernCallButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // Show phone number from location info
                  const phoneNumber = location.phone || location.contact || '555-123-456';
                  success('სამრეცხაოს ნომერი', `📞 ${phoneNumber}`);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Actions Footer */}
            <View style={styles.modernActionsFooter}>
              <View style={styles.modernActionsLeft}>
               
                
                <TouchableOpacity 
                  style={styles.modernActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Navigate to comments
                    router.push({
                      pathname: '/details',
                      params: {
                        id: location.id,
                        type: 'carwash',
                        title: location.name,
                        scrollToComments: 'true'
                      }
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modernActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    success('გაზიარება', 'სამრეცხაო წარმატებით გაზიარდა! 📤');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.modernBookButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBooking(location);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
                <Text style={styles.modernBookButtonText}>ჯავშნა</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  const renderFilterModal = () => (
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
                <Text style={styles.filterDistanceText}>{filterDistance} კმ-ში</Text>
                </View>
              </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>ფასის დიაპაზონი</Text>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceRangeText}>{filterPriceRange.min}₾ - {filterPriceRange.max}₾</Text>
              </View>
            </View>
            

            {/* Sort By Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>დალაგება</Text>
              <View style={styles.sortContainer}>
                {[
                  { id: 'rating', title: 'რეიტინგი', icon: 'star-outline' },
                  { id: 'price_low', title: 'ფასი (დაბალი)', icon: 'trending-down-outline' },
                  { id: 'price_high', title: 'ფასი (მაღალი)', icon: 'trending-up-outline' },
                  { id: 'distance', title: 'მანძილი', icon: 'location-outline' },
                ].map((sort) => (
                  <TouchableOpacity 
                    key={sort.id}
                    style={[
                      styles.sortOption,
                      filterSortBy === sort.id && styles.sortOptionActive,
                    ]}
                    onPress={() => setFilterSortBy(sort.id)}
                              >
                                <Ionicons 
                      name={sort.icon as any} 
                      size={18} 
                      color={filterSortBy === sort.id ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.sortOptionText,
                      { color: filterSortBy === sort.id ? '#FFFFFF' : '#6B7280' }
                    ]}>
                      {sort.title}
                    </Text>
                              </TouchableOpacity>
                ))}
                            </View>
                          </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>გასუფთავება</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <LinearGradient
                colors={['#111827', '#374151']}
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>სამრეცხაოები</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <View style={styles.headerRightSection}>
            <View style={styles.headerButtonContainer}>
              <TouchableOpacity 
                style={styles.headerAddBtn}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerButtonLabel}>დამატება</Text>
            </View>
            
            <View style={styles.headerButtonContainer}>
              <TouchableOpacity 
                style={styles.headerFilterBtn}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="car-sport" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerButtonLabel}>ფილტრი</Text>
            </View>
            
            {/* Debug: Change user role to owner */}
            {user?.role === 'user' && (
              <View style={styles.headerButtonContainer}>
                <TouchableOpacity 
                  style={[styles.headerFilterBtn, { backgroundColor: '#10B981' }]}
                  onPress={async () => {
                    try {
                      await updateUserRole('owner');
                    } catch (error) {
                      // Error changing user role
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerButtonLabel}>Owner</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Floating Tab Selector */}
        <View style={styles.floatingTabSelector}>
          {FLOATING_TABS.map((tab, idx) => (
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
      </LinearGradient>

        <ScrollView
        style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
            colors={['#111827']}
          />
        }
      >
        {/* Car Selection - AI Style */}
        <View style={styles.carSection}>
          <TouchableOpacity 
            style={styles.carCard}
            onPress={() => {
              if ((cars?.length || 0) === 0) {
                // Show add car modal if no cars
                Alert.alert('მანქანის დამატება', 'ჯერ დაამატეთ მანქანა გარაჟში');
              } else {
                // Show car picker modal
                setShowCarPicker(true);
              }
            }}
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
                  <Ionicons name="swap-horizontal" size={20} color="#6366F1" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="ძებნა სამრეცხაოების..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
      </View>
        </View>

        {/* Owner Banner - Show if user is owner and has carwashes */}
        {user?.role === 'owner' && myCarwashes.length > 0 && (
          <View style={styles.ownerBanner}>
            <View style={styles.ownerBannerContent}>
              <View style={styles.ownerBannerLeft}>
                <View style={styles.ownerBannerIcon}>
                  <Ionicons name="business-outline" size={24} color="#3B82F6" />
                </View>
                <View style={styles.ownerBannerText}>
                  <Text style={styles.ownerBannerTitle}>ჩემი სამრეცხაოები</Text>
                  <Text style={styles.ownerBannerSubtitle}>
                    {myCarwashes.length} სამრეცხაო მართვისთვის
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.ownerBannerButton}
                onPress={() => router.push('/management')}
              >
                <Ionicons name="settings-outline" size={20} color="#3B82F6" />
                <Text style={styles.ownerBannerButtonText}>მართვა</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}


        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {activeFloatingTab === 'bookings' 
              ? `${userBookings.length} ჯავშნა`
              : activeFloatingTab === 'favorites'
              ? `${getTabData().length} ფავორიტი`
              : `${sortedLocations.length} შედეგი`
              
            }
          </Text>
        </View>

        {/* Content based on active tab */}
        <View style={styles.locationsContainer}>
          {activeFloatingTab === 'bookings' ? (
            userBookings.length > 0 ? (
              userBookings.map((booking, index) => (
                <View key={booking.id || index} style={styles.bookingCard}>
                  {/* Booking Card Header */}
                  <View style={styles.bookingCardHeader}>
                    <View style={styles.bookingLocationInfo}>
                      <View style={styles.bookingLocationIcon}>
                        <Ionicons name="car-outline" size={20} color="#3B82F6" />
                      </View>
                      <View style={styles.bookingLocationDetails}>
                        <Text style={styles.bookingLocationName}>{booking.locationName}</Text>
                        <Text style={styles.bookingLocationAddress}>{booking.locationAddress || 'მდებარეობა'}</Text>
                      </View>
                    </View>
                    <View style={[styles.bookingStatus, { backgroundColor: getStatusColor(booking.status) }]}>
                      <Text style={styles.bookingStatusText}>{getStatusText(booking.status)}</Text>
                    </View>
                  </View>

                  {/* Service Details */}
                  <View style={styles.bookingServiceSection}>
                    <View style={styles.bookingServiceInfo}>
                      <Ionicons name="sparkles-outline" size={16} color="#6B7280" />
                      <Text style={styles.bookingServiceName}>{booking.serviceName}</Text>
                    </View>
                    <View style={styles.bookingPriceContainer}>
                      <Text style={styles.bookingPrice}>{booking.servicePrice}₾</Text>
                    </View>
                  </View>

                  {/* Date & Time */}
                  <View style={styles.bookingDateTimeSection}>
                    <View style={styles.bookingDateTimeItem}>
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.bookingDate}>{new Date(booking.bookingDate).toLocaleDateString('ka-GE')}</Text>
                    </View>
                    <View style={styles.bookingDateTimeItem}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.bookingTime}>{booking.bookingTime}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.bookingActions}>
                    <TouchableOpacity style={styles.bookingActionButton}>
                      <Ionicons name="call-outline" size={16} color="#3B82F6" />
                      <Text style={styles.bookingActionText}>დარეკვა</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bookingActionButton}>
                      <Ionicons name="navigate-outline" size={16} color="#10B981" />
                      <Text style={styles.bookingActionText}>ნავიგაცია</Text>
                    </TouchableOpacity>
                    {canCancelBooking(booking) && (
                      <TouchableOpacity 
                        style={styles.bookingCancelButton}
                        onPress={() => cancelBooking(booking.id)}
                      >
                        <Ionicons name="close-outline" size={16} color="#EF4444" />
                        <Text style={styles.bookingCancelText}>გაუქმება</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyStateTitle}>ჯავშნები არ არის</Text>
                <Text style={styles.emptyStateText}>ჯერ არ გაქვთ აქტიური ჯავშნები</Text>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <Text style={styles.emptyStateButtonText}>ახალი ჯავშნა</Text>
                </TouchableOpacity>
              </View>
            )
          ) : activeFloatingTab === 'favorites' ? (
            getTabData().length > 0 ? (
              getTabData().map(renderLocationCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>ფავორიტები არ არის</Text>
                <Text style={styles.emptyStateText}>ჯერ არ გაქვთ მოწონებული სამრეცხაოები</Text>
              </View>
            )
          ) : (
            getTabData().map(renderLocationCard)
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter Modal */}
      {renderFilterModal()}
      
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
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
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

      {/* Add Modal */}
      <AddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={async (type: AddModalType, data: any) => {
          setShowAddModal(false);
          
          // If carwash was added, refresh my carwashes and all carwashes
          if (type === 'carwash' && data?.success) {
           
            
            // If user is not owner yet, change role to owner
            if (user?.role !== 'owner') {
             
              try {
                await updateUserRole('owner');
               
              } catch (error) {
              }
            }
            
            // Add carwash to owned carwashes list (already done in AddModal)
            // await addToOwnedCarwashes(data.data.id);
            
            if (user?.role === 'owner') {
              try {
                const ownedCarwashes = await carwashLocationApi.getLocationsByOwner(user.id);
                setMyCarwashes(ownedCarwashes);
                await loadAllCarwashes();
              } catch (error) {
                // Add the new carwash to the list manually
                const newCarwash = {
                  id: data.data.id,
                  name: data.data.name,
                  address: data.data.address,
                  rating: data.data.rating,
                  reviews: data.data.reviews,
                  distance: 'მდებარეობა',
                  price: `${data.data.price}₾-დან`,
                  services: data.data.services?.split(',') || [],
                  isOpen: data.data.isOpen,
                  waitTime: 'მოლოდინი',
                  category: data.data.category,
                  logo: '🚗', // Default logo
                  image: data.data.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
                  description: data.data.description,
                  features: data.data.features?.split(',') || [],
                };
                setMyCarwashes(prev => [...prev, newCarwash]);
              }
            }
          }
        }}
        defaultType="carwash"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerButtonContainer: {
    alignItems: 'center',
    gap: 4,
  },
  headerAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerFilterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonLabel: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  addIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  addLabel: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginTop: 4,
  },
  // Floating Tab Selector Styles
  floatingTabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginHorizontal: 4,
  },
  floatingTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  floatingTabItemActive: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTabItemText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  floatingTabItemTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  locationsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  // Horizontal Card Design Styles
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  // Horizontal Layout Container
  cardHorizontalContainer: {
    flexDirection: 'row',
    height: 180,
  },
  // Left Side - Image
  cardImageContainerHorizontal: {
    width: 140,
    height: '100%',
    position: 'relative',
  },
  cardImageHorizontal: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImageOverlayHorizontal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'space-between',
    padding: 8,
  },
  cardCategoryBadgeHorizontal: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cardCategoryTextHorizontal: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  cardFavoriteButtonHorizontal: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 6,
    alignSelf: 'flex-end',
  },
  cardOpenBadgeHorizontal: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  cardOpenDotHorizontal: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  cardOpenTextHorizontal: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Inter',
  },
  // Right Side - Content
  cardContentHorizontal: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeaderHorizontal: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  cardTitleHorizontal: {
    fontSize: 17,
    fontFamily: 'Inter',
    color: '#111827',
    flex: 1,
    marginRight: 8,
    fontWeight: '600',
  },
  cardRatingHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRatingTextHorizontal: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#111827',
    fontWeight: '600',
  },
  cardReviewsTextHorizontal: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  cardDescriptionHorizontal: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  cardLocationHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  cardLocationTextHorizontal: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#6B7280',
    flex: 1,
  },
  cardDistanceHorizontal: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#3B82F6',
    fontWeight: '600',
  },
  cardPriceTimeHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardPriceHorizontal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardPriceLabelHorizontal: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  cardPriceTextHorizontal: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#111827',
    fontWeight: '600',
  },
  cardTimeHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardTimeTextHorizontal: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  // Horizontal Booking Button Styles
  bookingButtonHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 4,
  },
  bookingButtonTextHorizontal: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Legacy Booking Button Styles (for other components)
  bookingButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bookingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: '#111827',
    borderRadius: 12,
  },
  bookingButtonText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  // Booking Card Styles
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  bookingLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingLocationDetails: {
    flex: 1,
  },
  bookingLocationName: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#111827',
    marginBottom: 4,
  },
  bookingLocationAddress: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  bookingStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bookingStatusText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  bookingServiceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  bookingServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingServiceName: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
    marginLeft: 8,
  },
  bookingPriceContainer: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookingPrice: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  bookingDateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bookingDateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingDate: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 8,
  },
  bookingTime: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bookingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  bookingActionText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#374151',
    marginLeft: 6,
  },
  bookingCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  bookingCancelText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#EF4444',
    marginLeft: 6,
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 16,
  },
  distanceContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterDistanceText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
  },
  priceRangeContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  priceRangeText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
    flex: 1,
    minWidth: '45%',
  },
  sortOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  sortOptionText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  // Owner Banner Styles
  ownerBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ownerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  ownerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownerBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerBannerText: {
    flex: 1,
  },
  ownerBannerTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#111827',
    marginBottom: 2,
  },
  ownerBannerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  ownerBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ownerBannerButtonText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#3B82F6',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  
  // სოციალური მედიის ქარდების სტილები
  socialMediaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  
  socialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  
  socialProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  socialProfileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  socialProfileInfo: {
    gap: 2,
  },
  
  socialProfileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  
  socialPostTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  
  socialMoreButton: {
    padding: 4,
  },
  
  socialCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  
  socialPostText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  
  socialPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  
  socialLocationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  
  socialLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  
  socialLocationText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    flex: 1,
  },
  
  socialRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  socialRatingText: {
    fontSize: 12,
    color: '#111827',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  
  socialOfferBanner: {
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  socialOfferGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  
  socialOfferText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  
  socialOfferSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    opacity: 0.9,
  },
  
  socialInteractionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  
  socialInteractionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  socialInteractionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  socialInteractionText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  
  socialBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  
  socialBookText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  
  // Instagram-ის ზუსტი სტილის ქარდები
  instagramCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  instagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  instagramProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  instagramAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  
  instagramProfileInfo: {
    gap: 1,
  },
  
  instagramUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    fontFamily: 'Inter',
  },
  
  instagramTime: {
    fontSize: 12,
    color: '#8E8E8E',
    fontFamily: 'Inter',
  },
  
  instagramMoreButton: {
    padding: 4,
  },
  
  instagramMainImage: {
    width: '100%',
    height: 375,
    resizeMode: 'cover',
  },
  
  instagramInteractionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  instagramInteractionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  instagramInteractionButton: {
    padding: 2,
  },
  
  instagramLikes: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  
  instagramLikesText: {
    fontSize: 14,
    color: '#262626',
    fontFamily: 'Inter',
  },
  
  instagramBoldText: {
    fontWeight: '600',
  },
  
  instagramCaption: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  
  instagramCaptionText: {
    fontSize: 14,
    color: '#262626',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  
  instagramLocationInfo: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  
  instagramLocationText: {
    fontSize: 12,
    color: '#8E8E8E',
    fontFamily: 'Inter',
  },
  
  instagramComments: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  
  instagramCommentsText: {
    fontSize: 14,
    color: '#262626',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  
  instagramViewComments: {
    fontSize: 14,
    color: '#8E8E8E',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  
  instagramBookButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  instagramBookGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  
  instagramBookText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  
  // Story სტილის ქარდები - სამრეცხაოს ფოტო უკან, გამჭირვალე ღილაკები ზედა
  storyStyleCard: {
    height: 400,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  
  storyBackgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  
  storyGradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  
  storyProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  storyAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  
  storyAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  storyProfileInfo: {
    gap: 2,
  },
  
  storyUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  storyTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  storyMoreButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
    backdropFilter: 'blur(10px)',
  },
  
  storyActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backdropFilter: 'blur(15px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  
  storyActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  storyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  storyActionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  storyBookButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  storyInfoOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 12,
    backdropFilter: 'blur(10px)',
  },
  
  storyLocationText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 4,
  },
  
  storyPriceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter',
  },
  
  // მოდერნული კარდების სტილები - ინსპირაცია მოცემული იმიჯიდან
  modernCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    paddingBottom: 16,
  },
  
  modernCardWithBackground: {
    height: 220,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  modernBackgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  
  modernGradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  
  modernProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  modernAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  
  modernAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  modernUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  
  modernMoreButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  modernMainCard: {
    // backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 8,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    // borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  modernLocationSection: {
    marginBottom: 12,
  },
  
  modernLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  modernCoordinates: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  
  modernSeparator: {
    height: 1,
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  
  modernRatingSection: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  modernRatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  modernReviewsCount: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  
  modernDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  
  modernStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  modernRating: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  
  modernActionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  modernActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  
  modernActionText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  
  modernBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  modernBookButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  
  modernCallButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Car Section - AI Style
  carSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  carMeta: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  changeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Car Picker Modal Styles
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  carRowMeta: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
});