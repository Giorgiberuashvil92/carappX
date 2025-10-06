import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar, 
  Animated,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import DetailModal, { DetailItem } from '../components/ui/DetailModal';
import AddModal, { AddModalType } from '../components/ui/AddModal';
import { mechanicsApi, MechanicDTO } from '@/services/mechanicsApi';

export default function MechanicsScreen() {
  const router = useRouter();
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    specialty: '',
    location: '',
    rating: '',
    priceMin: '',
    priceMax: '',
  });

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Detail Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Real data states
  const [mechanics, setMechanics] = useState<MechanicDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Animation values
  const cardAnimations = useRef(mechanics.map(() => new Animated.Value(0))).current;

  // Load mechanics data
  const loadMechanics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: { q?: string; specialty?: string; location?: string } = {};
      
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      
      if (filters.specialty) {
        params.specialty = filters.specialty;
      }

      if (filters.location) {
        params.location = filters.location;
      }

      console.log('🔧 Loading mechanics with params:', params);
      const data = await mechanicsApi.getMechanics(params);
      console.log('🔧 Loaded mechanics:', data);
      setMechanics(data);
    } catch (error) {
      console.error('Error loading mechanics:', error);
      setError('მექანიკოსების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    loadMechanics();
  }, []);

  // Reload data when filters change
  useEffect(() => {
    loadMechanics();
  }, [filters, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMechanics();
  };

  // Start card animations
  useEffect(() => {
    const animations = cardAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, animations).start();
  }, [mechanics]);

  // Helper functions for DetailModal
  const convertMechanicToDetailItem = (mechanic: MechanicDTO): DetailItem => {
    const mainImage = mechanic.avatar || 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=800&auto=format&fit=crop';
    
    return {
      id: mechanic.id,
      title: mechanic.name,
      name: mechanic.name,
      image: mainImage,
      type: 'mechanic',
      location: mechanic.location || 'მდებარეობა არ არის მითითებული',
      phone: mechanic.services?.join(', ') || 'ტელეფონი არ არის მითითებული',
      workingHours: '09:00 - 18:00',
      address: mechanic.location || '',
      services: mechanic.services || ['ძრავის შეკეთება', 'დიაგნოსტიკა', 'ელექტრო სისტემა'],
      features: ['გამოცდილი', 'პროფესიონალი', 'სანდო'],
      gallery: [mainImage],
      specifications: {
        'სპეციალობა': mechanic.specialty || '',
        'გამოცდილება': mechanic.experience || 'არ არის მითითებული',
        'რეიტინგი': mechanic.rating ? `${mechanic.rating.toFixed(1)} ⭐` : 'არ არის',
        'ფასი': mechanic.priceGEL ? `${mechanic.priceGEL}₾/საათი` : 'არ არის მითითებული',
        'სტატუსი': mechanic.isAvailable ? 'ხელმისაწვდომი' : 'დაკავებული',
      }
    };
  };

  const handleShowMechanicDetails = (mechanic: MechanicDTO) => {
    setSelectedDetailItem(convertMechanicToDetailItem(mechanic));
    setShowDetailModal(true);
  };

  const handleAddItem = async (type: AddModalType, data: any) => {
    console.log('Mechanic successfully added:', { type, data });
        Alert.alert('წარმატება', 'მექანიკოსი წარმატებით დაემატა!');
    loadMechanics();
  };

  // Filtered data for mechanics
  const filteredMechanics = useMemo(() => {
    return mechanics.filter(mechanic => {
      // Client-side search filtering if needed
      if (searchQuery && !mechanic.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !mechanic.specialty?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [mechanics, searchQuery]);

  // Dropdown component
  const renderDropdown = (
    key: string, 
    value: string, 
    placeholder: string, 
    options: string[],
    onSelect: (value: string) => void
  ) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setOpenDropdown(openDropdown === key ? null : key)}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons 
          name={openDropdown === key ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#6B7280" 
        />
      </TouchableOpacity>
    </View>
  );

  const renderVerticalMechanicCard = (mechanic: MechanicDTO, index: number) => {
    const imageUri = mechanic.avatar || 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=800&auto=format&fit=crop';
    
    const animatedStyle = {
      opacity: cardAnimations[index] || 1,
      transform: [{
        translateY: (cardAnimations[index] || new Animated.Value(1)).interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0]
        })
      }]
  };

  return (
      <Animated.View key={mechanic.id} style={[animatedStyle]}>
        <TouchableOpacity style={styles.verticalMechanicCard} activeOpacity={0.95}>
          <View style={styles.verticalMechanicImageSection}>
            <Image source={{ uri: imageUri }} style={styles.verticalMechanicImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.verticalMechanicImageOverlay}
            />
            <View style={styles.verticalMechanicImageBadges}>
              <View style={[styles.verticalStatusBadge, { backgroundColor: mechanic.isAvailable ? '#10B981' : '#EF4444' }]}>
                <Text style={styles.verticalStatusText}>
                  {mechanic.isAvailable ? 'ხელმისაწვდომი' : 'დაკავებული'}
                </Text>
            </View>
            </View>
            {mechanic.priceGEL && (
              <View style={styles.verticalMechanicPriceBadge}>
                <Text style={styles.verticalMechanicPriceText}>₾{mechanic.priceGEL}/საათი</Text>
              </View>
            )}
          </View>
          
          <View style={styles.verticalMechanicContent}>
            <View style={styles.verticalMechanicMainInfo}>
              <Text style={styles.verticalMechanicName}>{mechanic.name}</Text>
              <Text style={styles.verticalMechanicSpecialty}>{mechanic.specialty}</Text>
              <View style={styles.verticalMechanicMetaRow}>
                <View style={styles.verticalLocationInfo}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.verticalLocationText}>{mechanic.location || 'თბილისი'}</Text>
                </View>
                <View style={styles.verticalMechanicStats}>
                  {mechanic.rating && (
                    <View style={styles.verticalStatItem}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.verticalStatText}>{mechanic.rating.toFixed(1)}</Text>
                    </View>
                  )}
                  {mechanic.reviews && (
                    <View style={styles.verticalStatItem}>
                      <Ionicons name="chatbubble" size={12} color="#3B82F6" />
                      <Text style={styles.verticalStatText}>{mechanic.reviews}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <View style={styles.verticalMechanicActions}>
              <TouchableOpacity style={styles.verticalActionBtnSecondary}>
                <Ionicons name="heart-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
              <TouchableOpacity 
                style={styles.verticalActionBtnPrimary}
                onPress={() => handleShowMechanicDetails(mechanic)}
              >
                <Text style={styles.verticalActionPrimaryText}>დეტალები</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const SPECIALTIES = ['ყველა', 'ძრავი', 'შემუშავება', 'ელექტრო', 'გადაცემა', 'დიაგნოსტიკა', 'ზოგადი'];
  const LOCATIONS = ['ყველა', 'თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'ფოთი', 'სხვა'];
  const RATINGS = ['ყველა', '5.0', '4.5+', '4.0+', '3.5+'];

  // Check if any filters are active
  const hasActiveFilters = !!(filters.specialty || filters.location || filters.rating || filters.priceMin || filters.priceMax);
  
  // Debug log
  console.log('Filters:', filters);
  console.log('Has active filters:', hasActiveFilters);
  console.log('Specialty:', filters.specialty);
  console.log('Location:', filters.location);

  return (
    <View style={styles.innovativeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Innovative Header */}
      <LinearGradient
        colors={['#667EEA', '#764BA2', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.innovativeHeader}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
            <View style={styles.headerCenter}>
              <Text style={styles.innovativeTitle}>🔧 ხელოსნები</Text>
              <View style={styles.titleUnderline} />
        </View>
        
            <View style={styles.headerRightSection}>
          <TouchableOpacity 
                style={styles.headerAddBtn}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
          >
                <View style={styles.addBtnContent}>
                  <Ionicons name="construct" size={20} color="#FFFFFF" />
                  <Ionicons name="add-circle" size={14} color="#FFFFFF" style={styles.addIcon} />
                </View>
          </TouchableOpacity>
              <Text style={styles.addLabel}>ხელოსნის დამატება</Text>
        </View>
      </View>

      {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
                placeholder="ძიება..."
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
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Category Badges */}
      <View style={styles.categoryBadgesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBadgesScroll}
        >
          {SPECIALTIES.map((specialty, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryBadge,
                filters.specialty === specialty && styles.categoryBadgeActive
              ]}
              onPress={() => {
                if (specialty === 'ყველა') {
                  setFilters({ ...filters, specialty: '' });
                } else {
                  setFilters({ ...filters, specialty: specialty });
                }
              }}
              >
                <Text style={[
                styles.categoryBadgeText,
                filters.specialty === specialty && styles.categoryBadgeTextActive
                ]}>
                {specialty}
                </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <View style={styles.filtersChipsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersChipsScroll}
          >
            {filters.specialty && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.specialty}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters({ ...filters, specialty: '' })}
                  style={styles.filterChipClose}
                >
                  <Ionicons name="close" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            {filters.location && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.location}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters({ ...filters, location: '' })}
                  style={styles.filterChipClose}
                >
                  <Ionicons name="close" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            {filters.rating && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.rating}</Text>
                <TouchableOpacity 
                  onPress={() => setFilters({ ...filters, rating: '' })}
                  style={styles.filterChipClose}
                >
                  <Ionicons name="close" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            {(filters.priceMin || filters.priceMax) && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {filters.priceMin && filters.priceMax 
                    ? `${filters.priceMin}-${filters.priceMax}₾`
                    : filters.priceMin 
                      ? `${filters.priceMin}₾+`
                      : `-${filters.priceMax}₾`
                  }
                </Text>
                <TouchableOpacity 
                  onPress={() => setFilters({ ...filters, priceMin: '', priceMax: '' })}
                  style={styles.filterChipClose}
                >
                  <Ionicons name="close" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity 
              style={styles.clearAllChip}
              onPress={() => setFilters({ specialty: '', location: '', rating: '', priceMin: '', priceMax: '' })}
            >
              <Text style={styles.clearAllChipText}>ყველას წაშლა</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.contentScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>მექანიკოსების ჩატვირთვა...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>შეცდომა</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadMechanics}>
              <Text style={styles.retryBtnText}>თავიდან ცდა</Text>
            </TouchableOpacity>
          </View>
        ) : filteredMechanics.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>მექანიკოსები ვერ მოიძებნა</Text>
            <Text style={styles.emptyMessage}>სცადეთ სხვა ძიების ტერმინები ან ფილტრები</Text>
          </View>
        ) : (
          <View style={styles.verticalCardsContainer}>
            {filteredMechanics.map((mechanic, index) => renderVerticalMechanicCard(mechanic, index))}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>ფილტრები</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterModalScroll}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>სპეციალობა</Text>
                {renderDropdown(
                  'specialty',
                  filters.specialty,
                  'აირჩიეთ სპეციალობა',
                  SPECIALTIES,
                  (value) => setFilters({ ...filters, specialty: value === 'ყველა' ? '' : value })
                )}
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>მდებარეობა</Text>
                {renderDropdown(
                  'location',
                  filters.location,
                  'აირჩიეთ მდებარეობა',
                  LOCATIONS,
                  (value) => setFilters({ ...filters, location: value === 'ყველა' ? '' : value })
                )}
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>რეიტინგი</Text>
                {renderDropdown(
                  'rating',
                  filters.rating,
                  'აირჩიეთ რეიტინგი',
                  RATINGS,
                  (value) => setFilters({ ...filters, rating: value === 'ყველა' ? '' : value })
                )}
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity 
                  style={styles.clearFiltersBtn}
                  onPress={() => setFilters({ specialty: '', location: '', rating: '', priceMin: '', priceMax: '' })}
                >
                  <Text style={styles.clearFiltersBtnText}>გასუფთავება</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyFiltersBtn}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.applyFiltersBtnText}>გამოყენება</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dropdown Options Modal */}
      {openDropdown && (
        <Modal visible={true} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setOpenDropdown(null)}
          >
            <View style={styles.dropdownModal}>
              <ScrollView style={styles.dropdownList}>
                {(openDropdown === 'specialty' ? SPECIALTIES :
                  openDropdown === 'location' ? LOCATIONS :
                  openDropdown === 'rating' ? RATINGS : []
                ).map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownOption}
                    onPress={() => {
                      if (openDropdown === 'specialty') {
                        setFilters({ ...filters, specialty: option === 'ყველა' ? '' : option });
                      } else if (openDropdown === 'location') {
                        setFilters({ ...filters, location: option === 'ყველა' ? '' : option });
                      } else if (openDropdown === 'rating') {
                        setFilters({ ...filters, rating: option === 'ყველა' ? '' : option });
                      }
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Detail Modal */}
      <DetailModal
        visible={showDetailModal}
        item={selectedDetailItem}
        onClose={() => setShowDetailModal(false)}
        onContact={() => console.log('Contact mechanic')}
        onFavorite={() => console.log('Favorite mechanic')}
      />

      {/* Add Mechanic Modal */}
      <AddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddItem}
        defaultType="mechanic"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  innovativeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  innovativeHeader: {
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  innovativeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRightSection: {
    alignItems: 'center',
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnContent: {
    position: 'relative',
  },
  addIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  addLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  categoryBadgesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  categoryBadgesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    transform: [{ scale: 1 }],
  },
  categoryBadgeActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  categoryBadgeText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoryBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  filtersChipsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  filtersChipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  filterChipClose: {
    padding: 2,
  },
  clearAllChip: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentScroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  verticalCardsContainer: {
    padding: 20,
    gap: 20,
  },
  verticalMechanicCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
    transform: [{ scale: 1 }],
  },
  verticalMechanicImageSection: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  verticalMechanicImage: {
    width: '100%',
    height: '100%',
  },
  verticalMechanicImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  verticalMechanicImageBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  verticalStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verticalStatusText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '500',
  },
  verticalMechanicPriceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verticalMechanicPriceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  verticalMechanicContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  verticalMechanicMainInfo: {
    flex: 1,
  },
  verticalMechanicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  verticalMechanicSpecialty: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  verticalMechanicMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  verticalLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  verticalLocationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  verticalMechanicStats: {
    flexDirection: 'row',
    gap: 8,
  },
  verticalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verticalStatText: {
    fontSize: 10,
    color: '#6B7280',
  },
  verticalMechanicActions: {
    flexDirection: 'row',
    gap: 8,
  },
  verticalActionBtnSecondary: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },
  verticalActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  filterModalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  clearFiltersBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearFiltersBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyFiltersBtn: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyFiltersBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#374151',
  },
});