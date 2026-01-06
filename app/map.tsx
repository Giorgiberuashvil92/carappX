import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  Image,
  Linking,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { publishLocation } from '../utils/LocationBus';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import Supercluster from 'supercluster';
import * as ExpoLocation from 'expo-location';
import type { LocationObject } from 'expo-location';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import Chip from '@/components/ui/Chip';
import API_BASE_URL from '../config/api';
import { addItemApi } from '../services/addItemApi';
import { carwashLocationApi } from '../services/carwashLocationApi';
import { categoriesApi, Category } from '../services/categoriesApi';
import { mechanicsApi } from '../services/mechanicsApi';
// Replacing external Chip with local glassy pills

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = 260;
const CARD_SPACING = 12;
const CARDS_CONTAINER_PADDING = 16;

const PLACEHOLDER_IMAGE = require('../assets/images/car-bg.png');
const MAP_STYLE_MINIMAL_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#0B0B0E' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0B0E' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F2937' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#112031' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
const CAR_WASH_LOCATIONS = [
  {
    id: '1',
    name: 'Premium Car Wash',
    address: 'ვაჟა-ფშაველას 15, თბილისი',
    rating: 4.8,
    reviews: 124,
    price: '15₾-დან',
    services: ['სრული სამრეცხაო', 'პრემიუმ სერვისი', 'ცვილის გამოყენება'],
    isOpen: true,
    waitTime: '10 წთ',
    category: 'Premium',
    phone: '+995 599 123 456',
    isPartner: true,
    isFeatured: true,
    offer: '−20% შიდა წმენდაზე ამ კვირაში',
    media: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop',
    ],
    menu: ['სრული გარეცხვა', 'ცვილის ფენა', 'ქიმწმენდა'],
    image: PLACEHOLDER_IMAGE,
    coordinates: { latitude: 41.7151, longitude: 44.8271 },
    queue: { length: 2, avgMinsPerTicket: 6 },
  },
  {
    id: '2',
    name: 'Express Car Wash',
    address: 'რუსთაველის 45, თბილისი',
    rating: 4.5,
    reviews: 89,
    price: '8₾-დან',
    services: ['სწრაფი სამრეცხაო', 'გარე გაწმენდა'],
    isOpen: true,
    waitTime: '5 წთ',
    category: 'Express',
    phone: '+995 599 123 457',
    isPartner: false,
    isFeatured: false,
    offer: '',
    media: [
      'https://images.unsplash.com/photo-1511918984145-48de785d4c4f?q=80&w=600&auto=format&fit=crop',
    ],
    menu: ['სწრაფი გარეცხვა', 'გარე გაწმენდა'],
    image: PLACEHOLDER_IMAGE,
    coordinates: { latitude: 41.7201, longitude: 44.8301 },
    queue: { length: 1, avgMinsPerTicket: 5 },
  },
  {
    id: '3',
    name: 'Luxury Auto Spa',
    address: 'პეკინის 78, თბილისი',
    rating: 4.9,
    reviews: 203,
    price: '25₾-დან',
    services: ['დეტალური სამრეცხაო', 'პრემიუმ სერვისი', 'ცვილის გამოყენება', 'ქიმწმენდა'],
    isOpen: true,
    waitTime: '15 წთ',
    category: 'Luxury',
    phone: '+995 599 123 458',
    isPartner: true,
    isFeatured: false,
    offer: 'პრემიუმ პაკეტზე სასაჩუქრე ცვილი',
    media: [
      'https://images.unsplash.com/photo-1515923162049-0413f9a4b2ce?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?q=80&w=600&auto=format&fit=crop',
    ],
    menu: ['დეტეილინგი', 'ცვილის ფენა', 'შამფუნინგი'],
    image: PLACEHOLDER_IMAGE,
    coordinates: { latitude: 41.7251, longitude: 44.8351 },
    queue: { length: 4, avgMinsPerTicket: 7 },
  },
];

