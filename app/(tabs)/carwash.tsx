import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  Platform,
  FlatList,
  Dimensions,
  Alert,
  Modal,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import Chip from '../../components/ui/Chip';
import { useCars } from '../../contexts/CarContext';

const { width, height } = Dimensions.get('window');

const CAR_WASH_LOCATIONS = [
  {
    id: '1',
    name: 'Premium Car Wash',
    address: 'ვაჟა-ფშაველას 15, თბილისი',
    rating: 4.8,
    reviews: 124,
    distance: '0.8 კმ',
    price: '15₾-დან',
    services: ['სრული სამრეცხაო', 'პრემიუმ სერვისი', 'ცვილის გამოყენება'],
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop',
    isOpen: true,
    waitTime: '10 წთ',
    category: 'Premium',
    discount: '20%',
  },
  {
    id: '2',
    name: 'Express Car Wash',
    address: 'რუსთაველის 45, თბილისი',
    rating: 4.5,
    reviews: 89,
    distance: '1.2 კმ',
    price: '8₾-დან',
    services: ['სწრაფი სამრეცხაო', 'გარე გაწმენდა'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop',
    isOpen: true,
    waitTime: '5 წთ',
    category: 'Express',
  },
  {
    id: '3',
    name: 'Luxury Auto Spa',
    address: 'პეკინის 78, თბილისი',
    rating: 4.9,
    reviews: 203,
    distance: '2.1 კმ',
    price: '25₾-დან',
    services: ['დეტალური სამრეცხაო', 'პრემიუმ სერვისი', 'ცვილის გამოყენება', 'ქიმწმენდა'],
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop',
    isOpen: true,
    waitTime: '15 წთ',
    category: 'Luxury',
    featured: true,
  },
  {
    id: '4',
    name: 'Quick & Clean',
    address: 'აღმაშენებლის 23, თბილისი',
    rating: 4.3,
    reviews: 67,
    distance: '0.5 კმ',
    price: '10₾-დან',
    services: ['სწრაფი სამრეცხაო', 'გარე გაწმენდა'],
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
    isOpen: false,
    waitTime: '20 წთ',
    category: 'Standard',
  },
  {
    id: '5',
    name: 'Professional Car Care',
    address: 'დიდუბის 12, თბილისი',
    rating: 4.7,
    reviews: 156,
    distance: '1.8 კმ',
    price: '20₾-დან',
    services: ['სრული სამრეცხაო', 'პრემიუმ სერვისი', 'ცვილის გამოყენება'],
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop',
    isOpen: true,
    waitTime: '12 წთ',
    category: 'Professional',
  },
];

const CATEGORIES = [
  { id: 'repair', title: 'Repairing', image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=600&auto=format&fit=crop' },
  { id: 'electrical', title: 'Electrical', image: 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=600&auto=format&fit=crop' },
  { id: 'cleaning', title: 'Cleaning', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop' },
  { id: 'painting', title: 'Painting', image: 'https://images.unsplash.com/photo-1510414696678-2415ad8474aa?q=80&w=600&auto=format&fit=crop' },
];



export default function CarWashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { cars, selectedCar, selectCar, addCar } = useCars();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [pressedButtons, setPressedButtons] = useState<{ [key: string]: boolean }>({});
  
  // Custom dialog states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReBookModal, setShowReBookModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  // Form state for adding new car
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
  });

  // UI state
  const [activeFilter, setActiveFilter] = useState<'All' | 'Premium' | 'Express' | 'Luxury' | 'Discount' | 'Open'>('All');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
      position: 'relative',
      paddingBottom: 100,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingBottom: 20,
      backgroundColor: '#F8FAFC',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    carSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      flex: 1,
      marginRight: 12,
    },
    carInfo: {
      flex: 1,
      marginLeft: 12,
    },
    carLabel: {
      fontSize: 12,
      fontFamily: 'Poppins_500Medium',
      color: '#6B7280',
      marginBottom: 2,
    },
    carNumber: {
      fontSize: 16,
      fontFamily: 'Poppins_700Bold',
      color: '#111827',
      letterSpacing: 1,
    },
    addCarButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 15,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    dropdownItemSelected: {
      backgroundColor: '#F0F9FF',
    },
    dropdownCarInfo: {
      flex: 1,
      marginLeft: 12,
    },
    dropdownCarNumber: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
      letterSpacing: 1,
    },
    dropdownCarDetails: {
      fontSize: 12,
      fontFamily: 'Poppins_400Regular',
      color: '#6B7280',
      marginTop: 2,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
    },
    addCarModalContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 15,
    },
    addCarForm: {
      gap: 20,
    },
    formGroup: {
      gap: 8,
    },
    formLabel: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
    },
    formInput: {
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      fontFamily: 'Poppins_400Regular',
      color: '#1F2937',
    },
    addCarSubmitButton: {
      backgroundColor: '#111827',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    addCarButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 16,
      fontFamily: 'Poppins_400Regular',
      color: '#6B7280',
    },
    searchContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    searchInputContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    searchIcon: {
      marginRight: 12,
      color: '#9CA3AF',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Poppins_400Regular',
      color: '#111827',
    },
    // ფილტრების სტილები ამოვიღეთ
    locationCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 6,
      borderWidth: 0,
    },
    locationImage: {
      width: '100%',
      height: 180,
    },
    locationOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
      padding: 16,
      justifyContent: 'space-between',
    },
    locationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    locationName: {
      fontSize: 18,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      flex: 1,
      marginTop: 20,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    categoryBadge: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    categoryText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
    featuredBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: '#F59E0B',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    featuredText: {
      fontSize: 10,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
    },
    discountBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: 'rgba(239, 68, 68, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    discountText: {
      fontSize: 10,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
    },
    locationDetails: { padding: 16, backgroundColor: '#FFFFFF' },
    locationInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    locationAddress: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#6B7280', flex: 1 },
    locationDistance: {
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      color: '#3B82F6',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    ratingText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#111827', marginLeft: 6 },
    reviewsText: {
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
      color: '#9CA3AF',
      marginLeft: 6,
    },
    waitTimeContainer: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    waitTimeText: {
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      color: '#6B7280',
      marginLeft: 4,
    },
    servicesContainer: {
      marginBottom: 12,
    },
    servicesTitle: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: '#111827',
      marginBottom: 8,
    },
    servicesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    serviceTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: '#F3F4F6',
    },
    serviceTagText: {
      fontSize: 11,
      fontFamily: 'Poppins_500Medium',
      color: '#374151',
    },
    priceContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#111827' },
    bookButton: { backgroundColor: '#0B0B0E', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 },
    bookButtonText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
    statusIndicator: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    mapButtonContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    mapButton: {
      backgroundColor: '#111827',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    mapButtonText: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
      marginLeft: 8,
    },
    bookingsSection: {
      marginTop: 24,
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    bookingsButton: {
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 1,
      borderColor: '#E0E7FF',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
    },
    bookingsButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bookingsButtonIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'rgba(255, 255, 255, 0.3)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    bookingsButtonText: {
      flex: 1,
      marginLeft: 20,
    },
    bookingsButtonTitle: {
      fontSize: 16,
      fontFamily: 'Poppins_700Bold',
      color: '#FFFFFF',
      marginBottom: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    bookingsButtonSubtitle: {
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 18,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    userName: {
      fontSize: 16,
      fontFamily: 'Poppins_700Bold',
      color: '#111827',
    },
    locationText: {
      marginLeft: 4,
      fontSize: 12,
      color: '#6B7280',
      fontFamily: 'Poppins_500Medium',
    },
    roundIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    promoCard: {
      marginTop: 4,
      marginHorizontal: 4,
      backgroundColor: '#111827',
      borderRadius: 20,
      overflow: 'hidden',
      height: 160,
      position: 'relative',
    },
    promoImage: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    promoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    promoContent: {
      position: 'absolute',
      left: 16,
      top: 16,
      right: 16,
    },
    promoTitle: {
      fontSize: 22,
      lineHeight: 26,
      color: '#FFFFFF',
      fontFamily: 'Poppins_700Bold',
    },
    promoSubtitle: {
      marginTop: 6,
      color: '#E5E7EB',
      fontFamily: 'Poppins_500Medium',
    },
    promoButton: {
      marginTop: 14,
      alignSelf: 'flex-start',
      backgroundColor: '#6366F1',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    promoButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins_700Bold',
      fontSize: 14,
    },
    filtersContainer: {
      paddingHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
    },
    filterChipActive: {
      backgroundColor: '#EEF2FF',
      borderColor: '#C7D2FE',
    },
    filterChipText: {
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      color: '#111827',
    },
    filterChipTextActive: {
      color: '#3B82F6',
    },
    // Add new style for the list container
    listContainer: {
      marginTop: 20,
      marginBottom: 20,
    },
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      );
    }
    return stars;
  };

  // Monochrome theme — category color not used, keep badge subtle
  const getCategoryColor = () => '#1F1F1F';

  const handleBooking = (location: any) => {
    router.push({
      pathname: '/booking',
      params: { location: JSON.stringify(location) }
    });
  };

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filteredLocations = useMemo(() => {
    let list = CAR_WASH_LOCATIONS;
    if (activeFilter === 'Premium' || activeFilter === 'Express' || activeFilter === 'Luxury') {
      list = list.filter(l => l.category === activeFilter);
    }
    if (activeFilter === 'Discount') {
      list = list.filter(l => !!l.discount);
    }
    if (activeFilter === 'Open') {
      list = list.filter(l => l.isOpen);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q));
    }
    return list;
  }, [activeFilter, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // simulate refresh
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderLocationCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.locationCard}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.locationImage}
      >
        <View style={styles.locationOverlay}>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            activeOpacity={0.8}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
          >
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(0,0,0,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)'
            }}>
              <Ionicons
                name={favoriteIds.has(item.id) ? 'heart' : 'heart-outline'}
                size={18}
                color={favoriteIds.has(item.id) ? '#EF4444' : '#FFFFFF'}
              />
            </View>
          </TouchableOpacity>
          {item.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ ფავორიტი</Text>
            </View>
          )}
          
          {item.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.discount}</Text>
            </View>
          )}

          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.statusIndicator}>
            <View style={[
              { 
                width: 4, 
                height: 4, 
                borderRadius: 2, 
                backgroundColor: item.isOpen ? '#10B981' : '#EF4444' 
              }
            ]} />
          </View>
        </View>
      </ImageBackground>
      
      <View style={styles.locationDetails}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationAddress}>{item.address}</Text>
          <Text style={styles.locationDistance}>{item.distance}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {renderStars(item.rating)}
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewsText}>({item.reviews} შეფასება)</Text>
          </View>
          <View style={styles.waitTimeContainer}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.waitTimeText}>{item.waitTime}</Text>
          </View>
        </View>
        
        <View style={styles.servicesContainer}>
          <Text style={styles.servicesTitle}>სერვისები:</Text>
          <View style={styles.servicesList}>
            {item.services.map((service: string, index: number) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{item.price}</Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => handleBooking(item)}
          >
            <Text style={styles.bookButtonText}>დაჯავშნა</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.avatar} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userName}>გამარჯობა!</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.locationText}>თბილისი, საქართველო</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.roundIcon}><Ionicons name="search" size={18} color="#111827" /></View>
              <View style={styles.roundIcon}><Ionicons name="notifications-outline" size={18} color="#111827" /></View>
            </View>
          </View>

          {/* Promo Banner */}
          <View style={styles.promoCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=1200&auto=format&fit=crop' }} style={styles.promoImage} />
            <View style={styles.promoOverlay} />
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Get Discount{"\n"}up to 35%</Text>
              <Text style={styles.promoSubtitle}>On first carwash services</Text>
              <TouchableOpacity style={styles.promoButton} activeOpacity={0.9} onPress={() => router.push('/booking')}>
                <Text style={styles.promoButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      

      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="მოძებნეთ სამრეცხაო..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.mapButtonContainer}>
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => router.push('/map')}
        >
          <Ionicons name="map-outline" size={20} color="#FFFFFF" />
          <Text style={styles.mapButtonText}>რუკაზე ნახვა</Text>
        </TouchableOpacity>
      </View>

      {/* Quick filter chips */}
      <View style={{ paddingHorizontal: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="ყველა" active={activeFilter==='All'} onPress={() => setActiveFilter('All')} />
          <Chip label="Premium" onPress={() => setActiveFilter('Premium')} active={activeFilter==='Premium'} />
          <Chip label="Express" onPress={() => setActiveFilter('Express')} active={activeFilter==='Express'} />
          <Chip label="Luxury" onPress={() => setActiveFilter('Luxury')} active={activeFilter==='Luxury'} />
          <Chip label="ფასდაკლება" icon="tag" onPress={() => setActiveFilter('Discount')} active={activeFilter==='Discount'} />
          <Chip label="ღიაა ახლა" icon="clock" onPress={() => setActiveFilter('Open')} active={activeFilter==='Open'} />
        </ScrollView>
      </View>

      {/* Bookings Section */}
      <View style={styles.bookingsSection}>
        <TouchableOpacity 
          onPress={() => router.push('/bookings')}
          activeOpacity={0.9}
        >
          <View style={styles.bookingsButton}>
            {/* Background decorative elements */}
            <View style={{
              position: 'absolute',
              top: -15,
              right: -15,
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: -20,
              left: -20,
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }} />
            <View style={styles.bookingsButtonContent}>
              <View style={styles.bookingsButtonIcon}>
                <Ionicons name="calendar-outline" size={24} color="#E5E5E5" />
              </View>
              <View style={styles.bookingsButtonText}>
                <Text style={styles.bookingsButtonTitle}>ჩემი ჯავშნები</Text>
                <Text style={styles.bookingsButtonSubtitle}>თქვენი ყველა ჯავშანი ერთ ადგილას</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="chevron-forward" size={20} color="#E5E5E5" />
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#111111',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 4,
                  borderWidth: 1,
                  borderColor: '#1F1F1F',
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontFamily: 'Poppins_600SemiBold',
                    color: '#E5E5E5',
                  }}>
                    3
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* List container */}
      <View style={styles.listContainer}>
        {filteredLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.locationCard}
            onPress={() => handleBooking(location)}
            activeOpacity={0.9}
          >
            {renderLocationCard({ item: location })}
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>
      
      {/* Modals outside of ScrollView */}
      <Modal
        visible={showCarDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCarDropdown(false)}

      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => setShowCarDropdown(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>აირჩიეთ მანქანა</Text>
              <TouchableOpacity onPress={() => setShowCarDropdown(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {cars.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={[
                  styles.dropdownItem,
                  selectedCar?.id === car.id && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  selectCar(car);
                  setShowCarDropdown(false);
                }}
              >
                <Ionicons name="car-sport" size={20} color="#3B82F6" />
                <View style={styles.dropdownCarInfo}>
                  <Text style={styles.dropdownCarNumber}>{car.plateNumber}</Text>
                  <Text style={styles.dropdownCarDetails}>
                    {car.make} {car.model} ({car.year})
                  </Text>
                </View>
                {selectedCar?.id === car.id && (
                  <Ionicons name="checkmark" size={16} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showAddCarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddCarModal(false)}

      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => setShowAddCarModal(false)}
            activeOpacity={1}
          />
          <View style={styles.addCarModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>მანქანის დამატება</Text>
              <TouchableOpacity onPress={() => setShowAddCarModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.addCarForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>მანქანის ნომერი</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="მაგ: AA-001-AA"
                  placeholderTextColor="#9CA3AF"
                  value={newCar.plateNumber}
                  onChangeText={(text) => setNewCar(prev => ({ ...prev, plateNumber: text }))}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>ბრენდი</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="მაგ: BMW"
                  placeholderTextColor="#9CA3AF"
                  value={newCar.make}
                  onChangeText={(text) => setNewCar(prev => ({ ...prev, make: text }))}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>მოდელი</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="მაგ: M5"
                  placeholderTextColor="#9CA3AF"
                  value={newCar.model}
                  onChangeText={(text) => setNewCar(prev => ({ ...prev, model: text }))}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>წელი</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="მაგ: 2022"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newCar.year}
                  onChangeText={(text) => setNewCar(prev => ({ ...prev, year: text }))}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.addCarSubmitButton}
                onPress={() => {
                  if (!newCar.make || !newCar.model || !newCar.year || !newCar.plateNumber) {
                    Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ყველა ველი');
                    return;
                  }
                  
                  addCar({
                    make: newCar.make,
                    model: newCar.model,
                    year: parseInt(newCar.year),
                    plateNumber: newCar.plateNumber,
                  });
                  
                  setNewCar({ make: '', model: '', year: '', plateNumber: '' });
                  setShowAddCarModal(false);
                  Alert.alert('წარმატება', 'მანქანა წარმატებით დაემატა!');
                }}
              >
                <Text style={styles.addCarButtonText}>დამატება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
