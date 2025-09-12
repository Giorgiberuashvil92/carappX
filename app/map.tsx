import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import Chip from '@/components/ui/Chip';
// Replacing external Chip with local glassy pills

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = 260;
const CARD_SPACING = 12;
const CARDS_CONTAINER_PADDING = 16;

// Mock map data - in real app this would come from API
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
    id: 'drive-geo-1',
    name: 'Drive GO თბილისი',
    address: 'გლდანი, ხიზაბავრელების კვეთა',
    rating: 4.6,
    reviews: 57,
    price: '9₾-დან',
    services: ['სწრაფი პიკაპი', 'პროდუქტები გზაში'],
    isOpen: true,
    waitTime: '7 წთ',
    category: 'Express',
    phone: '+995 555 123 000',
    isPartner: true,
    isFeatured: true,
    offer: '−10% პაკეტსა და ნაკრებებზე',
    media: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574920162043-b872873f19bd?q=80&w=600&auto=format&fit=crop',
    ],
    menu: ['მინის სანიაღვრე თხევადი', 'ტილოს ნაკრები', 'სუნამო სალონისთვის'],
    image: PLACEHOLDER_IMAGE,
    coordinates: { latitude: 41.7392, longitude: 44.7923 },
    queue: { length: 1, avgMinsPerTicket: 5 },
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

