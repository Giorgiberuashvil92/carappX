import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ბენზინგასამართის ტიპები
const FUEL_TYPES = [
  { id: 'all', label: 'ყველა', icon: 'car' },
  { id: 'gasoline', label: 'ბენზინი', icon: 'flame' },
  { id: 'diesel', label: 'დიზელი', icon: 'water' },
  { id: 'electric', label: 'ელექტრო', icon: 'battery-charging' },
  { id: 'services', label: 'სერვისი', icon: 'construct' },
];

// ბენზინგასამართის მონაცემების ტიპი
interface FuelStation {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  distance: number;
  isOpen: boolean;
  services: string[];
  image?: string;
  fuelType: string;
}

// ბენზინგასამართის კარდ კომპონენტი (ჰორიზონტალური)
const FuelStationCard: React.FC<{
  station: FuelStation;
  onPress: () => void;
  index: number;
}> = ({ station, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [index, fadeAnim]);

  const getStatusColor = () => {
    return station.isOpen ? '#10B981' : '#EF4444';
  };

  const getStatusText = () => {
    return station.isOpen ? 'ღიაა' : 'დახურული';
  };

  return (
    <Animated.View
      style={[
        styles.stationCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}],
        },
      ]}
    >
      <TouchableOpacity style={styles.cardContent} onPress={onPress}>
        <ImageBackground
          source={{ uri: station.image || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop' }}
          style={styles.cardBackground}
          imageStyle={styles.cardImageStyle}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.cardOverlay}
          >
            <View style={styles.cardHeader}>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationLocation}>{station.location}</Text>
              <View style={styles.cardRating}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>{station.rating.toFixed(1)}</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FuelScreen() {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [showMap, setShowMap] = useState(false);

  // მოკითხვის მონაცემები
  const mockStations: FuelStation[] = [
    {
      id: '1',
      name: 'Love\'s Travel Stop',
      location: 'Dallas, TX',
      price: 3.60,
      rating: 4.9,
      reviews: 1200,
      distance: 2.1,
      isOpen: true,
      services: ['ბენზინი', 'სერვისი', '24/7'],
      fuelType: 'gasoline'
    },
    {
      id: '2',
      name: 'Costco Gasoline',
      location: 'Seattle, WA',
      price: 3.45,
      rating: 4.5,
      reviews: 890,
      distance: 1.8,
      isOpen: true,
      services: ['ბენზინი', 'დიზელი'],
      fuelType: 'gasoline'
    },
    {
      id: '3',
      name: 'Aloha Petroleum',
      location: 'Honolulu, HI',
      price: 4.20,
      rating: 4.3,
      reviews: 420,
      distance: 2.0,
      isOpen: true,
      services: ['ბენზინი', 'სერვისი'],
      fuelType: 'gasoline'
    },
    {
      id: '4',
      name: 'American Gas',
      location: 'Miami, FL',
      price: 3.80,
      rating: 4.5,
      reviews: 670,
      distance: 2.5,
      isOpen: true,
      services: ['ბენზინი', 'დიზელი', 'ელექტრო'],
      fuelType: 'mixed'
    }
  ];

  // ბენზინგასამართების ჩატვირთვა
  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      // სიმულაცია API-ს
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStations(mockStations);
    } catch (error) {
      console.error('ბენზინგასამართების ჩატვირთვის შეცდომა:', error);
      Alert.alert('შეცდომა', 'ბენზინგასამართების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStations();
  }, [loadStations]);

  const handleStationPress = (station: FuelStation) => {
    Alert.alert(
      station.name,
      `${station.location}\nფასი: ₾${station.price.toFixed(2)}/ლ\nრეიტინგი: ${station.rating.toFixed(1)}`,
      [
        { text: 'დახურვა', style: 'cancel' },
        { text: 'მარშრუტი', onPress: () => console.log('მარშრუტი:', station.name) },
        { text: 'დარეკვა', onPress: () => console.log('დარეკვა:', station.name) },
      ]
    );
  };

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         station.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedFuelType === 'all' || station.fuelType === selectedFuelType;
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={20} color="#1F2937" />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#10B981" />
                <Text style={styles.locationText}>From San Francisco</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop' }}
          style={styles.heroBackground}
          imageStyle={styles.heroImageStyle}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroSubtitle}>Fuel Station</Text>
              <Text style={styles.heroTitle}>Recommended Fuel Station</Text>
              
              <View style={styles.heroDetails}>
                <View style={styles.heroDetailItem}>
                  <Ionicons name="wallet" size={16} color="#FFFFFF" />
                  <Text style={styles.heroDetailText}>$3.60 Per Gallon</Text>
                </View>
                <View style={styles.heroDetailItem}>
                  <Ionicons name="car" size={16} color="#FFFFFF" />
                  <Text style={styles.heroDetailText}>Fuel + Services</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>24/7</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Fuel Station"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Recommended Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {filteredStations.slice(0, 3).map((station, index) => (
              <FuelStationCard
                key={station.id}
                station={station}
                index={index}
                onPress={() => handleStationPress(station)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Nearby Stations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Petrol Stations</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {filteredStations.map((station, index) => (
              <FuelStationCard
                key={station.id}
                station={station}
                index={index + 3}
                onPress={() => handleStationPress(station)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // თეთრი ბექგრაუნდი
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#374151',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  heroSection: {
    height: 280,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroBackground: {
    flex: 1,
  },
  heroImageStyle: {
    borderRadius: 20,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    gap: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  heroDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDetailText: {
    fontSize: 12,
    fontFamily: 'Outfit',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  heroBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit',
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    fontWeight: '500',
    color: '#10B981',
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  stationCard: {
    width: 200,
    height: 140,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardBackground: {
    flex: 1,
  },
  cardImageStyle: {
    borderRadius: 16,
  },
  cardOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  cardFooter: {
    gap: 4,
  },
  stationName: {
    fontSize: 16,
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stationLocation: {
    fontSize: 12,
    fontFamily: 'Outfit',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Outfit',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});