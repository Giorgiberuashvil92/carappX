import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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
      
      const response = await fetch(`${API_BASE_URL}/services/popular?limit=50`);
      
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
        generateMockServices();
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      generateMockServices();
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const generateMockServices = () => {
    const types = ['carwash', 'mechanic', 'store', 'parking'];
    const locations = ['ვაკე', 'საბურთალო', 'დიღომი', 'ისანი', 'გლდანი'];
    
    const mockServices = Array.from({ length: 20 }, (_, i) => ({
      id: `service-${i + 1}`,
      name: `სერვისი ${i + 1}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      price: `${Math.floor(Math.random() * 50) + 15}₾`,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
      category: 'სერვისი',
      address: 'თბილისი',
      phone: '+995 555 123 456',
      isOpen: Math.random() > 0.3,
      reviews: Math.floor(Math.random() * 100) + 10,
      type: types[Math.floor(Math.random() * types.length)],
      description: 'პრემიუმ ხარისხის მომსახურება',
      distance: `${(Math.random() * 5 + 0.5).toFixed(1)} კმ`,
      waitTime: `${Math.floor(Math.random() * 30) + 5} წთ`,
    }));
    
    setServices(mockServices);
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
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={22} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            
            <Text style={styles.headerText}>ყველა სერვისი</Text>
            
            <TouchableOpacity style={styles.headerButton}>
              <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
                <Ionicons name="search" size={20} color="#FFF" />
              </BlurView>
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
              <BlurView intensity={filter === item.key ? 50 : 30} tint="dark" style={styles.filterBlur}>
                <Ionicons name={item.icon as any} size={16} color={filter === item.key ? '#FFF' : '#9CA3AF'} />
                <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
              </BlurView>
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
              <BlurView intensity={40} tint="dark" style={styles.serviceCardBlur}>
                <View style={styles.serviceContent}>
                  {/* Icon */}
                  <View style={styles.serviceIconBox}>
                    <Ionicons 
                      name={service.type === 'carwash' ? 'water' : service.type === 'mechanic' ? 'construct' : 'storefront'} 
                      size={24} 
                      color="#60A5FA" 
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
                        <Ionicons name="location" size={12} color="#9CA3AF" />
                        <Text style={styles.metaText}>{service.location}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={12} color="#9CA3AF" />
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
              </BlurView>
            </TouchableOpacity>
          ))
          )}
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
  headerText: { fontSize: 20, fontWeight: '700', color: '#FFF', fontFamily: 'FiraGO-Bold' },
  headerButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  
  // Filters
  filtersContainer: { paddingVertical: 16, backgroundColor: '#111827' },
  filters: { paddingHorizontal: 20, gap: 10 },
  filterButton: { borderRadius: 16, overflow: 'hidden' },
  filterButtonActive: { borderWidth: 1, borderColor: 'rgba(59,130,246,0.5)' },
  filterBlur: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'FiraGO-Medium' },
  filterTextActive: { color: '#FFF', fontFamily: 'FiraGO-Bold' },
  
  // Services
  scrollView: { flex: 1 },
  servicesList: { padding: 20, gap: 12 },
  serviceCard: { borderRadius: 16, overflow: 'hidden' },
  serviceCardBlur: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  serviceContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  serviceIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  serviceInfo: { flex: 1, gap: 6 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceName: { fontSize: 16, fontWeight: '700', color: '#E5E7EB', fontFamily: 'FiraGO-Bold', flex: 1 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  openText: { fontSize: 10, color: '#22C55E', fontFamily: 'FiraGO-Bold' },
  serviceMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'FiraGO-Regular' },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#E5E7EB', fontFamily: 'FiraGO-Bold' },
  reviewsText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'FiraGO-Regular' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#60A5FA', fontFamily: 'FiraGO-Bold' },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#E5E7EB', fontFamily: 'FiraGO-Bold' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', fontFamily: 'FiraGO-Regular' },
});