export default function MapScreen() {
  const router = useRouter();
  const navParams = useLocalSearchParams<{ driver?: string; lat?: string; lng?: string; storeName?: string; slot?: string; live?: string; picker?: string; pin?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  // tooltip removed
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.7151,
    longitude: 44.8271,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const mapRef = useRef<MapView | null>(null);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Premium' | 'Express' | 'Luxury'>('All');
  const [openNow, setOpenNow] = useState<boolean>(false);
  const [partnersOnly, setPartnersOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'nearest' | 'topRated'>('nearest');
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isDealsOpen, setIsDealsOpen] = useState<boolean>(false);
  const [dealsOnly, setDealsOnly] = useState<boolean>(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState<boolean>(false);
  const [queues, setQueues] = useState<Record<string, { length: number; avgMinsPerTicket: number }>>(() => {
    const map: Record<string, { length: number; avgMinsPerTicket: number }> = {};
    CAR_WASH_LOCATIONS.forEach(l => { map[l.id] = l.queue || { length: 0, avgMinsPerTicket: 6 }; });
    return map;
  });
  const [tickets, setTickets] = useState<Record<string, { ticketNumber: number; issuedAt: number; arrived?: boolean }>>({});
  const [, forceTick] = useState<number>(0);

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
    tabsRow: { flexDirection: 'row', gap: 8 },
    tabPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    tabPillActive: { backgroundColor: 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.45)' },
    tabText: { color: '#E5E7EB', fontFamily: 'Poppins_700Bold', fontSize: 12 },
    tabTextActive: { color: '#22C55E' },
    dealsTitle: { color: '#E5E7EB', fontFamily: 'Poppins_700Bold', fontSize: 12 },
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
    marketSheet: {
      backgroundColor: 'rgba(17,24,39,0.96)',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 16,
      gap: 12,
      height: Math.round(height * 0.85),
    },
    productCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    productThumb: { width: 64, height: 64, borderRadius: 12 },
    productTitle: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 },
    productPrice: { color: '#86EFAC', fontFamily: 'Poppins_700Bold', fontSize: 12 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    qtyText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
    cartBar: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 16 },
    cartTotalText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
    orderBtn: { backgroundColor: '#22C55E', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
    orderText: { color: '#0B0B0E', fontFamily: 'Poppins_700Bold' },
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
      backgroundColor: 'rgba(17,24,39,0.92)',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 18,
      paddingBottom: 28,
      paddingHorizontal: 18,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -20 },
      shadowOpacity: 0.4,
      shadowRadius: 40,
      elevation: 120,
      zIndex: 2000,
    },
    infoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    infoTitle: {
      fontSize: 20,
      fontFamily: 'Poppins_700Bold',
      color: '#F3F4F6',
      flex: 1,
      lineHeight: 26,
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

  const openedFromQueryRef = useRef<boolean>(false);
  useEffect(() => {
    if (openedFromQueryRef.current) return;
    if ((navParams as any)?.driver === '1') {
      openedFromQueryRef.current = true;
      if (typeof (navParams as any).slot === 'string' && (navParams as any).slot) setSelectedSlot((navParams as any).slot);
      if (typeof (navParams as any).live === 'string') setShareLiveLocation((navParams as any).live === '1');
      const lat = Number((navParams as any).lat);
      const lng = Number((navParams as any).lng);
      let found: any | null = null;
      if ((navParams as any).storeName) {
        found = CAR_WASH_LOCATIONS.find(s => s.name === (navParams as any).storeName) || null;
      }
      if (!found && isFinite(lat) && isFinite(lng)) {
        let best: any = null;
        let bestD = Infinity;
        for (const s of CAR_WASH_LOCATIONS) {
          const d = getDistanceKm(lat, lng, s.coordinates.latitude, s.coordinates.longitude);
          if (d < bestD) { best = s; bestD = d; }
        }
        found = best;
      }
      if (found) {
        setSelectedStore(found);
        focusOnLocation(found);
      }
      setIsDriverOpen(true);
    }
  }, [(navParams as any)?.driver]);

  const [activeTopTab, setActiveTopTab] = useState<'drives' | 'deals'>('drives');
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isDriverOpen, setIsDriverOpen] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('delivery');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [shareLiveLocation, setShareLiveLocation] = useState<boolean>(true);
  
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const stepMinutes = 30;
    const count = 6; // მომდევნო ~3 საათი
    const now = new Date();
    // მომდევნო ნახევარსაათზე მომრგვალებული
    const minutes = now.getMinutes();
    const add = minutes % stepMinutes === 0 ? stepMinutes : (stepMinutes - (minutes % stepMinutes));
    let cursor = new Date(now.getTime() + add * 60000);
    for (let i = 0; i < count; i++) {
      const hh = String(cursor.getHours()).padStart(2, '0');
      const mm = String(cursor.getMinutes()).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      cursor = new Date(cursor.getTime() + stepMinutes * 60000);
    }
    return slots;
  };

  const formatGel = (n: number) => `${n}₾`;
  const basePriceFromText = (txt: string) => {
    const num = parseInt(String(txt).replace(/[^0-9]/g, ''));
    return Number.isFinite(num) ? num : 10;
  };
  const computeCatalog = (store: any) => {
    const base = basePriceFromText(store.price || '10');
    const titles: string[] = store.menu?.length ? store.menu : ['სრული გარეცხვა', 'შიდა წმენდა', 'ცვილის ფენა'];
    return titles.map((t: string, i: number) => ({
      id: `${store.id}-${i}`,
      title: t,
      price: base + i * 3,
      image: store.media?.[i % (store.media?.length || 1)] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop',
    }));
  };
  const openMarket = (store: any) => {
    setSelectedStore(store);
    setCart({});
    setIsMarketOpen(true);
  };
  const beginDriveWithDestination = (store: any) => {
    setSelectedStore(store);
    setIsDrivePickerOpen(false);
    setIsMarketOpen(true);
  };
  const addToCart = (pid: string) => setCart(prev => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));
  const decFromCart = (pid: string) => setCart(prev => ({ ...prev, [pid]: Math.max(0, (prev[pid] || 0) - 1) }));
  const cartTotal = (store: any) => {
    if (!store) return 0;
    const catalog = computeCatalog(store);
    return catalog.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);
  };
  const mockDriver = {
    name: 'სალომე ბ.',
    phone: '+995 595 123 789',
    car: 'Toyota Prius • TBI-123',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
  };

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

  const handleMarkerPress = (location: any) => {
    setSelectedLocation(location);
    setShowInfoCard(true);
    // tooltip removed
  };

  const onZoomIn = async () => {
    try {
      const camera = await mapRef.current?.getCamera();
      if (camera && typeof camera.zoom === 'number') {
        await mapRef.current?.animateCamera({ ...camera, zoom: camera.zoom + 1 }, { duration: 200 });
        return;
      }
    } catch {}
    // Fallback: animate by region deltas
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
    // Fallback: animate by region deltas
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

  // useEffect(() => {
  //   (async () => {
  //     let { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status !== 'granted') {
  //       Alert.alert('Permission to access location was denied');
  //       return;
  //     }

  //     let location = await Location.getCurrentPositionAsync({});
  //     setUserLocation(location);
  //     setMapRegion({
  //       latitude: location.coords.latitude,
  //       longitude: location.coords.longitude,
  //       latitudeDelta: 0.02,
  //       longitudeDelta: 0.02,
  //     });
  //   })();
  // }, []);

  const handleBooking = () => {
    if (selectedLocation) {
      router.push({
        pathname: '/booking',
        params: { location: JSON.stringify(selectedLocation) }
      });
    }
  };
  const issueTicket = () => {
    if (!selectedLocation) return;
    const q = queues[selectedLocation.id] || { length: 0, avgMinsPerTicket: 6 };
    const newTicketNo = (tickets[selectedLocation.id]?.ticketNumber ?? 0) + 1;
    setTickets(prev => ({ ...prev, [selectedLocation.id]: { ticketNumber: newTicketNo, issuedAt: Date.now() } }));
    setQueues(prev => ({ ...prev, [selectedLocation.id]: { ...q, length: q.length + 1 } }));
  };
  const markArrived = () => {
    if (!selectedLocation) return;
    const cur = tickets[selectedLocation.id];
    if (!cur) return;
    setTickets(prev => ({ ...prev, [selectedLocation.id]: { ...cur, arrived: true } }));
  };
  useEffect(() => {
    const t = setInterval(() => forceTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const getEtaText = (locationId: string) => {
    const q = queues[locationId];
    const my = tickets[locationId];
    const base = (q?.length ?? 0) * (q?.avgMinsPerTicket ?? 5);
    const since = my ? Math.floor((Date.now() - my.issuedAt) / 60000) : 0;
    const remaining = Math.max(0, base - since);
    return `${remaining} წთ`;
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

  const filtered = useMemo(() => {
    const centerLat = mapRegion.latitude;
    const centerLng = mapRegion.longitude;

    let list = CAR_WASH_LOCATIONS.filter((l) => {
      if (activeCategory !== 'All' && l.category !== activeCategory) return false;
      if (openNow && !l.isOpen) return false;
      if (partnersOnly && !l.isPartner) return false;
      if (dealsOnly && !l.offer) return false;
      if (minRating > 0 && l.rating < minRating) return false;
      if (searchQuery?.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesText = l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || l.services.join(' ').toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      const d = getDistanceKm(centerLat, centerLng, l.coordinates.latitude, l.coordinates.longitude);
      return d <= radiusKm;
    });

    list = list
      .map((l: any) => ({ ...l, _distanceKm: getDistanceKm(centerLat, centerLng, l.coordinates.latitude, l.coordinates.longitude) }))
      .sort((a: any, b: any) => (sortBy === 'nearest' ? a._distanceKm - b._distanceKm : b.rating - a.rating));

    return list;
  }, [activeCategory, openNow, partnersOnly, minRating, radiusKm, searchQuery, mapRegion, sortBy]);

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
            <TouchableOpacity style={styles.headerAction} onPress={() => setIsFilterOpen(true)}>
              <Text style={styles.headerActionText}>ფილტრაცია</Text>
            </TouchableOpacity>
          </View>

          {/* Deals strip */}
          <View style={styles.dealsRow}>
            <View style={styles.tabsRow}>
              <TouchableOpacity onPress={() => setActiveTopTab('drives')} style={[styles.tabPill, activeTopTab==='drives' && styles.tabPillActive]}>
                <Text style={[styles.tabText, activeTopTab==='drives' && styles.tabTextActive]}>დრაივები</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTopTab('deals')} style={[styles.tabPill, activeTopTab==='deals' && styles.tabPillActive]}>
                <Text style={[styles.tabText, activeTopTab==='deals' && styles.tabTextActive]}>შეთავაზებები</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dealsTitle}>{activeTopTab==='deals' ? 'შეთავაზებები' : 'ახლო დრაივები'}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsStrip}>
            {(activeTopTab==='deals' ? CAR_WASH_LOCATIONS.filter(l => !!l.offer) : CAR_WASH_LOCATIONS).slice(0, 6).map(d => (
              <TouchableOpacity key={d.id} style={styles.dealPill} onPress={() => activeTopTab==='drives' ? setIsDrivePickerOpen(true) : openMarket(d)}>
                <Feather name="zap" size={14} color="#22C55E" />
                <Text style={styles.dealText}>{d.offer}</Text>
                <View style={styles.applyBtn}>
                  <Feather name="shopping-bag" size={14} color="#0B0B0E" />
                  <Text style={styles.applyText}>გახსნა</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chips moved to filter modal */}
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
          <Circle
            center={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
            radius={radiusKm * 1000}
            strokeColor="rgba(59,130,246,0.3)"
            fillColor="rgba(59,130,246,0.08)"
          />

          {filtered.map((location) => (
            <Marker
              key={location.id}
              coordinate={location.coordinates}
              onPress={() => handleMarkerPress(location)}
            >
              <View style={[
                styles.mapMarker,
                selectedLocation?.id === location.id && styles.mapMarkerSelected
              ]}>
                <Feather 
                  name="droplet" 
                  size={16} 
                  color={selectedLocation?.id === location.id ? '#FFFFFF' : '#E5E7EB'} 
                />
              </View>
            </Marker>
          ))}
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
        <View
          style={[
            {
              position: 'absolute',
              left: Math.round(width * 0.26),
              top: Math.round(height * 0.35),
            },
            styles.resultsPillFloating,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.resultsText}>{filtered.length} შედეგი {radiusKm}კმ რადიუსში</Text>
        </View>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn}>
            <Feather name="plus" size={18} color="#E5E7EB" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut}>
            <Feather name="minus" size={18} color="#E5E7EB" />
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

      {/* Info Card */}
      {showInfoCard && selectedLocation && !isPickerMode && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>{selectedLocation.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowInfoCard(false)}
            >
              <Feather name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoDetails}>
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>მისამართი:</Text>
              <Text style={styles.infoValue}>{selectedLocation.address}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.ratingContainer}>
                {renderStars(selectedLocation.rating)}
              </View>
              <Text style={styles.infoValue}>{selectedLocation.rating}</Text>
              <Text style={styles.infoLabel}>({selectedLocation.reviews} შეფასება)</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="clock" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>ლოდინი:</Text>
              <Text style={styles.infoValue}>{selectedLocation.waitTime}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="tag" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>ფასი:</Text>
              <Text style={styles.infoValue}>{selectedLocation.price}</Text>
            </View>
          </View>
          
          <View style={styles.servicesContainer}>
            <Text style={styles.servicesTitle}>სერვისები:</Text>
            <View style={styles.servicesList}>
              {selectedLocation.services.map((service: string, index: number) => (
                <View key={index} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Partner Profile Pro sections */}
          {!!selectedLocation.offer && (
            <View style={styles.dealBanner}><Text style={styles.dealTextAlt}>{selectedLocation.offer}</Text></View>
          )}
          {!!selectedLocation.media?.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
              {selectedLocation.media.slice(0,4).map((m: string, i: number) => (
                <Image key={i} source={{ uri: m }} style={styles.mediaThumb} />
              ))}
            </ScrollView>
          )}
          {!!selectedLocation.menu?.length && (
            <View style={styles.menuRow}>
              {selectedLocation.menu.slice(0,4).map((item: string, i: number) => (
                <View key={i} style={styles.menuItem}>
                  <Text style={styles.menuTitle}>{item}</Text>
                  <Text style={styles.menuPrice}>from {selectedLocation.price}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Q&A removed */}

          {/* Live queue row */}
          <View style={styles.queueRow}>
            <View style={styles.queueBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.queueText}>რიგი: {queues[selectedLocation.id]?.length ?? 0} კლიენტი • ETA {getEtaText(selectedLocation.id)}</Text>
            </View>
            <TouchableOpacity onPress={() => setQueues(prev => ({ ...prev, [selectedLocation.id]: { ...(prev[selectedLocation.id]||{ avgMinsPerTicket: 6, length: 0 }), length: Math.max(0, (prev[selectedLocation.id]?.length ?? 0) - 1) } }))}>
              <Text style={[styles.queueText, { color: '#A78BFA' }]}>refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Ticket card */}
          <View style={styles.ticketCard}>
            {tickets[selectedLocation.id] ? (
              <>
                <Text style={styles.ticketTitle}>ბილეთი #{tickets[selectedLocation.id].ticketNumber}</Text>
                <Text style={styles.ticketMeta}>მოსალოდნელი დრო: {getEtaText(selectedLocation.id)}</Text>
                <View style={styles.actionsRow}>
                  {!tickets[selectedLocation.id].arrived && (
                    <TouchableOpacity style={styles.ghostBtn} onPress={markArrived}><Text style={styles.ghostText}>მოვედი</Text></TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.primaryBtn} onPress={issueTicket}><Text style={styles.primaryText}>განახლება</Text></TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={issueTicket}><Text style={styles.primaryText}>აიღე ბილეთი</Text></TouchableOpacity>
              </View>
            )}
          </View>

          {/* Chat removed */}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
              <Feather name="phone" size={16} color="#E5E7EB" />
              <Text style={[styles.actionButtonText, styles.callButtonText]}>ზარი</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.routeButton]} onPress={handleRoute}>
              <Feather name="navigation" size={16} color="#A78BFA" />
              <Text style={[styles.actionButtonText, styles.routeButtonText]}>მარშრუტი</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.bookButton]}
              onPress={handleBooking}
            >
              <Feather name="calendar" size={16} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.bookButtonText]}>დაჯავშნა</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Filter Modal */}
      {!isPickerMode && (
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>ფილტრები</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}><Feather name="x" size={18} color="#FFFFFF" /></TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 14, paddingBottom: 120 }}
            >
              <View>
                <Text style={styles.sectionTitle}>კატეგორია</Text>
                <View style={styles.rowWrap}>
                  {['All','Premium','Express','Luxury'].map((c) => (
                    <TouchableOpacity key={c} style={[styles.pill, (activeCategory===c|| (c==='All'&&activeCategory==='All')) && styles.pillActive]} onPress={() => setActiveCategory(c as any)}>
                      <Text style={[styles.pillText, (activeCategory===c|| (c==='All'&&activeCategory==='All')) && styles.pillTextActive]}>{c==='All'?'ყველა':c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.sectionTitle}>სტატუსი</Text>
                <View style={styles.rowWrap}>
                  <TouchableOpacity style={[styles.pill, openNow && styles.pillActive]} onPress={() => setOpenNow(!openNow)}>
                    <Text style={[styles.pillText, openNow && styles.pillTextActive]}>{openNow? 'ღიაა' : 'ახლა'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.pill, partnersOnly && styles.pillActive]} onPress={() => setPartnersOnly(!partnersOnly)}>
                    <Text style={[styles.pillText, partnersOnly && styles.pillTextActive]}>პარტნიორი</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.pill, minRating>=4.5 && styles.pillActive]} onPress={() => setMinRating(minRating>=4.5?0:4.5)}>
                    <Text style={[styles.pillText, minRating>=4.5 && styles.pillTextActive]}>★4.5+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <Text style={styles.sectionTitle}>სორტირება</Text>
                <View style={styles.rowWrap}>
                  {['nearest','topRated'].map(s => (
                    <TouchableOpacity key={s} style={[styles.pill, sortBy===s && styles.pillActive]} onPress={() => setSortBy(s as any)}>
                      <Text style={[styles.pillText, sortBy===s && styles.pillTextActive]}>{s==='nearest'?'ახლოს':'რეიტინგი'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.sectionTitle}>რადიუსი</Text>
                <View style={styles.rowWrap}>
                  {[1,3,5,10].map(r => (
                    <TouchableOpacity key={r} style={[styles.pill, radiusKm===r && styles.pillActive]} onPress={() => setRadiusKm(r)}>
                      <Text style={[styles.pillText, radiusKm===r && styles.pillTextActive]}>{r}კმ</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={[styles.actionsRow, { position: 'absolute', left: 16, right: 16, bottom: 16 }] }>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => { setActiveCategory('All'); setOpenNow(false); setPartnersOnly(false); setMinRating(0); setSortBy('nearest'); setRadiusKm(3); }}>
                <Text style={styles.ghostText}>განულება</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsFilterOpen(false)}>
                <Text style={styles.primaryText}>გამოყენება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}

      {/* Checkout Modal */}
      {!isPickerMode && (
      <Modal
        visible={isCheckoutOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCheckoutOpen(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.marketSheet}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>დაბარების მონიშვნა</Text>
              <TouchableOpacity onPress={() => setIsCheckoutOpen(false)}><Feather name="x" size={18} color="#FFFFFF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ gap: 12, paddingBottom: 160 }}>
              <Text style={styles.sectionTitle}>მიწოდების რეჟიმი</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setDeliveryMode('delivery')} style={[styles.pill, deliveryMode==='delivery' && styles.pillActive]}>
                  <Text style={[styles.pillText, deliveryMode==='delivery' && styles.pillTextActive]}>მიწოდება მანქანამდე</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeliveryMode('pickup')} style={[styles.pill, deliveryMode==='pickup' && styles.pillActive]}>
                  <Text style={[styles.pillText, deliveryMode==='pickup' && styles.pillTextActive]}>პიკაპი</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionTitle}>დროის სლოტი</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 12 }}
              >
                {generateTimeSlots().map(slot => (
                  <TouchableOpacity key={slot} onPress={() => setSelectedSlot(slot)} style={[styles.pill, selectedSlot===slot && styles.pillActive]}>
                    <Text style={[styles.pillText, selectedSlot===slot && styles.pillTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.sectionTitle}>შეჯამება</Text>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.cartTotalText}>ნივთები: {Object.values(cart).reduce((a,b)=>a+(b||0),0)}</Text>
                  <Text style={styles.cartTotalText}>{formatGel(cartTotal(selectedStore))}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.cartTotalText}>ვიქნები: {selectedSlot}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.cartTotalText}>Live</Text>
                    <Switch value={shareLiveLocation} onValueChange={setShareLiveLocation} />
                  </View>
                </View>
              </View>
            </ScrollView>
            <View style={styles.cartBar}>
              <Text style={styles.cartTotalText}>ჯამი: {formatGel(cartTotal(selectedStore))}</Text>
              <TouchableOpacity style={styles.orderBtn} onPress={() => {
                setIsCheckoutOpen(false);
                const total = cartTotal(selectedStore);
                const params = new URLSearchParams({
                  storeName: selectedStore?.name ?? '',
                  address: selectedStore?.address ?? '',
                  lat: String(selectedStore?.coordinates?.latitude ?? ''),
                  lng: String(selectedStore?.coordinates?.longitude ?? ''),
                  phone: selectedStore?.phone ?? '',
                  slot: selectedSlot || '',
                  total: String(total),
                  live: shareLiveLocation ? '1' : '0',
                }).toString();
                router.push(`/payment?${params}` as never);
              }}>
                <Text style={styles.orderText}>ბარათით გადახდა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}

      {/* Market Info Modal (final screen) */}
      {!isPickerMode && (
      <Modal
        visible={isDriverOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDriverOpen(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.marketSheet}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>მაღაზია გზაშია</Text>
              <TouchableOpacity onPress={() => setIsDriverOpen(false)}><Feather name="x" size={18} color="#FFFFFF" /></TouchableOpacity>
            </View>
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionTitle}>{selectedStore?.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image source={{ uri: selectedStore?.media?.[0] }} style={{ width: 56, height: 56, borderRadius: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealOfferText}>{selectedStore?.address}</Text>
                </View>
                <TouchableOpacity style={styles.applyBtn} onPress={() => {
                  const lat = selectedStore?.coordinates?.latitude; const lng = selectedStore?.coordinates?.longitude;
                  const label = selectedStore?.name || 'Market';
                  const url = Platform.select({ ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`, android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label)})` });
                  if (url) Linking.openURL(url);
                }}>
                  <Feather name="navigation" size={14} color="#0B0B0E" />
                  <Text style={styles.applyText}>ნავიგაცია</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionTitle}>ვინ მოგაწვდის</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop' }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                <Text style={styles.productTitle}>დრაივერი გუნდი</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.applyBtn} onPress={() => Linking.openURL(`tel:+995595123789`)}>
                  <Feather name="phone" size={14} color="#0B0B0E" />
                  <Text style={styles.applyText}>დარეკვა</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionTitle}>შეკვეთის სია</Text>
              <View style={{ gap: 8 }}>
                {selectedStore && computeCatalog(selectedStore).slice(0,3).map(p => (
                  <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.productTitle}>{p.title}</Text>
                    <Text style={styles.productPrice}>{(cart[p.id]||0)} x {formatGel(p.price)}</Text>
                  </View>
                ))}
                <Text style={styles.cartTotalText}>ჯამი: {formatGel(cartTotal(selectedStore))}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      )}
      {/* Market Modal */}
      {!isPickerMode && (
      <Modal
        visible={isMarketOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMarketOpen(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.marketSheet}>
            <View style={[styles.sheetTitleRow, { gap: 8 }]}>
              <TouchableOpacity onPress={() => { setIsMarketOpen(false); setIsDrivePickerOpen(true); }} style={{ padding: 6 }}>
                <Feather name="arrow-left" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{selectedStore?.name || 'მაღაზია'}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setIsMarketOpen(false)}><Feather name="x" size={18} color="#FFFFFF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ gap: 12, paddingBottom: 120 }}>
              {selectedStore && computeCatalog(selectedStore).map(p => (
                <View key={p.id} style={styles.productCard}>
                  <Image source={{ uri: p.image }} style={styles.productThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productTitle}>{p.title}</Text>
                    <Text style={styles.productPrice}>{formatGel(p.price)}</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decFromCart(p.id)}><Text style={styles.qtyText}>-</Text></TouchableOpacity>
                    <Text style={styles.qtyText}>{cart[p.id] || 0}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(p.id)}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.cartBar}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
                  {generateTimeSlots().map(slot => (
                    <TouchableOpacity key={slot} onPress={() => setSelectedSlot(slot)} style={[styles.pill, selectedSlot===slot && styles.pillActive]}>
                      <Text style={[styles.pillText, selectedSlot===slot && styles.pillTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.orderBtn} onPress={() => { setIsMarketOpen(false); setIsCheckoutOpen(true); }}>
                <Text style={styles.orderText}>გაგრძელება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}

      {/* Drive Picker Modal */}
      {!isPickerMode && (
      <Modal
        visible={isDrivePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDrivePickerOpen(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.marketSheet}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>ახლომდებარე დრაივები</Text>
              <TouchableOpacity onPress={() => setIsDrivePickerOpen(false)}><Feather name="x" size={18} color="#FFFFFF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ gap: 10 }}>
              {CAR_WASH_LOCATIONS
                .map(l => ({
                  ...l,
                  _distanceKm: getDistanceKm(mapRegion.latitude, mapRegion.longitude, l.coordinates.latitude, l.coordinates.longitude),
                }))
                .sort((a, b) => a._distanceKm - b._distanceKm)
                .slice(0, 20)
                .map(l => (
                  <TouchableOpacity key={l.id} style={styles.dealItem}>
                    <Image source={{ uri: l.media?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop' }} style={styles.dealThumb} />
                    <View style={styles.dealInfo}>
                      <Text style={styles.dealName}>{l.name}</Text>
                      <Text style={styles.dealOfferText}>{l._distanceKm.toFixed(1)}კმ • {l.isPartner ? 'Partner' : 'Store'}</Text>
                    </View>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => { beginDriveWithDestination(l); }}>
                      <Feather name="check" size={14} color="#0B0B0E" />
                      <Text style={styles.applyText}>არჩევა</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      )}

      {/* Destination step removed (drive მიდის თავად დრაივთან) */}
      {/* Deals Modal */}
      {!isPickerMode && (
      <Modal
        visible={isDealsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDealsOpen(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>შეთავაზებები ახლოს</Text>
              <TouchableOpacity onPress={() => setIsDealsOpen(false)}><Feather name="x" size={18} color="#FFFFFF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.dealsList}>
              {CAR_WASH_LOCATIONS.filter(l => !!l.offer).map(store => (
                <TouchableOpacity key={store.id} style={styles.dealItem} onPress={() => { focusOnLocation(store); setIsDealsOpen(false); }}>
                  <Image source={store.image} style={styles.dealThumb} />
                  <View style={styles.dealInfo}>
                    <Text style={styles.dealName}>{store.name}</Text>
                    <Text style={styles.dealOfferText}>{store.offer}</Text>
                  </View>
                  <View style={styles.dealActions}>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => { setDealsOnly(true); setIsDealsOpen(false); }}>
                      <Feather name="filter" size={14} color="#0B0B0E" />
                      <Text style={styles.applyText}>ფილტრი</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      )}

      {isPickerMode && (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, gap: 10 }}>
          <View style={{ backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: '#E5E7EB' }}>მდებარეობა:</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{mapRegion.latitude.toFixed(6)}, {mapRegion.longitude.toFixed(6)}</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
            onPress={() => {
              publishLocation({
                type: 'LOCATION_PICKED',
                payload: {
                  latitude: mapRegion.latitude,
                  longitude: mapRegion.longitude,
                  address: `${mapRegion.latitude.toFixed(6)}, ${mapRegion.longitude.toFixed(6)}`,
                },
              });
              router.back();
            }}
          >
            <Text style={{ color: '#0B0B0E', fontWeight: '700' }}>არჩევა</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
