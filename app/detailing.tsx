import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Animated,
  TextInput,
  ImageBackground,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { addItemApi } from '../services/addItemApi';
import API_BASE_URL from '../config/api';

const { width, height } = Dimensions.get('window');

interface DetailingService {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  price?: string | number;
  rating: number;
  reviews: number;
  images: string[];
  avatar?: string;
  isOpen: boolean;
  verified?: boolean;
  services?: string[];
  features?: string;
  workingHours?: string;
  waitTime?: string;
}

export default function DetailingScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [services, setServices] = useState<DetailingService[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'verified'>('all');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Load from stores API with type filter
      const storesResponse = await addItemApi.getStores({ type: 'სხვა' });
      
      // Also try services API
      const servicesResponse = await fetch(`${API_BASE_URL}/services/list`);
      const servicesResult = await servicesResponse.json();
      
      const allServices: DetailingService[] = [];
      
      
      if (storesResponse.success && storesResponse.data) {
        const stores = storesResponse.data
          .filter((store: any) => store.type === 'სხვა')
          .map((store: any) => ({
          id: store.id || store._id,
          name: store.name || store.title,
          description: store.description || '',
          category: store.type || 'სხვა',
          location: store.location || '',
          address: store.address || store.location || '',
          phone: store.phone || '',
          price: undefined,
          rating: 4.5,
          reviews: 0,
          images: store.images || store.photos || [],
          avatar: store.avatar,
          isOpen: true,
          verified: false,
          services: store.services || [],
          features: store.features,
          workingHours: store.workingHours,
          waitTime: undefined,
        }));
        allServices.push(...stores);
      }
      
      if (servicesResult.success && servicesResult.data) {
        const services = servicesResult.data
          .filter((s: any) => 
            s.type === 'other' ||
            s.type === 'სხვა' ||
            s.category?.toLowerCase() === 'სხვა' ||
            s.category?.toLowerCase().includes('სხვა')
          )
          .map((service: any) => ({
            id: service.id || service._id,
            name: service.name || service.title,
            description: service.description || '',
            category: service.category || 'სხვა',
            location: service.location || '',
            address: service.address || service.location || '',
            phone: service.phone || '',
            price: service.price,
            rating: service.rating || 4.5,
            reviews: service.reviews || 0,
            images: service.images || [],
            avatar: service.avatar,
            isOpen: service.isOpen !== undefined ? service.isOpen : true,
            verified: service.verified || service.status === 'verified',
            services: service.services || [],
            features: service.features,
            workingHours: service.workingHours,
            waitTime: service.waitTime,
          }));
        allServices.push(...services);
      }
      
      setServices(allServices);
    } catch (error) {
      console.error('Error loading detailing services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const filteredServices = useMemo(() => {
    let filtered = services;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (activeFilter === 'open') {
      filtered = filtered.filter(s => s.isOpen);
    } else if (activeFilter === 'verified') {
      filtered = filtered.filter(s => s.verified);
    }

    return filtered;
  }, [services, searchQuery, activeFilter]);

  const handleServicePress = (service: DetailingService) => {
    router.push({
      pathname: '/details',
      params: {
        id: service.id,
        type: 'service',
        title: service.name,
        description: service.description,
        image: service.images?.[0] || '',
        rating: service.rating?.toFixed(1) || '4.5',
        address: service.address || service.location || '',
        phone: service.phone || '',
        price: service.price ? (typeof service.price === 'string' ? service.price : `${service.price}₾`) : '',
        category: service.category || 'დითეილინგი',
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* White Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.heroTitle}>დითეილინგი</Text>
            <Text style={styles.heroSubtitle}>მანქანის სრულყოფილი მოვლა</Text>
          </View>

        
        </View>

        {/* Search Bar */}
        

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[
              { id: 'all', label: 'ყველა', icon: 'grid-outline' },
              { id: 'open', label: 'ღიაა', icon: 'time-outline' },
              { id: 'verified', label: 'ვერიფიცირებული', icon: 'checkmark-circle-outline' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  activeFilter === filter.id && styles.filterChipActive
                ]}
                onPress={() => setActiveFilter(filter.id as any)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={16} 
                  color={activeFilter === filter.id ? '#111827' : '#6B7280'} 
                />
                <Text style={[
                  styles.filterChipText,
                  activeFilter === filter.id && styles.filterChipTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Services List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {loading && services.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>იტვირთება...</Text>
          </View>
        ) : filteredServices.length > 0 ? (
          <View style={styles.modernSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.modernSectionTitle}>დითეილინგ სერვისები</Text>
            </View>
            <View style={styles.modernStoresContainer}>
              {filteredServices.map((service, index) => (
                <View key={service.id || index} style={styles.modernStoreCard}>
                  {/* Background Image */}
                  <ImageBackground 
                    source={{
                      uri: service.images && service.images.length > 0 
                        ? service.images[0] 
                        : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop'
                    }}
                    style={styles.modernStoreBackgroundImage}
                    resizeMode="cover"
                  >
                    {/* Gradient Overlay */}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
                      style={styles.modernStoreGradientOverlay}
                    >
                      {/* Header */}
                      <View style={styles.modernStoreHeader}>
                        <View style={styles.modernStoreProfileSection}>
                          <View style={styles.modernStoreAvatarPlaceholder}>
                            <Image 
                              source={{
                                uri: service.images && service.images.length > 0 
                                  ? service.images[0] 
                                  : service.avatar || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop'
                              }} 
                              style={styles.modernStoreAvatar} 
                            />
                          </View>
                          <Text style={styles.modernStoreUsername}>{service.name}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.modernStoreLikeButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite(service.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={isFavorite(service.id) ? "heart" : "heart-outline"} 
                            size={16} 
                            color="#FFFFFF" 
                          />
                          <Text style={styles.modernStoreActionText}>
                            {isFavorite(service.id) ? '1' : '0'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Main Card */}
                      <TouchableOpacity 
                        style={styles.modernStoreMainCard}
                        onPress={() => handleServicePress(service)}
                        activeOpacity={0.95}
                      >
                        {/* Service Info */}
                        <View style={styles.modernStoreInfoSection}>
                          {service.category && (
                            <Text style={styles.modernStoreTypeText}>{service.category}</Text>
                          )}
                        </View>
                        
                        {/* Separator Line */}
                        <View style={styles.modernStoreSeparator} />
                        
                        {/* Service Type Section */}
                        <View style={styles.modernStoreTypeSection}>
                          <View style={styles.modernStoreTypeLeft}>
                            {/* Service type info */}
                          </View>
                          
                          {/* Call Button */}
                          <TouchableOpacity 
                            style={styles.modernStoreCallButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              const phoneNumber = service.phone || '';
                              if (phoneNumber) {
                                Linking.openURL(`tel:${phoneNumber}`).catch(() => {});
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="call-outline" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                        
                        {/* Actions Footer */}
                        <View style={styles.modernStoreActionsFooter}>
                          <View style={styles.modernStoreActionsLeft}>
                            <TouchableOpacity 
                              style={styles.modernStoreActionButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                console.log('Service comments:', service.name);
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                            
                            <View style={styles.modernStoreLocationButton}>
                              <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                              <Text style={styles.modernStoreLocationButtonText}>
                                {service.location || service.address || 'მდებარეობა'}
                              </Text>
                            </View>
                          </View>
                          
                          <TouchableOpacity 
                            style={styles.modernStoreContactButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleServicePress(service);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="information-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.modernStoreContactButtonText}>ინფო</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>სერვისები არ მოიძებნა</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'სცადეთ სხვა ძიების ტერმინი' : 'დითეილინგ სერვისები ჯერ არ არის დამატებული'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    paddingHorizontal: 20,
  },
  filterScroll: {
    gap: 12,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Modern Section Styles
  modernSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },

  // Modern Store Card Styles
  modernStoresContainer: {
    gap: 12,
  },
  
  modernStoreCard: {
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
  
  modernStoreBackgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    borderRadius: 10,
  },
  
  modernStoreGradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  
  modernStoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  
  modernStoreProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  modernStoreAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  
  modernStoreAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  modernStoreUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  
  modernStoreLikeButton: {
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
  
  modernStoreActionText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  
  modernStoreMainCard: {
    borderRadius: 8,
    padding: 8,
  },
  
  modernStoreInfoSection: {
    marginBottom: 12,
  },
  
  modernStoreTypeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  
  modernStoreSeparator: {
    height: 1,
    marginVertical: 8,
  },
  
  modernStoreTypeSection: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  modernStoreTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  modernStoreCallButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
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
  
  modernStoreActionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  
  modernStoreActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  modernStoreActionButton: {
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
  
  modernStoreLocationButton: {
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
  
  modernStoreLocationButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '500',
    maxWidth: 80,
  },
  
  modernStoreContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  modernStoreContactButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

