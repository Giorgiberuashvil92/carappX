import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { marteApi, AssistantLevel } from '@/services/marteApi';
import { useCars } from '@/contexts/CarContext';
import { useUser } from '@/contexts/UserContext';

const { width, height } = Dimensions.get('window');

const ASSISTANT_LEVELS = [
  {
    id: 'standard',
    title: 'STANDARD',
    icon: 'construct-outline',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    price: '20₾',
    time: '15-30 წუთი',
    description: 'ზოგადი პრობლემები',
    features: ['ძირითადი ხელსაწყოები', 'სწრაფი სერვისი', 'ზოგადი რეპარატი']
  },
  {
    id: 'premium',
    title: 'PREMIUM',
    icon: 'star-outline',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'],
    price: '30₾',
    time: '30-45 წუთი',
    description: 'რთული პრობლემები',
    features: ['სპეციალისტები', 'პროფესიონალური ხელსაწყოები', 'გამოცდილი ხელოსნები']
  },
  {
    id: 'elite',
    title: 'ELITE',
    icon: 'diamond-outline',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    price: '50₾',
    time: '45-60 წუთი',
    description: 'მაგისტრები',
    features: ['6 თვე გარანტია', 'VIP სერვისი', 'პრემიუმ მომსახურება']
  }
];


const PROBLEM_CATEGORIES = [
  {
    id: 'engine',
    title: 'ძრავი',
    icon: 'settings-outline',
    problems: ['ვერ იწყება', 'ჩამორჩება', 'ტრანსმისია']
  },
  {
    id: 'electrical',
    title: 'ელექტრო',
    icon: 'flash-outline',
    problems: ['ბატარეა', 'ფარები', 'გენერატორი']
  },
  {
    id: 'tires',
    title: 'ბორბლები',
    icon: 'disc-outline',
    problems: ['შეცვლა', 'პუნქტურა', 'ბალანსი']
  },
  {
    id: 'heating',
    title: 'გათბობა',
    icon: 'thermometer-outline',
    problems: ['რადიატორი', 'კონდიციონერი', 'გაჟონვა']
  }
];

