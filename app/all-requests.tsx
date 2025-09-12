import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Request = {
  id: string;
  partName: string;
  partDetails?: string;
  vehicle: {
    make: string;
    model: string;
    year: string;
    vin?: string;
  };
  status: 'აქტიური' | 'დასრულებული';
  createdAt: string;
  offers?: number;
};

const API_URL = 'http://localhost:4000';

export default function AllRequestsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  const fetchRequests = async () => {
    try {
      console.log('[API] GET /requests');
      const response = await fetch(`${API_URL}/requests`);
      if (response.ok) {
        const data = await response.json();
        console.log('[API] requests received:', data.length);
        console.log('[API] sample request:', data[0]);
        
        // Transform backend data to match our format
        const transformedRequests: Request[] = data.map((req: any) => ({
          id: String(req.id),
          partName: req.partName || 'ნაწილის მოძიება',
          partDetails: req.partDetails,
          vehicle: {
            make: req.vehicle?.make || '',
            model: req.vehicle?.model || '',
            year: req.vehicle?.year || '',
            vin: req.vehicle?.vin,
          },
          status: req.status === 'closed' ? 'დასრულებული' : 'აქტიური',
          createdAt: new Date(req.createdAt).toISOString(),
          offers: req.offersCount || 0,
        }));
        
        console.log('[API] transformed requests:', transformedRequests.map(r => ({ id: r.id, offers: r.offers })));
        setRequests(transformedRequests);
      } else {
        console.log('[API] GET /requests failed:', response.status);
        // Fallback to mock data if API fails
        setRequests(getMockRequests());
      }
    } catch (error) {
      console.log('[API] GET /requests error:', error);
      // Fallback to mock data if API fails
      setRequests(getMockRequests());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMockRequests = (): Request[] => [
    {
      id: '1',
      partName: 'ზეთის ფილტრი',
      vehicle: { make: 'BMW', model: '320i', year: '2018' },
      status: 'აქტიური',
      createdAt: '2024-01-15T10:30:00Z',
      offers: 3
    },
    {
      id: '2', 
      partName: 'ბრეკის ხუნდები',
      vehicle: { make: 'Mercedes', model: 'C200', year: '2020' },
      status: 'აქტიური',
      createdAt: '2024-01-15T10:18:00Z',
      offers: 2
    },
    {
      id: '3',
      partName: 'ფარები',
      vehicle: { make: 'Toyota', model: 'Camry', year: '2019' },
      status: 'აქტიური', 
      createdAt: '2024-01-15T10:05:00Z',
      offers: 4
    },
    {
      id: '4',
      partName: 'ძრავის ზეთი',
      vehicle: { make: 'Audi', model: 'A4', year: '2021' },
      status: 'აქტიური',
      createdAt: '2024-01-15T09:30:00Z',
      offers: 1
    },
    {
      id: '5',
      partName: 'ჰაერის ფილტრი',
      vehicle: { make: 'Volkswagen', model: 'Golf', year: '2017' },
      status: 'დასრულებული',
      createdAt: '2024-01-13T14:20:00Z',
      offers: 5
    },
    {
      id: '6',
      partName: 'სანთურები',
      vehicle: { make: 'Honda', model: 'Civic', year: '2016' },
      status: 'დასრულებული',
      createdAt: '2024-01-12T11:45:00Z',
      offers: 3
    }
  ];

  useEffect(() => {
    fetchRequests();
    // Animate in
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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    console.log('[UI] Refreshing requests...');
    fetchRequests();
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'ახლა';
    if (diffInMinutes < 60) return `${diffInMinutes} წთ წინ`;
    if (diffInHours < 24) return `${diffInHours} სთ წინ`;
    if (diffInDays < 7) return `${diffInDays} დღე წინ`;
    return `${Math.floor(diffInDays / 7)} კვირა წინ`;
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'active') return req.status === 'აქტიური';
    if (filter === 'completed') return req.status === 'დასრულებული';
    return true;
  });

  const openOffersForRequest = (requestId: string) => {
    router.push(`/ai-chat?requestId=${requestId}&resumeOffers=1`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <FontAwesome name="chevron-left" size={16} color="#111827" />
            </Pressable>
            <Text style={styles.headerTitle}>ყველა მოთხოვნა</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.loadingText}>მოთხოვნები იტვირთება...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={16} color="#111827" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>ყველა მოთხოვნა</Text>
            <Text style={styles.headerSubtitle}>{requests.length} მოთხოვნა</Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>{requests.length}</Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#111827']}
              tintColor="#111827"
            />
          }
        >
          {/* Modern Filter tabs */}
          <View style={styles.filterContainer}>
            {[
              { key: 'all', label: 'ყველა', count: requests.length, icon: 'list' },
              { key: 'active', label: 'აქტიური', count: requests.filter(r => r.status === 'აქტიური').length, icon: 'clock-o' },
              { key: 'completed', label: 'დასრულებული', count: requests.filter(r => r.status === 'დასრულებული').length, icon: 'check-circle' }
            ].map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
                onPress={() => setFilter(tab.key as any)}
              >
                <FontAwesome 
                  name={tab.icon as any} 
                  size={14} 
                  color={filter === tab.key ? '#FFFFFF' : '#111827'} 
                />
                <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.filterBadge, filter === tab.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === tab.key && styles.filterBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Requests list */}
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <FontAwesome name="inbox" size={48} color="#111827" />
              </View>
              <Text style={styles.emptyTitle}>მოთხოვნები არ არის</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' ? 'ჯერ არ გაქვთ მოთხოვნები' : 
                 filter === 'active' ? 'აქტიური მოთხოვნები არ არის' : 
                 'დასრულებული მოთხოვნები არ არის'}
              </Text>
            </View>
          ) : (
            <View style={styles.requestsContainer}>
              {filteredRequests.map((r, index) => (
                <Animated.View 
                  key={r.id} 
                  style={[
                    styles.requestCard,
                    {
                      transform: [{ scale: selectedCard === r.id ? 1.02 : 1 }],
                      shadowOpacity: selectedCard === r.id ? 0.15 : 0.08,
                    }
                  ]}
                  onTouchStart={() => setSelectedCard(r.id)}
                  onTouchEnd={() => setSelectedCard(null)}
                >
                  <View style={styles.cardContent}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.requestIconContainer}>
                        <View style={[
                          styles.requestIcon,
                          r.status === 'აქტიური' ? styles.requestIconActive : styles.requestIconCompleted
                        ]}>
                          <FontAwesome name="search" size={16} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestTitle}>{r.partName}</Text>
                        <Text style={styles.requestMeta}>
                          {r.vehicle.make} {r.vehicle.model} • {r.vehicle.year}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        r.status === 'აქტიური' ? styles.statusBadgeActive : styles.statusBadgeCompleted
                      ]}>
                        <FontAwesome 
                          name={r.status === 'აქტიური' ? 'clock-o' : 'check-circle'} 
                          size={10} 
                          color={r.status === 'აქტიური' ? '#111827' : '#717171'} 
                        />
                        <Text style={[
                          styles.statusText,
                          r.status === 'აქტიური' ? styles.statusTextActive : styles.statusTextCompleted
                        ]}>
                          {r.status}
                        </Text>
                      </View>
                    </View>

                    {/* Card Stats */}
                    <View style={styles.cardStats}>
                      <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                          <FontAwesome name="tag" size={12} color="#111827" />
                        </View>
                        <Text style={styles.statText}>{r.offers || 0} შეთავაზება</Text>
                      </View>
                      <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                          <FontAwesome name="clock-o" size={12} color="#111827" />
                        </View>
                        <Text style={styles.statText}>{formatTimeAgo(r.createdAt)}</Text>
                      </View>
                    </View>

                    {/* Card Actions */}
                    {r.status === 'აქტიური' && (
                      <Pressable 
                        onPress={() => openOffersForRequest(r.id)} 
                        style={styles.viewOffersBtn}
                      >
                        <Text style={styles.viewOffersText}>შეთავაზებები</Text>
                        <FontAwesome name="chevron-right" size={12} color="#FFFFFF" />
                      </Pressable>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#717171',
  },
  headerStats: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerStatsText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  content: { padding: 20, paddingBottom: 32 },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  filterTabActive: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 10,
    color: '#717171',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E8E8E8',
  },
  filterBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  filterBadgeText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 11,
    color: '#717171',
  },
  filterBadgeTextActive: {
    color: '#111827',
  },
  requestsContainer: { gap: 16 },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  requestIconContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestIconActive: {
    backgroundColor: '#111827',
  },
  requestIconCompleted: {
    backgroundColor: '#717171',
  },
  requestInfo: { flex: 1 },
  requestTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 15,
    color: '#111827',
    marginBottom: 4,
  },
  requestMeta: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#717171',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  statusBadgeActive: {
    backgroundColor: '#F0F0F0',
  },
  statusBadgeCompleted: {
    backgroundColor: '#F0F0F0',
  },
  statusText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 10,
  },
  statusTextActive: {
    color: '#111827',
  },
  statusTextCompleted: {
    color: '#717171',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
    color: '#111827',
  },
  viewOffersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  viewOffersText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#717171',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 20,
  },
});
