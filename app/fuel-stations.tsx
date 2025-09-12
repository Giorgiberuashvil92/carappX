import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  ImageBackground,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import Button from '../components/ui/Button';

const { width } = Dimensions.get('window');

// Fuel station data for Georgia
const FUEL_STATIONS = [
  {
    id: '1',
    name: 'Wissol',
    brand: 'Wissol',
    logo: '🔵',
    regular: 2.89,
    premium: 3.19,
    diesel: 2.99,
    trend: 'up',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Gulf',
    brand: 'Gulf',
    logo: '🟢',
    regular: 2.85,
    premium: 3.15,
    diesel: 2.95,
    trend: 'stable',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'SOCAR',
    brand: 'SOCAR',
    logo: '🔴',
    regular: 2.87,
    premium: 3.17,
    diesel: 2.97,
    trend: 'up',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Rompetrol',
    brand: 'Rompetrol',
    logo: '🟡',
    regular: 2.82,
    premium: 3.12,
    diesel: 2.92,
    trend: 'down',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: '5',
    name: 'Lukoil',
    brand: 'Lukoil',
    logo: '🟠',
    regular: 2.84,
    premium: 3.14,
    diesel: 2.94,
    trend: 'stable',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
  },
];

const FUEL_TYPES = [
  { id: 'regular', name: 'რეგულარული', color: '#10B981', icon: 'local-gas-station', gradient: ['#10B981', '#059669'] },
  { id: 'premium', name: 'პრემიუმი', color: '#3B82F6', icon: 'diamond', gradient: ['#3B82F6', '#1D4ED8'] },
  { id: 'diesel', name: 'დიზელი', color: '#F59E0B', icon: 'engineering', gradient: ['#F59E0B', '#D97706'] },
];

