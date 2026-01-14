import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  RefreshControl,
  StatusBar,
  ImageBackground,
  FlatList,
  Alert,
  Animated,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import AddModal, { AddModalType } from '../components/ui/AddModal';
import DetailModal, { DetailItem } from '../components/ui/DetailModal';
import SpecialOfferModal, { SpecialOfferModalData } from '../components/ui/SpecialOfferModal';
import { addItemApi } from '../services/addItemApi';
import API_BASE_URL from '../config/api';
import { engagementApi } from '../services/engagementApi';
import { specialOffersApi, SpecialOffer } from '../services/specialOffersApi';

const { width, height } = Dimensions.get('window');

export default function StoresScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { success, error } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [vipStores, setVipStores] = useState<any[]>([]);
  const [specialOffers, setSpecialOffers] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);
  
  // Special offer modal state
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SpecialOfferModalData | null>(null);

  // Map Banner pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      // Load stores and special offers in parallel
      const [storesResponse, offersResponse] = await Promise.all([
        addItemApi.getStores({}),
        specialOffersApi.getSpecialOffers(true),
      ]);
      
      if (storesResponse.success && storesResponse.data) {
        const allStores = storesResponse.data;
        
        // Separate VIP stores (you can add isVip field in backend)
        const vip = allStores.filter((s: any) => s.isVip || s.featured);
        const regular = allStores.filter((s: any) => !s.isVip && !s.featured);
        
        setVipStores(vip.length > 0 ? vip : allStores.slice(0, 3));
        setStores(regular.length > 0 ? regular : allStores);
        
        // Load special offers and merge with store data
        if (offersResponse && offersResponse.length > 0) {
          const offersWithStores = offersResponse.map((offer: SpecialOffer) => {
            const store = allStores.find(
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
          }).filter(Boolean);
          
          setSpecialOffers(offersWithStores);
        } else {
          // Fallback: no special offers
          setSpecialOffers([]);
        }
      } else {
        setErrorMessage('მაღაზიების ჩატვირთვა ვერ მოხერხდა');
        setSpecialOffers([]);
      }
    } catch (err) {
      console.error('Error loading stores:', err);
      setErrorMessage('მაღაზიების ჩატვირთვა ვერ მოხერხდა');
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

  const convertStoreToDetailItem = (store: any): DetailItem => {
    const mainImage = store.photos && store.photos.length > 0 
      ? store.photos[0] 
      : store.images && store.images.length > 0 
        ? store.images[0]
        : store.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop';
    
    const gallery = store.photos && store.photos.length > 0 
      ? store.photos 
      : store.images && store.images.length > 0 
        ? store.images
        : [mainImage];
    
    return {
      id: store.id || store._id,
      title: store.title || store.name,
      name: store.name,
      description: store.description || `${store.name} არის საქართველოში წამყვანი ავტონაწილების მაღაზია, რომელიც გთავაზობთ ხარისხიან პროდუქტებს და მომსახურებას. ჩვენ ვთავაზობთ ფართო ასორტიმენტს ავტომანქანების ნაწილებისა და აქსესუარების, პროფესიონალურ კონსულტაციას და სწრაფ მიწოდებას მთელი საქართველოს მასშტაბით.`,
      image: mainImage,
      type: 'store',
      location: store.location,
      phone: store.phone,
      alternativePhone: store.alternativePhone,
      email: store.email,
      website: store.website,
      workingHours: store.workingHours || '09:00 - 18:00',
      address: store.address || store.location,
      services: store.services || ['ნაწილების მიყიდვა', 'კონსულტაცია', 'მონტაჟი', 'გარანტია', '24/7 მხარდაჭერა'],
      features: store.features || ['გამოცდილი პერსონალი', 'ხარისხიანი სერვისი', 'ორიგინალური ნაწილები'],
      specializations: store.specializations,
      gallery: gallery,
      ownerName: store.ownerName,
      managerName: store.managerName,
      facebook: store.facebook,
      instagram: store.instagram,
      youtube: store.youtube,
      yearEstablished: store.yearEstablished,
      employeeCount: store.employeeCount,
      license: store.license,
      latitude: store.latitude,
      longitude: store.longitude,
      specifications: {
        'ძრავა': store.specifications?.engine || 'ყველა ტიპი',
        'დრო': store.specifications?.deliveryTime || '24 საათი',
        'ტრანსმისია': store.specifications?.transmission || 'ყველა ტიპი',
        'ტიპი': store.type || 'ავტომაღაზია',
        'მდებარეობა': store.location || 'თბილისი',
        'ტელეფონი': store.phone || 'მიუთითებელი არ არის',
      }
    };
  };

  const handleStorePress = async (store: any) => {
    const storeId = store.id || store._id;
    console.log('🏪 [STORES] Store pressed:', {
      storeId: storeId,
      storeName: store.name,
      userId: user?.id,
      rawStore: { id: store.id, _id: store._id },
    });
    
    // თუ ეს შეთავაზებაა (აქვს discount ან storeId), გავხსნათ SpecialOfferModal
    if (store.discount || store.storeId) {
      setSelectedOffer(store);
      setShowSpecialOfferModal(true);
      return;
    }
    
    // Track view
    if (user?.id && storeId) {
      console.log('👁️ [STORES] Tracking view for store:', storeId, 'user:', user.id);
      engagementApi.trackStoreView(storeId, user.id).catch((err) => {
        console.error('❌ [STORES] Error tracking store view:', err);
      });
    } else {
      console.warn('⚠️ [STORES] Cannot track view - missing userId or storeId:', {
        userId: user?.id,
        storeId: storeId,
      });
    }
    
    setSelectedDetailItem(convertStoreToDetailItem(store));
    setShowDetailModal(true);
  };

  const renderVIPStore = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.vipCard}
      onPress={() => handleStorePress(item)}
      activeOpacity={0.7}
    >
      <ImageBackground
        source={{ 
          uri: item.photos?.[0] || item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop' 
        }}
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
            <View style={styles.offerCountBadge}>
              <Text style={styles.offerCountBadgeText}>+{offersCount > 1 ? offersCount - 1 : 1}</Text>
            </View>
            
            <View style={styles.offerCardContent}>
              <Text style={styles.offerCardTitle} numberOfLines={2}>{offer.name}</Text>
              <View style={styles.offerCardMeta}>
                <Ionicons name="location" size={14} color="#FFFFFF" />
                <Text style={styles.offerCardLocation}>{offer.location || 'თბილისი'}</Text>
              </View>
        <View style={styles.offerPriceRow}>
                {offer.oldPrice && (
          <Text style={styles.offerOldPrice}>{offer.oldPrice}</Text>
                )}
                <Text style={styles.offerNewPrice}>{offer.newPrice || offer.price}</Text>
        </View>
      </View>
          </LinearGradient>
        </ImageBackground>
    </TouchableOpacity>
  );
  };

  const handleAddItem = (type: AddModalType, data: any) => {
    console.log('Store successfully added:', { type, data });
    loadStores();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.innovativeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Innovative Header */}
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={styles.innovativeHeader}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.innovativeTitle}>ავტომაღაზიები</Text>
              <View style={styles.titleUnderline} />
            </View>
            
            <View style={styles.headerRightSection}>
              <TouchableOpacity 
                style={styles.headerAddBtn}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addBtnContent}>
                  <Ionicons name="storefront" size={20} color="#FFFFFF" />
                  <Ionicons name="add-circle" size={14} color="#FFFFFF" style={styles.addIcon} />
                </View>
              </TouchableOpacity>
              <Text style={styles.addLabel}>მაღაზიის დამატება</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        
        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>იტვირთება...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={loadStores}
            >
              <Text style={styles.retryText}>თავიდან ცდა</Text>
            </TouchableOpacity>
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
                <FlatList
                  horizontal
                  data={specialOffers}
                  renderItem={({ item, index }) => renderOfferCard(item, index)}
                  keyExtractor={(item, index) => item.id || item._id || index.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offersList}
                />
              </View>
            )}

            {/* Map Banner */}
            <View style={styles.section}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push('/map')}
                style={styles.mapBannerContainer}
              >
                <LinearGradient
                  colors={['#1F2937', '#111827']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mapBanner}
                >
                  <View style={styles.mapBannerContent}>
                    <View style={styles.mapBannerIconWrapper}>
                      <View style={styles.mapBannerIconInner}>
                        <Ionicons name="map" size={22} color="#111827" />
                      </View>
                      <Animated.View
                        style={[
                          styles.mapBannerPulse,
                          {
                            transform: [{ scale: pulseAnim }],
                            opacity: pulseAnim.interpolate({
                              inputRange: [1, 1.3],
                              outputRange: [0.2, 0],
                            }),
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.mapBannerTextContainer}>
                      <Text style={styles.mapBannerTitle}>მოძებნე მაღაზიები</Text>
                      <Text style={styles.mapBannerSubtitle}>
                        იპოვე შენთან ახლოს მყოფი მაღაზიები
                      </Text>
                    </View>
                    <View style={styles.mapBannerArrow}>
                      <Ionicons name="arrow-forward" size={18} color="#111827" />
                    </View>
                  </View>
                  <View style={styles.mapBannerDecoration}>
                    <View style={styles.mapBannerDot1} />
                    <View style={styles.mapBannerDot2} />
                    <View style={styles.mapBannerDot3} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* All Stores */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="storefront" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>ყველა მაღაზია</Text>
              </View>
              
              {stores.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="storefront-outline" size={64} color="#3B82F6" />
                  </View>
                  <Text style={styles.emptyTitle}>მაღაზიები არ მოიძებნა</Text>
                  <Text style={styles.emptySubtitle}>
                    მაღაზიები ჯერ არ დაემატა
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={stores}
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
                            uri: store.photos?.[0] || store.images?.[0] || store.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop' 
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
                            <Ionicons name="location" size={12} color="#3B82F6" />
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
                          {store.phone && (
                            <TouchableOpacity 
                              style={styles.cardCallButton}
                              onPress={async (e) => {
                                e.stopPropagation();
                                const storeId = store.id || store._id;
                                
                                
                                try {
                                  // Track call
                                  if (user?.id && storeId) {
                                    engagementApi.trackStoreCall(storeId, user.id).catch((err) => {
                                      console.error('❌ [STORES] Error tracking store call:', err);
                                    });
                                  } else {
                                    console.warn('⚠️ [STORES] Cannot track call - missing userId or storeId:', {
                                      userId: user?.id,
                                      storeId: storeId,
                                    });
                                  }
                                  
                                  // Clean phone number - remove spaces, dashes, and other characters
                                  const cleanPhone = store.phone.replace(/[\s\-\(\)]/g, '');
                                  // Add +995 if it doesn't start with it
                                  const phoneNumber = cleanPhone.startsWith('+995') 
                                    ? cleanPhone 
                                    : cleanPhone.startsWith('995')
                                    ? `+${cleanPhone}`
                                    : `+995${cleanPhone}`;
                                  
                                  Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
                                    console.error('Error opening phone:', err);
                                    error('ტელეფონის გახსნა ვერ მოხერხდა');
                                  });
                                } catch (err) {
                                  console.error('Error processing phone:', err);
                                  error('ტელეფონის ნომერი არასწორია');
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="call" size={12} color="#3B82F6" />
                            </TouchableOpacity>
                          )}
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detail Modal */}
      <DetailModal
        visible={showDetailModal}
        item={selectedDetailItem}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Special Offer Modal */}
      <SpecialOfferModal
        visible={showSpecialOfferModal}
        offer={selectedOffer}
        onClose={() => {
          setShowSpecialOfferModal(false);
          setSelectedOffer(null);
        }}
        onContact={() => {
          if (selectedOffer?.phone) {
            const cleanPhone = selectedOffer.phone.replace(/[\s\-\(\)]/g, '');
            const phoneNumber = cleanPhone.startsWith('+995') 
              ? cleanPhone 
              : cleanPhone.startsWith('995')
              ? `+${cleanPhone}`
              : `+995${cleanPhone}`;
            
            Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
              console.error('Error opening phone:', err);
              error('ტელეფონის გახსნა ვერ მოხერხდა');
            });
          }
        }}
      />

      {/* Add Modal */}
      <AddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddItem}
        defaultType="store"
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Main Container
  innovativeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Innovative Header
  innovativeHeader: {
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerCenter: {
    alignItems: 'center',
  },
  innovativeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.6,
    fontFamily: 'Inter',
  },
  titleUnderline: {
    width: 50,
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 6,
  },
  headerRightSection: {
    alignItems: 'center',
    gap: 4,
  },
  addLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.1,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  headerAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  addBtnContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1D4ED8',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Modern Section Styles
  modernSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Grid Container
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  
  // Product Card (2 columns)
  productCard: {
    width: (width - 56) / 2, // 20px padding on each side + 16px gap
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  
  // Image Container
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F9FAFB',
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Heart Button
  heartButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  
  // Price Badge
  priceBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    fontFamily: 'Inter',
  },
  
  // Card Content
  cardContent: {
    padding: 12,
    paddingTop: 10,
  },
  
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  
  productCategory: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: -0.1,
    fontFamily: 'Inter',
  },
  
  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  
  ratingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyState: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  // Section Styles
  section: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },

  // VIP Card Styles
  vipCard: {
    width: width * 0.75,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    justifyContent: 'flex-end',
    padding: 16,
  },
  vipBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: 'Inter',
  },
  vipCardContent: {
    gap: 8,
  },
  vipCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  vipCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipCardLocation: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  vipList: {
    paddingRight: 20,
  },

  // Offer Card Styles (VIP-ის მსგავსი)
  offerCard: {
    width: width * 0.75,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  offerOldPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter',
  },
  offerNewPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  offersList: {
    paddingRight: 20,
  },

  // Map Banner Styles
  mapBannerContainer: {
    marginHorizontal: 0,
  },
  mapBanner: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  mapBannerIconWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBannerIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  mapBannerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1,
  },
  mapBannerTextContainer: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  mapBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.3,
  },
  mapBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: 'Inter',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  mapBannerArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  mapBannerDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  mapBannerDot1: {
    position: 'absolute',
    top: 16,
    right: 80,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  mapBannerDot2: {
    position: 'absolute',
    top: 40,
    right: 100,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  mapBannerDot3: {
    position: 'absolute',
    bottom: 20,
    right: 60,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Card Styles (for grid)
  card: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    width: '100%',
    height: 140,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardGradient: {
    flex: 1,
  },
  cardBadges: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  cardMeta: {
    marginBottom: 12,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  cardLocationTextContainer: {
    flex: 1,
    gap: 2,
  },
  cardLocationText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  cardAddressText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Inter',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  cardCallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    paddingBottom: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
  },

  // Empty State Styles
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
});
