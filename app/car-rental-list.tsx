import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import API_BASE_URL from '../config/api';
import CarRentalCard from '../components/ui/CarRentalCard';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// Helper ფუნქცია კატეგორიის icon-ის მისაღებად
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'ეკონომი': 'car-outline',
    'კომფორტი': 'car-sport-outline',
    'ლუქსი': 'diamond-outline',
    'SUV': 'logo-model-s',
    'მინივენი': 'bus-outline',
  };
  return iconMap[category] || 'car-outline';
}

interface RentalCar {
  _id?: string;
  id?: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  image?: string;
  images?: string[];
  transmission: string;
  fuelType: string;
  seats: number;
  rating?: number;
  reviews?: number;
  location: string;
  available?: boolean;
  features?: string[];
  deposit?: number;
  description?: string;
  address?: string;
  phone?: string;
}

interface FilterData {
  categories: string[];
  locations: string[];
  brands: string[];
  transmissions: string[];
  fuelTypes: string[];
  seatOptions: number[];
  priceRange: {
    min: number;
    max: number;
  };
  totalCars: number;
}

export default function CarRentalListScreen() {
  const router = useRouter();
  const colors = Colors['light'];

  const [cars, setCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterData | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // დინამიური კატეგორიები filters-იდან
  const categories = [
    { id: null, label: 'ყველა', icon: 'grid-outline' },
    ...(filters?.categories || []).map(cat => ({
      id: cat,
      label: cat,
      icon: getCategoryIcon(cat),
    })),
  ];

  // Fetch filters on mount
  useEffect(() => {
    fetchFilters();
  }, []);

  // Fetch cars when category changes
  useEffect(() => {
    if (!loadingFilters) {
      fetchCars();
    }
  }, [selectedCategory, loadingFilters]);

  const fetchFilters = async () => {
    try {
      setLoadingFilters(true);
      const response = await fetch(`${API_BASE_URL}/car-rental/filters`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch filters');
      }
      
      const data = await response.json();
      console.log('🎯 Filters loaded:', data);
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchCars = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const categoryParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      const response = await fetch(`${API_BASE_URL}/car-rental?limit=50&sortBy=rating&order=desc${categoryParam}`);

      if (!response.ok) {
        throw new Error('Failed to fetch cars');
      }

      const data = await response.json();
      console.log('🚗 Fetched cars data:', data);
      console.log('🚗 First car:', data[0]);
      setCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setCars([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCars(true), fetchFilters()]);
  };

  // Handle phone call
  const handleCall = (phone: string) => {
    const phoneNumber = `tel:${phone.replace(/\s/g, '')}`;
    
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('შეცდომა', 'ტელეფონზე დარეკვა შეუძლებელია');
        }
      })
      .catch((err) => console.error('Error opening phone dialer:', err));
  };

  // Filter cars by search query
  const filteredCars = cars.filter(car => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      car.brand?.toLowerCase().includes(query) ||
      car.model?.toLowerCase().includes(query) ||
      car.location?.toLowerCase().includes(query)
    );
  });


  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>მანქანების გაქირავება</Text>
        <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
          <Ionicons name={showSearch ? "close" : "search"} size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ძიება ბრენდით, მოდელით..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id || 'all'}
        renderItem={({ item }) => {
          const isActive = selectedCategory === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                isActive && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={isActive ? '#111827' : '#6B7280'}
              />
              <Text
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.categoriesContent}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="car-outline" size={80} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyText}>
        {searchQuery ? 'ძიება არ გამოიწვია შედეგი' : 'მანქანები არ მოიძებნა'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'სცადეთ სხვა საძიებო სიტყვა' : 'სცადეთ სხვა ფილტრები'}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearSearchText}>ძიების გასუფთავება</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>მანქანების გაქირავება</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>ჩატვირთვა...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderCategories()}

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item._id || item.id || ''}
        renderItem={({ item }) => {
          const carId = item._id || item.id || '';
          const imageUrl = item.images?.[0] || item.image || '';
          
          return (
            <CarRentalCard
              id={carId}
              brand={item.brand}
              model={item.model}
              year={item.year}
              category={item.category}
              pricePerDay={item.pricePerDay}
              pricePerWeek={item.pricePerWeek}
              image={imageUrl}
              transmission={item.transmission}
              fuelType={item.fuelType}
              seats={item.seats}
              rating={item.rating || 0}
              reviews={item.reviews || 0}
              location={item.location}
              available={item.available !== false}
              features={item.features || []}
              phone={item.phone}
              width={width - 32}
              height={180}
              onPress={() => router.push(`/car-rental/${carId}` as any)}
              onCall={handleCall}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter',
    color: '#111827',
  },
  categoriesContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  categoryChipActive: {
    backgroundColor: '#111827',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
});


