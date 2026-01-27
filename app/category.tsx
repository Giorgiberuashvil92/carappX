import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import API_BASE_URL from '../config/api';
import { categoriesApi, Category } from '../services/categoriesApi';
import { useUser } from '../contexts/UserContext';
import { engagementApi } from '../services/engagementApi';
import { analyticsService } from '../services/analytics';
import { useFocusEffect } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Fallback კატეგორიების კონფიგურაცია (თუ API-დან ვერ ჩაიტვირთა)
const CATEGORY_CONFIG: Record<string, { title: string; icon: string; color: string; gradient: string[] }> = {
  carwash: {
    title: 'სამრეცხაო სერვისები',
    icon: 'water',
    color: '#22C55E',
    gradient: ['#22C55E', '#16A34A'],
  },
  mechanic: {
    title: 'ავტოსერვისები',
    icon: 'construct',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'],
  },
  store: {
    title: 'ავტო მაღაზიები',
    icon: 'storefront',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
  },
  dismantler: {
    title: 'დაშლილი მანქანები',
    icon: 'build',
    color: '#6366F1',
    gradient: ['#6366F1', '#4F46E5'],
  },
  part: {
    title: 'ავტონაწილები',
    icon: 'cog',
    color: '#EC4899',
    gradient: ['#EC4899', '#DB2777'],
  },
  parking: {
    title: 'პარკინგები',
    icon: 'car',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  insurance: {
    title: 'დაზღვევა',
    icon: 'shield-checkmark',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
  },
  rental: {
    title: 'მანქანის გაქირავება',
    icon: 'key',
    color: '#F97316',
    gradient: ['#F97316', '#EA580C'],
  },
};

// Helper function to convert hex to RGB for gradient
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [99, 102, 241];
};

