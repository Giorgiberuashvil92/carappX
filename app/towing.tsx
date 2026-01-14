import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  StatusBar,
  FlatList,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useUser } from '../contexts/UserContext';
import API_BASE_URL from '../config/api';

const { width, height } = Dimensions.get('window');

export default function TowingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [activeChip, setActiveChip] = useState<'top' | 'near' | 'cheap'>('top');
  const [openOnly, setOpenOnly] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadTowingServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/services`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const servicesArray = Array.isArray(data) ? data : (data.data || []);
      
      // Filter only towing/evakuator services
      const towingServices = servicesArray.filter((service: any) => {
        const category = (service.category || '').toLowerCase();
        const name = (service.name || '').toLowerCase();
        const description = (service.description || '').toLowerCase();
        
        return category.includes('ევაკუატორ') || 
               category.includes('towing') ||
               name.includes('ევაკუატორ') ||
               name.includes('towing') ||
               description.includes('ევაკუატორ') ||
               description.includes('towing');
      });
      
      const services = towingServices.map((service: any) => ({
        id: service.id || service._id,
        name: service.name,
        description: service.description,
        category: service.category || 'ევაკუატორი',
        location: service.location,
        address: service.address,
        phone: service.phone,
        price: service.price,
        rating: service.rating || 0,
        reviews: service.reviews || 0,
        images: service.images || [],
        avatar: service.avatar,
        isOpen: service.isOpen !== undefined ? service.isOpen : true,
        waitTime: service.waitTime,
        workingHours: service.workingHours,
        latitude: service.latitude,
        longitude: service.longitude,
        distance: service.distance,
      }));
      
      setAllServices(services);
    } catch (error) {
      console.error('❌ [TOWING] Error loading services:', error);
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTowingServices();
  }, [loadTowingServices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTowingServices();
    setRefreshing(false);
  }, [loadTowingServices]);

  const handleChipPress = (chipId: 'top' | 'near' | 'cheap' | 'open') => {
    if (chipId === 'open') {
      setOpenOnly((prev) => !prev);
      return;
    }
    setActiveChip(chipId);
  };

  const filteredServices = useMemo(() => {
    let list = [...allServices];
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.address.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }
    
    if (openOnly) {
      list = list.filter((l) => l.isOpen);
    }
    
    return list;
  }, [allServices, searchQuery, openOnly]);

  const sortedServices = useMemo(() => {
    return [...filteredServices].sort((a, b) => {
      switch (activeChip) {
        case 'top':
          return b.rating - a.rating;
        case 'near':
          const distanceA = parseFloat(String(a.distance || '0').replace(/[^\d.]/g, ''));
          const distanceB = parseFloat(String(b.distance || '0').replace(/[^\d.]/g, ''));
          return distanceA - distanceB;
        case 'cheap':
          const priceA = parseInt(String(a.price || '0').replace(/[^\d]/g, ''));
          const priceB = parseInt(String(b.price || '0').replace(/[^\d]/g, ''));
          return priceA - priceB;
        default:
          return 0;
      }
    });
  }, [filteredServices, activeChip]);

  const handleLocationPress = (location: any) => {
    router.push({
      pathname: '/details',
      params: {
        id: location.id,
        type: 'towing',
        title: location.name,
        lat: location.latitude || 41.7151,
        lng: location.longitude || 44.8271,
        rating: location.rating,
        distance: location.distance,
        price: location.price,
        address: location.address,
        description: location.description,
        category: location.category || 'ევაკუატორი',
        isOpen: location.isOpen,
        phone: location.phone,
        workingHours: location.workingHours,
        image: location.images?.[0] || location.avatar,
      }
    });
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderServiceCard = ({ item: location }: { item: any }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleLocationPress(location)}
      activeOpacity={0.9}
    >
      <View style={styles.cardContent}>
        {location.images?.[0] ? (
          <Image source={{ uri: location.images[0] }} style={styles.serviceImage} />
        ) : (
          <View style={[styles.serviceImage, styles.serviceImagePlaceholder]}>
            <Ionicons name="car-sport" size={40} color="#9CA3AF" />
          </View>
        )}
        
        <View style={styles.serviceInfo}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceName} numberOfLines={1}>{location.name}</Text>
            {location.isOpen && (
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>ღიაა</Text>
              </View>
            )}
          </View>
          
          {location.description && (
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {location.description}
            </Text>
          )}
          
          <View style={styles.serviceMeta}>
            {location.address && (
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color="#6B7280" />
                <Text style={styles.metaText} numberOfLines={1}>{location.address}</Text>
              </View>
            )}
            
            {location.distance && (
              <View style={styles.metaItem}>
                <Ionicons name="navigate" size={14} color="#6B7280" />
                <Text style={styles.metaText}>{location.distance}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.serviceFooter}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{location.rating.toFixed(1)}</Text>
              {location.reviews > 0 && (
                <Text style={styles.reviewsText}>({location.reviews})</Text>
              )}
            </View>
            
            {location.price && (
              <Text style={styles.priceText}>{location.price}</Text>
            )}
          </View>
          
          {location.phone && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(location.phone)}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.callButtonText}>დარეკვა</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => {
              router.back();
            }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>ევაკუატორი</Text>
              <View style={styles.titleUnderline} />
            </View>
            
            <View style={styles.headerRight} />
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="ძიება..."
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
          
          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            <TouchableOpacity
              style={[styles.chip, activeChip === 'top' && styles.chipActive]}
              onPress={() => handleChipPress('top')}
            >
              <Text style={[styles.chipText, activeChip === 'top' && styles.chipTextActive]}>
                ტოპ რეიტინგი
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.chip, activeChip === 'near' && styles.chipActive]}
              onPress={() => handleChipPress('near')}
            >
              <Text style={[styles.chipText, activeChip === 'near' && styles.chipTextActive]}>
                ახლოს
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.chip, activeChip === 'cheap' && styles.chipActive]}
              onPress={() => handleChipPress('cheap')}
            >
              <Text style={[styles.chipText, activeChip === 'cheap' && styles.chipTextActive]}>
                ყველაზე იაფი
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.chip, openOnly && styles.chipActive]}
              onPress={() => handleChipPress('open')}
            >
              <Text style={[styles.chipText, openOnly && styles.chipTextActive]}>
                მხოლოდ ღია
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Services List */}
      {loading && allServices.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>იტვირთება...</Text>
        </View>
      ) : sortedServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-sport-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>ევაკუატორის სერვისები ვერ მოიძებნა</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={sortedServices}
          renderItem={renderServiceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    marginTop: 4,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit',
  },
  chipsContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
  },
  serviceImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  serviceImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  openBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  openBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  reviewsText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'Outfit',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Outfit',
    marginTop: 16,
  },
});

