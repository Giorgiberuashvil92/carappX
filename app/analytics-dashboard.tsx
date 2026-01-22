import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import API_BASE_URL from '../config/api';
import { useUser } from '../contexts/UserContext';
import { analyticsApi } from '@/services/analyticsApi';

const { width } = Dimensions.get('window');

interface ScreenView {
  screenName: string;
  views: number;
  uniqueUsers: number;
}

interface ButtonClick {
  buttonName: string;
  clicks: number;
  screen: string;
}

interface UserEngagement {
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  newUsers: number;
}

interface NavigationFlow {
  from: string;
  to: string;
  count: number;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  
  // Analytics data
  const [screenViews, setScreenViews] = useState<ScreenView[]>([]);
  const [buttonClicks, setButtonClicks] = useState<ButtonClick[]>([]);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);
  const [navigationFlows, setNavigationFlows] = useState<NavigationFlow[]>([]);
  const [popularFeatures, setPopularFeatures] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch real analytics data from backend
      const data = await analyticsApi.getDashboard(selectedPeriod);

      setScreenViews(data.screenViews);
      setButtonClicks(data.buttonClicks);
      setUserEngagement(data.userEngagement);
      setNavigationFlows(data.navigationFlows);
      setPopularFeatures(data.popularFeatures);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to empty data on error
      setScreenViews([]);
      setButtonClicks([]);
      setUserEngagement(null);
      setNavigationFlows([]);
      setPopularFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'დღეს';
      case 'week': return 'კვირა';
      case 'month': return 'თვე';
      default: return 'კვირა';
    }
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
          <Text style={styles.headerSubtitle}>მომხმარებლის ქცევა</Text>
        </View>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            onPress={() => setSelectedPeriod(period)}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'today' ? 'დღეს' : period === 'week' ? 'კვირა' : 'თვე'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Engagement Overview */}
        {userEngagement && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#111827" />
              <Text style={styles.sectionTitle}>მომხმარებლის ჩართულობა</Text>
            </View>
            <View style={styles.engagementGrid}>
              <View style={styles.engagementCard}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.engagementGradient}
                >
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                  <Text style={styles.engagementValue}>{userEngagement.activeUsers}</Text>
                  <Text style={styles.engagementLabel}>აქტიური იუზერი</Text>
                </LinearGradient>
              </View>
              <View style={styles.engagementCard}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.engagementGradient}
                >
                  <Ionicons name="time" size={24} color="#FFFFFF" />
                  <Text style={styles.engagementValue}>{userEngagement.averageSessionDuration} წთ</Text>
                  <Text style={styles.engagementLabel}>საშუალო სესია</Text>
                </LinearGradient>
              </View>
              <View style={styles.engagementCard}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.engagementGradient}
                >
                  <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
                  <Text style={styles.engagementValue}>{userEngagement.totalSessions}</Text>
                  <Text style={styles.engagementLabel}>სულ სესია</Text>
                </LinearGradient>
              </View>
              <View style={styles.engagementCard}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.engagementGradient}
                >
                  <Ionicons name="person-add" size={24} color="#FFFFFF" />
                  <Text style={styles.engagementValue}>{userEngagement.newUsers}</Text>
                  <Text style={styles.engagementLabel}>ახალი იუზერი</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        )}

        {/* Screen Views */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye" size={20} color="#111827" />
            <Text style={styles.sectionTitle}>ეკრანების ნახვები</Text>
          </View>
          <View style={styles.screenViewsContainer}>
            {screenViews.map((screen, index) => {
              const maxViews = Math.max(...screenViews.map(s => s.views));
              const percentage = (screen.views / maxViews) * 100;
              return (
                <View key={screen.screenName} style={styles.screenViewCard}>
                  <View style={styles.screenViewHeader}>
                    <View style={styles.screenViewInfo}>
                      <Text style={styles.screenViewName}>{screen.screenName}</Text>
                      <Text style={styles.screenViewStats}>
                        {screen.views} ნახვა • {screen.uniqueUsers} იუზერი
                      </Text>
                    </View>
                    <View style={styles.screenViewRank}>
                      <Text style={styles.rankNumber}>#{index + 1}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Button Clicks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hand-left" size={20} color="#111827" />
            <Text style={styles.sectionTitle}>ღილაკების დაჭერები</Text>
          </View>
          <View style={styles.buttonClicksContainer}>
            {buttonClicks.map((button, index) => {
              const maxClicks = Math.max(...buttonClicks.map(b => b.clicks));
              const percentage = (button.clicks / maxClicks) * 100;
              return (
                <View key={`${button.buttonName}-${index}`} style={styles.buttonClickCard}>
                  <View style={styles.buttonClickHeader}>
                    <View style={styles.buttonClickIcon}>
                      <Ionicons name="radio-button-on" size={16} color="#3B82F6" />
                    </View>
                    <View style={styles.buttonClickInfo}>
                      <Text style={styles.buttonClickName}>{button.buttonName}</Text>
                      <Text style={styles.buttonClickScreen}>{button.screen}</Text>
                    </View>
                    <Text style={styles.buttonClickCount}>{button.clicks}</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: '#3B82F6' }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Navigation Flows */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="swap-horizontal" size={20} color="#111827" />
            <Text style={styles.sectionTitle}>ნავიგაციის ნაკადები</Text>
          </View>
          <View style={styles.navigationContainer}>
            {navigationFlows.map((flow, index) => (
              <View key={`${flow.from}-${flow.to}-${index}`} style={styles.navigationCard}>
                <View style={styles.navigationFlow}>
                  <View style={styles.navigationFrom}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.navigationText}>{flow.from}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                  <View style={styles.navigationTo}>
                    <Ionicons name="location" size={16} color="#3B82F6" />
                    <Text style={styles.navigationText}>{flow.to}</Text>
                  </View>
                </View>
                <View style={styles.navigationCount}>
                  <Text style={styles.navigationCountText}>{flow.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Popular Features */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={20} color="#111827" />
            <Text style={styles.sectionTitle}>პოპულარული ფუნქციები</Text>
          </View>
          <View style={styles.featuresContainer}>
            {popularFeatures.map((feature, index) => (
              <View key={feature.name} style={styles.featureCard}>
                <View style={styles.featureHeader}>
                  <View style={styles.featureRank}>
                    <Text style={styles.featureRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureUsage}>{feature.usage} გამოყენება</Text>
                  </View>
                  <View style={styles.featureTrend}>
                    <Ionicons name="trending-up" size={16} color="#10B981" />
                    <Text style={styles.featureTrendText}>{feature.trend}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
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
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
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
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  engagementCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  engagementGradient: {
    padding: 16,
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  screenViewsContainer: {
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
  screenViewCard: {
    marginBottom: 16,
  },
  screenViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  screenViewInfo: {
    flex: 1,
  },
  screenViewName: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  screenViewStats: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  screenViewRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#3B82F6',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  buttonClicksContainer: {
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
  buttonClickCard: {
    marginBottom: 16,
  },
  buttonClickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonClickIcon: {
    marginRight: 12,
  },
  buttonClickInfo: {
    flex: 1,
  },
  buttonClickName: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  buttonClickScreen: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  buttonClickCount: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#3B82F6',
  },
  navigationContainer: {
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
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navigationFlow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navigationFrom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navigationTo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navigationText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#111827',
  },
  navigationCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  navigationCountText: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#3B82F6',
  },
  featuresContainer: {
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
  featureCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureRankText: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#3B82F6',
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  featureUsage: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  featureTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureTrendText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#10B981',
  },
});