// Helper to create gradient from color
const createGradient = (color: string): string[] => {
  const [r, g, b] = hexToRgb(color);
  const darker = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`;
  return [color, darker];
};

export default function CategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  
  const categoryType = (params.type as string) || 'carwash';
  const categoryId = params.categoryId as string | undefined;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'topRated'>('all');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Get config from API category or fallback
  const config = category
    ? {
        title: category.name,
        icon: category.icon as any,
        color: category.color,
        gradient: createGradient(category.color),
      }
    : CATEGORY_CONFIG[categoryType] || CATEGORY_CONFIG.carwash;
  
  const categoryName = params.name as string || category?.name || config.title || 'კატეგორია';

  // Track screen view when focused
  useFocusEffect(
    React.useCallback(() => {
      const screenName = `კატეგორია: ${categoryName}`;
      analyticsService.logScreenViewWithBackend(screenName, screenName, user?.id);
      analyticsService.logCategoryView(categoryType, categoryName, user?.id);
    }, [categoryType, categoryName, user?.id])
  );

  useEffect(() => {
    loadCategory();
    fetchCategoryServices();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [categoryType, categoryId, filter]);

  const loadCategory = async () => {
    if (categoryId) {
      try {
        const cat = await categoriesApi.getCategoryById(categoryId);
        if (cat) {
          setCategory(cat);
        }
      } catch (error) {
        console.error('Error loading category:', error);
      }
    } else {
      // Try to find category by service type
      try {
        const allCategories = await categoriesApi.getAllCategories();
        const foundCategory = allCategories.find(
          (cat) => cat.serviceTypes?.includes(categoryType)
        );
        if (foundCategory) {
          setCategory(foundCategory);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }
  };

  const fetchCategoryServices = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // API-დან მონაცემების მიღება
      const response = await fetch(`${API_BASE_URL}/services?type=${categoryType}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        const formattedServices = data.map((service: any) => ({
          id: service.id,
          name: service.title,
          location: service.location,
          rating: service.rating || 4.5,
          price: typeof service.price === 'string' ? service.price : `${service.price || 25}₾`,
          image: service.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
          category: service.category || service.type,
          address: service.location,
          phone: service.phone || 'N/A',
          isOpen: service.isOpen !== undefined ? service.isOpen : true,
          reviews: service.reviews || Math.floor(Math.random() * 50) + 10,
          type: service.type,
          description: service.description,
          distance: `${(Math.random() * 5 + 0.5).toFixed(1)} კმ`,
          waitTime: `${Math.floor(Math.random() * 30) + 5} წთ`,
        }));
        
        setServices(formattedServices);
      } else {
        // Fallback mock data
        generateMockServices();
      }
    } catch (error) {
      console.error('Error fetching category services:', error);
      generateMockServices();
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const generateMockServices = () => {
    const mockServices = Array.from({ length: 12 }, (_, i) => ({
      id: `${categoryType}-${i + 1}`,
      name: `${categoryName} ${i + 1}`,
      location: ['ვაკე', 'საბურთალო', 'დიღომი', 'ისანი', 'გლდანი'][Math.floor(Math.random() * 5)],
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      price: `${Math.floor(Math.random() * 50) + 15}₾`,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
      category: categoryName,
      address: 'თბილისი',
      phone: '+995 555 123 456',
      isOpen: Math.random() > 0.3,
      reviews: Math.floor(Math.random() * 100) + 10,
      type: categoryType,
      description: 'პრემიუმ ხარისხის მომსახურება',
      distance: `${(Math.random() * 5 + 0.5).toFixed(1)} კმ`,
      waitTime: `${Math.floor(Math.random() * 30) + 5} წთ`,
    }));
    
    setServices(mockServices);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoryServices(true);
  };

  const handleServicePress = (service: any) => {
    const serviceId = service.id;
    const serviceType = service.type || categoryType;
    
    // Track service click
    analyticsService.logButtonClick(`სერვისი: ${service.name}`, 'კატეგორია', {
      service_id: serviceId,
      service_type: serviceType,
      category: categoryName,
    }, user?.id);
    
    // Track engagement based on service type
    if (user?.id && serviceId) {
      if (serviceType === 'store') {
        console.log('👁️ [CATEGORY] Tracking view for store:', serviceId, 'user:', user.id);
        engagementApi.trackStoreView(serviceId, user.id).catch((err) => {
          console.error('❌ [CATEGORY] Error tracking store view:', err);
        });
      } else if (serviceType === 'dismantler') {
        console.log('👁️ [CATEGORY] Tracking view for dismantler:', serviceId, 'user:', user.id);
        engagementApi.trackDismantlerView(serviceId, user.id).catch((err) => {
          console.error('❌ [CATEGORY] Error tracking dismantler view:', err);
        });
      }
      // Add more types as needed (mechanic, etc.)
    }
    
    router.push({
      pathname: '/details',
      params: {
        id: service.id,
        title: service.name,
        type: service.type,
        image: service.image,
        rating: service.rating,
        reviews: service.reviews,
        distance: service.distance,
        price: service.price,
        address: service.address,
        phone: service.phone,
        category: service.category,
        isOpen: service.isOpen.toString(),
        waitTime: service.waitTime,
        description: service.description,
      },
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={config.color} />
        <Text style={styles.loadingText}>იტვირთება...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={config.gradient as any} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={22} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <View style={styles.headerIcon}>
                <Ionicons name={config.icon as any} size={24} color="#FFF" />
              </View>
              <Text style={styles.headerText}>{categoryName}</Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
                  <Ionicons name="search" size={20} color="#FFF" />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <BlurView intensity={30} tint="dark" style={styles.statsBlur}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{services.length}</Text>
                <Text style={styles.statLabel}>სერვისი</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{services.filter(s => s.isOpen).length}</Text>
                <Text style={styles.statLabel}>ღიაა</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {services.length > 0 ? (services.reduce((acc, s) => acc + parseFloat(s.rating), 0) / services.length).toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.statLabel}>რეიტინგი</Text>
              </View>
            </BlurView>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <BlurView intensity={filter === 'all' ? 50 : 30} tint="dark" style={styles.filterBlur}>
              <Ionicons name="apps" size={16} color={filter === 'all' ? '#FFF' : '#9CA3AF'} />
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>ყველა</Text>
            </BlurView>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'nearby' && styles.filterButtonActive]}
            onPress={() => setFilter('nearby')}
          >
            <BlurView intensity={filter === 'nearby' ? 50 : 30} tint="dark" style={styles.filterBlur}>
              <Ionicons name="location" size={16} color={filter === 'nearby' ? '#FFF' : '#9CA3AF'} />
              <Text style={[styles.filterText, filter === 'nearby' && styles.filterTextActive]}>ახლოს</Text>
            </BlurView>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'topRated' && styles.filterButtonActive]}
            onPress={() => setFilter('topRated')}
          >
            <BlurView intensity={filter === 'topRated' ? 50 : 30} tint="dark" style={styles.filterBlur}>
              <Ionicons name="star" size={16} color={filter === 'topRated' ? '#FFF' : '#9CA3AF'} />
              <Text style={[styles.filterText, filter === 'topRated' && styles.filterTextActive]}>რეიტინგით</Text>
            </BlurView>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Services Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.servicesGrid, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.color} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {services.map((service, index) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, { animationDelay: `${index * 50}ms` }]}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.9}
            >
              <BlurView intensity={40} tint="dark" style={styles.serviceCardBlur}>
                {/* Service Image */}
                <View style={styles.serviceImageContainer}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)'] as any}
                    style={styles.serviceImageGradient}
                  />
                  <View style={styles.serviceImagePlaceholder}>
                    <Ionicons name={config.icon as any} size={40} color="rgba(255,255,255,0.3)" />
                  </View>
                  
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: service.isOpen ? '#22C55E' : '#EF4444' }]}>
                    <Text style={styles.statusText}>{service.isOpen ? 'ღიაა' : 'დახურულია'}</Text>
                  </View>
                </View>

                {/* Service Info */}
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
                  
                  <View style={styles.serviceMetaRow}>
                    <View style={styles.serviceMeta}>
                      <Ionicons name="location" size={12} color="#9CA3AF" />
                      <Text style={styles.serviceMetaText} numberOfLines={1}>{service.location}</Text>
                    </View>
                    <View style={styles.serviceMeta}>
                      <Ionicons name="time" size={12} color="#9CA3AF" />
                      <Text style={styles.serviceMetaText}>{service.waitTime}</Text>
                    </View>
                  </View>

                  <View style={styles.serviceFooter}>
                    <View style={styles.ratingBox}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{service.rating}</Text>
                      <Text style={styles.reviewsText}>({service.reviews})</Text>
                    </View>
                    <Text style={styles.priceText}>{service.price}</Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#9CA3AF', fontFamily: 'FiraGO-Regular' },
  
  // Header
  header: { paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  backButtonBlur: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerText: { fontSize: 20, fontWeight: '700', color: '#FFF', fontFamily: 'FiraGO-Bold' },
  headerRight: { width: 44 },
  headerButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  
  // Stats
  statsContainer: { paddingHorizontal: 20, marginTop: 20 },
  statsBlur: { flexDirection: 'row', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#FFF', fontFamily: 'FiraGO-Bold' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'FiraGO-Regular' },
  statDivider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' },
  
  // Filters
  filtersContainer: { paddingVertical: 16, backgroundColor: '#111827' },
  filters: { paddingHorizontal: 20, gap: 10 },
  filterButton: { borderRadius: 16, overflow: 'hidden' },
  filterButtonActive: { borderWidth: 1, borderColor: 'rgba(59,130,246,0.5)' },
  filterBlur: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'FiraGO-Medium' },
  filterTextActive: { color: '#FFF', fontFamily: 'FiraGO-Bold' },
  
  // Services Grid
  scrollView: { flex: 1 },
  servicesGrid: { padding: 20, gap: 16 },
  serviceCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  serviceCardBlur: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  serviceImageContainer: { height: 160, position: 'relative', backgroundColor: '#1E293B' },
  serviceImageGradient: { ...StyleSheet.absoluteFillObject },
  serviceImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, color: '#FFF', fontFamily: 'FiraGO-Bold' },
  
  // Service Info
  serviceInfo: { padding: 16, gap: 10 },
  serviceName: { fontSize: 17, fontWeight: '700', color: '#E5E7EB', fontFamily: 'FiraGO-Bold' },
  serviceMetaRow: { flexDirection: 'row', gap: 12 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  serviceMetaText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'FiraGO-Regular', flex: 1 },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#E5E7EB', fontFamily: 'FiraGO-Bold' },
  reviewsText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'FiraGO-Regular' },
  priceText: { fontSize: 18, fontWeight: '800', color: '#60A5FA', fontFamily: 'FiraGO-Bold' },
});
