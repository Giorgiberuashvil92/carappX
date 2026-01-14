import React, { useState, useCallback, useEffect } from 'react';
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
  ImageBackground,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { addItemApi } from '../services/addItemApi';
import DetailModal, { DetailItem } from '../components/ui/DetailModal';
import { specialOffersApi, SpecialOffer } from '../services/specialOffersApi';
import SpecialOfferModal, { SpecialOfferModalData } from '../components/ui/SpecialOfferModal';

const { width } = Dimensions.get('window');

// Map banner
const MAP_BANNER = {
  id: 'map',
  title: 'რუკაზე მონახე',
  subtitle: 'დააჭირე და იპოვე შენთან ახლოს მყოფი მაღაზიები',
  color: ['#0EA5E9', '#0284C7'],
  icon: 'map',
};

export default function OilsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [vipStores, setVipStores] = useState<any[]>([]);
  const [specialOffers, setSpecialOffers] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SpecialOfferModalData | null>(null);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load stores and special offers in parallel
      const [storesResponse, offersResponse] = await Promise.all([
        addItemApi.getStores({ type: 'ზეთები' }),
        specialOffersApi.getSpecialOffers(true),
      ]);
      
      if (storesResponse.success && storesResponse.data) {
        // Filter only oil stores
        const oilStores = storesResponse.data.filter((store: any) => 
          store.type === 'ზეთები'
        );
        
        // Separate VIP stores (you can add isVip field in backend)
        const vip = oilStores.filter((s: any) => s.isVip || s.featured);
        const regular = oilStores.filter((s: any) => !s.isVip && !s.featured);
        
        setVipStores(vip.length > 0 ? vip : oilStores.slice(0, 3));
        setStores(regular.length > 0 ? regular : oilStores);
        
        // Load special offers and merge with store data (only for oil stores)
        if (offersResponse && offersResponse.length > 0) {
          const offersWithStores = offersResponse
            .map((offer: SpecialOffer) => {
              const store = oilStores.find(
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
      } else {
        setSpecialOffers([]);
      }
    } catch (err) {
      console.error('Error loading oils:', err);
      setSpecialOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStores().finally(() => setRefreshing(false));
  }, [loadStores]);

  const filteredStores = stores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const convertStoreToDetailItem = (store: any): DetailItem => {
    const mainImage = store.images?.[0] || store.image || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop';
    const gallery = store.images || [mainImage];
    
    return {
      id: store.id || store._id,
      title: store.name,
      name: store.name,
      description: store.description || `${store.name} - ხარისხიანი ზეთები და საპოხი მასალები`,
      image: mainImage,
      type: 'store',
      location: store.location,
      phone: store.phone,
      address: store.address,
      workingHours: store.workingHours,
      services: store.services,
      gallery: gallery,
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

  const renderVIPStore = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.vipCard}
      onPress={() => handleStorePress(item)}
      activeOpacity={0.7}
    >
      <ImageBackground
        source={{ uri: item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop' }}
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
  );

  const renderOfferCard = (offer: any, index: number) => {
    // დავითვალოთ რამდენი შეთავაზებაა ამ მაღაზიაზე
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
            {/* Discount Badge - მარცხნივ */}
            <View style={styles.offerDiscountBadge}>
              <Text style={styles.offerDiscountBadgeText}>-{offer.discount}%</Text>
        </View>
            
            {/* შეთავაზება Badge - მარჯვნივ */}
            <View style={styles.offerLabelBadge}>
              <Ionicons name="pricetag" size={14} color="#FFFFFF" />
              <Text style={styles.offerLabelBadgeText}>შეთავაზება</Text>
      </View>
            
            {/* რაოდენობის Badge - ყოველთვის ჩანს */}
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
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Ionicons name="water" size={24} color="#0EA5E9" />
            <Text style={styles.title}>ზეთები</Text>
          </View>
          
          <View style={{ width: 40 }} />
        </View>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="მოძებნე ზეთი ან მაღაზია..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0EA5E9" />
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
                  renderItem={renderVIPStore}
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
                  {specialOffers.map((offer, index) => renderOfferCard(offer, index))}
                </ScrollView>
              </View>
            )}

            {/* Map Banner */}
            <View style={styles.section}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/map?type=ზეთები')}
              >
                <LinearGradient
                  colors={MAP_BANNER.color as any}
                  style={styles.promoBanner}
                >
                  <View style={styles.promoContent}>
                    <View style={styles.promoIcon}>
                      <Ionicons name="map" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.promoTextContainer}>
                      <Text style={styles.promoTitle}>{MAP_BANNER.title}</Text>
                      <Text style={styles.promoSubtitle}>{MAP_BANNER.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.promoButton}>
                    <Text style={styles.promoButtonText}>რუკა</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* All Stores */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="storefront" size={20} color="#0EA5E9" />
                <Text style={styles.sectionTitle}>ყველა მაღაზია</Text>
              </View>
              
              {filteredStores.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="water-outline" size={64} color="#0EA5E9" />
                  </View>
                  <Text style={styles.emptyTitle}>მაღაზიები არ მოიძებნა</Text>
                  <Text style={styles.emptySubtitle}>
                    სცადეთ სხვა საძიებო სიტყვა
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredStores}
                  numColumns={2}
                  scrollEnabled={false}
                  keyExtractor={(item, index) => item.id || item._id || index.toString()}
                  contentContainerStyle={styles.grid}
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item: store, index }) => (
                    <TouchableOpacity
                      key={store.id || store._id || index}
                      style={styles.card}
                      onPress={() => handleStorePress(store)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardHeader}>
                        <ImageBackground
                          source={{ 
                            uri: store.images?.[0] || store.image || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop' 
                          }}
                          style={styles.cardImage}
                          imageStyle={styles.cardImageStyle}
                        >
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.7)']}
                            style={styles.cardGradient}
                          >
                            <View style={styles.cardBadges}>
                              <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                              </View>
                            </View>
                          </LinearGradient>
                        </ImageBackground>
                      </View>
                      
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {store.name}
                        </Text>
                        
                        <View style={styles.cardMeta}>
                          <View style={styles.cardLocation}>
                            <Ionicons name="location" size={12} color="#0EA5E9" />
                            <View style={styles.cardLocationTextContainer}>
                              {store.location && (
                                <Text style={styles.cardLocationText} numberOfLines={1}>
                                  {store.location}
                                </Text>
                              )}
                              {store.address && (
                                <Text style={styles.cardAddressText} numberOfLines={1}>
                                  {store.address}
                                </Text>
                              )}
                              {!store.location && !store.address && (
                                <Text style={styles.cardLocationText} numberOfLines={1}>
                                  თბილისი
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>

                        <View style={styles.cardFooter}>
                          <View style={styles.cardRating}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.cardRatingText}>4.8</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.cardCallButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              if (store.phone) {
                                Linking.openURL(`tel:${store.phone}`);
                              }
                            }}
                          >
                            <Ionicons name="call" size={12} color="#0EA5E9" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>

            <View style={{ height: 40 }} />
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit',
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
    shadowColor: '#0EA5E9',
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
    marginTop: 38, // შეთავაზება badge-ის ქვემოთ
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
  offerCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerCardLocation: {
    fontSize: 12,
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
  offerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  offerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  offerImage: {
    width: '100%',
    height: 120,
  },
  offerImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  offerGradient: {
    flex: 1,
  },
  offerContent: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerOldPrice: {
    fontSize: 11,
    color: '#6B7280',
    textDecorationLine: 'line-through',
    fontFamily: 'Outfit',
  },
  offerNewPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'Outfit',
  },
  
  // Map Banner
  promoBanner: {
    width: width - 32,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  promoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    fontFamily: 'Outfit',
    lineHeight: 16,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  
  // Regular Stores Grid
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Outfit',
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardBadges: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    fontFamily: 'Outfit',
    lineHeight: 18,
  },
  cardMeta: {
    gap: 8,
    marginBottom: 12,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  cardLocationTextContainer: {
    flex: 1,
    gap: 2,
  },
  cardLocationText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  cardAddressText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Outfit',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#F0F9FF',
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: 'Outfit',
  },
  cardCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