export default function FuelStationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState('regular');
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return Colors.light.error;
      case 'down': return Colors.light.success;
      default: return Colors.light.secondary;
    }
  };

  const getSortedStations = () => {
    let filtered = [...FUEL_STATIONS];
    
    if (searchQuery) {
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      const priceA = a[selectedFuelType as keyof typeof a] as number;
      const priceB = b[selectedFuelType as keyof typeof b] as number;
      return priceA - priceB;
    });
  };

  const renderFuelStation = (station: any, index: number) => {
    const price = station[selectedFuelType as keyof typeof station] as number;
    const isCheapest = index === 0;
    
    return (
      <TouchableOpacity 
        key={station.id} 
        style={[
          styles.stationCard,
          isCheapest && styles.stationCardBest
        ]} 
        activeOpacity={0.7}
      >
        <View style={styles.stationContent}>
          <View style={styles.stationLeft}>
            <View style={[styles.stationLogo, isCheapest && styles.stationLogoBest]}>
              <Text style={[styles.logoText, isCheapest && styles.logoTextBest]}>{station.logo}</Text>
            </View>
            <View style={styles.stationInfo}>
              <Text style={[styles.stationName, isCheapest && styles.stationNameBest]}>
                {station.brand}
              </Text>
              <View style={styles.stationRating}>
                <Ionicons name="star" size={12} color={isCheapest ? "#FFFFFF" : "#F59E0B"} />
                <Text style={[styles.ratingText, isCheapest && styles.ratingTextBest]}>
                  {station.rating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.stationRight}>
            {isCheapest && (
              <View style={styles.buyButton}>
                <Text style={styles.buyButtonText}>ყიდვა</Text>
              </View>
            )}
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Ionicons name="star" size={14} color={isCheapest ? "#FFFFFF" : "#F59E0B"} />
                <Text style={[styles.priceValue, isCheapest && styles.priceValueBest]}>
                  {price.toFixed(2)}₾
                </Text>
              </View>
              {isCheapest && (
                <Text style={styles.oldPrice}>2.74₾</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>საწვავი</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Promotional Banners */}
      <View style={styles.bannersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.bannersScroll}
          contentContainerStyle={styles.bannersScrollContent}
        >
          <TouchableOpacity style={styles.promoBanner} activeOpacity={0.8}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?q=80&w=400&auto=format&fit=crop' }}
              style={styles.bannerImage}
              imageStyle={styles.bannerImageStyle}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerMainText}>ყველაზე იაფი ბენზინი</Text>
                  <Text style={styles.bannerSubText}>Portal-ში</Text>
                  <View style={styles.bannerPriceContainer}>
                    <Text style={styles.bannerPriceText}>2.56₾</Text>
                    <Text style={styles.bannerPriceLabel}>ლიტრი</Text>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.promoBanner} activeOpacity={0.8}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=400&auto=format&fit=crop' }}
              style={styles.bannerImage}
              imageStyle={styles.bannerImageStyle}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerMainText}>ფასდაკლება</Text>
                  <Text style={styles.bannerSubText}>SOCAR-ში</Text>
                  <View style={styles.bannerDiscountContainer}>
                    <Text style={styles.bannerDiscountText}>30 თეთრამდე</Text>
                    <Text style={styles.bannerDiscountLabel}>ფასდაკლება</Text>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.promoBanner} activeOpacity={0.8}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=400&auto=format&fit=crop' }}
              style={styles.bannerImage}
              imageStyle={styles.bannerImageStyle}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerMainText}>პრემიუმ ხარისხი</Text>
                  <Text style={styles.bannerSubText}>Gulf-ში</Text>
                  <View style={styles.bannerQualityContainer}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.bannerQualityText}>5.0 რეიტინგი</Text>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Market Stats */}
        <View style={styles.marketStatsSection}>
          <View style={styles.marketStatsCard}>
            <View style={styles.marketStatsHeader}>
              <Text style={styles.marketStatsTitle}>ბაზრის სტატისტიკა</Text>
              <TouchableOpacity style={styles.refreshStatsBtn}>
                <Ionicons name="refresh" size={16} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.marketStatsGrid}>
              <View style={styles.marketStatItem}>
                <Text style={styles.marketStatValue}>{FUEL_STATIONS.length}</Text>
                <Text style={styles.marketStatLabel}>სადგური</Text>
              </View>
              <View style={styles.marketStatItem}>
                <Text style={styles.marketStatValue}>
                  {Math.min(...FUEL_STATIONS.map(s => s[selectedFuelType as keyof typeof s] as number)).toFixed(2)}₾
                </Text>
                <Text style={styles.marketStatLabel}>მინიმუმი</Text>
              </View>
              <View style={styles.marketStatItem}>
                <Text style={styles.marketStatValue}>
                  {Math.max(...FUEL_STATIONS.map(s => s[selectedFuelType as keyof typeof s] as number)).toFixed(2)}₾
                </Text>
                <Text style={styles.marketStatLabel}>მაქსიმუმი</Text>
              </View>
              <View style={styles.marketStatItem}>
                <Text style={styles.marketStatValue}>
                  {((Math.min(...FUEL_STATIONS.map(s => s[selectedFuelType as keyof typeof s] as number)) + 
                    Math.max(...FUEL_STATIONS.map(s => s[selectedFuelType as keyof typeof s] as number))) / 2).toFixed(2)}₾
                </Text>
                <Text style={styles.marketStatLabel}>საშუალო</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.carSelector}>
              <Text style={styles.carSelectorText}>აირჩიე მანქანა</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
            
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>თვითმომსახურება</Text>
              <View style={styles.toggle}>
                <View style={styles.toggleThumb} />
              </View>
            </View>
          </View>
        </View>

        {/* Fuel Type Tabs */}
        <View style={styles.fuelTabsSection}>
          <View style={styles.fuelTabsContainer}>
            {FUEL_TYPES.map((fuelType) => (
              <TouchableOpacity
                key={fuelType.id}
                style={[
                  styles.fuelTab,
                  selectedFuelType === fuelType.id && styles.fuelTabActive,
                ]}
                onPress={() => setSelectedFuelType(fuelType.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.fuelTabText,
                  selectedFuelType === fuelType.id && styles.fuelTabTextActive,
                ]}>
                  {fuelType.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stations List */}
        <View style={styles.stationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>სადგურების რეიტინგი</Text>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>ყველა</Text>
              <Ionicons name="chevron-forward" size={12} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.stationsList}>
            {getSortedStations().map((station, index) => renderFuelStation(station, index))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>სწრაფი მოქმედებები</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.7}>
              <LinearGradient
                colors={['#1DB954', '#16A34A']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="notifications" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>შეტყობინება</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.7}>
              <LinearGradient
                colors={['#E1306C', '#BE185D']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="analytics" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>შედარება</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.7}>
              <LinearGradient
                colors={['#1DA1F2', '#0EA5E9']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="location" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>მდებარეობა</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.7}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="share" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>გაზიარება</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: Colors.light.text,
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  bannersContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  bannersScroll: {
    marginHorizontal: -20,
  },
  bannersScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  promoBanner: {
    width: 300,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bannerImageStyle: {
    borderRadius: 16,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerTextContainer: {
    alignItems: 'flex-start',
  },
  bannerMainText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  bannerSubText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  bannerPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bannerPriceText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  bannerPriceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#E5E7EB',
  },
  bannerDiscountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerDiscountText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  bannerDiscountLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#E5E7EB',
  },
  bannerQualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerQualityText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  marketStatsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  marketStatsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  marketStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  marketStatsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.light.text,
  },
  refreshStatsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  marketStatItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
  },
  marketStatValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: Colors.light.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  marketStatLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.light.secondary,
    letterSpacing: -0.1,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  carSelector: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  carSelectorText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.light.secondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.light.secondary,
  },
  toggle: {
    width: 40,
    height: 20,
    backgroundColor: Colors.light.border,
    borderRadius: 10,
    padding: 2,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    marginLeft: 18,
  },
  fuelTabsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  fuelTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  fuelTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  fuelTabActive: {
    backgroundColor: Colors.light.primary,
  },
  fuelTabText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.light.secondary,
  },
  fuelTabTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: Colors.light.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  stationsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
  },
  viewAllText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Colors.light.primary,
  },
  stationsList: {
    gap: 8,
  },
  stationCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 6,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.surface,
  },
  stationCardBest: {
    backgroundColor: '#E0F2FE',
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  stationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  stationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stationLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 12,
  },
  stationLogoBest: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.primary,
  },
  logoText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: 'bold',
  },
  logoTextBest: {
    color: Colors.light.primary,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  stationNameBest: {
    color: Colors.light.primary,
  },
  stationRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: Colors.light.secondary,
  },
  ratingTextBest: {
    color: Colors.light.primary,
  },
  stationRight: {
    alignItems: 'flex-end',
  },
  buyButton: {
    backgroundColor: Colors.light.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  buyButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  priceValueBest: {
    color: Colors.light.primary,
  },
  oldPrice: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: Colors.light.secondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    borderRadius: 16,
    minWidth: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
