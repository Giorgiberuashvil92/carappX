import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { marteApi, MarteOrder } from '@/services/marteApi';
import { useUser } from '@/contexts/UserContext';

const { width } = Dimensions.get('window');

// Mock data for orders (fallback only)
const MOCK_ORDERS: MarteOrder[] = [];

const ORDER_TABS = [
  { id: 'pending', title: 'მიმდინარე', icon: 'time-outline' },
  { id: 'searching', title: 'ელოდება', icon: 'search-outline' },
  { id: 'assigned', title: 'მიება', icon: 'person-outline' },
  { id: 'completed', title: 'დასრულებული', icon: 'checkmark-circle-outline' },
  { id: 'cancelled', title: 'გაუქმებული', icon: 'close-circle-outline' },
];

export default function CaruOrdersScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('searching');

  // Set user ID for MARTE API
  useEffect(() => {
    if (user?.id) {
      marteApi.setUserId(user.id);
    }
  }, [user]);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [selectedOrder, setSelectedOrder] = useState<MarteOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAnim] = useState(new Animated.Value(0));
  const [modalAnim] = useState(new Animated.Value(0));
  const [assistantFound, setAssistantFound] = useState(false);
  const [orders, setOrders] = useState<MarteOrder[]>([]);
  const [loading, setLoading] = useState(true);

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

    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) {
      setOrders(MOCK_ORDERS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userOrders = await marteApi.getUserOrders();
      setOrders(userOrders);
      
      // Show searching animation for searching orders (ready for manual assignment)
      const hasSearchingOrders = userOrders.some(order => order.status === 'searching');
      if (hasSearchingOrders) {
        setIsSearching(true);
        startSearchingAnimation();
      } else {
        setIsSearching(false);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      console.error('❌ Error details:', error.message);
      // Fallback to mock data if API fails
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  const startSearchingAnimation = () => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(searchAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(searchAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    // Stop searching after 8 seconds (simulate finding assistant)
    setTimeout(() => {
      setIsSearching(false);
      animation.stop();
    }, 8000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getFilteredOrders = () => {
    return orders.filter(order => order.status === activeTab);
  };

  const getOrderCounts = () => {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      searching: orders.filter(o => o.status === 'searching').length,
      assigned: orders.filter(o => o.status === 'assigned' || o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'searching': return '#8B5CF6';
      case 'assigned': return '#3B82F6';
      case 'in_progress': return '#06B6D4';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'მიმდინარე';
      case 'searching': return 'ეძებს ასისტენტს';
      case 'assigned': return 'მიება';
      case 'in_progress': return 'მუშაობს';
      case 'completed': return 'დასრულებული';
      case 'cancelled': return 'გაუქმებული';
      default: return status;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'STANDARD': return '#10B981';
      case 'PREMIUM': return '#3B82F6';
      case 'ELITE': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderOrderCard = (order: MarteOrder) => (
    <TouchableOpacity 
      key={order._id} 
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
        setAssistantFound(true);
        
        // Modal entrance animation
        Animated.timing(modalAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.orderCardGradient}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCar}>{order.carInfo.make} {order.carInfo.model} • {order.carInfo.plate}</Text>
            <Text style={styles.orderLocation}>{order.contactInfo.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="build-outline" size={16} color="#6366F1" />
              <Text style={styles.detailText}>{order.problemDescription}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(order.assistantLevel.id) }]}>
              <Text style={styles.levelText}>{order.assistantLevel.title}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#6366F1" />
              <Text style={styles.detailText}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#6366F1" />
              <Text style={styles.detailText}>{new Date(order.createdAt).toLocaleTimeString()}</Text>
            </View>
          </View>

          {order.assignedAssistant && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={16} color="#6366F1" />
                <Text style={styles.detailText}>{order.assignedAssistant.name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Price and Actions */}
        <View style={styles.orderFooter}>
          <Text style={styles.orderPrice}>{order.assistantLevel.price}₾</Text>
          <View style={styles.orderActions}>
            {order.status === 'pending' && (
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="close-outline" size={16} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>გაუქმება</Text>
              </TouchableOpacity>
            )}
            {order.status === 'assigned' && (
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="call-outline" size={16} color="#10B981" />
                <Text style={[styles.actionText, { color: '#10B981' }]}>დარეკვა</Text>
              </TouchableOpacity>
            )}
            {order.status === 'completed' && (
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="star-outline" size={16} color="#F59E0B" />
                <Text style={[styles.actionText, { color: '#F59E0B' }]}>შეფასება</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const filteredOrders = getFilteredOrders();

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
                <Text style={styles.headerTitle}>ჩემი შეკვეთები</Text>
                <Text style={styles.headerSubtitle}>MARTE</Text>
              </View>
              <TouchableOpacity style={styles.headerRight} onPress={() => router.push('/caru-order')}>
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Searching Animation */}
          {isSearching && (
            <Animated.View 
              style={[
                styles.searchingContainer,
                {
                  opacity: searchAnim,
                  transform: [{
                    translateY: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 10],
                    }),
                  }],
                },
              ]}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.searchingGradient}
              >
                <View style={styles.searchingContent}>
                  <Ionicons name="search" size={24} color="#FFFFFF" />
                    <Text style={styles.searchingText}>ელოდება ავტოასისტენტის მიებას...</Text>
                  <View style={styles.searchingDots}>
                    <Animated.View 
                      style={[
                        styles.searchingDot,
                        {
                          opacity: searchAnim,
                          transform: [{
                            scale: searchAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            }),
                          }],
                        },
                      ]}
                    />
                    <Animated.View 
                      style={[
                        styles.searchingDot,
                        {
                          opacity: searchAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.3, 1, 0.3],
                          }),
                          transform: [{
                            scale: searchAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.8, 1.2, 0.8],
                            }),
                          }],
                        },
                      ]}
                    />
                    <Animated.View 
                      style={[
                        styles.searchingDot,
                        {
                          opacity: searchAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1],
                          }),
                          transform: [{
                            scale: searchAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            }),
                          }],
                        },
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {ORDER_TABS.map((tab) => (
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
                    <View style={[
                      styles.tabBadge,
                      { backgroundColor: activeTab === tab.id ? "#FFFFFF" : "#6B7280" }
                    ]}>
                      <Text style={[
                        styles.tabBadgeText,
                        { color: activeTab === tab.id ? "#111827" : "#FFFFFF" }
                      ]}>
                        {getOrderCounts()[tab.id as keyof ReturnType<typeof getOrderCounts>]}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Orders List */}
          <View style={styles.ordersContainer}>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(renderOrderCard)
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="list-outline" size={48} color="#6B7280" />
                </View>
                <Text style={styles.emptyTitle}>
                  {loading ? 'იტვირთება...' : 
                   activeTab === 'pending' && 'მიმდინარე შეკვეთები არ არის'}
                  {activeTab === 'assigned' && 'მიება შეკვეთები არ არის'}
                  {activeTab === 'completed' && 'დასრულებული შეკვეთები არ არის'}
                  {activeTab === 'cancelled' && 'გაუქმებული შეკვეთები არ არის'}
                </Text>
                <Text style={styles.emptyDescription}>
                  {loading ? 'მოცდით...' :
                   activeTab === 'pending' && 'ჯერ არ გაქვთ ახალი შეკვეთები'}
                  {activeTab === 'assigned' && 'ჯერ არ გაქვთ მიება შეკვეთები'}
                  {activeTab === 'completed' && 'ჯერ არ გაქვთ დასრულებული შეკვეთები'}
                  {activeTab === 'cancelled' && 'ჯერ არ გაქვთ გაუქმებული შეკვეთები'}
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/caru-order')}
                >
                  <Text style={styles.emptyButtonText}>ახალი შეკვეთა</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Order Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          Animated.timing(modalAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowDetailsModal(false);
            setAssistantFound(false);
          });
        }}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <LinearGradient
            colors={['#111827', '#1F2937']}
            style={styles.modalGradient}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>შეკვეთის დეტალები</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  Animated.timing(modalAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    setShowDetailsModal(false);
                    setAssistantFound(false);
                  });
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Car Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>მანქანა</Text>
                  <View style={styles.modalInfoCard}>
                    <Ionicons name="car-outline" size={24} color="#6366F1" />
                    <Text style={styles.modalInfoText}>{selectedOrder.carInfo.make} {selectedOrder.carInfo.model} • {selectedOrder.carInfo.plate}</Text>
                  </View>
                </View>

                {/* Service Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>სერვისი</Text>
                  <View style={styles.modalInfoCard}>
                    <Ionicons name="build-outline" size={24} color="#6366F1" />
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoText}>{selectedOrder.problemDescription}</Text>
                      <View style={[styles.levelBadge, { backgroundColor: getLevelColor(selectedOrder.assistantLevel.id) }]}>
                        <Text style={styles.levelText}>{selectedOrder.assistantLevel.title}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Time & Location */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>დრო და ადგილი</Text>
                  <View style={styles.modalInfoCard}>
                    <Ionicons name="calendar-outline" size={24} color="#6366F1" />
                    <Text style={styles.modalInfoText}>{new Date(selectedOrder.createdAt).toLocaleDateString()} - {new Date(selectedOrder.createdAt).toLocaleTimeString()}</Text>
                  </View>
                  <View style={styles.modalInfoCard}>
                    <Ionicons name="location-outline" size={24} color="#6366F1" />
                    <Text style={styles.modalInfoText}>{selectedOrder.contactInfo.location}</Text>
                  </View>
                </View>

                {/* Assistant */}
                {selectedOrder.assignedAssistant && (
                  <Animated.View 
                    style={[
                      styles.modalSection,
                      {
                        opacity: assistantFound ? modalAnim : 0,
                        transform: [{
                          scale: assistantFound ? modalAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }) : 0.8,
                        }],
                      },
                    ]}
                  >
                    <View style={styles.assistantFoundContainer}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.assistantFoundGradient}
                      >
                        <View style={styles.assistantFoundContent}>
                          <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
                          <Text style={styles.assistantFoundText}>ავტოასისტენტი ნაპოვნია!</Text>
                        </View>
                      </LinearGradient>
                    </View>
                    <Text style={styles.modalSectionTitle}>ავტოასისტენტი</Text>
                    <View style={styles.modalInfoCard}>
                      <Ionicons name="person-outline" size={24} color="#6366F1" />
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoText}>{selectedOrder.assignedAssistant.name}</Text>
                        <Text style={styles.modalInfoText}>ტელ: {selectedOrder.assignedAssistant.phone}</Text>
                        <Text style={styles.modalInfoText}>რეიტინგი: {selectedOrder.assignedAssistant.rating}/5</Text>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* Status */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>სტატუსი</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(selectedOrder.status)}</Text>
                  </View>
                </View>

                {/* Estimated Time */}
                {selectedOrder.estimatedTime && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>დაგეგმილი დრო</Text>
                    <View style={styles.modalInfoCard}>
                      <Ionicons name="time-outline" size={24} color="#6366F1" />
                      <Text style={styles.modalInfoText}>{selectedOrder.estimatedTime}</Text>
                    </View>
                  </View>
                )}

                {/* Price */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>ფასი</Text>
                  <Text style={styles.modalPrice}>{selectedOrder.assistantLevel.price}₾</Text>
                </View>
              </ScrollView>
            )}
          </LinearGradient>
        </SafeAreaView>
      </Modal>
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
    marginTop: 10,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Outfit',
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

  // Tabs
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsContent: {
    gap: 12,
    marginTop: 15,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    fontFamily: 'Outfit',
  },
  tabBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },

  // Orders
  ordersContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16,
  },
  orderCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  orderCardGradient: {
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderCar: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  orderLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Outfit',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  orderDetails: {
    marginBottom: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Outfit',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Outfit',
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },

  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSection: {
    marginTop: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  modalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalInfoContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    fontFamily: 'Outfit',
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
    fontFamily: 'Outfit',
  },

  // Searching Animation Styles
  searchingContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchingGradient: {
    padding: 16,
  },
  searchingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
    fontFamily: 'Outfit',
  },
  searchingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 4,
  },
  searchingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  // Assistant Found Animation Styles
  assistantFoundContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  assistantFoundGradient: {
    padding: 16,
  },
  assistantFoundContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    fontFamily: 'Outfit',
  },
});
