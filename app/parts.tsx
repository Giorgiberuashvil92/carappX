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
    TextInput
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { Ionicons } from '@expo/vector-icons';
  import { LinearGradient } from 'expo-linear-gradient';
  import { useRouter } from 'expo-router';
  import carData from '../data/carData.json';
  import DetailModal, { DetailItem } from '../components/ui/DetailModal';
  import AddModal, { AddModalType } from '../components/ui/AddModal';
  import { addItemApi } from '../services/addItemApi';






  export default function PartsHomeScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'დაშლილები' | 'ნაწილები' | 'მაღაზიები'>('დაშლილები');
    const [showFilterModal, setShowFilterModal] = useState(false);
    
    // Filter states for different tabs
    const [dismantlerFilters, setDismantlerFilters] = useState({
      brand: '',
      model: '',
      yearFrom: '',
      yearTo: '',
      condition: '',
      location: '',
    });

    const [partsFilters, setPartsFilters] = useState({
      brand: '',
      category: '',
      condition: '',
      priceMin: '',
      priceMax: '',
      location: '',
    });

    const [storesFilters, setStoresFilters] = useState({
      location: '',
      type: '',
      rating: '',
    });

    // Dropdown states
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    
    // Detail Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Real data states
    const [dismantlers, setDismantlers] = useState<any[]>([]);
    const [parts, setParts] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Car data states - Initialize with JSON data for instant loading
    const [carMakes, setCarMakes] = useState<string[]>([]);
    const [carModels, setCarModels] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [brandSearchQuery, setBrandSearchQuery] = useState('');

    // Load real data functions
    const loadDismantlers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await addItemApi.getDismantlers(dismantlerFilters as any);
        
        console.log('=== DISMANTLERS JSON DEBUG ===');
        console.log('Full JSON response:', JSON.stringify(response, null, 2));
        console.log('=============================');
        
        if (response.success && response.data) {
          response.data.forEach((dismantler: any, index: number) => {
            console.log(`\n--- Dismantler ${index + 1} ---`);
            console.log(`ID: ${dismantler.id}`);
            console.log(`Name: ${dismantler.name}`);
            console.log(`Photos:`, JSON.stringify(dismantler.photos, null, 2));
            console.log(`Model: ${dismantler.model}`);
            console.log(`Brand: ${dismantler.brand}`);
          });
          setDismantlers(response.data);
        } else {
          setError('დაშლილების ჩატვირთვა ვერ მოხერხდა');
        }
      } catch (error) {
        console.error('Error loading dismantlers:', error);
        setError('დაშლილების ჩატვირთვა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
    };

    const loadParts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await addItemApi.getParts(partsFilters);
        if (response.success && response.data) {
          setParts(response.data);
        } else {
          setError('ნაწილების ჩატვირთვა ვერ მოხერხდა');
        }
      } catch (error) {
        console.error('Error loading parts:', error);
        setError('ნაწილების ჩატვირთვა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
    };

    const loadStores = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await addItemApi.getStores(storesFilters);
        if (response.success && response.data) {
          setStores(response.data);
        } else {
          setError('მაღაზიების ჩატვირთვა ვერ მოხერხდა');
        }
      } catch (error) {
        console.error('Error loading stores:', error);
        setError('მაღაზიების ჩატვირთვა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
    };

    // Initialize data on mount
    useEffect(() => {
      setCarMakes(CAR_BRANDS);
      // Load initial data
      loadDismantlers();
    }, []);

    // Load data when tab changes
    useEffect(() => {
      if (activeTab === 'დაშლილები') {
        loadDismantlers();
      } else if (activeTab === 'ნაწილები') {
        loadParts();
      } else if (activeTab === 'მაღაზიები') {
        loadStores();
      }
    }, [activeTab]);

    // Reload data when filters change
    useEffect(() => {
      if (activeTab === 'დაშლილები') {
        loadDismantlers();
      }
    }, [dismantlerFilters]);

    useEffect(() => {
      if (activeTab === 'ნაწილები') {
        loadParts();
      }
    }, [partsFilters]);

    useEffect(() => {
      if (activeTab === 'მაღაზიები') {
        loadStores();
      }
    }, [storesFilters]);

    // Load car models when brand changes
    useEffect(() => {
      if (dismantlerFilters.brand && CAR_MODELS[dismantlerFilters.brand as keyof typeof CAR_MODELS]) {
        setCarModels(CAR_MODELS[dismantlerFilters.brand as keyof typeof CAR_MODELS].models);
      } else {
        setCarModels([]);
      }
    }, [dismantlerFilters.brand]);
    
    // Animation values
    const cardAnimations = useRef(parts.map(() => new Animated.Value(0))).current;

    // Extract data from JSON for instant loading
    const CAR_BRANDS = Object.keys(carData.brands);
    const CAR_BRANDS_DATA = carData.brands;
    const CAR_MODELS = carData.brands;
    const PART_CATEGORIES = carData.categories;
    const CONDITIONS = carData.conditions;
    const LOCATIONS = carData.locations;
    const YEARS = carData.years;
    const STORE_TYPES = carData.storeTypes;
    const RATINGS = carData.ratings;

    // Filtered brands based on search
    const filteredBrands = useMemo(() => {
      if (!brandSearchQuery.trim()) return CAR_BRANDS;
      return CAR_BRANDS.filter(brand => 
        brand.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );
    }, [brandSearchQuery, CAR_BRANDS]);

    // Helper function to get current tab filters
    const getCurrentFilters = () => {
      switch (activeTab) {
        case 'დაშლილები': return dismantlerFilters;
        case 'ნაწილები': return partsFilters;
        case 'მაღაზიები': return storesFilters;
        default: return dismantlerFilters;
      }
    };

    // Helper functions for DetailModal
    const convertPartToDetailItem = (part: any): DetailItem => {
      const mainImage = part.photos && part.photos.length > 0 
        ? part.photos[0] 
        : part.images && part.images.length > 0 
          ? part.images[0]
          : part.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop';
      
      // Create gallery from all photos or fallback to single image
      const gallery = part.photos && part.photos.length > 0 
        ? part.photos 
        : part.images && part.images.length > 0 
          ? part.images
          : [mainImage];

      return {
        id: part.id,
        title: part.title || part.name,
        description: part.description,
        price: part.price,
        image: mainImage,
        type: 'part',
        seller: part.seller || part.name,
        location: part.location,
        brand: part.brand,
        category: part.category,
        condition: part.condition,
        phone: part.phone,
        gallery: gallery, // Use real photos for gallery
        specifications: {
          'ბრენდი': part.brand || '',
          'კატეგორია': part.category || '',
        'მდგომარეობა': part.condition || '',
        'მყიდველი': part.seller || '',
        'ტელეფონი': part.phone || '',
      },
      features: ['ორიგინალი', 'გარანტია', 'ხარისხიანი']
    };
  };

    const convertStoreToDetailItem = (store: any): DetailItem => {
      // Get first photo from backend data or use fallback
      const mainImage = store.photos && store.photos.length > 0 
        ? store.photos[0] 
        : store.images && store.images.length > 0 
          ? store.images[0]
          : store.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop';
      
      // Create gallery from all photos or fallback to single image
      const gallery = store.photos && store.photos.length > 0 
        ? store.photos 
        : store.images && store.images.length > 0 
          ? store.images
          : [mainImage];
      
      return {
        id: store.id,
        title: store.name,
        name: store.name,
        image: mainImage,
        type: store.type === 'დაშლილები' || store.brand ? 'dismantler' : 'store', // Backend dismantlers have brand field
        location: store.location,
        phone: store.phone,
        workingHours: '09:00 - 18:00',
        address: store.location,
        services: ['ნაწილების მიყიდვა', 'კონსულტაცია', 'მონტაჟი', 'გარანტია'],
        features: ['გამოცდილი პერსონალი', 'ხარისხიანი სერვისი'],
        gallery: gallery, // Use real photos for gallery
        specifications: {
          'ტიპი': store.type || `${store.brand} ${store.model}`,
          'მდებარეობა': store.location,
          'ტელეფონი': store.phone || 'მიუთითებელი არ არის',
        }
      };
    };

    const handleShowPartDetails = (part: any) => {
      setSelectedDetailItem(convertPartToDetailItem(part));
      setShowDetailModal(true);
    };

    const handleShowStoreDetails = (store: any) => {
      setSelectedDetailItem(convertStoreToDetailItem(store));
      setShowDetailModal(true);
    };

    const handleAddItem = (type: AddModalType, data: any) => {
      console.log('Item successfully added:', { type, data });
      
      // Refresh the data based on the type and current tab
      const typeNames: Record<AddModalType, string> = {
        dismantler: 'დაშლილების განცხადება',
        part: 'ნაწილი',
        store: 'მაღაზია',
        carwash: 'სამართ-დასახურებელი'
      };
      
      console.log(`${typeNames[type]} წარმატებით დაემატა!`);
      
      // Reload the data for the respective type
      switch (type) {
        case 'dismantler':
          loadDismantlers();
          break;
        case 'part':
          loadParts();
          break;
        case 'store':
          loadStores();
          break;
      }
    };

    // Filtered data for parts (filtering is now done on backend, but we can add client-side search)
    const filteredParts = useMemo(() => {
      return parts.filter(part => {
        // Client-side search filtering if needed
        if (searchQuery && !part.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !part.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      });
    }, [parts, searchQuery]);

    // Filtered data for stores (filtering mostly done on backend)
    const filteredStores = useMemo(() => {
      let currentStores = activeTab === 'დაშლილები' ? dismantlers : 
                        activeTab === 'მაღაზიები' ? stores : stores;
      
      return currentStores.filter(store => {
        // Client-side search filtering if needed
        if (searchQuery && !store.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !store.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !store.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      });
    }, [dismantlers, stores, activeTab, searchQuery]);

    // Start card animations
    React.useEffect(() => {
      const animations = cardAnimations.map((anim, index) => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        })
      );
      Animated.stagger(100, animations).start();
    }, [activeTab]);

    const getTabIcon = (tab: string) => {
      switch (tab) {
        case 'დაშლილები': return 'car-outline';
        case 'ნაწილები': return 'cog-outline';
        case 'მაღაზიები': return 'storefront-outline';
        default: return 'grid-outline';
      }
    };

    const handleTabChange = (tab: any) => {
      // Reset animations
      cardAnimations.forEach(anim => anim.setValue(0));
      setActiveTab(tab);
    };

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


    const renderVerticalStoreCard = (store: any) => {
      // Get first photo from backend data or use fallback
      const imageUri = store.photos && store.photos.length > 0 
        ? store.photos[0] 
        : store.images && store.images.length > 0 
          ? store.images[0]
          : store.image || 'https://images.unsplash.com/photo-1517672651691-24622a91b550?q=80&w=800&auto=format&fit=crop';
      
      console.log(`🖼️ Store ${store.name}: Using image ${imageUri}`);
      
    return (
      <TouchableOpacity style={styles.verticalStoreCard} activeOpacity={0.95}>
          <View style={styles.verticalStoreImageSection}>
            <Image source={{ uri: imageUri }} style={styles.verticalStoreImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.verticalStoreImageOverlay}
          />
          <View style={styles.verticalStoreImageBadges}>
            <View style={styles.verticalTypeBadge}>
              <Text style={styles.verticalTypeText}>{store.type}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.verticalStoreContent}>
          <View style={styles.verticalStoreMainInfo}>
            <Text style={styles.verticalStoreName}>{store.name}</Text>
            <View style={styles.verticalStoreMetaRow}>
              <View style={styles.verticalLocationInfo}>
                <Ionicons name="location" size={14} color="#6B7280" />
                <Text style={styles.verticalLocationText}>{store.location}</Text>
              </View>
              <View style={styles.verticalStoreStats}>
                <View style={styles.verticalStatItem}>
                  <Ionicons name="time" size={12} color="#3B82F6" />
                  <Text style={styles.verticalStatText}>მუშაობს</Text>
                </View>
                {store.phone && (
                  <View style={styles.verticalStatItem}>
                    <Ionicons name="call" size={12} color="#3B82F6" />
                    <Text style={styles.verticalStatText}>{store.phone}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.verticalStoreActions}>
            <TouchableOpacity style={styles.verticalActionBtnSecondary}>
              <Ionicons name="heart-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.verticalActionBtnPrimary}
              onPress={() => handleShowStoreDetails(store)}
            >
              <Text style={styles.verticalActionPrimaryText}>დეტალები</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
    };

    const renderVerticalPartCard = (part: any) => {
      // Get first image from backend data or fallback
      const imageUri = part.images && part.images.length > 0 
        ? part.images[0] 
        : part.photos && part.photos.length > 0 
          ? part.photos[0]
          : part.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop';
      
      console.log(`🖼️ Part ${part.title}: Using image ${imageUri}`);
      
      return (
        <TouchableOpacity style={styles.verticalPartCard} activeOpacity={0.95}>
          <View style={styles.verticalPartImageSection}>
            <Image source={{ uri: imageUri }} style={styles.verticalPartImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.verticalPartImageOverlay}
          />
          {part.condition && (
            <View style={styles.verticalPartConditionBadge}>
              <Text style={styles.verticalPartConditionText}>{part.condition}</Text>
            </View>
          )}
          <View style={styles.verticalPartPriceBadge}>
            <Text style={styles.verticalPartPriceText}>{part.price}</Text>
          </View>
        </View>
        
        <View style={styles.verticalPartContent}>
          <View style={styles.verticalPartMainInfo}>
            <Text style={styles.verticalPartName}>{part.title}</Text>
            <View style={styles.verticalPartMetaRow}>
              <View style={styles.verticalPartLocationInfo}>
                <Ionicons name="storefront-outline" size={14} color="#6B7280" />
                <Text style={styles.verticalPartLocationText}>{part.seller}</Text>
              </View>
              <View style={styles.verticalPartStats}>
                <View style={styles.verticalPartStatItem}>
                  <Ionicons name="location" size={12} color="#3B82F6" />
                  <Text style={styles.verticalPartStatText}>{part.location}</Text>
                </View>
                {part.phone && (
                  <View style={styles.verticalPartStatItem}>
                    <Ionicons name="call" size={12} color="#3B82F6" />
                    <Text style={styles.verticalPartStatText}>{part.phone}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.verticalPartActions}>
            <TouchableOpacity style={styles.verticalPartActionBtnSecondary}>
              <Ionicons name="heart-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.verticalPartActionBtnPrimary}
              onPress={() => handleShowPartDetails(part)}
            >
              <Text style={styles.verticalPartActionPrimaryText}>დეტალები</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
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
                <Text style={styles.innovativeTitle}>ავტონაწილები</Text>
                <View style={styles.titleUnderline} />
              </View>
              
              <View style={styles.headerRightSection}>
                <TouchableOpacity 
                  style={styles.headerAddBtn}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.addBtnContent}>
                    <Ionicons name="car-sport" size={20} color="#FFFFFF" />
                    <Ionicons name="add-circle" size={14} color="#FFFFFF" style={styles.addIcon} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.addLabel}>განცხადების დამატება</Text>
              </View>
            </View>
            
            {/* Floating Tab Selector */}
            <View style={styles.floatingTabSelector}>
              {['დაშლილები', 'ნაწილები', 'მაღაზიები'].map((t, idx) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleTabChange(t as any)}
                  style={[
                    styles.floatingTabItem,
                    activeTab === t && styles.floatingTabItemActive
                  ]}
                >
                  <View style={styles.tabIconWrapper}>
                    <Ionicons 
                      name={getTabIcon(t) as any} 
                      size={20} 
                      color={activeTab === t ? "#FFFFFF" : "#111827"} 
                    />
                  </View>
                  <Text style={[
                    styles.floatingTabItemText, 
                    activeTab === t && styles.floatingTabItemTextActive
                  ]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI Search Section */}
            <View style={styles.aiSearchSection}>
              {/* AI Search Banner */}
              <TouchableOpacity 
                style={styles.aiSearchBanner}
                onPress={() => router.push('/ai-chat')}
                activeOpacity={0.95}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6', '#EC4899']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.aiGradient}
                >
                  <View style={styles.aiSearchContent}>
                    <View style={styles.aiIcon}>
                      <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.aiTextContainer}>
                      <Text style={styles.aiTitle}>AI დამხმარე</Text>
                      <Text style={styles.aiSubtitle}>მოძებნე ნაწილები ჭკვიანად</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

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
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  if (activeTab === 'დაშლილები') loadDismantlers();
                  else if (activeTab === 'ნაწილები') loadParts();
                  else if (activeTab === 'მაღაზიები') loadStores();
                }}
              >
                <Text style={styles.retryText}>თავიდან ცდა</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {activeTab === 'დაშლილები' && (
                <View style={styles.modernSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.modernSectionTitle}>დაშლილების მაღაზიები</Text>
                    <TouchableOpacity style={styles.seeAllBtn}>
                      <Text style={styles.seeAllText}>ყველა</Text>
                      <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                  {dismantlers.length > 0 ? (
                    <View style={styles.verticalStoresList}>
                      {dismantlers?.map((dismantler, index) => (
                      <View key={dismantler.id || dismantler._id || `dismantler-${index}`}>
                        {renderVerticalStoreCard(dismantler)}
                      </View>
                    ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>დაშლილები არ მოიძებნა</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'ნაწილები' && (
                <View style={styles.modernSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.modernSectionTitle}>პოპულარული ნაწილები</Text>
                    <View style={styles.sectionActions}>
                      <TouchableOpacity style={styles.seeAllBtn}>
                        <Text style={styles.seeAllText}>ყველა</Text>
                        <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {filteredParts.length > 0 ? (
                    <View style={styles.verticalPartsList}>
                      {filteredParts?.map((part) => (
                      <View key={part.id}>
                        {renderVerticalPartCard(part)}
                      </View>
                    ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>ნაწილები არ მოიძებნა</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'მაღაზიები' && (
                <View style={styles.modernSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.modernSectionTitle}>ყველა მაღაზია</Text>
                    <TouchableOpacity style={styles.seeAllBtn}>
                      <Text style={styles.seeAllText}>რუკა</Text>
                      <Ionicons name="map-outline" size={16} color="#6366F1" />
                    </TouchableOpacity>
                  </View>
                  {filteredStores.length > 0 ? (
                    <View style={styles.verticalStoresList}>
                      {filteredStores?.map((store) => (
                      <View key={store.id}>
                        {renderVerticalStoreCard(store)}
                      </View>
                    ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>მაღაზიები არ მოიძებნა</Text>
                    </View>
                  )}
                </View>
              )}
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
                  onPress={() => {
                    setDismantlerFilters({
                      brand: '',
                      model: '',
                      yearFrom: '',
                      yearTo: '',
                      condition: '',
                      location: '',
                    });
                    setPartsFilters({
                      brand: '',
                      category: '',
                      condition: '',
                      priceMin: '',
                      priceMax: '',
                      location: '',
                    });
                    setStoresFilters({
                      location: '',
                      type: '',
                      rating: '',
                    });
                  }}
                >
                  <Text style={styles.modalResetText}>გასუფთავება</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Dismantler Filters */}
                {activeTab === 'დაშლილები' && (
                  <>
                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>ბრენდი</Text>
                      {renderDropdown(
                        'dismantler-brand',
                        dismantlerFilters.brand,
                        'აირჩიეთ ბრენდი',
                        filteredBrands,
                        (value) => setDismantlerFilters(prev => ({ ...prev, brand: value, model: '' }))
                      )}
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>მოდელი</Text>
                      <View style={[styles.dropdownContainer, !dismantlerFilters.brand && styles.dropdownDisabled]}>
                        <TouchableOpacity 
                          style={[styles.dropdownButton, !dismantlerFilters.brand && styles.dropdownButtonDisabled]}
                          onPress={() => dismantlerFilters.brand && setOpenDropdown(openDropdown === 'dismantler-model' ? null : 'dismantler-model')}
                          disabled={!dismantlerFilters.brand}
                        >
                          <Text style={[styles.dropdownText, !dismantlerFilters.model && styles.dropdownPlaceholder, !dismantlerFilters.brand && styles.dropdownTextDisabled]}>
                            {dismantlerFilters.model || (dismantlerFilters.brand ? 'აირჩიეთ მოდელი' : 'ჯერ აირჩიეთ ბრენდი')}
                          </Text>
                          <Ionicons 
                            name={openDropdown === 'dismantler-model' ? "chevron-up" : "chevron-down"} 
                            size={16} 
                            color={dismantlerFilters.brand ? "#6B7280" : "#D1D5DB"} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>წელი</Text>
                      <View style={styles.yearRangeContainer}>
                        <View style={styles.yearInputWrapper}>
                          <Text style={styles.yearLabel}>წლიდან</Text>
                          {renderDropdown(
                            'dismantler-year-from',
                            dismantlerFilters.yearFrom,
                            'წელი',
                            YEARS,
                            (value) => setDismantlerFilters(prev => ({ ...prev, yearFrom: value }))
                          )}
                        </View>
                        <View style={styles.yearInputWrapper}>
                          <Text style={styles.yearLabel}>წლამდე</Text>
                          {renderDropdown(
                            'dismantler-year-to',
                            dismantlerFilters.yearTo,
                            'წელი',
                            YEARS,
                            (value) => setDismantlerFilters(prev => ({ ...prev, yearTo: value }))
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>მდგომარეობა</Text>
                      {renderDropdown(
                        'dismantler-condition',
                        dismantlerFilters.condition,
                        'მდგომარეობა',
                        CONDITIONS,
                        (value) => setDismantlerFilters(prev => ({ ...prev, condition: value }))
                      )}
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>მდებარეობა</Text>
                      {renderDropdown(
                        'dismantler-location',
                        dismantlerFilters.location,
                        'აირჩიეთ ქალაქი',
                        LOCATIONS,
                        (value) => setDismantlerFilters(prev => ({ ...prev, location: value }))
                      )}
                    </View>
                  </>
                )}

                {/* Parts Filters */}
                {activeTab === 'ნაწილები' && (
                  <>
                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>ბრენდი</Text>
                      {renderDropdown(
                        'parts-brand',
                        partsFilters.brand,
                        'აირჩიეთ ბრენდი',
                        filteredBrands,
                        (value) => setPartsFilters(prev => ({ ...prev, brand: value }))
                      )}
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>კატეგორია</Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {partsFilters.category || 'ნაწილის ტიპი'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>მდგომარეობა</Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {partsFilters.condition || 'მდგომარეობა'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>ფასი (₾)</Text>
                      <View style={styles.priceInputsContainer}>
                        <View style={styles.priceInputWrapper}>
                          <Text style={styles.priceInputLabel}>დან</Text>
                          <TextInput
                            style={styles.priceInput}
                            value={partsFilters.priceMin}
                            onChangeText={(text) => setPartsFilters(prev => ({ ...prev, priceMin: text }))}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.priceSeparator} />
                        <View style={styles.priceInputWrapper}>
                          <Text style={styles.priceInputLabel}>მდე</Text>
                          <TextInput
                            style={styles.priceInput}
                            value={partsFilters.priceMax}
                            onChangeText={(text) => setPartsFilters(prev => ({ ...prev, priceMax: text }))}
                            placeholder="9999"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>მდებარეობა</Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {partsFilters.location || 'აირჩიეთ ქალაქი'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Stores Filters */}
                {activeTab === 'მაღაზიები' && (
                  <>
                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>ტიპი</Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {storesFilters.type || 'მაღაზიის ტიპი'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>რეიტინგი</Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {storesFilters.rating || 'მინიმალური რეიტინგი'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>მდებარეობა</Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {storesFilters.location || 'აირჩიეთ ქალაქი'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <View style={{ height: 100 }} />
              </ScrollView>

              {/* Apply Button */}
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.applyFiltersBtn}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.applyFiltersBtnText}>
                    {activeTab === 'ნაწილები' 
                      ? `ნაწილების ნახვა (${filteredParts.length})` 
                      : `მაღაზიების ნახვა (${filteredStores.length})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>

          {/* Dropdown Overlay */}
          {openDropdown && (
            <View style={styles.dropdownOverlay}>
              <TouchableOpacity 
                style={styles.dropdownBackdrop}
                onPress={() => setOpenDropdown(null)}
              />
              <View style={styles.dropdownOptionsModal}>
                {/* Clean Modal Header */}
                <View style={styles.cleanModalHeader}>
                  <View style={styles.cleanHeaderContent}>
                    <View style={styles.cleanHeaderLeft}>
                      <View style={styles.cleanIconBadge}>
                        <Ionicons 
                          name={openDropdown === 'dismantler-brand' || openDropdown === 'parts-brand' ? 'car-sport' : 'list'} 
                          size={22} 
                          color="#3B82F6" 
                        />
                      </View>
                      <View>
                        <Text style={styles.cleanHeaderTitle}>
                          {openDropdown === 'dismantler-brand' || openDropdown === 'parts-brand' ? 'ბრენდის არჩევა' : 'არჩევა'}
                        </Text>
                        <Text style={styles.cleanHeaderSubtitle}>
                          {openDropdown === 'dismantler-brand' || openDropdown === 'parts-brand' ? 
                            `${filteredBrands.length} ბრენდი ხელმისაწვდომი` : 'აირჩიეთ ოფცია'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.cleanCloseButton}
                      onPress={() => setOpenDropdown(null)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Clean Search Section */}
                {(openDropdown === 'dismantler-brand' || openDropdown === 'parts-brand') && (
                  <View style={styles.cleanSearchSection}>
                    <View style={styles.cleanSearchWrapper}>
                      <Ionicons name="search" size={18} color="#9CA3AF" style={styles.cleanSearchIcon} />
                      <TextInput
                        style={styles.cleanSearchInput}
                        placeholder="ძებნა ბრენდებში..."
                        placeholderTextColor="#9CA3AF"
                        value={brandSearchQuery}
                        onChangeText={setBrandSearchQuery}
                      />
                      {brandSearchQuery.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => setBrandSearchQuery('')} 
                          style={styles.cleanClearButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={18} color="#6B7280" />
                        </TouchableOpacity>
                      )}
                    </View>
                    {brandSearchQuery.length > 0 && (
                      <Text style={styles.cleanResultsText}>
                        {filteredBrands.length} შედეგი
                      </Text>
                    )}
                  </View>
                )}

                {(() => {
                  let options: string[] = [];
                  let onSelect: (value: string) => void = () => {};
                  
                  switch(openDropdown) {
                    case 'dismantler-brand':
                      options = filteredBrands;
                      onSelect = (value) => setDismantlerFilters(prev => ({ ...prev, brand: value, model: '' }));
                      break;
                    case 'parts-brand':
                      options = filteredBrands;
                      onSelect = (value) => setPartsFilters(prev => ({ ...prev, brand: value }));
                      break;
                    case 'dismantler-model':
                      if (!dismantlerFilters.brand) {
                        options = ['ჯერ აირჩიეთ ბრენდი'];
                        onSelect = () => {};
                      } else if (carModels.length === 0) {
                        options = ['მოდელები ვერ მოიძებნა'];
                        onSelect = () => {};
                      } else {
                        options = carModels;
                        onSelect = (value) => setDismantlerFilters(prev => ({ ...prev, model: value }));
                      }
                      break;
                    case 'dismantler-year-from':
                      options = YEARS;
                      onSelect = (value) => setDismantlerFilters(prev => ({ ...prev, yearFrom: value }));
                      break;
                    case 'dismantler-year-to':
                      options = YEARS;
                      onSelect = (value) => setDismantlerFilters(prev => ({ ...prev, yearTo: value }));
                      break;
                    case 'dismantler-condition':
                      options = CONDITIONS;
                      onSelect = (value) => setDismantlerFilters(prev => ({ ...prev, condition: value }));
                      break;
                    case 'dismantler-location':
                      options = LOCATIONS;
                      onSelect = (value) => setDismantlerFilters(prev => ({ ...prev, location: value }));
                      break;
                  }

                  // For brand dropdowns, options are already filtered by filteredBrands
                  // For other dropdowns, apply search filtering
                  const isBrandDropdown = openDropdown === 'dismantler-brand' || openDropdown === 'parts-brand';
                  let filteredOptions = options;
                  
                  if (!isBrandDropdown && searchQuery.trim()) {
                    filteredOptions = options.filter(option => 
                      option.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  }

                  return (
                    <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                      {filteredOptions.map((option, index) => {
                        let currentValue = '';
                        switch(openDropdown) {
                          case 'dismantler-brand': currentValue = dismantlerFilters.brand; break;
                          case 'parts-brand': currentValue = partsFilters.brand; break;
                          case 'dismantler-model': currentValue = dismantlerFilters.model; break;
                          case 'dismantler-year-from': currentValue = dismantlerFilters.yearFrom; break;
                          case 'dismantler-year-to': currentValue = dismantlerFilters.yearTo; break;
                          case 'dismantler-condition': currentValue = dismantlerFilters.condition; break;
                          case 'dismantler-location': currentValue = dismantlerFilters.location; break;
                        }
                        
                        const isDisabledMessage = option === 'ჯერ აირჩიეთ ბრენდი' || 
                                                option === 'მოდელები ვერ მოიძებნა';
                        
                        const isBrandOption = (openDropdown === 'dismantler-brand' || openDropdown === 'parts-brand') && !isDisabledMessage;
                        const brandData = isBrandOption ? CAR_BRANDS_DATA[option as keyof typeof CAR_BRANDS_DATA] : null;
                        
                        return (
                          <TouchableOpacity
                            key={`${openDropdown}-${option}-${index}`}
                            style={[
                              styles.dropdownOptionModal,
                              index === filteredOptions.length - 1 && styles.dropdownOptionLast,
                              isDisabledMessage && styles.dropdownOptionDisabled,
                              currentValue === option && styles.dropdownOptionSelected
                            ]}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (!isDisabledMessage) {
                                onSelect(option);
                                setOpenDropdown(null);
                                if (isBrandDropdown) {
                                  setBrandSearchQuery('');
                                } else {
                                  setSearchQuery('');
                                }
                              }
                            }}
                            disabled={isDisabledMessage}
                          >
                            {brandData ? (
                              <View style={styles.cleanBrandCard}>
                                <View style={styles.cleanBrandLogoContainer}>
                                  <Image 
                                    source={{ uri: brandData.logo }} 
                                    style={styles.cleanBrandLogo}
                                    resizeMode="contain"
                                  />
                                </View>
                                <View style={styles.cleanBrandInfo}>
                                  <Text style={[
                                    styles.cleanBrandName,
                                    currentValue === option && styles.cleanBrandNameSelected
                                  ]}>
                                    {option}
                                  </Text>
                                  <View style={styles.cleanBrandMeta}>
                                    <Text style={styles.cleanCountryText}>{brandData.country}</Text>
                                    <View style={styles.cleanDivider} />
                                    <Text style={styles.cleanModelsText}>{brandData.models.length} მოდელი</Text>
                                  </View>
                                </View>
                                {currentValue === option && (
                                  <View style={styles.cleanSelectedIndicator}>
                                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                                  </View>
                                )}
                              </View>
                            ) : (
                              <View style={styles.regularOptionContent}>
                                <Text style={[
                                  styles.dropdownOptionText,
                                  currentValue === option && styles.dropdownOptionTextActive,
                                  isDisabledMessage && styles.dropdownOptionTextDisabled
                                ]}>
                                  {option}
                                </Text>
                                {currentValue === option && !isDisabledMessage && (
                                  <Ionicons name="checkmark" size={16} color="#3B82F6" />
                                )}
                                {isDisabledMessage && (
                                  <Ionicons name="information-circle" size={16} color="#9CA3AF" />
                                )}
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                      
                      {filteredOptions.length === 0 && (
                        (isBrandDropdown ? brandSearchQuery.length > 0 : searchQuery.length > 0)
                      ) && (
                        <View style={styles.noResultsContainer}>
                          <Ionicons name="search" size={32} color="#D1D5DB" />
                          <Text style={styles.noResultsText}>შედეგები ვერ მოიძებნა</Text>
                          <Text style={styles.noResultsSubtext}>სცადეთ სხვა საძიებო სიტყვა</Text>
                        </View>
                      )}
                    </ScrollView>
                  );
                })()}
              </View>
            </View>
          )}
        </Modal>

        {/* Detail Modal */}
        <DetailModal
          visible={showDetailModal}
          item={selectedDetailItem}
          onClose={() => setShowDetailModal(false)}
          onContact={() => {
            // Handle contact action
            console.log('Contact pressed for:', selectedDetailItem?.title);
            setShowDetailModal(false);
          }}
          onFavorite={() => {
            // Handle favorite toggle
            console.log('Favorite pressed for:', selectedDetailItem?.title);
          }}
          isFavorite={false}
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

    // Floating Tab Selector
    floatingTabSelector: {
      flexDirection: 'row',
      marginHorizontal: 20,
      backgroundColor: '#FFFFFF',
      borderRadius: 25,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 12,
    },
    floatingTabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 20,
      gap: 6,
    },
    floatingTabItemActive: {
      backgroundColor: '#111827',
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    tabIconWrapper: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingTabItemText: {
      fontSize: 11,
      fontWeight: '500',
      color: '#111827',
    },
    floatingTabItemTextActive: {
      color: '#FFFFFF',
    },

    // AI Search Section
    aiSearchSection: {
      marginHorizontal: 20,
      marginTop: 16,
      gap: 12,
    },
    aiSearchBanner: {
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    aiGradient: {
      padding: 16,
    },
    aiSearchContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    aiIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiTextContainer: {
      flex: 1,
    },
    aiTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    aiSubtitle: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '400',
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
    sectionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#3B82F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 6,
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    addBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
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
      fontWeight: '500',
      color: '#3B82F6',
    },





    // Vertical Stores List
    verticalStoresList: {
      gap: 16,
    },
    verticalStoreCard: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      marginBottom: 4,
    },
    verticalStoreImageSection: {
      width: 120,
      height: 120,
      position: 'relative',
    },
    verticalStoreImage: {
      width: '100%',
      height: '100%',
    },
    verticalStoreImageOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
    },
    verticalStoreImageBadges: {
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    verticalTypeBadge: {
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    verticalTypeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '500',
    },
    verticalStoreContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    verticalStoreMainInfo: {
      flex: 1,
    },
    verticalStoreName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 6,
      lineHeight: 18,
    },
    verticalStoreMetaRow: {
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
      color: '#6B7280',
      fontWeight: '400',
    },
    verticalStoreStats: {
      flexDirection: 'row',
      gap: 6,
    },
    verticalStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
    },
    verticalStatText: {
      fontSize: 9,
      fontWeight: '500',
      color: '#6B7280',
      maxWidth: 80,
    },
    verticalStoreActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    verticalActionBtnSecondary: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    verticalActionBtnPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111827',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 4,
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    verticalActionPrimaryText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
    },


    // Filter Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: '#F8FAFC',
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
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    modalCloseBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F9FAFB',
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
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    modalResetText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#EF4444',
    },
    modalScroll: {
      flex: 1,
      paddingHorizontal: 20,
    },
    filterSection: {
      marginTop: 24,
    },
    filterSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 12,
    },
    dropdownContainer: {
      position: 'relative',
      zIndex: 1,
    },
    dropdownButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownText: {
      fontSize: 14,
      color: '#374151',
      fontWeight: '400',
    },
    dropdownPlaceholder: {
      color: '#9CA3AF',
    },
    dropdownDisabled: {
      opacity: 0.6,
    },
    dropdownButtonDisabled: {
      backgroundColor: '#F9FAFB',
      borderColor: '#E5E7EB',
    },
    dropdownTextDisabled: {
      color: '#9CA3AF',
    },
    dropdownOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dropdownOptionsModal: {
      backgroundColor: '#FFFFFF',
      borderRadius: 32,
      width: 340,
      height: 520,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 20,
      overflow: 'hidden',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#374151',
      paddingVertical: 0,
    },
    clearButton: {
      padding: 2,
      marginLeft: 8,
    },
    dropdownScrollView: {
      height: 400,
      paddingBottom: 8,
    },
    noResultsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    noResultsText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#6B7280',
      marginTop: 12,
      marginBottom: 4,
    },
    noResultsSubtext: {
      fontSize: 14,
      color: '#9CA3AF',
    },
    dropdownOptionModal: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      minHeight: 70,
      backgroundColor: '#FFFFFF',
    },
    dropdownOptionDisabled: {
      backgroundColor: '#F9FAFB',
      opacity: 0.7,
    },
    dropdownOptionSelected: {
      backgroundColor: '#F8FAFC',
      borderLeftWidth: 3,
      borderLeftColor: '#3B82F6',
    },
    dropdownOptionTextDisabled: {
      color: '#9CA3AF',
      fontStyle: 'italic',
    },
    dropdownOptionLast: {
      borderBottomWidth: 0,
    },
    dropdownOptionText: {
      fontSize: 16,
      color: '#111827',
      fontWeight: '500',
      lineHeight: 20,
    },
    dropdownOptionTextActive: {
      color: '#3B82F6',
      fontWeight: '600',
    },
    yearRangeContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    yearInputWrapper: {
      flex: 1,
    },
    yearLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: '#6B7280',
      marginBottom: 8,
    },
    priceInputsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    priceInputWrapper: {
      flex: 1,
    },
    priceInputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
      marginBottom: 8,
    },
    priceInput: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: '#111827',
    },
    priceSeparator: {
      width: 20,
      height: 1,
      backgroundColor: '#D1D5DB',
      marginTop: 20,
    },
    modalFooter: {
      padding: 20,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    applyFiltersBtn: {
      backgroundColor: '#111827',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    applyFiltersBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    // Enhanced Dropdown Option Styles
    dropdownOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    dropdownOptionTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    brandLogo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    brandCountryText: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '400',
      marginTop: 2,
    },

    // Clean Modal Header Styles
    cleanModalHeader: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
    cleanHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cleanHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    cleanIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F8FAFC',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    cleanHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      letterSpacing: -0.3,
    },
    cleanHeaderSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: '#6B7280',
      marginTop: 2,
    },
    cleanCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },

    // Enhanced Search Styles
    brandSearchContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#FFFFFF',
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    searchIconStyle: {
      marginRight: 12,
    },
    brandSearchInput: {
      flex: 1,
      fontSize: 16,
      color: '#111827',
      fontWeight: '400',
    },
    clearSearchButton: {
      padding: 4,
      marginLeft: 8,
    },

    // Advanced Search Styles
    advancedSearchSection: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: '#FAFBFC',
    },
    glassSearchWrapper: {
      marginBottom: 12,
    },
    searchGlassEffect: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 16,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    glassSearchIcon: {
      marginRight: 12,
    },
    glassSearchInput: {
      flex: 1,
      fontSize: 16,
      color: '#111827',
      fontWeight: '500',
    },
    glassClearButton: {
      padding: 4,
    },
    searchResultsText: {
      fontSize: 14,
      color: '#6366F1',
      fontWeight: '600',
      textAlign: 'center',
    },

    // Modern Brand Card Styles
    modernBrandCard: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingVertical: 4,
    },
    brandLogoContainer: {
      position: 'relative',
      marginRight: 16,
    },
    modernBrandLogo: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#F9FAFB',
      borderWidth: 2,
      borderColor: '#E5E7EB',
    },
    selectedBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    brandInfoSection: {
      flex: 1,
    },
    modernBrandName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 6,
    },
    modernBrandNameSelected: {
      color: '#6366F1',
    },
    brandMetaRow: {
      flexDirection: 'row',
      gap: 8,
    },
    countryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    countryChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#6366F1',
    },
    modelsChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    modelsChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#EC4899',
    },
    selectedIndicator: {
      marginLeft: 12,
    },
    regularOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },

    // Clean Search Styles
    cleanSearchSection: {
      backgroundColor: '#F9FAFB',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    cleanSearchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cleanSearchIcon: {
      marginRight: 12,
    },
    cleanSearchInput: {
      flex: 1,
      fontSize: 15,
      color: '#111827',
      fontWeight: '500',
    },
    cleanClearButton: {
      padding: 4,
    },
    cleanResultsText: {
      fontSize: 13,
      color: '#3B82F6',
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 8,
    },

    // Clean Brand Card Styles
    cleanBrandCard: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingVertical: 2,
    },
    cleanBrandLogoContainer: {
      marginRight: 16,
    },
    cleanBrandLogo: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    cleanBrandInfo: {
      flex: 1,
    },
    cleanBrandName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      letterSpacing: -0.2,
    },
    cleanBrandNameSelected: {
      color: '#3B82F6',
    },
    cleanBrandMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cleanCountryText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#6B7280',
    },
    cleanDivider: {
      width: 1,
      height: 12,
      backgroundColor: '#E5E7EB',
      marginHorizontal: 8,
    },
    cleanModelsText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#6B7280',
    },
    cleanSelectedIndicator: {
      marginLeft: 12,
    },

    // Vertical Parts List
    verticalPartsList: {
      gap: 16,
    },
    verticalPartCard: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      marginBottom: 4,
    },
    verticalPartImageSection: {
      width: 120,
      height: 120,
      position: 'relative',
    },
    verticalPartImage: {
      width: '100%',
      height: '100%',
    },
    verticalPartImageOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
    },
    verticalPartConditionBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    verticalPartConditionText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '500',
    },
    verticalPartPriceBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    verticalPartPriceText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    verticalPartContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    verticalPartMainInfo: {
      flex: 1,
    },
    verticalPartName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 6,
      lineHeight: 18,
    },
    verticalPartMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    verticalPartLocationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      flex: 1,
    },
    verticalPartLocationText: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '400',
    },
    verticalPartStats: {
      flexDirection: 'row',
      gap: 6,
    },
    verticalPartStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
    },
    verticalPartStatText: {
      fontSize: 9,
      fontWeight: '500',
      color: '#6B7280',
      maxWidth: 80,
    },
    verticalPartActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    verticalPartActionBtnSecondary: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    verticalPartActionBtnPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111827',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 4,
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    verticalPartActionPrimaryText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    
    // Loading and Error States
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      marginBottom: 16,
      fontWeight: '500',
    },
    retryButton: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: '#9CA3AF',
      fontWeight: '500',
    },
  });


