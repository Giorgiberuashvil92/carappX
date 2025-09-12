import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../contexts/UserContext';

interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  discount?: string;
  freeService?: string;
  icon: string;
  color: string;
  isAvailable: boolean;
}

interface PointsTransaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  date: string;
  service?: string;
}

const LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: '1',
    title: '10% ფასდაკლება',
    description: 'ყველა სერვისზე',
    pointsRequired: 100,
    discount: '10%',
    icon: 'pricetag',
    color: '#6366F1',
    isAvailable: true,
  },
  {
    id: '2',
    title: 'უფასო სწრაფი სამრეცხაო',
    description: '15 წუთიანი სამრეცხაო',
    pointsRequired: 500,
    freeService: 'სწრაფი სამრეცხაო',
    icon: 'car-wash',
    color: '#3B82F6',
    isAvailable: true,
  },
  {
    id: '3',
    title: 'უფასო ტექდათვალიერება',
    description: 'ოფიციალური ტექდათვალიერება',
    pointsRequired: 1000,
    freeService: 'ტექდათვალიერება',
    icon: 'checkmark-circle',
    color: '#22C55E',
    isAvailable: true,
  },
  {
    id: '4',
    title: 'უფასო ზეთის გამოცვლა',
    description: 'სრული ზეთის გამოცვლა',
    pointsRequired: 2000,
    freeService: 'ზეთის გამოცვლა',
    icon: 'settings',
    color: '#F59E0B',
    isAvailable: false,
  },
  {
    id: '5',
    title: 'VIP სტატუსი',
    description: 'პრიორიტეტული მომსახურება',
    pointsRequired: 5000,
    icon: 'star',
    color: '#EF4444',
    isAvailable: false,
  },
];

const POINTS_TRANSACTIONS: PointsTransaction[] = [
  {
    id: '1',
    type: 'earned',
    amount: 25,
    description: 'სამრეცხაო სერვისი',
    date: 'დღეს',
    service: 'პრემიუმ სამრეცხაო',
  },
  {
    id: '2',
    type: 'earned',
    amount: 15,
    description: 'კომუნიტიში აქტივობა',
    date: 'გუშინ',
    service: 'პოსტის გამოქვეყნება',
  },
  {
    id: '3',
    type: 'spent',
    amount: -100,
    description: '10% ფასდაკლება',
    date: '2 დღის წინ',
    service: 'ტექდათვალიერება',
  },
  {
    id: '4',
    type: 'earned',
    amount: 30,
    description: 'ზეთის გამოცვლა',
    date: '3 დღის წინ',
    service: 'სრული სერვისი',
  },
];

export default function LoyaltyScreen() {
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [currentPoints] = useState(1250); // მომხმარებლის მიმდინარე ქულები
  const [vipLevel] = useState('ვერცხლი'); // VIP სტატუსი

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getVipColor = (level: string) => {
    switch (level) {
      case 'ბრონზე': return '#CD7F32';
      case 'ვერცხლი': return '#C0C0C0';
      case 'ოქრო': return '#FFD700';
      case 'პლატინა': return '#E5E4E2';
      default: return '#6B7280';
    }
  };

  const getNextReward = () => {
    return LOYALTY_REWARDS.find(reward => !reward.isAvailable) || LOYALTY_REWARDS[0];
  };

  const nextReward = getNextReward();
  const pointsToNext = nextReward.pointsRequired - currentPoints;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>ლოიალობის პროგრამა</Text>
            <Text style={styles.headerSubtitle}>
              მოაგროვე ქულები და მიიღე ჯილდოები
            </Text>
          </View>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#111827']}
          />
        }
      >
        {/* Points Summary */}
        <View style={styles.pointsContainer}>
          <LinearGradient
            colors={['#111827', '#374151', '#1F2937']}
            style={styles.pointsCard}
          >
            <View style={styles.pointsHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userName}>
                    {user?.name || 'მომხმარებელი'}
                  </Text>
                  <View style={styles.vipBadge}>
                    <Ionicons name="star" size={16} color={getVipColor(vipLevel)} />
                    <Text style={[styles.vipText, { color: getVipColor(vipLevel) }]}>
                      {vipLevel} VIP
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.pointsDisplay}>
                <Text style={styles.pointsNumber}>{currentPoints}</Text>
                <Text style={styles.pointsLabel}>ქულა</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                შემდეგი ჯილდოსკენ: {pointsToNext} ქულა
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(currentPoints / nextReward.pointsRequired) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.nextRewardText}>
                {nextReward.title}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* სტატისტიკა */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>სერვისი</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>320₾</Text>
            <Text style={styles.statLabel}>დახარჯული</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>ჯილდო</Text>
          </View>
        </View>

        {/* ხელმისაწვდომი ჯილდოები */}
        <View style={styles.rewardsContainer}>
          <Text style={styles.sectionTitle}>ხელმისაწვდომი ჯილდოები</Text>
          {LOYALTY_REWARDS.filter(reward => reward.isAvailable).map((reward) => (
            <TouchableOpacity key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardContent}>
                <View style={[styles.rewardIcon, { backgroundColor: reward.color }]}>
                  <Ionicons name={reward.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                  {reward.discount && (
                    <Text style={styles.rewardDiscount}>{reward.discount} ფასდაკლება</Text>
                  )}
                  {reward.freeService && (
                    <Text style={styles.rewardFree}>უფასო: {reward.freeService}</Text>
                  )}
                </View>
                <View style={styles.rewardPoints}>
                  <Text style={styles.pointsRequired}>{reward.pointsRequired}</Text>
                  <Text style={styles.pointsLabel}>ქულა</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[
                  styles.redeemButton,
                  { backgroundColor: currentPoints >= reward.pointsRequired ? reward.color : '#E5E7EB' }
                ]}
                disabled={currentPoints < reward.pointsRequired}
              >
                <Text style={[
                  styles.redeemButtonText,
                  { color: currentPoints >= reward.pointsRequired ? '#FFFFFF' : '#9CA3AF' }
                ]}>
                  {currentPoints >= reward.pointsRequired ? 'გამოყენება' : 'არასაკმარისი ქულა'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* ქულების ისტორია */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>ქულების ისტორია</Text>
          {POINTS_TRANSACTIONS.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionContent}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.type === 'earned' ? '#22C55E' : '#EF4444' }
                ]}>
                  <Ionicons 
                    name={transaction.type === 'earned' ? 'add' : 'remove'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionService}>{transaction.service}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'earned' ? '#22C55E' : '#EF4444' }
                ]}>
                  {transaction.type === 'earned' ? '+' : ''}{transaction.amount}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  pointsContainer: {
    padding: 20,
  },
  pointsCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  vipText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  pointsDisplay: {
    alignItems: 'center',
  },
  pointsNumber: {
    fontSize: 32,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  pointsLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  nextRewardText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  rewardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  rewardDiscount: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#10B981',
  },
  rewardFree: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#3B82F6',
  },
  rewardPoints: {
    alignItems: 'center',
  },
  pointsRequired: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
  },
  redeemButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  redeemButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#1F2937',
  },
  transactionService: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    fontFamily: 'NotoSans_500Medium',
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
  },
});
