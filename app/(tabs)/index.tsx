import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useColorScheme, toggleColorScheme } from '../../components/useColorScheme';
import { useRouter } from 'expo-router';
import ServiceCard from '../../components/ui/ServiceCard';
import Button from '../../components/ui/Button';
import ReminderTicket from '../../components/ui/ReminderTicket';
import Chip from '../../components/ui/Chip';
import MiniServiceCard from '../../components/ui/MiniServiceCard';
import NearbyCard from '../../components/ui/NearbyCard';

const REMINDERS = [
  {
    id: '1',
    title: 'ზეთის გამოცვლა',
    car: 'BMW M5',
    date: '2024-07-15',
    type: 'service',
    icon: 'build-outline',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'ტექდათვალიერება',
    car: 'Mercedes C63',
    date: '2024-08-01',
    type: 'inspection',
    icon: 'car-outline',
    color: '#22C55E',
    bgColor: '#F0FDF4',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'ბორბლების გამოცვლა',
    car: 'BMW M5',
    date: '2024-09-10',
    type: 'service',
    icon: 'settings-outline',
    color: '#F97316',
    bgColor: '#FFF7ED',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '4',
    title: 'კონდიციონერის სერვისი',
    car: 'Mercedes C63',
    date: '2024-06-20',
    type: 'service',
    icon: 'thermometer-outline',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
  },
];

const POPULAR_SERVICES = [
  {
    id: '1',
    name: 'პრემიუმ სამრეცხაო',
    location: 'საბურთალო',
    rating: 4.8,
    price: '15₾',
    image: require('../../assets/images/car-bg.png'),
    category: 'სამრეცხაო',
  },
  {
    id: '2',
    name: 'ავტო სერვისი',
    location: 'ვაკე',
    rating: 4.9,
    price: '25₾',
    image: require('../../assets/images/car-bg.png'),
    category: 'სერვისი',
  },
  {
    id: '3',
    name: 'ტექდათვალიერება',
    location: 'დიდუბე',
    rating: 4.7,
    price: '30₾',
    image: require('../../assets/images/car-bg.png'),
    category: 'ტექდათვალიერება',
  },
  {
    id: '4',
    name: 'ზეთის გამოცვლა',
    location: 'მთაწმინდა',
    rating: 4.6,
    price: '40₾',
    image: require('../../assets/images/car-bg.png'),
    category: 'სერვისი',
  },
];

