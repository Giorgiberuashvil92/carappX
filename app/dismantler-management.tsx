import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { addItemApi } from '../services/addItemApi';
import { useRouter as useRouterExpo } from 'expo-router';

const { width } = Dimensions.get('window');

interface DismantlerAnnouncement {
  _id: string;
  id?: string;
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  photos?: string[];
  description: string;
  location: string;
  phone: string;
  name: string;
  status: string;
  isFeatured: boolean;
  createdAt?: string;
  expiryDate?: string;
  views?: number;
  
}

export default function DismantlerManagementScreen() {
  const router = useRouterExpo();
  const { user } = useUser();
  const [dismantlers, setDismantlers] = useState<DismantlerAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  const loadDismantlers = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await addItemApi.getDismantlers({ ownerId: user.id } as any);
      if (response.success && response.data) {
        setDismantlers(response.data || []);
      }
    } catch (error) {
      console.error('Error loading dismantlers:', error);
      Alert.alert('შეცდომა', 'განცხადებების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDismantlers();
  }, [loadDismantlers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDismantlers();
  }, [loadDismantlers]);

  const handleRenew = async (dismantler: DismantlerAnnouncement) => {
    const dismantlerId = dismantler._id || dismantler.id;
    if (!dismantlerId) return;

    Alert.alert(
      'განცხადების განახლება',
      `გსურთ განაახლოთ "${dismantler.brand} ${dismantler.model}" განცხადება? განახლება ღირს ${dismantler.isFeatured ? '20' : '5'}₾.`,
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'გადახდა',
          onPress: async () => {
            setRenewingId(dismantlerId);
            try {
              // გადავიდეთ გადახდის გვერდზე
              const tier = dismantler.isFeatured ? 'vip' : 'regular';
              const price = dismantler.isFeatured ? 20 : 5;
              
              router.push({
                pathname: '/payment-card',
                params: {
                  amount: price.toString(),
                  description: `განცხადების განახლება - ${dismantler.brand} ${dismantler.model}`,
                  context: 'dismantler-renewal',
                  orderId: `dismantler_renewal_${dismantlerId}_${Date.now()}`,
                  metadata: JSON.stringify({
                    dismantlerId: dismantlerId,
                    tier: tier,
                    userId: user?.id,
                  }),
                }
              });
            } catch (error) {
              console.error('Error initiating renewal payment:', error);
              Alert.alert('შეცდომა', 'გადახდის ინიციალიზაცია ვერ მოხერხდა');
            } finally {
              setRenewingId(null);
            }
          }
        }
      ]
    );
  };

  const handleUpgradeToVip = async (dismantler: DismantlerAnnouncement) => {
    const dismantlerId = dismantler._id || dismantler.id;
    if (!dismantlerId) return;

    Alert.alert(
      'VIP-ზე გადაყვანა',
      `გსურთ "${dismantler.brand} ${dismantler.model}" განცხადება VIP-ზე გადაიყვანოთ? VIP განცხადება ღირს 20₾/თვეში და მიიღებს პრიორიტეტულ განთავსებას.`,
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'გადახდა',
          onPress: async () => {
            setUpgradingId(dismantlerId);
            try {
              router.push({
                pathname: '/payment-card',
                params: {
                  amount: '20',
                  description: `VIP განცხადება - ${dismantler.brand} ${dismantler.model}`,
                  context: 'dismantler-upgrade',
                  orderId: `dismantler_upgrade_${dismantlerId}_${Date.now()}`,
                  metadata: JSON.stringify({
                    dismantlerId: dismantlerId,
                    tier: 'vip',
                    userId: user?.id,
                  }),
                }
              });
            } catch (error) {
              console.error('Error initiating upgrade payment:', error);
              Alert.alert('შეცდომა', 'გადახდის ინიციალიზაცია ვერ მოხერხდა');
            } finally {
              setUpgradingId(null);
            }
          }
        }
      ]
    );
  };

  const handleDelete = async (dismantler: DismantlerAnnouncement) => {
    const dismantlerId = dismantler._id || dismantler.id;
    if (!dismantlerId) return;

    Alert.alert(
      'განცხადების წაშლა',
      `ნამდვილად გსურთ "${dismantler.brand} ${dismantler.model}" განცხადების წაშლა?`,
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await addItemApi.deleteDismantler(dismantlerId, user?.id);
              if (response.success) {
                Alert.alert('წარმატება', 'განცხადება წარმატებით წაიშალა');
                loadDismantlers();
              } else {
                Alert.alert('შეცდომა', response.message || 'წაშლა ვერ მოხერხდა');
              }
            } catch (error) {
              console.error('Error deleting dismantler:', error);
              Alert.alert('შეცდომა', 'განცხადების წაშლა ვერ მოხერხდა');
            }
          }
        }
      ]
    );
  };

  const getExpiryDate = (dismantler: DismantlerAnnouncement): Date | null => {
    // თუ არის expiryDate, გამოვიყენოთ ის
    if (dismantler.expiryDate) {
      return new Date(dismantler.expiryDate);
    }
    
    // თუ არ არის expiryDate, გამოვთვალოთ createdAt + 1 თვე
    if (dismantler.createdAt) {
      const createdDate = new Date(dismantler.createdAt);
      const expiryDate = new Date(createdDate);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      return expiryDate;
    }
    
    return null;
  };

  const getDaysUntilExpiry = (dismantler: DismantlerAnnouncement): number | null => {
    const expiryDate = getExpiryDate(dismantler);
    if (!expiryDate) return null;
    
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dismantler: DismantlerAnnouncement): string => {
    const expiryDate = getExpiryDate(dismantler);
    if (!expiryDate) return 'უცნობი';
    
    return expiryDate.toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderDismantlerCard = (dismantler: DismantlerAnnouncement) => {
    const dismantlerId = dismantler._id || dismantler.id || '';
    const daysUntilExpiry = getDaysUntilExpiry(dismantler);
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    
    // Status-ის დადგენა - თუ status არის "approved" ან "active", მაშინ "აქტიური", სხვა შემთხვევაში "მოლოდინში"
    const isActive = dismantler.status === 'approved' || dismantler.status === 'active';

    return (
      <View key={dismantlerId} style={styles.announcementCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {dismantler.isFeatured && (
              <View style={styles.vipBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.vipBadgeText}>VIP</Text>
              </View>
            )}
            <View style={styles.statusBadge}>
              <View style={[
                styles.statusDot,
                isActive 
                  ? styles.statusDotActive 
                  : styles.statusDotPending
              ]} />
              <Text style={styles.statusText}>
                { 'აქტიური' }
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(dismantler)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <Image
            source={{
              uri: dismantler.photos && dismantler.photos.length > 0
                ? dismantler.photos[0]
                : 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=400&auto=format&fit=crop'
            }}
            style={styles.cardImage}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {dismantler.brand} {dismantler.model}
            </Text>
            <Text style={styles.cardSubtitle}>
              {dismantler.yearFrom}-{dismantler.yearTo} წლები • {dismantler.location}
            </Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {dismantler.description}
            </Text>
            
            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color="#6B7280" />
                <Text style={styles.statText}>{dismantler.views || 0} ნახვა</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.expirySection}>
          <View style={styles.expiryInfo}>
            <Ionicons 
              name={isExpired ? "alert-circle" : "time-outline"} 
              size={16} 
              color={isExpired ? "#EF4444" : isExpiringSoon ? "#F59E0B" : "#6B7280"} 
            />
            <View style={styles.expiryTextContainer}>
              <Text style={styles.expiryLabel}>
                {isExpired ? 'ვადა გაუვიდა' : 'განახლება უწევს'}
              </Text>
              <Text style={[
                styles.expiryDate,
                isExpired && styles.expiryDateExpired,
                isExpiringSoon && !isExpired && styles.expiryDateExpiring
              ]}>
                {formatDate(dismantler)}
                {daysUntilExpiry !== null && !isExpired && (
                  <Text style={styles.daysText}> ({daysUntilExpiry} დღე)</Text>
                )}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            {!dismantler.isFeatured && (
              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  (upgradingId === dismantlerId) && styles.upgradeButtonDisabled
                ]}
                onPress={() => handleUpgradeToVip(dismantler)}
                disabled={upgradingId === dismantlerId}
              >
                {upgradingId === dismantlerId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.upgradeButtonText}>
                      VIP (20₾)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.renewButton,
                (renewingId === dismantlerId) && styles.renewButtonDisabled,
                !dismantler.isFeatured && styles.renewButtonWithUpgrade
              ]}
              onPress={() => handleRenew(dismantler)}
              disabled={renewingId === dismantlerId}
            >
              {renewingId === dismantlerId ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card" size={16} color="#FFFFFF" />
                  <Text style={styles.renewButtonText}>
                    განახლება ({dismantler.isFeatured ? '20' : '5'}₾)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'განცხადებების მართვა',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#111827',
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>იტვირთება...</Text>
          </View>
        ) : dismantlers.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>განცხადებები არ მოიძებნა</Text>
            <Text style={styles.emptySubtitle}>
              თქვენ არ გაქვთ დაშლილების განცხადებები
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/parts' as any)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>განცხადების დამატება</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.headerInfo}>
              <Text style={styles.headerInfoText}>
                სულ {dismantlers.length} განცხადება
              </Text>
            </View>

            {dismantlers.map(renderDismantlerCard)}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  headerInfo: {
    marginBottom: 8,
  },
  headerInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotPending: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  deleteButton: {
    padding: 4,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expirySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expiryTextContainer: {
    flex: 1,
  },
  expiryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  expiryDateExpired: {
    color: '#EF4444',
  },
  expiryDateExpiring: {
    color: '#F59E0B',
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  renewButtonWithUpgrade: {
    flex: 1,
  },
  renewButtonDisabled: {
    opacity: 0.6,
  },
  renewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
