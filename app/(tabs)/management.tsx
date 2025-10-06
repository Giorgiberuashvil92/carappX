import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import { carwashLocationApi } from '@/services/carwashLocationApi';
import { CarwashLocation } from '@/services/carwashLocationApi';
import API_BASE_URL from '@/config/api';

const { width } = Dimensions.get('window');

export default function ManagementScreen() {
  const { user } = useUser();
  const { success, error } = useToast();
  const router = useRouter();
  const [myCarwashes, setMyCarwashes] = useState<CarwashLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load my carwashes
  useEffect(() => {
    const loadMyCarwashes = async () => {
      if (user?.role === 'owner' && user.ownedCarwashes?.length > 0) {
        try {
          const ownedCarwashes = await carwashLocationApi.getLocationsByOwner(user.id);
          setMyCarwashes(ownedCarwashes);
        } catch (error) {
          console.error('Error loading my carwashes:', error);
          setMyCarwashes([]);
        }
      } else {
        setMyCarwashes([]);
      }
      setLoading(false);
    };
    loadMyCarwashes();
  }, [user?.role, user?.ownedCarwashes]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.role === 'owner' && user.ownedCarwashes?.length > 0) {
      try {
        const ownedCarwashes = await carwashLocationApi.getLocationsByOwner(user.id);
        setMyCarwashes(ownedCarwashes);
      } catch (error) {
        console.error('Error refreshing carwashes:', error);
      }
    }
    setRefreshing(false);
  };

  const toggleCarwashStatus = async (carwashId: string) => {
    try {
      // Call backend API to toggle status
      const response = await fetch(`${API_BASE_URL}/carwash/locations/${carwashId}/toggle-open`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const updatedCarwash = await response.json();
        
        // Update local state with the updated carwash data
        setMyCarwashes(prev => 
          prev.map(carwash => 
            carwash.id === carwashId 
              ? { 
                  ...carwash, 
                  isOpen: updatedCarwash.realTimeStatus?.isOpen ?? !carwash.isOpen 
                }
              : carwash
          )
        );
        
        // Show success message
        success(
          'წარმატება',
          'სამრეცხაოს სტატუსი წარმატებით შეიცვალა',
        );
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling carwash status:', error);
      error(
        'შეცდომა',
        'სამრეცხაოს სტატუსის შეცვლა ვერ მოხერხდა',
      );
    }
  };

  const openAnalytics = (carwashId: string) => {
    router.push(`/analytics/${carwashId}`);
  };

  const openBookings = (carwashId: string) => {
    router.push(`/bookings/${carwashId}`);
  };

  const openSettings = (carwashId: string) => {
    router.push(`/settings/${carwashId}`);
  };


  const renderCarwashCard = ({ item }: { item: CarwashLocation }) => (
    <View style={styles.carwashCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text style={styles.carwashName}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.carwashAddress}>{item.address}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.statusBadge, { backgroundColor: item.isOpen ? '#D1FAE5' : '#FEE2E2' }]}
          onPress={() => toggleCarwashStatus(item.id)}
        >
          <View style={[styles.statusDot, { backgroundColor: item.isOpen ? '#10B981' : '#EF4444' }]} />
          <Text style={[styles.statusText, { color: item.isOpen ? '#065F46' : '#991B1B' }]}>
            {item.isOpen ? 'ღია' : 'დახურული'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{item.rating || 0}</Text>
          <Text style={styles.quickStatLabel}>★ რეიტინგი</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{item.reviews || 0}</Text>
          <Text style={styles.quickStatLabel}>💬 რეცენზია</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{item.price}₾</Text>
          <Text style={styles.quickStatLabel}>💰 ფასი</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => openAnalytics(item.id)}
        >
          <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>ანალიტიკა</Text>
        </TouchableOpacity>
        <View style={styles.secondaryActions}>
          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => openSettings(item.id)}
          >
            <Ionicons name="settings-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => openBookings(item.id)}
          >
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="business-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>სამრეცხაოები ჯერ არ არის</Text>
      <Text style={styles.emptySubtitle}>
        დაამატეთ თქვენი პირველი სამრეცხაო და დაიწყეთ მართვა
      </Text>
      <TouchableOpacity style={styles.emptyAddButton}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>სამრეცხაოს დამატება</Text>
      </TouchableOpacity>
    </View>
  );

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ბიზნეს მართვა</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <View style={styles.headerRightSection}>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={myCarwashes}
        renderItem={renderCarwashCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
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
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    textAlign: 'center',
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 4,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
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
  listContainer: {
    padding: 16,
  },
  carwashCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  carwashName: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  carwashAddress: {
    fontSize: 13,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'NotoSans_600SemiBold',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 11,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
});