// Picker Location Info Component with Reverse Geocoding
const PickerLocationInfo: React.FC<{ latitude: number; longitude: number; onConfirm: (address: string) => void }> = ({ latitude, longitude, onConfirm }) => {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setLoading(true);
        const result = await ExpoLocation.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        if (result && result.length > 0) {
          const location = result[0];
          const parts = [
            location.street,
            location.streetNumber,
            location.district,
            location.city,
            location.region,
          ].filter(Boolean);
          const fullAddress = parts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setAddress(fullAddress);
        } else {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [latitude, longitude]);

  const handleConfirm = () => {
    onConfirm(address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  };

  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, gap: 10 }}>
      <View style={{ backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Ionicons name="location" size={18} color="#22C55E" />
          <Text style={{ color: '#E5E7EB', fontSize: 13, fontWeight: '600' }}>მდებარეობა</Text>
        </View>
        {loading ? (
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>მისამართის განსაზღვრა...</Text>
        ) : (
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
            {address}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <Ionicons name="map" size={14} color="#9CA3AF" />
          <Text style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
        onPress={handleConfirm}
      >
        <Text style={{ color: '#0B0B0E', fontWeight: '700', fontSize: 16 }}>არჩევა</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function MapScreen() {
  const router = useRouter();
  const navParams = useLocalSearchParams<{ lat?: string; lng?: string; storeName?: string; picker?: string; pin?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
  // tooltip removed
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.7151,
    longitude: 44.8271,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<Supercluster | null>(null);
  const [sortBy, setSortBy] = useState<'nearest' | 'topRated'>('nearest');
  const [radiusKm, setRadiusKm] = useState<number>(50); // დიდი რადიუსი რომ ყველა ჩანდეს
  
  // API data states
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // Categories for filtering - extracted from locations
  const [availableCategories, setAvailableCategories] = useState<Array<{name: string; color: string; type?: string}>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0B0B0E',
    },
    header: { display: 'none' },
    overlayTop: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 20,
      pointerEvents: 'box-none',
    },
    headerCard: {
      backgroundColor: 'rgba(17,24,39,0.75)',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 10,
      marginTop: 10,
    },
    dealsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    dealsTitle: { color: '#E5E7EB', fontFamily: 'Poppins_700Bold', fontSize: 14 },
    dealsStrip: { flexDirection: 'row', gap: 10, marginTop: 8 },
    dealPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.35)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
    dealText: { color: '#86EFAC', fontFamily: 'Poppins_700Bold', fontSize: 12 },
    applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22C55E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    applyText: { color: '#0B0B0E', fontFamily: 'Poppins_700Bold', fontSize: 12 },
    dealsList: { gap: 10, paddingBottom: 16, marginTop: 8 },
    dealItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    dealThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#111827' },
    dealInfo: { flex: 1 },
    dealName: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 },
    dealOfferText: { color: '#86EFAC', fontFamily: 'Poppins_600SemiBold', fontSize: 12, marginTop: 2 },
    dealActions: { flexDirection: 'row', gap: 8 },
    chipsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    pillActive: {
      backgroundColor: 'rgba(139,92,246,0.2)',
      borderColor: 'rgba(167,139,250,0.5)',
    },
    pillText: { color: '#E5E7EB', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
    pillTextActive: { color: '#FFFFFF' },
    filterFab: {
      position: 'absolute',
      right: 16,
      bottom: 100,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(17,24,39,0.85)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
      zIndex: 15,
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
      zIndex: 1000,
      elevation: 100,
    },
    sheet: {
      backgroundColor: 'rgba(17,24,39,0.96)',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 16,
      gap: 12,
      height: Math.round(height * 0.8),
      zIndex: 1001,
      elevation: 101,
    },
    sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sheetTitle: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 16 },
    sectionTitle: { color: '#E5E7EB', fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 8 },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
    ghostBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    primaryBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: '#22C55E' },
    ghostText: { color: '#E5E7EB', fontFamily: 'Poppins_700Bold' },
    primaryText: { color: '#0B0B0E', fontFamily: 'Poppins_700Bold' },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 26,
      fontFamily: 'Poppins_700Bold',
      color: '#F9FAFB',
      letterSpacing: -0.2,
    },
    headerAction: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    headerActionText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#111827',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#1F2937',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Poppins_400Regular',
      color: '#E5E7EB',
      marginLeft: 12,
    },
    mapContainer: {
      flex: 1,
      backgroundColor: '#0B0B0E',
    },
    map: {
      width: '100%',
      height: '100%',
    },
    resultsPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(17,24,39,0.7)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
      marginTop: 10,
    },
    resultsText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
    resultsPillFloating: {
      position: 'absolute',
      backgroundColor: 'rgba(17,24,39,0.7)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    mapMarker: {
      backgroundColor: '#111827',
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#1F2937',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      flexDirection: 'row',
      gap: 6,
    },
    mapMarkerSelected: {
      backgroundColor: '#8B5CF6',
      borderColor: '#A78BFA',
      transform: [{ scale: 1.06 }],
      shadowColor: '#8B5CF6',
      shadowOpacity: 0.45,
      shadowRadius: 12,
    },
    mapMarkerText: {
      fontSize: 18,
      fontFamily: 'Poppins_600SemiBold',
      color: '#6B7280',
    },
    mapMarkerTextSelected: {
      color: '#FFFFFF',
    },
    markersContainer: {
      position: 'absolute',
      top: 100,
      left: 20,
      right: 20,
    },
    marker: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    markerSelected: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    markerText: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: '#1F2937',
    },
    markerTextSelected: {
      color: '#FFFFFF',
    },

    infoCard: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(17,24,39,0.95)',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 14,
      paddingBottom: 16,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 120,
      zIndex: 2000,
    },
    infoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoTitle: {
      fontSize: 16,
      fontFamily: 'Poppins_700Bold',
      color: '#F3F4F6',
      flex: 1,
      lineHeight: 20,
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    infoDetails: {
      gap: 14,
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    infoLabel: {
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      color: '#9CA3AF',
    },
    infoValue: {
      fontSize: 13,
      fontFamily: 'Poppins_600SemiBold',
      color: '#E5E7EB',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    servicesContainer: {
      marginTop: 10,
    },
    servicesTitle: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: '#E5E7EB',
      marginBottom: 10,
    },
    servicesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    serviceTag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    serviceTagText: {
      fontSize: 11,
      fontFamily: 'Poppins_500Medium',
      color: '#E5E7EB',
    },
    queueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    queueBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
    queueText: { color: '#E5E7EB', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
    ticketCard: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 8 },
    ticketTitle: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 14 },
    ticketMeta: { color: '#9CA3AF', fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 14,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 18,
      gap: 8,
    },
    callButton: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    routeButton: {
      backgroundColor: 'rgba(139,92,246,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(167,139,250,0.25)',
    },
    bookButton: {
      backgroundColor: '#22C55E',
    },
    actionButtonText: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
    },
    callButtonText: {
      color: '#E5E7EB',
    },
    routeButtonText: {
      color: '#A78BFA',
    },
    bookButtonText: {
      color: '#0B0B0E',
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      marginBottom: 8,
    },
    smallBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    smallBadgeText: { color: '#E5E7EB', fontFamily: 'NotoSans_700Bold', fontSize: 11 },
    offerBanner: {
      marginTop: 8,
      backgroundColor: 'rgba(34,197,94,0.15)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(34,197,94,0.25)',
    },
    offerText: { color: '#86EFAC', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
    mediaRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    mediaThumb: { width: 80, height: 56, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    dealBanner: { marginTop: 10, backgroundColor: 'rgba(139,92,246,0.18)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)' },
    dealTextAlt: { color: '#C4B5FD', fontFamily: 'Poppins_700Bold', fontSize: 12 },
    menuRow: { marginTop: 10, gap: 6 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    menuTitle: { color: '#E5E7EB', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
    menuPrice: { color: '#22C55E', fontFamily: 'Poppins_700Bold', fontSize: 13 },
    // Q&A styles removed
    // tooltip styles removed
    zoomControls: {
      position: 'absolute',
      right: 16,
      bottom: 180,
      backgroundColor: 'rgba(17,24,39,0.7)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    zoomButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    zoomDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
    cardsContainer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
    },
    cardsRow: {
      paddingHorizontal: CARDS_CONTAINER_PADDING,
      gap: CARD_SPACING,
    },
    resultCard: {
      width: CARD_WIDTH,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: 'rgba(17,24,39,0.75)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 10,
      marginRight: CARD_SPACING,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 6,
    },
    resultThumb: { width: 52, height: 52, borderRadius: 12 },
    resultTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#F3F4F6' },
    resultMeta: { fontFamily: 'NotoSans_600SemiBold', fontSize: 11, color: '#9CA3AF' },
    partnerBadge: { backgroundColor: '#8B5CF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    partnerBadgeText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 10 },
    featureBadge: { position: 'absolute', right: 10, top: 10, backgroundColor: '#22C55E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    featureBadgeText: { color: '#0B0B0E', fontFamily: 'NotoSans_700Bold', fontSize: 10 },
  });

  // Picker UI animation (for nicer pin)
  const isPickerModeAnim = (navParams as any)?.picker === '1';
  const pinVariant: 'float' | 'label' = ((navParams as any)?.pin === 'label') ? 'label' : 'float';
  const pinScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!isPickerMode) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.25, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1.0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.0, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.35, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isPickerModeAnim]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      );
    }
    return stars;
  };


  // კატეგორიის მიხედვით ფერის განსაზღვრა
  const getCategoryColor = (category: string, type?: string): string => {
    if (!category) {
      // თუ კატეგორია არ არის, type-ის მიხედვით
      switch (type) {
        case 'carwash':
          return '#3B82F6'; // ლურჯი
        case 'store':
          return '#F59E0B'; // ყვითელი/ნარინჯისფერი
        case 'service':
          return '#EF4444'; // წითელი
        case 'mechanic':
          return '#10B981'; // მწვანე
        default:
          return '#6B7280'; // ნაცრისფერი
      }
    }

    const categoryLower = category.toLowerCase();
    
    // სამრეცხაო - ლურჯი
    if (categoryLower.includes('სამრეცხაო') || categoryLower.includes('carwash') || categoryLower.includes('wash')) {
      return '#3B82F6';
    }
    
    // ავტოსერვისები - წითელი
    if (categoryLower.includes('ავტოსერვის') || categoryLower.includes('auto service') || categoryLower.includes('service')) {
      return '#EF4444';
    }
    
    // მაღაზიები - ყვითელი/ნარინჯისფერი
    if (categoryLower.includes('მაღაზია') || categoryLower.includes('store') || categoryLower.includes('shop')) {
      return '#F59E0B';
    }
    
    // მექანიკოსები - მწვანე
    if (categoryLower.includes('მექანიკ') || categoryLower.includes('mechanic') || categoryLower.includes('ხელოსან')) {
      return '#10B981';
    }
    
    // დეტეილინგი - იისფერი
    if (categoryLower.includes('დეტეილ') || categoryLower.includes('detailing')) {
      return '#8B5CF6';
    }
    
    if (categoryLower.includes('ევაკუატორი') || categoryLower.includes('towing')) {
      return '#EF4444';
    }
    
    // ნაწილები - ლურჯი
    if (categoryLower.includes('ნაწილ') || categoryLower.includes('part')) {
      return '#3B82F6';
    }
    
    // ზეთები - ნარინჯისფერი
    if (categoryLower.includes('ზეთ') || categoryLower.includes('oil') || categoryLower.includes('ლუბრიკანტ')) {
      return '#F97316'; // ნარინჯისფერი
    }
    
    // Default - ნაცრისფერი
    return '#6B7280';
  };

  // Load locations from API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoadingLocations(true);
        console.log('🗺️ [MAP] Loading locations from API...');
        
        // Use new /services/map endpoint that returns all services with coordinates
        const response = await fetch(`${API_BASE_URL}/services/map`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }

        const result = await response.json();
        const services = result.success ? result.data : [];

        console.log('🗺️ [MAP] Received services:', services.length);
        console.log('🗺️ [MAP] Sample service:', services[0]);

        const allLocationsData: any[] = services
          .filter((service: any) => {
            // Filter out services without valid coordinates
            return service.latitude != null && 
                   service.longitude != null &&
                   typeof service.latitude === 'number' &&
                   typeof service.longitude === 'number';
          })
          .map((service: any) => {
            // Map the service to the format expected by the map component
            return {
              id: service.id || String(service._id) || `service-${Math.random()}`,
              name: service.title || service.name || 'სერვისი',
              address: service.address || service.location || '',
              rating: service.rating || 0,
              reviews: service.reviews || 0,
              price: service.price || undefined,
              services: Array.isArray(service.services) ? service.services : [],
              isOpen: service.isOpen !== undefined ? service.isOpen : true,
              category: service.category || 'სერვისი',
              phone: service.phone || '',
              image: service.images?.[0] 
                ? { uri: service.images[0] } 
                : PLACEHOLDER_IMAGE,
              coordinates: { 
                latitude: Number(service.latitude), 
                longitude: Number(service.longitude) 
              },
              isPartner: false,
              isFeatured: false,
              offer: '',
              waitTime: service.waitTime,
              type: service.type || 'service',
              workingHours: service.workingHours,
              features: service.features,
            };
          });

        console.log('🗺️ [MAP] Processed locations with coordinates:', allLocationsData.length);
        console.log('🗺️ [MAP] Sample location:', allLocationsData[0]);
        
        if (allLocationsData.length > 0) {
          setAllLocations(allLocationsData);
          
          // Extract unique categories from locations
          const categoryMap = new Map<string, {name: string; color: string; type?: string}>();
          
          allLocationsData.forEach((location: any) => {
            const categoryName = location.category || location.type || 'სხვა';
            if (!categoryMap.has(categoryName)) {
              const categoryColor = getCategoryColor(categoryName, location.type);
              categoryMap.set(categoryName, {
                name: categoryName,
                color: categoryColor,
                type: location.type,
              });
            }
          });
          
          const uniqueCategories = Array.from(categoryMap.values());
          console.log('🗺️ [MAP] Extracted categories:', uniqueCategories.length);
          setAvailableCategories(uniqueCategories);
        } else {
          console.warn('🗺️ [MAP] No locations with coordinates found, using fallback');
          setAllLocations(CAR_WASH_LOCATIONS);
          setAvailableCategories([]);
        }
      } catch (error) {
        console.error('🗺️ [MAP] Error loading locations:', error);
        // Fallback to hardcoded locations
        setAllLocations(CAR_WASH_LOCATIONS);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
  }, []);

  // Initialize supercluster
  useEffect(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });
    clusterRef.current = cluster;
  }, []);

  const toRad = (value: number) => (value * Math.PI) / 180;
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleMarkerPress = useCallback((location: any) => {
    setSelectedLocation(location);
    setShowInfoCard(true);
  }, []);

  const onZoomIn = async () => {
    try {
      const camera = await mapRef.current?.getCamera();
      if (camera && typeof camera.zoom === 'number') {
        await mapRef.current?.animateCamera({ ...camera, zoom: camera.zoom + 1 }, { duration: 200 });
        return;
      }
    } catch {}
    try {
      const newRegion = {
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        latitudeDelta: Math.max(mapRegion.latitudeDelta * 0.5, 0.0005),
        longitudeDelta: Math.max(mapRegion.longitudeDelta * 0.5, 0.0005),
      };
      setMapRegion(newRegion as any);
      mapRef.current?.animateToRegion(newRegion as any, 200);
    } catch {}
  };

  const onZoomOut = async () => {
    try {
      const camera = await mapRef.current?.getCamera();
      if (camera && typeof camera.zoom === 'number') {
        await mapRef.current?.animateCamera({ ...camera, zoom: camera.zoom - 1 }, { duration: 200 });
        return;
      }
    } catch {}
    try {
      const newRegion = {
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        latitudeDelta: Math.min(mapRegion.latitudeDelta * 1.8, 60),
        longitudeDelta: Math.min(mapRegion.longitudeDelta * 1.8, 60),
      };
      setMapRegion(newRegion as any);
      mapRef.current?.animateToRegion(newRegion as any, 200);
    } catch {}
  };

  const onMyLocation = async () => {
    try {
      // Always use static Tbilisi location
      const tbilisiCoords = { latitude: 41.7151, longitude: 44.8271 };
      const newRegion = {
        latitude: tbilisiCoords.latitude,
        longitude: tbilisiCoords.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateCamera(
        { center: tbilisiCoords, zoom: 18.5 },
        { duration: 800 }
      );
    } catch (error) {
      console.log('Error animating to location:', error);
    }
  };

  const focusOnLocation = async (location: any) => {
    if (!location?.coordinates) return;
    try {
      await mapRef.current?.animateCamera(
        { center: location.coordinates, zoom: 18 },
        { duration: 400 }
      );
      setSelectedLocation(location);
      setMapRegion(prev => ({
        ...prev,
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
      }));
    } catch {}
  };

  const onCardsMomentumEnd = (e: any) => {
    const offsetX: number = e?.nativeEvent?.contentOffset?.x ?? 0;
    const adjusted = Math.max(0, offsetX - CARDS_CONTAINER_PADDING);
    const index = Math.min(
      filtered.length - 1,
      Math.max(0, Math.round(adjusted / (CARD_WIDTH + CARD_SPACING)))
    );
    const target = filtered[index];
    if (target) {
      focusOnLocation(target);
    }
  };

  useEffect(() => {
    // Set static location to Tbilisi
    const tbilisiLocation: LocationObject = {
      coords: {
        latitude: 41.7151,
        longitude: 44.8271,
        altitude: null,
        accuracy: 50,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    
    setUserLocation(tbilisiLocation);
    
    // Set map region to Tbilisi
    const newRegion = {
      latitude: 41.7151,
      longitude: 44.8271,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setMapRegion(newRegion);
    
    // Animate camera to Tbilisi
    setTimeout(() => {
      mapRef.current?.animateCamera(
        { 
          center: { 
            latitude: 41.7151, 
            longitude: 44.8271 
          }, 
          zoom: 15 
        },
        { duration: 1000 }
      );
    }, 500);

    // Disable real-time location tracking - using static location
    /* 
    let locationSubscription: any;
    
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        // პირველი ლოკაცია
        const location = await ExpoLocation.getCurrentPositionAsync({});
        setUserLocation(location);
        
        // ავტომატურად გადაიტანოს რუკა მომხმარებლის ლოკაციაზე
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setMapRegion(newRegion);
        
        // ანიმაციით გადაიტანოს კამერა
        setTimeout(() => {
          mapRef.current?.animateCamera(
            { 
              center: { 
                latitude: location.coords.latitude, 
                longitude: location.coords.longitude 
              }, 
              zoom: 15 
            },
            { duration: 1000 }
          );
        }, 500);

        // Real-time location tracking
        locationSubscription = await ExpoLocation.watchPositionAsync(
          {
            accuracy: ExpoLocation.Accuracy.High,
            timeInterval: 5000, // განახლება ყოველ 5 წამში
            distanceInterval: 10, // ან ყოველ 10 მეტრზე
          },
          (newLocation) => {
            setUserLocation(newLocation);
          }
        );
      } catch (error) {
        console.log('Error getting initial location:', error);
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
    */
  }, []);

  const handleBooking = () => {
    if (selectedLocation) {
      router.push({
        pathname: '/booking',
        params: { location: JSON.stringify(selectedLocation) }
      });
    }
  };

  const handleCall = () => {
    if (selectedLocation?.phone) {
      Linking.openURL(`tel:${selectedLocation.phone}`);
    }
  };

  const handleRoute = () => {
    const lat = selectedLocation?.coordinates?.latitude ?? mapRegion.latitude;
    const lng = selectedLocation?.coordinates?.longitude ?? mapRegion.longitude;
    const label = selectedLocation?.name ?? 'Destination';
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`,
    });
    if (url) Linking.openURL(url);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const filtered = useMemo(() => {
    // Use API data if available, otherwise fallback to hardcoded
    const locationsToFilter = allLocations.length > 0 ? allLocations : CAR_WASH_LOCATIONS;

    // მხოლოდ coordinates-ის შემოწმება - ყველა სერვისი რომელსაც აქვს coordinates
    let list = locationsToFilter.filter((l) => {
      return l.coordinates && 
             typeof l.coordinates.latitude === 'number' && 
             typeof l.coordinates.longitude === 'number' &&
             !isNaN(l.coordinates.latitude) &&
             !isNaN(l.coordinates.longitude);
    });

    // კატეგორიის ფილტრაცია
    if (selectedCategories.length > 0) {
      list = list.filter((l) => {
        const locationCategory = l.category || l.type || '';
        return selectedCategories.includes(locationCategory);
      });
    }

    return list;
  }, [allLocations, selectedCategories]);

  // Clustered markers
  const clusteredMarkers = useMemo(() => {
    if (filtered.length === 0) return [];
    
    // თუ clusterRef არ არის initialized, ვაბრუნებთ ჩვეულებრივ მარკერებს
    if (!clusterRef.current) {
      return filtered.map((location) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          locationId: location.id,
          location: location,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [location.coordinates.longitude, location.coordinates.latitude],
        },
      }));
    }

    const points = filtered.map((location) => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        locationId: location.id,
        location: location,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [location.coordinates.longitude, location.coordinates.latitude],
      },
    }));

    // Load points into supercluster
    clusterRef.current.load(points);

    // Get clusters for current map bounds
    const bbox: [number, number, number, number] = [
      mapRegion.longitude - mapRegion.longitudeDelta / 2,
      mapRegion.latitude - mapRegion.latitudeDelta / 2,
      mapRegion.longitude + mapRegion.longitudeDelta / 2,
      mapRegion.latitude + mapRegion.latitudeDelta / 2,
    ];

    // Calculate zoom level from latitudeDelta
    const zoom = Math.round(Math.log(360 / mapRegion.latitudeDelta) / Math.LN2);
    const zoomLevel = Math.max(0, Math.min(zoom, 20)); // Clamp zoom between 0 and 20

    try {
      const clusters = clusterRef.current.getClusters(bbox, zoomLevel);
      console.log('🗺️ [MAP] Clusters:', clusters.length, 'from', filtered.length, 'locations');
      return clusters;
    } catch (error) {
      console.error('🗺️ [MAP] Error getting clusters:', error);
      // Fallback: return individual markers
      return points;
    }
  }, [filtered, mapRegion]);


  const isPickerMode = (navParams as any)?.picker === '1';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.overlayTop, { top: (insets.top || (Platform.OS==='ios'?48:18)) + 8 } ]}>
        <View style={[styles.headerCard]}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.9}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>რუკა</Text>
            <View style={{ width: 48 }} />
          </View>

          {/* Category Filter Chips - დინამიურად ლოკაციებიდან */}
          {availableCategories.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginTop: 12, paddingBottom: 8 }}
            >
              <TouchableOpacity
                style={[
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedCategories.length === 0 ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: selectedCategories.length === 0 ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                  }
                ]}
                onPress={() => setSelectedCategories([])}
              >
                <Text style={{
                  color: selectedCategories.length === 0 ? '#FFFFFF' : '#E5E7EB',
                  fontFamily: 'Poppins_600SemiBold',
                  fontSize: 12,
                }}>
                  ყველა
                </Text>
              </TouchableOpacity>
              
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.name);
                
                return (
                  <TouchableOpacity
                    key={category.name}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isSelected ? category.color : 'rgba(255,255,255,0.1)',
                      borderWidth: 1,
                      borderColor: isSelected ? category.color : 'rgba(255,255,255,0.2)',
                    }}
                    onPress={() => toggleCategory(category.name)}
                  >
                    <Text style={{
                      color: isSelected ? '#FFFFFF' : '#E5E7EB',
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 12,
                    }}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {/*
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow} pointerEvents="auto">
            <TouchableOpacity style={[styles.pill, activeCategory==='All' && styles.pillActive]} onPress={() => setActiveCategory('All')}>
              <Text style={[styles.pillText, activeCategory==='All' && styles.pillTextActive]}>ყველა</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, activeCategory==='Premium' && styles.pillActive]} onPress={() => setActiveCategory('Premium')}>
              <Text style={[styles.pillText, activeCategory==='Premium' && styles.pillTextActive]}>Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, activeCategory==='Express' && styles.pillActive]} onPress={() => setActiveCategory('Express')}>
              <Text style={[styles.pillText, activeCategory==='Express' && styles.pillTextActive]}>Express</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, activeCategory==='Luxury' && styles.pillActive]} onPress={() => setActiveCategory('Luxury')}>
              <Text style={[styles.pillText, activeCategory==='Luxury' && styles.pillTextActive]}>Luxury</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, openNow && styles.pillActive]} onPress={() => setOpenNow(!openNow)}>
              <Text style={[styles.pillText, openNow && styles.pillTextActive]}>{openNow ? 'ღიაა' : 'ახლა'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, partnersOnly && styles.pillActive]} onPress={() => setPartnersOnly(!partnersOnly)}>
              <Text style={[styles.pillText, partnersOnly && styles.pillTextActive]}>პარტნიორი</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, minRating>=4.5 && styles.pillActive]} onPress={() => setMinRating(minRating>=4.5 ? 0 : 4.5)}>
              <Text style={[styles.pillText, minRating>=4.5 && styles.pillTextActive]}>★4.5+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, styles.pillActive]} onPress={() => setSortBy(sortBy==='nearest' ? 'topRated' : 'nearest')}>
              <Text style={[styles.pillText, styles.pillTextActive]}>{sortBy==='nearest' ? 'ახლოს' : 'რეიტინგი'}</Text>
            </TouchableOpacity>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipsRow, { marginTop: 8 }]} pointerEvents="auto"> 
            <TouchableOpacity style={[styles.pill, radiusKm===1 && styles.pillActive]} onPress={() => setRadiusKm(1)}><Text style={[styles.pillText, radiusKm===1 && styles.pillTextActive]}>1კმ</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, radiusKm===3 && styles.pillActive]} onPress={() => setRadiusKm(3)}><Text style={[styles.pillText, radiusKm===3 && styles.pillTextActive]}>3კმ</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, radiusKm===5 && styles.pillActive]} onPress={() => setRadiusKm(5)}><Text style={[styles.pillText, radiusKm===5 && styles.pillTextActive]}>5კმ</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, radiusKm===10 && styles.pillActive]} onPress={() => setRadiusKm(10)}><Text style={[styles.pillText, radiusKm===10 && styles.pillTextActive]}>10კმ</Text></TouchableOpacity>
          </ScrollView>
          */}
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={(ref) => { mapRef.current = ref; }}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={mapRegion}
          onRegionChangeComplete={(region) => setMapRegion(region)}
          onPress={(e) => {
            if (isPickerMode) {
              const c = e?.nativeEvent?.coordinate;
              if (c && typeof c.latitude === 'number' && typeof c.longitude === 'number') {
                setMapRegion((prev) => ({
                  latitude: c.latitude,
                  longitude: c.longitude,
                  latitudeDelta: prev.latitudeDelta,
                  longitudeDelta: prev.longitudeDelta,
                }));
                mapRef.current?.animateCamera({ center: c, zoom: 18 }, { duration: 200 });
              }
            }
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          customMapStyle={MAP_STYLE_MINIMAL_DARK}
        >

          {/* User location marker - Car icon with heading */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={userLocation.coords.heading || 0}
              flat={true}
            >
              <View style={{
                backgroundColor: '#60A5FA',
                borderRadius: 20,
                padding: 8,
                borderWidth: 3,
                borderColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
                elevation: 8,
                transform: [{ rotate: `${userLocation.coords.heading || 0}deg` }],
              }}>
                <Ionicons name="car-sport" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Accuracy circle */}
          {userLocation && userLocation.coords.accuracy && (
            <Circle
              center={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              radius={userLocation.coords.accuracy}
              fillColor="rgba(96, 165, 250, 0.1)"
              strokeColor="rgba(96, 165, 250, 0.3)"
              strokeWidth={1}
            />
          )}

          {clusteredMarkers.map((marker: any, index: number) => {
            const [longitude, latitude] = marker.geometry.coordinates;
            const { cluster: isCluster, point_count: pointCount } = marker.properties;

            // Choose icon based on service type
            const getMarkerIcon = (type: string) => {
              switch (type) {
                case 'carwash':
                  return 'droplet';
                case 'store':
                  return 'shopping-bag';
                case 'service':
                  return 'tool';
                case 'mechanic':
                  return 'wrench';
                default:
                  return 'map-pin';
              }
            };

            // Cluster marker - რამდენიმე მარკერი ერთად
            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${marker.id}`}
                  coordinate={{ latitude, longitude }}
                  onPress={() => {
                    // ნაკლები ზუმი - რომ სერვისები ჩანდეს მაგრამ არ იყოს ძალიან დიდი ზუმი
                    const currentZoom = Math.round(Math.log(360 / mapRegion.latitudeDelta) / Math.LN2);
                    const targetZoom = Math.min(currentZoom + 6, 14); // მხოლოდ 2 zoom level-ით ზუმი
                    const newDelta = 360 / Math.pow(2, targetZoom);
                    mapRef.current?.animateToRegion({
                      latitude,
                      longitude,
                      latitudeDelta: newDelta,
                      longitudeDelta: newDelta,
                    }, 300);
                  }}
                >
                  <View style={{
                    backgroundColor: '#8B5CF6',
                    borderRadius: 25,
                    width: 50,
                    height: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 8,
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontFamily: 'Poppins_700Bold',
                      fontSize: 16,
                    }}>
                      {pointCount}
                    </Text>
                  </View>
                </Marker>
              );
            }

            // Individual marker
            const location = marker.properties.location;
            const iconName = getMarkerIcon(location.type);
            const categoryColor = getCategoryColor(location.category, location.type);
            const markerKey = `marker-${location.id || location._id || index}`;
            const isSelected = selectedLocation?.id === location.id;
            
            return (
              <Marker
                key={markerKey}
                identifier={markerKey}
                coordinate={location.coordinates}
                onPress={() => handleMarkerPress(location)}
              >
                <View style={{
                  backgroundColor: categoryColor,
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? '#FFFFFF' : categoryColor,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 5,
                  transform: isSelected ? [{ scale: 1.06 }] : [],
                }}>
                  <Feather 
                    name={iconName as any} 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : '#FFFFFF'} 
                  />
                </View>
              </Marker>
            );
          })}
        </MapView>
        {isPickerModeAnim && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: '50%', alignItems: 'center', marginTop: -16 }} pointerEvents="none">
            {/* Variant 1: Floating Pin with shadow and pulse */}
            {pinVariant === 'float' && (
              <>
                <Animated.View style={{ transform: [{ scale: pinScale }] }}>
                  <Feather name="map-pin" size={32} color="#22C55E" />
                </Animated.View>
                <Animated.View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#22C55E',
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                    position: 'absolute',
                    top: 24,
                  }}
                />
                <View
                  style={{
                    width: 16,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    position: 'absolute',
                    top: 28,
                  }}
                />
              </>
            )}

            {/* Variant 2: Label + Pin (address bubble) */}
            {pinVariant === 'label' && (
              <>
                <View style={{ alignItems: 'center' }}>
                  <Feather name="map-pin" size={32} color="#22C55E" />
                  <View style={{ marginTop: 8, backgroundColor: 'rgba(17,24,39,0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    <Text style={{ color: '#E5E7EB', fontWeight: '600' }} numberOfLines={2}>
                      {selectedLocation?.address || `${mapRegion.latitude.toFixed(6)}, ${mapRegion.longitude.toFixed(6)}`}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
        {/* Floating filter button removed; header action opens modal */}
       
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn}>
            <Feather name="plus" size={18} color="#E5E7EB" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut}>
            <Feather name="minus" size={18} color="#E5E7EB" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomButton} onPress={onMyLocation}>
            <Feather name="navigation" size={18} color="#60A5FA" />
          </TouchableOpacity>
        </View>
        {!showInfoCard && !isPickerMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
            style={styles.cardsContainer}
            onMomentumScrollEnd={onCardsMomentumEnd}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {filtered.map((l: any) => (
              <TouchableOpacity key={l.id} activeOpacity={0.9} onPress={() => focusOnLocation(l)} style={styles.resultCard}>
                <Image source={l.image} style={styles.resultThumb} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.resultTitle}>{l.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.resultMeta}>{l.rating.toFixed(1)}</Text>
                    <Ionicons name="navigate-outline" size={12} color="#6B7280" />
                    <Text style={styles.resultMeta}>{getDistanceKm(mapRegion.latitude, mapRegion.longitude, l.coordinates.latitude, l.coordinates.longitude).toFixed(1)}კმ</Text>
                  </View>
                </View>
                {l.isPartner && <View style={styles.partnerBadge}><Text style={styles.partnerBadgeText}>Partner</Text></View>}
                {l.isFeatured && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>Featured</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Custom Tooltip removed */}
      </View>

      {/* Info Card - დაპატარავებული ინფორმაციული ქარდი */}
      {showInfoCard && selectedLocation && !isPickerMode && (
        <View style={[styles.infoCard, { paddingBottom: 20, maxHeight: height * 0.6 }]}>
          <View style={styles.infoHeader}>
            <Text style={[styles.infoTitle, { fontSize: 18 }]} numberOfLines={1}>{selectedLocation.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowInfoCard(false)}
            >
              <Feather name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {/* ფოტო */}
          {selectedLocation.image && (
            <View style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden' }}>
              <Image 
                source={selectedLocation.image} 
                style={{ width: '100%', height: 120, borderRadius: 12 }} 
                resizeMode="cover"
              />
            </View>
          )}

          {/* კატეგორია */}
          {selectedLocation.category && (
            <View style={{ marginBottom: 12 }}>
              <View style={[
                styles.serviceTag, 
                { 
                  backgroundColor: `${getCategoryColor(selectedLocation.category, selectedLocation.type)}20`,
                  borderColor: `${getCategoryColor(selectedLocation.category, selectedLocation.type)}60`,
                  borderWidth: 1,
                }
              ]}>
                <Text style={[
                  styles.serviceTagText, 
                  { 
                    color: getCategoryColor(selectedLocation.category, selectedLocation.type), 
                    fontSize: 11, 
                    fontFamily: 'Poppins_600SemiBold' 
                  }
                ]}>
                  {selectedLocation.category}
                </Text>
              </View>
            </View>
          )}
          
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.3 }}>
            <View style={[styles.infoDetails, { gap: 10, marginBottom: 12 }]}>
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={14} color="#6B7280" />
                <Text style={[styles.infoLabel, { fontSize: 12 }]}>მისამართი:</Text>
                <Text style={[styles.infoValue, { fontSize: 12, flex: 1 }]} numberOfLines={2}>{selectedLocation.address}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.ratingContainer}>
                  {renderStars(selectedLocation.rating)}
                </View>
                <Text style={[styles.infoValue, { fontSize: 12 }]}>{selectedLocation.rating?.toFixed(1) || '0'}</Text>
                <Text style={[styles.infoLabel, { fontSize: 11 }]}>({selectedLocation.reviews || 0} შეფასება)</Text>
              </View>
              
              {selectedLocation.phone && (
                <View style={styles.infoRow}>
                  <Feather name="phone" size={14} color="#6B7280" />
                  <Text style={[styles.infoLabel, { fontSize: 12 }]}>ტელეფონი:</Text>
                  <Text style={[styles.infoValue, { fontSize: 12 }]}>{selectedLocation.phone}</Text>
                </View>
              )}
              
              {selectedLocation.price && (
                <View style={styles.infoRow}>
                  <Feather name="tag" size={14} color="#6B7280" />
                  <Text style={[styles.infoLabel, { fontSize: 12 }]}>ფასი:</Text>
                  <Text style={[styles.infoValue, { fontSize: 12 }]}>{selectedLocation.price}</Text>
                </View>
              )}

              {selectedLocation.waitTime && (
                <View style={styles.infoRow}>
                  <Feather name="clock" size={14} color="#6B7280" />
                  <Text style={[styles.infoLabel, { fontSize: 12 }]}>ლოდინი:</Text>
                  <Text style={[styles.infoValue, { fontSize: 12 }]}>{selectedLocation.waitTime}</Text>
                </View>
              )}

              {selectedLocation.workingHours && (
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={14} color="#6B7280" />
                  <Text style={[styles.infoLabel, { fontSize: 12 }]}>სამუშაო საათები:</Text>
                  <Text style={[styles.infoValue, { fontSize: 12, flex: 1 }]} numberOfLines={2}>{selectedLocation.workingHours}</Text>
                </View>
              )}
            </View>
            
            {selectedLocation.services && selectedLocation.services.length > 0 && (
              <View style={styles.servicesContainer}>
                <Text style={[styles.servicesTitle, { fontSize: 13 }]}>სერვისები:</Text>
                <View style={styles.servicesList}>
                  {selectedLocation.services.slice(0, 5).map((service: string, index: number) => (
                    <View key={index} style={styles.serviceTag}>
                      <Text style={[styles.serviceTagText, { fontSize: 10 }]}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
          
          {selectedLocation.phone && (
            <View style={[styles.actionButtons, { marginTop: 12 }]}>
              <TouchableOpacity style={[styles.actionButton, styles.callButton, { flex: 1 }]} onPress={handleCall}>
                <Feather name="phone" size={14} color="#E5E7EB" />
                <Text style={[styles.actionButtonText, styles.callButtonText, { fontSize: 12 }]}>ზარი</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {isPickerMode && (
        <PickerLocationInfo 
          latitude={mapRegion.latitude}
          longitude={mapRegion.longitude}
          onConfirm={(address) => {
            publishLocation({
              type: 'LOCATION_PICKED',
              payload: {
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
                address: address,
              },
            });
            router.back();
          }}
        />
      )}

    </View>
  );
}  