export default function TabOneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: colors.background,
    },
    profileRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 16,
    },
    avatarSmall: { width: 40, height: 40, borderRadius: 20 },
    userName: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text },
    smallLocation: { marginLeft: 4, fontSize: 12, color: colors.secondary, fontFamily: 'Poppins_500Medium' },
    roundIcon: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
      alignItems: 'center' as const, justifyContent: 'center' as const,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 2,
    },
    promoCard: {
      marginTop: 4,
      marginHorizontal: 4,
      backgroundColor: '#111827',
      borderRadius: 20,
      overflow: 'hidden' as const,
      height: 148,
      position: 'relative' as const,
    },
    promoImage: { position: 'absolute' as const, width: '100%', height: '100%' },
    promoOverlay: { ...StyleSheet.absoluteFillObject },
    promoContent: { position: 'absolute' as const, left: 16, top: 16, right: 16 },
    promoTitle: { fontSize: 18, lineHeight: 22, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
    promoSubtitle: { marginTop: 4, color: '#E5E7EB', fontFamily: 'Manrope_500Medium', fontSize: 12 },
    promoButton: { marginTop: 14, alignSelf: 'flex-start', backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    promoButtonText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 14 },
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
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      letterSpacing: -0.2,
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
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 16,
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
      fontFamily: 'NotoSans_700Bold',
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
    mapBannerTitle: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
    mapBannerSubtitle: { color: '#E5E7EB', fontFamily: 'NotoSans_500Medium', fontSize: 11, marginTop: 4 },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    sectionAction: {
      fontSize: 13,
      fontFamily: 'NotoSans_600SemiBold',
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
      fontFamily: 'NotoSans_600SemiBold',
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
      fontFamily: 'NotoSans_700Bold',
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
      fontFamily: 'NotoSans_700Bold',
      color: '#FFFFFF',
    },
    remindersContainer: {
      paddingTop: 32,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    remindersList: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    reminderCard: {
      width: 280,
      padding: 16,
      borderRadius: 18,
      marginRight: 16,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    reminderRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    reminderThumb: { width: 56, height: 56, borderRadius: 14 },
    reminderTexts: { flex: 1 },
    reminderMetaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 4 },
    reminderRight: { alignItems: 'flex-end' as const, gap: 8 },
    daysPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#111827' },
    daysPillUrgent: { backgroundColor: '#EF4444' },
    daysText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 11 },
    reminderHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
    },
    reminderIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    reminderBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    reminderBadgeText: {
      fontSize: 11,
      fontFamily: 'NotoSans_600SemiBold',
    },
    reminderContent: {
      gap: 16,
    },
    reminderInfo: {
      gap: 8,
    },
    reminderTitle: {
      fontSize: 14,
      fontFamily: 'NotoSans_600SemiBold',
      lineHeight: 20,
    },
    reminderCar: {
      fontSize: 12,
      fontFamily: 'NotoSans_500Medium',
    },
    reminderDate: {
      fontSize: 11,
      fontFamily: 'NotoSans_500Medium',
    },
    reminderGradient: {
      flex: 1,
      padding: 16,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    reminderTitleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    urgentIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    reminderDetails: {
      gap: 8,
    },
    reminderDetailItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    reminderIconContainer: {
      position: 'relative' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    progressRing: {
      position: 'absolute' as const,
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    progressFill: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      height: '100%',
      borderRadius: 30,
    },
    reminderNeon: {
      flex: 1,
      padding: 20,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 2,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    reminderIconWrapper: {
      position: 'relative' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    iconGlow: {
      position: 'absolute' as const,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Header (new) */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.avatarSmall} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.userName}>გამარჯობა!</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={14} color={colors.secondary} />
                <Text style={styles.smallLocation}>თბილისი, საქართველო</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={styles.roundIcon}><Ionicons name="search" size={18} color={'#111827'} /></View>
            <View style={styles.roundIcon}><Ionicons name="notifications-outline" size={18} color={'#111827'} /></View>
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoCard}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=1200&auto=format&fit=crop' }} style={styles.promoImage} />
          <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]} style={styles.promoOverlay} />
          <View style={styles.promoContent}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#EF4444', marginBottom: 8 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 }}>🔥 ფასდაკლება</Text>
            </View>
            <Text style={styles.promoTitle}>35% ფასდაკლება{'\n'}პირველ სერვისზე</Text>
            <Text style={styles.promoSubtitle}>სამრეცხაო სერვისები</Text>
            <Button title="დაჯავშნა" onPress={() => router.push('/map')} variant="black" size="sm" />
          </View>
        </View>
      </View>

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
          {POPULAR_SERVICES.map((service) => (
            <ServiceCard
              key={service.id}
              image={service.image}
              title={service.name}
              category={service.category}
              rating={service.rating}
              location={service.location}
              price={service.price}
              onPress={() => router.push({ pathname: '/details', params: { title: service.name } })}
            />
          ))}
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
          {POPULAR_SERVICES.map(s => (
            <NearbyCard key={s.id} image={s.image} title={s.name} subtitle={s.location} rating={s.rating} distance={'1.2კმ'} price={s.price} onPress={() => router.push({ pathname: '/details', params: { title: s.name } })} />
          ))}
        </ScrollView>
      </View>

      {/* Reminders */}
      <View style={styles.remindersContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>შეხსენებები</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>ყველა</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.remindersList}>
          {REMINDERS.map((r) => (
            <ReminderTicket
              key={r.id}
              title={r.title}
              car={r.car}
              date={r.date}
              icon={r.icon}
              onPress={() => router.push('/booking')}
            />
          ))}
        </ScrollView>
        

      </View>

      {/* Popular Services Slider */}
    </ScrollView>
  );
}