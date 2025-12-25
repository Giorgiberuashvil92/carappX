import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  RefreshControl,
  StatusBar,
  ImageBackground,
  FlatList,
  Alert,
  Animated,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import AddModal, { AddModalType } from '../components/ui/AddModal';
import DetailModal, { DetailItem } from '../components/ui/DetailModal';
import { addItemApi } from '../services/addItemApi';
import API_BASE_URL from '../config/api';

const { width, height } = Dimensions.get('window');

export default function StoresScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { success, error } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRating, setFilterRating] = useState('');
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);

  // Load stores
  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const filters: any = {};
      if (filterLocation) filters.location = filterLocation;
      if (filterType) filters.type = filterType;
      if (filterRating) filters.rating = filterRating;
      
      const response = await addItemApi.getStores(filters);
      if (response.success && response.data) {
        setStores(response.data);
      } else {
        setErrorMessage('მაღაზიების ჩატვირთვა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error('Error loading stores:', err);
      setErrorMessage('მაღაზიების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }, [filterLocation, filterType, filterRating]);

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
      title: store.name,
      name: store.name,
      image: mainImage,
      type: 'store',
      location: store.location,
      phone: store.phone,
      workingHours: '09:00 - 18:00',
      address: store.location,
      services: ['ნაწილების მიყიდვა', 'კონსულტაცია', 'მონტაჟი', 'გარანტია'],
      features: ['გამოცდილი პერსონალი', 'ხარისხიანი სერვისი'],
      gallery: gallery,
      specifications: {
        'ტიპი': store.type || 'ავტომაღაზია',
        'მდებარეობა': store.location,
        'ტელეფონი': store.phone || 'მიუთითებელი არ არის',
      }
    };
  };

  const handleStorePress = (store: any) => {
    setSelectedDetailItem(convertStoreToDetailItem(store));
    setShowDetailModal(true);
  };

  const filteredStores = useMemo(() => {
    let list = stores;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(store => 
        (store.name || '').toLowerCase().includes(q) || 
        (store.location || '').toLowerCase().includes(q) ||
        (store.description || '').toLowerCase().includes(q) ||
        (store.type || '').toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [stores, searchQuery]);

  const handleAddItem = (type: AddModalType, data: any) => {
    console.log('Store successfully added:', { type, data });
    loadStores();
  };

  const resetFilters = () => {
    setFilterLocation('');
    setFilterType('');
    setFilterRating('');
  };

  const getCurrentFilters = () => {
    return { location: filterLocation, type: filterType, rating: filterRating };
  };

  return (
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

          {/* AI Search Section */}
          <View style={styles.aiSearchSection}>
            {/* Simple Filter Button */}
            <TouchableOpacity 
              style={styles.simpleFilterButton}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.9}
            >
              <View style={styles.simpleFilterContent}>
                <View style={styles.simpleFilterLeft}>
                  <Ionicons name="options" size={20} color="#3B82F6" />
                  <Text style={styles.simpleFilterText}>
                    {Object.values(getCurrentFilters()).some(v => v) ? 'ფილტრები აქტიურია' : 'ფილტრაცია'}
                  </Text>
                </View>
                <View style={styles.simpleFilterRight}>
                  {Object.values(getCurrentFilters()).some(v => v) && (
                    <View style={styles.simpleFilterBadge}>
                      <Text style={styles.simpleFilterBadgeText}>
                        {Object.values(getCurrentFilters()).filter(v => v).length}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>იტვირთება...</Text>
          </View>
        )}

        {/* Error State */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={loadStores}
            >
              <Text style={styles.retryText}>თავიდან ცდა</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {!loading && !errorMessage && (
          <>
            <View style={styles.modernSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.modernSectionTitle}>ყველა მაღაზია</Text>
                <TouchableOpacity style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>რუკა</Text>
                  <Ionicons name="map-outline" size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>
              {filteredStores.length > 0 ? (
                <View style={styles.modernStoresContainer}>
                  {filteredStores?.map((store, index) => (
                    <View key={store.id || index} style={styles.modernStoreCard}>
                      {/* Background Image */}
                      <ImageBackground 
                        source={{
                          uri: store.photos && store.photos.length > 0 
                            ? store.photos[0] 
                            : store.images && store.images.length > 0 
                              ? store.images[0]
                              : store.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop'
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
                                    uri: store.photos && store.photos.length > 0 
                                      ? store.photos[0] 
                                      : store.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop'
                                  }} 
                                  style={styles.modernStoreAvatar} 
                                />
                              </View>
                              <Text style={styles.modernStoreUsername}>{store.name}</Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.modernStoreLikeButton}
                              onPress={(e) => {
                                e.stopPropagation();
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="heart" size={16} color="#FFFFFF" />
                              <Text style={styles.modernStoreActionText}>127</Text>
                            </TouchableOpacity>
                          </View>
                          
                          {/* Main Card */}
                          <TouchableOpacity 
                            style={styles.modernStoreMainCard}
                            onPress={() => handleStorePress(store)}
                            activeOpacity={0.95}
                          >
                            {/* Store Info */}
                            <View style={styles.modernStoreInfoSection}>
                              {store.type && (
                                <Text style={styles.modernStoreTypeText}>{store.type}</Text>
                              )}
                            </View>
                            
                            {/* Separator Line */}
                            <View style={styles.modernStoreSeparator} />
                            
                            {/* Store Type Section */}
                            <View style={styles.modernStoreTypeSection}>
                              <View style={styles.modernStoreTypeLeft}>
                                {/* Store type info */}
                              </View>
                              
                              {/* Call Button */}
                              <TouchableOpacity 
                                style={styles.modernStoreCallButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  const phoneNumber = store.phone || '555-123-456';
                                  Linking.openURL(`tel:${phoneNumber}`).catch(() => {});
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
                                    console.log('Store comments:', store.name);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                                
                                <View style={styles.modernStoreLocationButton}>
                                  <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                                  <Text style={styles.modernStoreLocationButtonText}>
                                    {store.location || 'მდებარეობა'}
                                  </Text>
                                </View>
                              </View>
                              
                              <TouchableOpacity 
                                style={styles.modernStoreContactButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleStorePress(store);
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
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>მაღაზიები არ მოიძებნა</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ფილტრები</Text>
              <TouchableOpacity 
                style={styles.modalResetBtn}
                onPress={resetFilters}
              >
                <Text style={styles.modalResetText}>გასუფთავება</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>მდებარეობა</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="აირჩიეთ ქალაქი"
                  value={filterLocation}
                  onChangeText={setFilterLocation}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>ტიპი</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="მაღაზიის ტიპი"
                  value={filterType}
                  onChangeText={setFilterType}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>მინიმალური რეიტინგი</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="რეიტინგი"
                  value={filterRating}
                  onChangeText={setFilterRating}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.applyFiltersBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFiltersBtnText}>
                  {`მაღაზიების ნახვა (${filteredStores.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Detail Modal */}
      <DetailModal
        visible={showDetailModal}
        item={selectedDetailItem}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Add Modal */}
      <AddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddItem}
      />
    </View>
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
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  innovativeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 4,
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
  },
  headerAddBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
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

  // AI Search Section
  aiSearchSection: {
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },

  // Simple Filter Button
  simpleFilterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  simpleFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  simpleFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  simpleFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  simpleFilterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simpleFilterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  simpleFilterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
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
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
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
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  modernStoreContactButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalResetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalResetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyFiltersBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyFiltersBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
