import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import API_BASE_URL from '../config/api';

const { width } = Dimensions.get('window');

export default function AllServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'carwash' | 'mechanic' | 'store'>('all');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAllServices();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [filter]);

  const fetchAllServices = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Fetch only popular services (same as slider)
      const response = await fetch(`${API_BASE_URL}/services/popular?limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Backend returns array directly
        const formattedServices = (Array.isArray(data) ? data : []).map((service: any) => ({
          id: service.id || service._id,
          name: service.title || service.name,
          location: service.location || 'თბილისი',
          rating: service.rating || 4.5,
          price: typeof service.price === 'string' ? service.price : `${service.price || 25}₾`,
          image: service.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
          category: service.category || service.type,
          address: service.location || 'თბილისი',
          phone: service.phone || 'N/A',
          isOpen: service.isOpen !== undefined ? service.isOpen : true,
          reviews: service.reviews || 0,
          type: service.type,
          description: service.description || '',
          distance: `${(Math.random() * 5 + 0.5).toFixed(1)} კმ`,
          waitTime: `${Math.floor(Math.random() * 30) + 5} წთ`,
        }));
        
        setServices(formattedServices);
      } else {
        console.error('Failed to fetch services');
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    fetchAllServices(true);
  };

  const handleServicePress = (service: any) => {
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

  const filteredServices = filter === 'all' ? services : services.filter(s => s.type === filter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>იტვირთება...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <View style={styles.backButtonView}>
                <Ionicons name="arrow-back" size={22} color="#111827" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.headerText}>პოპულარული სერვისები</Text>
            
            <TouchableOpacity style={styles.headerButton}>
              <View style={styles.backButtonView}>
                <Ionicons name="search" size={20} color="#111827" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {[
            { key: 'all', label: 'ყველა', icon: 'apps' },
            { key: 'carwash', label: 'სამრეცხაო', icon: 'water' },
            { key: 'mechanic', label: 'სერვისი', icon: 'construct' },
            { key: 'store', label: 'მაღაზია', icon: 'storefront' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}
              onPress={() => setFilter(item.key as any)}
            >
              <View style={styles.filterView}>
                <Ionicons name={item.icon as any} size={16} color={filter === item.key ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Services List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.servicesList, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {filteredServices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color="#9CA3AF" />
              <Text style={styles.emptyText}>სერვისები არ მოიძებნა</Text>
              <Text style={styles.emptySubtext}>სცადეთ სხვა ფილტრი</Text>
            </View>
          ) : (
            filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.9}
            >
              <View style={styles.serviceCardView}>
                <View style={styles.serviceContent}>
                  {/* Icon */}
                  <View style={styles.serviceIconBox}>
                    <Ionicons 
                      name={service.type === 'carwash' ? 'water' : service.type === 'mechanic' ? 'construct' : 'storefront'} 
                      size={24} 
                      color="#3B82F6" 
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.serviceInfo}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
                      {service.isOpen && (
                        <View style={styles.openBadge}>
                          <View style={styles.openDot} />
                          <Text style={styles.openText}>ღიაა</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.serviceMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location" size={12} color="#6B7280" />
                        <Text style={styles.metaText}>{service.location}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={12} color="#6B7280" />
                        <Text style={styles.metaText}>{service.waitTime}</Text>
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

                  {/* Arrow */}
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </View>
            </TouchableOpacity>
          ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280', fontFamily: 'FiraGO-Regular' },
  
  // Header
  header: { 
    paddingBottom: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22 },
  backButtonView: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 22,
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: { fontSize: 20, fontWeight: '700', color: '#111827', fontFamily: 'FiraGO-Bold' },
  headerButton: { width: 44, height: 44, borderRadius: 22 },
  
  // Filters
  filtersContainer: { paddingVertical: 16, backgroundColor: '#F8FAFC' },
  filters: { paddingHorizontal: 20, gap: 10 },
  filterButton: { 
    borderRadius: 16, 
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  filterButtonActive: { 
    backgroundColor: '#EEF2FF', 
    borderWidth: 2, 
    borderColor: '#3B82F6',
    shadowOpacity: 0.15,
  },
  filterView: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 16, 
    paddingVertical: 10,
  },
  filterText: { fontSize: 14, color: '#6B7280', fontFamily: 'FiraGO-Medium' },
  filterTextActive: { color: '#3B82F6', fontFamily: 'FiraGO-Bold' },
  
  // Services
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  servicesList: { padding: 20, gap: 12 },
  serviceCard: { 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceCardView: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16,
    borderWidth: 1, 
    borderColor: '#E5E7EB',
  },
  serviceContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  serviceIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: '#EEF2FF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#DBEAFE',
  },
  serviceInfo: { flex: 1, gap: 6 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceName: { fontSize: 16, fontWeight: '700', color: '#111827', fontFamily: 'FiraGO-Bold', flex: 1 },
  openBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#DCFCE7', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#BBF7D0',
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  openText: { fontSize: 10, color: '#059669', fontFamily: 'FiraGO-Bold' },
  serviceMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280', fontFamily: 'FiraGO-Regular' },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#111827', fontFamily: 'FiraGO-Bold' },
  reviewsText: { fontSize: 12, color: '#6B7280', fontFamily: 'FiraGO-Regular' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#3B82F6', fontFamily: 'FiraGO-Bold' },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#111827', fontFamily: 'FiraGO-Bold' },
  emptySubtext: { fontSize: 14, color: '#6B7280', fontFamily: 'FiraGO-Regular' },
});