export default function CaruServiceLandingScreen() {
  const router = useRouter();
  const { selectedCar } = useCars();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('home');

  // Set user ID for MARTE API
  useEffect(() => {
    if (user?.id) {
      marteApi.setUserId(user.id);
      loadOrderStats();
    }
  }, [user?.id]);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [assistantLevels, setAssistantLevels] = useState(ASSISTANT_LEVELS);
  const [loading, setLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    completed: 0,
    cancelled: 0
  });
  const [statsError, setStatsError] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    loadAssistantLevels();
    loadOrderStats();
  }, []);

  const loadAssistantLevels = async () => {
    try {
      setLoading(true);
      const levels = await marteApi.getAssistantLevels();
      // Map API response to our UI format
      const mappedLevels = levels.map(level => ({
        id: level.id,
        title: level.title,
        icon: level.id === 'standard' ? 'construct-outline' : 
              level.id === 'premium' ? 'star-outline' : 'diamond-outline',
        color: level.id === 'standard' ? '#10B981' : 
               level.id === 'premium' ? '#3B82F6' : '#F59E0B',
        gradient: level.id === 'standard' ? ['#10B981', '#059669'] : 
                  level.id === 'premium' ? ['#3B82F6', '#1D4ED8'] : ['#F59E0B', '#D97706'],
        price: `${level.price}₾`,
        time: level.id === 'standard' ? '15-30 წუთი' : 
              level.id === 'premium' ? '30-45 წუთი' : '45-60 წუთი',
        description: level.description,
        features: level.features
      }));
      setAssistantLevels(mappedLevels);
    } catch (error) {
      console.error('Error loading assistant levels:', error);
      // Keep default levels if API fails
    } finally {
      setLoading(false);
    }
  };

  const loadOrderStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(false);
      const orders = await marteApi.getUserOrders();
      const stats = {
        pending: orders.filter(order => ['pending', 'searching', 'assigned', 'in_progress'].includes(order.status)).length,
        completed: orders.filter(order => order.status === 'completed').length,
        cancelled: orders.filter(order => order.status === 'cancelled').length
      };
      setOrderStats(stats);
    } catch (error) {
      console.error('Error loading order stats:', error);
      setStatsError(true);
      // Keep default stats if API fails
    } finally {
      setStatsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAssistantLevels(),
      loadOrderStats()
    ]);
    setRefreshing(false);
  };

  const handleStartOrder = () => {
    router.push('/caru-order');
  };

  const handleViewOrders = () => {
    router.push('/caru-orders' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            titleColor="#FFFFFF"
            colors={['#6366F1']}
            progressBackgroundColor="#111827"
          />
        }
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <LinearGradient colors={['#111827', '#1F2937']} style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>MARTE</Text>
                <Text style={styles.headerSubtitle}>მართე</Text>
              </View>
              <TouchableOpacity style={styles.headerRight}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }}
              style={styles.heroCard}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(17,24,39,0.9)', 'rgba(31,41,55,0.8)', 'rgba(17,24,39,0.9)']}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroIcon}>
                    <Ionicons name="car-sport" size={40} color="#FFFFFF" />
                  </View>
                  <Text style={styles.heroTitle}>MARTE • მართე</Text>
                  <Text style={styles.heroSubtitle}>პერსონალური ავტოასისტენტი</Text>
                  
                  <View style={styles.heroFeatures}>
                    <View style={styles.heroFeature}>
                      <View style={styles.heroFeatureIcon}>
                        <Ionicons name="time" size={16} color="#22C55E" />
                      </View>
                      <Text style={styles.heroFeatureText}>30 წუთი</Text>
                    </View>
                    <View style={styles.heroFeature}>
                      <View style={styles.heroFeatureIcon}>
                        <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                      </View>
                      <Text style={styles.heroFeatureText}>დაზღვეული</Text>
                    </View>
                    <View style={styles.heroFeature}>
                      <View style={styles.heroFeatureIcon}>
                        <Ionicons name="star" size={16} color="#22C55E" />
                      </View>
                      <Text style={styles.heroFeatureText}>პრემიუმი</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {[
                { id: 'home', title: 'მთავარი', icon: 'home-outline' },
                { id: 'assistants', title: 'ავტოასისტენტები', icon: 'people-outline' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.id && styles.tabActive
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <View style={styles.tabContent}>
                    <Ionicons 
                      name={tab.icon as any} 
                      size={20} 
                      color={activeTab === tab.id ? "#FFFFFF" : "#9CA3AF"} 
                    />
                    <Text style={[
                      styles.tabText,
                      { color: activeTab === tab.id ? "#FFFFFF" : "#9CA3AF" }
                    ]}>
                      {tab.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          {activeTab === 'home' && (
            <View style={styles.tabContentContainer}>
              {/* Orders Stats Section */}
              <View style={styles.ordersSection}>
                <Text style={styles.sectionTitle}>ჩემი შეკვეთები</Text>
                <View style={styles.ordersStats}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {statsLoading ? '...' : statsError ? '?' : orderStats.pending}
                    </Text>
                    <Text style={styles.statLabel}>მიმდინარე</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {statsLoading ? '...' : statsError ? '?' : orderStats.completed}
                    </Text>
                    <Text style={styles.statLabel}>დასრულებული</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {statsLoading ? '...' : statsError ? '?' : orderStats.cancelled}
                    </Text>
                    <Text style={styles.statLabel}>გაუქმებული</Text>
                  </View>
                </View>
                {statsError && (
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadOrderStats}
                  >
                    <Ionicons name="refresh" size={16} color="#6366F1" />
                    <Text style={styles.retryButtonText}>ხელახლა ცდა</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {activeTab === 'assistants' && (
            <View style={styles.tabContentContainer}>
              {/* Assistant Levels Section */}
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>ავტოასისტენტის დონეები</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {assistantLevels.map((level) => (
                    <View key={level.id} style={styles.assistantCard}>
                      <LinearGradient
                        colors={level.gradient as any}
                        style={styles.assistantCardGradient}
                      >
                        <View style={styles.assistantHeader}>
                          <View style={styles.assistantIcon}>
                            <Ionicons name={level.icon as any} size={24} color="#FFFFFF" />
                          </View>
                          <Text style={styles.assistantTitle}>{level.title}</Text>
                        </View>
                        <Text style={styles.assistantDescription}>{level.description}</Text>
                        <View style={styles.assistantFeatures}>
                          {level.features.map((feature, index) => (
                            <Text key={index} style={styles.assistantFeature}>• {feature}</Text>
                          ))}
                        </View>
                        <View style={styles.assistantMeta}>
                          <Text style={styles.assistantPrice}>{level.price}</Text>
                          <Text style={styles.assistantTime}>{level.time}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleStartOrder}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="car-sport" size={24} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>შეკვეთის დაწყება</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewOrders}
            >
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.2)', 'rgba(79, 70, 229, 0.2)']}
                style={styles.secondaryButtonGradient}
              >
                <Ionicons name="list-outline" size={20} color="#6366F1" />
                <Text style={styles.secondaryButtonText}>ჩემი შეკვეთები</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  heroCard: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  heroFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFeatureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsContent: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  tabContentContainer: {
    paddingHorizontal: 20,
  },

  // Orders Section
  ordersSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    fontFamily: 'Inter',
  },

  // Services Section
  servicesSection: {
    marginBottom: 32,
  },
  
  // Horizontal Scroll
  horizontalScroll: {
    marginHorizontal: -20,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  
  // Assistant Cards
  assistantCard: {
    width: 240,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  assistantCardGradient: {
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  assistantTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  assistantDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  assistantFeatures: {
    marginBottom: 12,
  },
  assistantFeature: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  assistantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assistantPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  assistantTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
  },
  
  // Orders Stats
  ordersStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
    textAlign: 'center',
  },

  // Assistant Levels
  levelsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  levelCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  levelCardGradient: {
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  levelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  levelDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  levelMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  levelTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
  },

  // Problem Categories
  problemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  problemCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  problemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  problemList: {
    gap: 4,
  },
  problemItem: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
  },

  // Action Section
  actionSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  secondaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    fontFamily: 'Inter',
  },
  
  // Retry Button
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    fontFamily: 'Inter',
  },
});
