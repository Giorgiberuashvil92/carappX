import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { addItemApi } from '../services/addItemApi';
import API_BASE_URL from '../config/api';
import { specialOffersApi, SpecialOffer } from '../services/specialOffersApi';
import SpecialOfferModal, { SpecialOfferModalData } from '../components/ui/SpecialOfferModal';
import DetailModal, { DetailItem } from '../components/ui/DetailModal';

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
  const [vipStores, setVipStores] = useState<any[]>([]);
  const [specialOffers, setSpecialOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'verified'>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SpecialOfferModalData | null>(null);

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
      
      // Load stores and special offers in parallel
      const [storesResponse, offersResponse] = await Promise.all([
        addItemApi.getDetailingStores({ includeAll: true }),
        specialOffersApi.getSpecialOffers(true),
      ]);
      
      const allServices: DetailingService[] = [];
      
      if (storesResponse.success && storesResponse.data) {
        // All stores from detailing endpoint are already filtered
        const detailingStores = storesResponse.data;
        
        // Separate VIP stores
        const vip = detailingStores.filter((s: any) => s.isVip || s.featured);
        const regular = detailingStores.filter((s: any) => !s.isVip && !s.featured);
        
        setVipStores(vip.length > 0 ? vip : detailingStores.slice(0, 3));
        
        const stores = detailingStores.map((store: any) => ({
          id: store.id || store._id,
          name: store.name || store.title,
          description: store.description || '',
          category: store.type || 'დითეილინგი',
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
        setServices(regular.length > 0 ? regular.map((s: any) => ({
          id: s.id || s._id,
          name: s.name || s.title,
          description: s.description || '',
          category: s.type || 'დითეილინგი',
          location: s.location || '',
          address: s.address || s.location || '',
          phone: s.phone || '',
          price: undefined,
          rating: 4.5,
          reviews: 0,
          images: s.images || s.photos || [],
          avatar: s.avatar,
          isOpen: true,
          verified: false,
          services: s.services || [],
          features: s.features,
          workingHours: s.workingHours,
          waitTime: undefined,
        })) : allServices);
        
        // Load special offers and merge with store data (only for detailing stores)
        if (offersResponse && offersResponse.length > 0) {
          const offersWithStores = offersResponse
            .map((offer: SpecialOffer) => {
              const store = detailingStores.find(
                (s: any) => (s.id || s._id) === offer.storeId,
              );
              if (store) {
                return {
                  ...store,
                  ...offer,
                  // Use offer image if available, otherwise use store image
                  image: offer.image || store.photos?.[0] || store.images?.[0],
                };
      }
              return null;
            })
            .filter(Boolean);
          
          setSpecialOffers(offersWithStores);
        } else {
          // Fallback: no special offers
          setSpecialOffers([]);
        }
      }
    } catch (error) {
      console.error('Error loading detailing services:', error);
      setSpecialOffers([]);
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

  const convertStoreToDetailItem = (store: any): DetailItem => {
    const mainImage = store.images?.[0] || store.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop';
    const gallery = store.images || [mainImage];
    
    return {
      id: store.id || store._id,
      title: store.name,
      name: store.name,
      description: store.description || `${store.name} - ხარისხიანი დითეილინგ სერვისები`,
      image: mainImage,
      gallery: gallery,
      type: 'store' as const,
      phone: store.phone,
      address: store.address || store.location,
      location: store.location,
      workingHours: store.workingHours,
      services: store.services || [],
      latitude: store.latitude,
      longitude: store.longitude,
    };
  };

  const handleStorePress = (store: any) => {
    // თუ ეს შეთავაზებაა (აქვს discount ან storeId), გავხსნათ SpecialOfferModal
    if (store.discount || store.storeId) {
      const offerData: SpecialOfferModalData = {
        id: store.id || store._id,
        name: store.name,
        title: store.title || store.name,
        description: store.description,
        location: store.location || store.address,
        phone: store.phone,
        discount: store.discount,
        oldPrice: store.oldPrice,
        newPrice: store.newPrice,
        image: store.image || store.images?.[0] || store.photos?.[0],
        address: store.address || store.location,
      };
      setSelectedOffer(offerData);
      setShowSpecialOfferModal(true);
    } else {
      // ჩვეულებრივი მაღაზია - DetailModal
      const detailItem = convertStoreToDetailItem(store);
      setSelectedDetailItem(detailItem);
      setShowDetailModal(true);
    }
  };

  const handleServicePress = (service: DetailingService) => {
    const detailItem = convertStoreToDetailItem(service);
    setSelectedDetailItem(detailItem);
    setShowDetailModal(true);
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
        {loading && services.length === 0 && vipStores.length === 0 && specialOffers.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>იტვირთება...</Text>
          </View>
        ) : (
          <>
            {/* VIP Section */}
            {vipStores.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>VIP მაღაზიები</Text>
                </View>
                <FlatList
                  horizontal
                  data={vipStores}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.vipCard}
                      onPress={() => handleStorePress(item)}
                      activeOpacity={0.7}
                    >
                      <ImageBackground
                        source={{ uri: item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop' }}
                        style={styles.vipCardImage}
                        imageStyle={styles.vipCardImageStyle}
                      >
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.vipCardGradient}
                        >
                          <View style={styles.vipBadge}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.vipBadgeText}>VIP</Text>
                          </View>
                          <View style={styles.vipCardContent}>
                            <Text style={styles.vipCardTitle} numberOfLines={2}>{item.name}</Text>
                            <View style={styles.vipCardMeta}>
                              <Ionicons name="location" size={14} color="#FFFFFF" />
                              <Text style={styles.vipCardLocation}>{item.location}</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </ImageBackground>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item, index) => item.id || item._id || index.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vipList}
                />
              </View>
            )}

            {/* Special Offers */}
            {specialOffers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetag" size={20} color="#EF4444" />
                  <Text style={styles.sectionTitle}>სპეციალური შეთავაზებები</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offersList}
                >
                  {specialOffers.map((offer, index) => {
                    const storeId = offer.storeId || offer.id || offer._id;
                    const offersCount = specialOffers.filter(
                      (o: any) => (o.storeId || o.id || o._id) === storeId
                    ).length;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.offerCard}
                        onPress={() => handleStorePress(offer)}
                        activeOpacity={0.7}
                      >
                        <ImageBackground
                          source={{ 
                            uri: offer.photos?.[0] || offer.images?.[0] || offer.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop' 
                          }}
                          style={styles.offerCardImage}
                          imageStyle={styles.offerCardImageStyle}
                        >
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.offerCardGradient}
                          >
                            <View style={styles.offerDiscountBadge}>
                              <Text style={styles.offerDiscountBadgeText}>-{offer.discount}%</Text>
                            </View>
                            <View style={styles.offerLabelBadge}>
                              <Ionicons name="pricetag" size={14} color="#FFFFFF" />
                              <Text style={styles.offerLabelBadgeText}>შეთავაზება</Text>
                            </View>
                            {offersCount > 1 && (
                              <View style={styles.offerCountBadge}>
                                <Text style={styles.offerCountBadgeText}>+{offersCount - 1}</Text>
                              </View>
                            )}
                            <View style={styles.offerCardContent}>
                              <Text style={styles.offerCardTitle} numberOfLines={2}>{offer.name}</Text>
                              <View style={styles.offerCardPriceRow}>
                                <Text style={styles.offerCardOldPrice}>{offer.oldPrice}</Text>
                                <Text style={styles.offerCardNewPrice}>{offer.newPrice}</Text>
                              </View>
                            </View>
                          </LinearGradient>
                        </ImageBackground>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* All Services */}
            {filteredServices.length > 0 && (
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
            )}
          </>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <DetailModal
        visible={showDetailModal}
        item={selectedDetailItem}
        onClose={() => setShowDetailModal(false)}
        onContact={() => {}}
      />

      {/* Special Offer Modal */}
      <SpecialOfferModal
        visible={showSpecialOfferModal}
        offer={selectedOffer}
        onClose={() => {
          setShowSpecialOfferModal(false);
          setSelectedOffer(null);
        }}
      />
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
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  
  // VIP Stores
  vipList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  vipCard: {
    width: width * 0.75,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  vipCardImage: {
    width: '100%',
    height: '100%',
  },
  vipCardImageStyle: {
    borderRadius: 20,
  },
  vipCardGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit',
    letterSpacing: 0.5,
  },
  vipCardContent: {
    gap: 10,
  },
  vipCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  vipCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipCardLocation: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  
  // Special Offers
  offersList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  offerCard: {
    width: width * 0.75,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  offerCardImage: {
    width: '100%',
    height: '100%',
  },
  offerCardImageStyle: {
    borderRadius: 20,
  },
  offerCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  offerDiscountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  offerDiscountBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  offerLabelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    zIndex: 10,
  },
  offerLabelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  offerCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 11,
    marginTop: 38,
  },
  offerCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  offerCardContent: {
    gap: 8,
  },
  offerCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  offerCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerCardOldPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter',
  },
  offerCardNewPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },

  // Modern Section Styles
  modernSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
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

