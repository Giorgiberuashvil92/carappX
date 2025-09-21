import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import API_BASE_URL from '../../config/api';
import { CarwashLocation } from '@/services/carwashLocationApi';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const { carwashId } = useLocalSearchParams();
  const [carwash, setCarwash] = useState<CarwashLocation | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (carwashId) {
      loadData();
    }
  }, [carwashId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load carwash info
      const carwashResponse = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}`);
      const carwashData = await carwashResponse.json();
      setCarwash(carwashData);

      // Load bookings
      const bookingsResponse = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}/bookings`);
      const bookings = await bookingsResponse.json();

      // Calculate analytics
      const analytics = calculateAnalytics(bookings);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('შეცდომა', 'ანალიტიკის ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateAnalytics = (bookings: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's stats
    const todayBookings = bookings.filter(b => new Date(b.createdAt) >= today);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // This week's stats
    const weekBookings = bookings.filter(b => new Date(b.createdAt) >= thisWeek);
    const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // This month's stats
    const monthBookings = bookings.filter(b => new Date(b.createdAt) >= thisMonth);
    const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Status breakdown
    const statusCounts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      today: {
        bookings: todayBookings.length,
        revenue: todayRevenue,
      },
      week: {
        bookings: weekBookings.length,
        revenue: weekRevenue,
      },
      month: {
        bookings: monthBookings.length,
        revenue: monthRevenue,
      },
      statusCounts,
      totalBookings: bookings.length,
      averageBookingValue: bookings.length > 0 ? bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0) / bookings.length : 0,
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>იტვირთება...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ანალიტიკა</Text>
          {carwash && <Text style={styles.headerSubtitle}>{carwash.name}</Text>}
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {analyticsData && (
          <>
            {/* Overview Cards */}
            <View style={styles.overviewSection}>
              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.overviewGradient}
                >
                  <View style={styles.overviewContent}>
                    <View style={styles.overviewIcon}>
                      <Ionicons name="trending-up" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.overviewText}>
                      <Text style={styles.overviewValue}>{analyticsData.today.revenue}₾</Text>
                      <Text style={styles.overviewLabel}>დღევანდელი შემოსავალი</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.overviewGradient}
                >
                  <View style={styles.overviewContent}>
                    <View style={styles.overviewIcon}>
                      <Ionicons name="calendar" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.overviewText}>
                      <Text style={styles.overviewValue}>{analyticsData.today.bookings}</Text>
                      <Text style={styles.overviewLabel}>დღევანდელი ჯავშნები</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Revenue Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash-outline" size={20} color="#111827" />
                <Text style={styles.sectionTitle}>შემოსავალი</Text>
              </View>
              <View style={styles.revenueGrid}>
                <View style={styles.revenueCard}>
                  <View style={styles.revenueIconContainer}>
                    <Ionicons name="sunny" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.revenueValue}>{analyticsData.today.revenue}₾</Text>
                  <Text style={styles.revenueLabel}>დღეს</Text>
                  <Text style={styles.revenueTrend}>+12%</Text>
                </View>
                <View style={styles.revenueCard}>
                  <View style={styles.revenueIconContainer}>
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.revenueValue}>{analyticsData.week.revenue}₾</Text>
                  <Text style={styles.revenueLabel}>კვირა</Text>
                  <Text style={styles.revenueTrend}>+8%</Text>
                </View>
                <View style={styles.revenueCard}>
                  <View style={styles.revenueIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.revenueValue}>{analyticsData.month.revenue}₾</Text>
                  <Text style={styles.revenueLabel}>თვე</Text>
                  <Text style={styles.revenueTrend}>+15%</Text>
                </View>
              </View>
            </View>

            {/* Bookings Analytics */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bar-chart-outline" size={20} color="#111827" />
                <Text style={styles.sectionTitle}>ჯავშნების სტატისტიკა</Text>
              </View>
              <View style={styles.bookingsGrid}>
                <View style={styles.bookingCard}>
                  <Text style={styles.bookingValue}>{analyticsData.today.bookings}</Text>
                  <Text style={styles.bookingLabel}>დღეს</Text>
                  <View style={styles.bookingProgress}>
                    <View style={[styles.progressBar, { width: '75%' }]} />
                  </View>
                </View>
                <View style={styles.bookingCard}>
                  <Text style={styles.bookingValue}>{analyticsData.week.bookings}</Text>
                  <Text style={styles.bookingLabel}>კვირა</Text>
                  <View style={styles.bookingProgress}>
                    <View style={[styles.progressBar, { width: '60%' }]} />
                  </View>
                </View>
                <View style={styles.bookingCard}>
                  <Text style={styles.bookingValue}>{analyticsData.month.bookings}</Text>
                  <Text style={styles.bookingLabel}>თვე</Text>
                  <View style={styles.bookingProgress}>
                    <View style={[styles.progressBar, { width: '85%' }]} />
                  </View>
                </View>
                <View style={styles.bookingCard}>
                  <Text style={styles.bookingValue}>{analyticsData.totalBookings}</Text>
                  <Text style={styles.bookingLabel}>სულ</Text>
                  <View style={styles.bookingProgress}>
                    <View style={[styles.progressBar, { width: '100%' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="analytics-outline" size={20} color="#111827" />
                <Text style={styles.sectionTitle}>შესრულების მეტრიკები</Text>
              </View>
              <View style={styles.metricsContainer}>
                <View style={styles.metricCard}>
                  <View style={styles.metricIconContainer}>
                    <Ionicons name="wallet-outline" size={24} color="#10B981" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{analyticsData.averageBookingValue.toFixed(0)}₾</Text>
                    <Text style={styles.metricLabel}>საშუალო ღირებულება</Text>
                    <Text style={styles.metricSubtext}>ჯავშნაზე</Text>
                  </View>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricIconContainer}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>94%</Text>
                    <Text style={styles.metricLabel}>წარმატების მაჩვენებელი</Text>
                    <Text style={styles.metricSubtext}>ჯავშნების</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Status Distribution */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pie-chart-outline" size={20} color="#111827" />
                <Text style={styles.sectionTitle}>ჯავშნების განაწილება</Text>
              </View>
              <View style={styles.statusContainer}>
                {Object.entries(analyticsData.statusCounts).map(([status, count], index) => {
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
                  const icons = ['checkmark-circle', 'time', 'pause-circle', 'close-circle', 'help-circle'];
                  return (
                    <View key={status} style={styles.statusCard}>
                      <View style={[styles.statusIndicator, { backgroundColor: colors[index % colors.length] }]}>
                        <Ionicons name={icons[index % icons.length] as any} size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.statusInfo}>
                        <Text style={styles.statusName}>{status}</Text>
                        <Text style={styles.statusCount}>{count as number} ჯავშნა</Text>
                      </View>
                      <View style={styles.statusPercentage}>
                        <Text style={styles.percentageText}>
                          {analyticsData.totalBookings > 0 ? ((count as number / analyticsData.totalBookings) * 100).toFixed(1) : 0}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  overviewSection: {
    marginBottom: 24,
    gap: 16,
  },
  overviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  overviewGradient: {
    padding: 20,
  },
  overviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  overviewText: {
    flex: 1,
  },
  overviewValue: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  revenueIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  revenueValue: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  revenueLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  revenueTrend: {
    fontSize: 11,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#10B981',
  },
  bookingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bookingCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookingValue: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  bookingLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginBottom: 12,
  },
  bookingProgress: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  metricsContainer: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusName: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  statusCount: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  statusPercentage: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#3B82F6',
  },
});
