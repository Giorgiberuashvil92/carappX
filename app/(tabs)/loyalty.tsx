import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { loyaltyApi, type LoyaltySummary, type LoyaltyTransaction, type LoyaltyReward, type LoyaltyLeaderboardUser, type LoyaltyFriend, type LoyaltyAchievement, type LoyaltyMission } from '../../services/loyaltyApi';
import QRCode from 'react-native-qrcode-svg';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface PointsTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  description: string;
  date: string;
  service?: string;
  icon: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  rank: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  pointsReward: number;
  progress?: number;
  maxProgress?: number;
}

interface Friend {
  id: string;
  name: string;
  points: number;
  avatar?: string;
  isOnline: boolean;
  lastActive: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  icon: string;
  category: 'discount' | 'freebie' | 'upgrade' | 'bonus';
  isAvailable: boolean;
  discount?: number;
  expiryDate?: string;
}

const POINTS_TRANSACTIONS: PointsTransaction[] = [
  {
    id: '1',
    type: 'earned',
    amount: 25,
    description: 'CarWash Pro',
    date: 'დღეს',
    service: 'სამრეცხაო სერვისი',
    icon: 'car-wash',
  },
  {
    id: '2',
    type: 'bonus',
    amount: 50,
    description: 'CarWash Pro',
    date: 'დღეს',
    service: 'პირველი ვიზიტის ბონუსი',
    icon: 'gift',
  },
  {
    id: '3',
    type: 'spent',
    amount: 100,
    description: 'Premium Wash',
    date: '3 დღის წინ',
    service: '10% ფასდაკლება',
    icon: 'pricetag',
  },
  {
    id: '4',
    type: 'earned',
    amount: 50,
    description: 'AutoService Center',
    date: 'გუშინ',
    service: 'ტექდათვალიერება',
    icon: 'checkmark-circle',
  },
];

// Missions (mock) for loyalty engagement
const MISSIONS: Array<{ id: string; title: string; icon: any; progress: number; target: number; reward: number }>= [
  { id: 'm1', title: 'ყოველდღიური ჩექინი', icon: 'calendar', progress: 1, target: 1, reward: 20 },
  { id: 'm2', title: 'სერვისის დაჯავშნა', icon: 'construct', progress: 0, target: 1, reward: 50 },
  { id: 'm3', title: 'შეფასება დაწერე', icon: 'chatbox-ellipses', progress: 0, target: 1, reward: 30 },
  { id: 'm4', title: 'მეგობრის მოწვევა', icon: 'people', progress: 0, target: 1, reward: 100 },
];

const renderMissionItem = (
  m: { id: string; title: string; icon: any; progress: number; target: number; reward: number },
  onClaim?: (missionId: string) => void,
) => {
  const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
  const canClaim = pct >= 100;
  return (
    <View key={m.id} style={{ width: 220, marginRight: 12 }}>
      <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
        <BlurView intensity={30} tint="default" style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)' }}>
              <Ionicons name={m.icon as any} size={16} color="#60A5FA" />
            </View>
            <Text style={{ color: '#E5E7EB', fontWeight: '800' }}>{m.title}</Text>
            <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 11 }}>+{m.reward}</Text>
            </View>
          </View>
          <View style={{ height: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#3B82F6' }} />
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 11 }}>{m.progress}/{m.target}</Text>
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: canClaim ? '#22C55E' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: canClaim ? '#16A34A' : 'rgba(255,255,255,0.12)' }}
              disabled={!canClaim}
              onPress={() => canClaim && onClaim && onClaim(m.id)}
            >
              <Text style={{ color: canClaim ? '#0B1F12' : '#E5E7EB', fontWeight: '700', fontSize: 12 }}>{canClaim ? 'მიღება' : 'შესრულე'}</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
};

const LEADERBOARD_DATA: LeaderboardUser[] = [
  { id: '1', name: 'გიორგი ბერიძე', points: 2450, rank: 1, isCurrentUser: false },
  { id: '2', name: 'ანა კვარაცხელია', points: 2100, rank: 2, isCurrentUser: false },
  { id: '3', name: 'დავით ჩიქოვანი', points: 1850, rank: 3, isCurrentUser: false },
  { id: '4', name: 'მომხმარებელი', points: 750, rank: 4, isCurrentUser: true },
  { id: '5', name: 'ნინო ბაღაშვილი', points: 650, rank: 5, isCurrentUser: false },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'პირველი ვიზიტი',
    description: 'პირველი სამრეცხაო სერვისი',
    icon: 'star',
    isUnlocked: true,
    pointsReward: 50,
  },
  {
    id: '2',
    title: 'ლოიალური მომხმარებელი',
    description: '10 სერვისი გამოიყენე',
    icon: 'heart',
    isUnlocked: true,
    pointsReward: 100,
    progress: 7,
    maxProgress: 10,
  },
  {
    id: '3',
    title: 'VIP სტატუსი',
    description: '1000 ქულა მიიღე',
    icon: 'diamond',
    isUnlocked: false,
    pointsReward: 200,
    progress: 750,
    maxProgress: 1000,
  },
  {
    id: '4',
    title: 'მეგობრების მოწვევა',
    description: '5 მეგობარი მოიწვიე',
    icon: 'people',
    isUnlocked: false,
    pointsReward: 150,
    progress: 2,
    maxProgress: 5,
  },
];

const FRIENDS_DATA: Friend[] = [
  { id: '1', name: 'გიორგი ბერიძე', points: 2450, isOnline: true, lastActive: 'ახლა' },
  { id: '2', name: 'ანა კვარაცხელია', points: 2100, isOnline: false, lastActive: '2 საათის წინ' },
  { id: '3', name: 'დავით ჩიქოვანი', points: 1850, isOnline: true, lastActive: 'ახლა' },
  { id: '4', name: 'ნინო ბაღაშვილი', points: 650, isOnline: false, lastActive: '1 დღის წინ' },
];

const REWARDS_DATA: Reward[] = [
  {
    id: '1',
    title: '10% ფასდაკლება',
    description: 'ყველა სამრეცხაო სერვისზე',
    pointsRequired: 500,
    icon: 'pricetag',
    category: 'discount',
    isAvailable: true,
    discount: 10,
    expiryDate: '2024-12-31'
  },
  {
    id: '2',
    title: 'უფასო ვაქსი',
    description: 'პრემიუმ ვაქსის სერვისი',
    pointsRequired: 1000,
    icon: 'car',
    category: 'freebie',
    isAvailable: true,
    expiryDate: '2024-12-31'
  },
  {
    id: '3',
    title: 'VIP სტატუსი',
    description: '1 თვის VIP სტატუსი',
    pointsRequired: 2000,
    icon: 'diamond',
    category: 'upgrade',
    isAvailable: false,
    expiryDate: '2024-12-31'
  },
  {
    id: '4',
    title: 'ბონუს ქულები',
    description: '+200 ბონუს ქულა',
    pointsRequired: 300,
    icon: 'gift',
    category: 'bonus',
    isAvailable: true,
    expiryDate: '2024-12-31'
  },
  {
    id: '5',
    title: '20% ფასდაკლება',
    description: 'ყველა სერვისზე',
    pointsRequired: 1500,
    icon: 'pricetag',
    category: 'discount',
    isAvailable: false,
    discount: 20,
    expiryDate: '2024-12-31'
  },
  {
    id: '6',
    title: 'უფასო ტექდათვალიერება',
    description: 'სრული ტექდათვალიერება',
    pointsRequired: 800,
    icon: 'checkmark-circle',
    category: 'freebie',
    isAvailable: true,
    expiryDate: '2024-12-31'
  }
];

export default function LoyaltyScreen() {
  const { user, loading } = useUser();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  // All hooks must be called before any early returns
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'history' | 'leaderboard' | 'friends' | 'achievements'>('rewards');
  const [redeemVisible, setRedeemVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardRotateAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Loading state - after all hooks
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#0F0F0F' }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: '#FFFFFF' }]}>იტვირთება...</Text>
        </View>
      </View>
    );
  }
  
  // Dynamic state
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[] | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[] | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [missions, setMissions] = useState<LoyaltyMission[] | null>(null);

  const currentPoints = summary?.points ?? 0;
  const vipLevel = summary?.tier ?? 'Bronze';
  const nextTierPoints = summary?.nextTierPoints ?? 500;
  const tierProgress = Math.min(100, Math.round((currentPoints / (nextTierPoints || 1)) * 100));

  const handleCloseRedeem = () => {
    setRedeemVisible(false);
    setSelectedReward(null);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !user?.id) return;
    try {
      const res = await loyaltyApi.redeem(user.id, selectedReward.id);
      if (res?.summary) setSummary(res.summary);
      const rw = await loyaltyApi.getRewards(user.id);
      setRewards(rw);
      Alert.alert('გადაცვლა', `${selectedReward.title} წარმატებით გამოიყენე!`);
    } catch (e) {
      Alert.alert('შეცდომა', 'ჯილდოს გადაცვლა ვერ მოხერხდა');
    } finally {
      handleCloseRedeem();
    }
  };

  useEffect(() => {
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
      Animated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    if (!user?.id) {
      console.warn('⚠️ Loyalty Screen: No user ID available');
      return;
    }
    
    try {
      console.log('📊 Loyalty Screen - Loading data for user:', user.id);
      const [s, tx, rw, lb, fr, ac, ms] = await Promise.all([
        loyaltyApi.getSummary(user.id).catch(err => {
          console.error('❌ Failed to load summary:', err);
          return null;
        }),
        loyaltyApi.getTransactions(user.id, 20).catch(err => {
          console.error('❌ Failed to load transactions:', err);
          return [];
        }),
        loyaltyApi.getRewards(user.id).catch(err => {
          console.error('❌ Failed to load rewards:', err);
          return [];
        }),
        loyaltyApi.getLeaderboard(user.id).catch(err => {
          console.error('❌ Failed to load leaderboard:', err);
          return [];
        }),
        loyaltyApi.getFriends(user.id).catch(err => {
          console.error('❌ Failed to load friends:', err);
          return [];
        }),
        loyaltyApi.getAchievements(user.id).catch(err => {
          console.error('❌ Failed to load achievements:', err);
          return [];
        }),
        loyaltyApi.getMissions(user.id).catch(err => {
          console.error('❌ Failed to load missions:', err);
          return [];
        }),
      ]);
      
      console.log('📊 Loyalty Screen - Data loaded:', {
        summary: !!s,
        transactions: tx?.length || 0,
        rewards: rw?.length || 0,
        leaderboard: lb?.length || 0,
        friends: fr?.length || 0,
        achievements: ac?.length || 0,
        missions: ms?.length || 0,
      });
      
      console.log('📊 Loyalty Screen - Leaderboard State:', {
        leaderboard: lb,
        leaderboardLength: lb?.length || 0,
        currentUserRank: lb?.find((u: any) => u.isCurrentUser)?.rank,
        isArray: Array.isArray(lb),
      });
      
      if (s) setSummary(s);
      if (tx) setTransactions(tx);
      if (rw) setRewards(rw);
      if (lb) setLeaderboard(lb as unknown as LeaderboardUser[]);
      if (fr) setFriends(fr as unknown as Friend[]);
      if (ac) setAchievements(ac as unknown as Achievement[]);
      if (ms) setMissions(ms as unknown as LoyaltyMission[]);
    } catch (error) {
      console.error('❌ Loyalty Screen - Failed to load data:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
      });
    }
  };

  const handleClaimMission = async (missionId: string) => {
    if (!user?.id) return;
    try {
      const res = await loyaltyApi.claimMission(user.id, missionId);
      // Refresh summary and missions after claim
      const [s, ms] = await Promise.all([
        loyaltyApi.getSummary(user.id),
        loyaltyApi.getMissions(user.id),
      ]);
      setSummary(s);
      setMissions(ms);
      Alert.alert('მისია', 'ჯილდო მიღებულია!');
    } catch (e) {
      Alert.alert('შეცდომა', 'მისიის მიღება ვერ მოხერხდა');
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const generateQRData = () => {
    return JSON.stringify({
      app: 'CarAppX',
      userId: user?.id || 'demo-user',
      type: 'loyalty',
      points: currentPoints,
      timestamp: new Date().toISOString(),
    });
  };

  const handleQRShare = async () => {
    try {
      const qrData = generateQRData();
      await Share.share({
        message: `CarAppX ლოიალობის QR კოდი: ${qrData}`,
        title: 'CarAppX ლოიალობის QR კოდი'
      });
    } catch (error) {
      Alert.alert('შეცდომა', 'QR კოდის გაზიარება ვერ მოხერხდა');
    }
  };

  const handleSocialShare = async (type: 'points' | 'achievement' | 'leaderboard') => {
    try {
      let message = '';
      switch (type) {
        case 'points':
          message = `მე მაქვს ${currentPoints} ქულა CarAppX-ში! 🚗✨`;
          break;
        case 'achievement':
          message = `ახალი მიღწევა გავაკეთე CarAppX-ში! 🏆`;
          break;
        case 'leaderboard':
          message = `მე მე-4 ადგილზე ვარ CarAppX ლიდერბორდში! 🥇`;
          break;
      }
      
      await Share.share({
        message: message,
        title: 'CarAppX ლოიალობის პროგრამა'
      });
    } catch (error) {
      Alert.alert('შეცდომა', 'გაზიარება ვერ მოხერხდა');
    }
  };

  const handleReferral = () => {
    Alert.alert(
      'მეგობრების მოწვევა',
      'გაზიარე შენი რეკომენდაციის კოდი მეგობრებთან და მიიღე ბონუს ქულები!',
      [
        { text: 'გაუქმება', style: 'cancel' },
        { text: 'გაზიარება', onPress: () => handleSocialShare('points') }
      ]
    );
  };

  const renderTransactionCard = (transaction: PointsTransaction, index: number) => {
    return (
      <Animated.View
        key={transaction.id}
        style={[
          styles.transactionCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 20],
                outputRange: [0, -10],
              }),
            }],
          },
        ]}
      >
        <View style={styles.transactionContent}>
          <View style={[
            styles.transactionIcon,
            { backgroundColor: transaction.type === 'earned' ? '#10B981' : 
                              transaction.type === 'bonus' ? '#F59E0B' : '#EF4444' }
          ]}>
            <Ionicons 
              name={transaction.icon as any} 
              size={16} 
              color="#FFFFFF" 
            />
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionDescription, { color: '#FFFFFF' }]}>{transaction.description}</Text>
            <Text style={[styles.transactionService, { color: '#9CA3AF' }]}>{transaction.service}</Text>
            <Text style={[styles.transactionDate, { color: '#6B7280' }]}>{transaction.date}</Text>
          </View>
          
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.transactionAmountText,
              { color: transaction.type === 'earned' ? '#10B981' : 
                       transaction.type === 'bonus' ? '#F59E0B' : '#EF4444' }
            ]}>
              {transaction.type === 'earned' ? '+' : 
               transaction.type === 'bonus' ? '++' : '-'}{transaction.amount}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderLeaderboardCard = (user: LeaderboardUser, index: number) => {
    return (
      <Animated.View
        key={user.id}
        style={[
          styles.leaderboardCard,
          user.isCurrentUser && styles.currentUserCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 20],
                outputRange: [0, 10],
              }),
            }],
          },
        ]}
      >
        <View style={styles.leaderboardContent}>
          <View style={styles.rankContainer}>
            <Text style={[styles.rankText, { color: user.rank <= 3 ? '#F59E0B' : '#9CA3AF' }]}>
              #{user.rank}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: user.isCurrentUser ? '#F59E0B' : '#FFFFFF' }]}>
                {user.name}
              </Text>
              <Text style={[styles.userPoints, { color: '#9CA3AF' }]}>
                {user.points.toLocaleString()} ქულა
              </Text>
            </View>
          </View>
          
          {user.rank <= 3 && (
            <View style={styles.trophyContainer}>
              <Ionicons 
                name={user.rank === 1 ? 'trophy' : user.rank === 2 ? 'medal' : 'ribbon'} 
                size={20} 
                color="#F59E0B" 
              />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderAchievementCard = (achievement: Achievement, index: number) => {
    return (
      <Animated.View
        key={achievement.id}
        style={[
          styles.achievementCard,
          achievement.isUnlocked && styles.unlockedAchievement,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 20],
                outputRange: [0, 10],
              }),
            }],
          },
        ]}
      >
        <View style={styles.achievementContent}>
          <View style={[
            styles.achievementIcon,
            { backgroundColor: achievement.isUnlocked ? '#10B981' : '#6B7280' }
          ]}>
            <Ionicons 
              name={achievement.icon as any} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          
          <View style={styles.achievementInfo}>
            <Text style={[
              styles.achievementTitle,
              { color: achievement.isUnlocked ? '#FFFFFF' : '#6B7280' }
            ]}>
              {achievement.title}
            </Text>
            <Text style={[styles.achievementDescription, { color: '#9CA3AF' }]}>
              {achievement.description}
            </Text>
            {achievement.progress && achievement.maxProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(achievement.progress / achievement.maxProgress) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: '#9CA3AF' }]}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.achievementReward}>
            <Text style={[styles.rewardText, { color: '#F59E0B' }]}>
              +{achievement.pointsReward}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderFriendCard = (friend: Friend, index: number) => {
    return (
      <Animated.View
        key={friend.id}
        style={[
          styles.friendCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 20],
                outputRange: [0, 10],
              }),
            }],
          },
        ]}
      >
        <View style={styles.friendContent}>
          <View style={styles.friendAvatar}>
            <Text style={styles.friendAvatarText}>
              {friend.name.charAt(0).toUpperCase()}
            </Text>
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: friend.isOnline ? '#10B981' : '#6B7280' }
            ]} />
          </View>
          
          <View style={styles.friendInfo}>
            <Text style={[styles.friendName, { color: '#FFFFFF' }]}>{friend.name}</Text>
            <Text style={[styles.friendPoints, { color: '#9CA3AF' }]}>
              {friend.points.toLocaleString()} ქულა
            </Text>
            <Text style={[styles.friendStatus, { color: '#6B7280' }]}>
              {friend.isOnline ? 'ონლაინ' : friend.lastActive}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.challengeButton}
            onPress={() => Alert.alert('გამოწვევა', `გამოიწვიე ${friend.name} დუელში!`)}
          >
            <Ionicons name="flash" size={16} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const openRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setRedeemVisible(true);
  };

  const renderRewardCard = (reward: Reward, index: number) => {
    const canAfford = currentPoints >= reward.pointsRequired;
    const categoryColors = {
      discount: '#10B981',
      freebie: '#3B82F6',
      upgrade: '#F59E0B',
      bonus: '#8B5CF6'
    };

    return (
      <Animated.View
        key={reward.id}
        style={[
          styles.rewardCard,
          !reward.isAvailable && styles.unavailableReward,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 20],
                outputRange: [0, 10],
              }),
            }],
          },
        ]}
      >
        <View style={styles.rewardContent}>
          <View style={[
            styles.rewardIcon,
            { backgroundColor: categoryColors[reward.category] }
          ]}>
            <Ionicons 
              name={reward.icon as any} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          
          <View style={styles.rewardInfo}>
            <Text style={[
              styles.rewardTitle,
              { color: reward.isAvailable ? '#FFFFFF' : '#6B7280' }
            ]}>
              {reward.title}
            </Text>
            <Text style={[styles.rewardDescription, { color: '#9CA3AF' }]}>
              {reward.description}
            </Text>
            <Text style={[styles.rewardExpiry, { color: '#6B7280' }]}>
              ვადა: {reward.expiryDate}
            </Text>
          </View>
          
          <View style={styles.rewardActions}>
            <Text style={[
              styles.rewardPoints,
              { color: canAfford ? '#F59E0B' : '#6B7280' }
            ]}>
              {reward.pointsRequired} ქულა
            </Text>
            <TouchableOpacity 
              style={[
                styles.redeemButton,
                { 
                  backgroundColor: canAfford && reward.isAvailable ? 
                    categoryColors[reward.category] : 'rgba(107, 114, 128, 0.3)'
                }
              ]}
              onPress={() => {
                if (canAfford && reward.isAvailable) openRedeem(reward);
                else Alert.alert('ჯილდო', 'ამ ჯილდოსთვის საკმარისი ქულა არ გაქვს');
              }}
              disabled={!canAfford || !reward.isAvailable}
            >
              <Text style={styles.redeemButtonText}>
                {canAfford && reward.isAvailable ? 'გამოყენება' : 'მიუწვდომელი'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0F0F0F' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      
      <Animated.ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9CA3AF']}
            tintColor="#9CA3AF"
          />
        }
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { backgroundColor: '#0F0F0F' },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View>
                  <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>სულ ქულები</Text>
                  <Text style={[styles.headerSubtitle, { color: '#9CA3AF' }]}>ლოიალობის პროგრამა</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.addButton, { 
                    backgroundColor: 'rgba(55, 65, 81, 0.4)',
                    borderWidth: 1,
                    borderColor: 'rgba(156, 163, 175, 0.3)',
                    backdropFilter: 'blur(20px)',
                  }]}
                  onPress={() => setShowQRModal(true)}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>ქულების დამატება</Text>
                </TouchableOpacity>
              </View>

              {/* Balance Section */}
              <Animated.View 
                style={[
                  styles.balanceSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={[styles.balanceLabel, { color: '#9CA3AF' }]}>ხელმისაწვდომი ქულები</Text>
                <Text style={[styles.balanceAmount, { color: '#FFFFFF' }]}>{currentPoints.toLocaleString()}</Text>
                <Text style={[styles.balanceSubtext, { color: '#9CA3AF' }]}>გადაცვლას მზად</Text>
              </Animated.View>

              {/* Virtual Card */}
              <Animated.View 
                style={[
                  styles.virtualCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: cardScaleAnim },
                      { 
                        rotateY: cardRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '5deg'],
                        })
                      }
                    ],
                  },
                ]}
              >
                <View style={styles.cardBackground}>
                  <View style={styles.cardGradient} />
                  <View style={styles.cardPattern} />
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>ლოიალობა</Text>
                    <View style={styles.cardLogo}>
                      <Text style={styles.cardLogoText}>CA</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardNumber}>
                    <Text style={styles.cardNumberText}>**** **** **** 7501</Text>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.cardHolder}>
                      <Text style={styles.cardHolderLabel}>მფლობელი</Text>
                      <Text style={styles.cardHolderName}>{user?.name || 'მომხმარებელი'}</Text>
                    </View>
                    <View style={styles.cardExpiry}>
                      <Text style={styles.cardExpiryLabel}>ვადა</Text>
                      <Text style={styles.cardExpiryDate}>12/27</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </View>
          </SafeAreaView>
        </Animated.View>
        {/* Tier Progress Glass Card */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <BlurView intensity={30} tint="default" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: '#3B82F6', fontWeight: '800' }}>{tierProgress}%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#E5E7EB', fontWeight: '800' }}>სტატუსი: {vipLevel}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>შემდეგი თვალი: {nextTierPoints - currentPoints} ქულა</Text>
                <View style={{ height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                  <View style={{ width: `${tierProgress}%`, height: '100%', backgroundColor: '#3B82F6' }} />
                </View>
              </View>
              <TouchableOpacity style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)' }}>
                <Text style={{ color: '#60A5FA', fontWeight: '700', fontSize: 12 }}>დეტალები</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
        {/* Missions Carousel */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>მისიები</Text>
            <TouchableOpacity>
              <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '700' }}>ყველა</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {missions && missions.length > 0 ? (
              missions.map((m) => renderMissionItem(m as any, handleClaimMission))
            ) : (
              <View style={{ paddingVertical: 14 }}>
                <Text style={{ color: '#9CA3AF' }}>მისიები არ არის</Text>
              </View>
            )}
          </ScrollView>
        </View>
        {/* Streak & Quick Chips */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <BlurView intensity={25} tint="default" style={{ borderRadius: 14, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="flame" size={14} color="#F59E0B" />
                  <Text style={{ color: '#E5E7EB', fontWeight: '700', fontSize: 12 }}>სერია 3 დღე</Text>
                </View>
              </BlurView>
              <BlurView intensity={25} tint="default" style={{ borderRadius: 14, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="gift" size={14} color="#22C55E" />
                  <Text style={{ color: '#E5E7EB', fontWeight: '700', fontSize: 12 }}>დღევანდელი ბონუსი</Text>
                </View>
              </BlurView>
              <BlurView intensity={25} tint="default" style={{ borderRadius: 14, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="people" size={14} color="#60A5FA" />
                  <Text style={{ color: '#E5E7EB', fontWeight: '700', fontSize: 12 }}>მეგობრის მოწვევა</Text>
                </View>
              </BlurView>
            </View>
          </ScrollView>
        </View>
        {/* Tab Navigation */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollContainer}
          contentContainerStyle={styles.tabScrollContent}
        >
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'rewards' && { 
                backgroundColor: 'rgba(75, 85, 99, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(20px)',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }]}
              onPress={() => setActiveTab('rewards')}
            >
              <Ionicons 
                name="gift" 
                size={16} 
                color={activeTab === 'rewards' ? '#F59E0B' : '#9CA3AF'} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'rewards' ? '#F59E0B' : '#9CA3AF' }
              ]}>
                ჯილდოები
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'history' && { 
                backgroundColor: 'rgba(75, 85, 99, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(20px)',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }]}
              onPress={() => setActiveTab('history')}
            >
              <Ionicons 
                name="time" 
                size={16} 
                color={activeTab === 'history' ? '#F59E0B' : '#9CA3AF'} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'history' ? '#F59E0B' : '#9CA3AF' }
              ]}>
                ისტორია
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'leaderboard' && { 
                backgroundColor: 'rgba(75, 85, 99, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(20px)',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Ionicons 
                name="trophy" 
                size={16} 
                color={activeTab === 'leaderboard' ? '#F59E0B' : '#9CA3AF'} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'leaderboard' ? '#F59E0B' : '#9CA3AF' }
              ]}>
                ლიდერბორდი
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'friends' && { 
                backgroundColor: 'rgba(75, 85, 99, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(20px)',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }]}
              onPress={() => setActiveTab('friends')}
            >
              <Ionicons 
                name="people" 
                size={16} 
                color={activeTab === 'friends' ? '#F59E0B' : '#9CA3AF'} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'friends' ? '#F59E0B' : '#9CA3AF' }
              ]}>
                მეგობრები
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'achievements' && { 
                backgroundColor: 'rgba(75, 85, 99, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(20px)',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }]}
              onPress={() => setActiveTab('achievements')}
            >
              <Ionicons 
                name="star" 
                size={16} 
                color={activeTab === 'achievements' ? '#F59E0B' : '#9CA3AF'} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'achievements' ? '#F59E0B' : '#9CA3AF' }
              ]}>
                მიღწევები
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {activeTab === 'rewards' ? (
          <View style={styles.rewardsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>ჯილდოები</Text>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => handleSocialShare('points')}
              >
                <Ionicons name="share-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.rewardsGrid}>
              {rewards && rewards.length > 0 ? (
                rewards.map((reward, index) => renderRewardCard(reward as any, index))
              ) : (
                <Text style={{ color: '#9CA3AF' }}>ჯილდოები არ არის</Text>
              )}
            </View>
          </View>
        ) : activeTab === 'history' ? (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>ბოლო ტრანზაქციები</Text>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction, index) => renderTransactionCard(transaction as any, index))
            ) : (
              <Text style={{ color: '#9CA3AF' }}>ტრანზაქციები ჯერ არ არის</Text>
            )}
          </View>
        ) : activeTab === 'leaderboard' ? (
          <View style={styles.leaderboardContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>ლიდერბორდი</Text>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => handleSocialShare('leaderboard')}
              >
                <Ionicons name="share-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((user, index) => renderLeaderboardCard(user as any, index))
            ) : (
              <Text style={{ color: '#9CA3AF' }}>ლიდერბორდი ცარიელია</Text>
            )}
          </View>
        ) : activeTab === 'friends' ? (
          <View style={styles.friendsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>მეგობრები</Text>
              <TouchableOpacity          
                style={styles.referralButton}
                onPress={handleReferral}
              >
                <Ionicons name="person-add" size={20} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            {friends && friends.length > 0 ? (
              friends.map((friend, index) => renderFriendCard(friend as any, index))
            ) : (
              <Text style={{ color: '#9CA3AF' }}>მეგობრები არ არის</Text>
            )}
          </View>
        ) : (
          <View style={styles.achievementsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>მიღწევები</Text>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => handleSocialShare('achievement')}
              >
                <Ionicons name="share-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {achievements && achievements.length > 0 ? (
              achievements.map((achievement, index) => renderAchievementCard(achievement as any, index))
            ) : (
              <Text style={{ color: '#9CA3AF' }}>მიღწევები ჯერ არ არის</Text>
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* QR კოდის მოდალი */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: 'rgba(55, 65, 81, 0.4)' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>
                ლოიალობის ბარათი
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowQRModal(false)}
              >
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.qrContainer, { backgroundColor: 'rgba(75, 85, 99, 0.3)' }]}>
              <QRCode
                value={generateQRData()}
                size={160}
                color="#FFFFFF"
                backgroundColor="transparent"
                logoSize={20}
                logoMargin={2}
                logoBorderRadius={10}
                logoBackgroundColor="transparent"
              />
            </View>

            <View style={styles.qrActions}>
              <TouchableOpacity 
                style={[styles.qrActionButton, { 
                  backgroundColor: 'rgba(75, 85, 99, 0.4)',
                  borderWidth: 1,
                  borderColor: 'rgba(156, 163, 175, 0.3)',
                  backdropFilter: 'blur(15px)',
                }]}
                onPress={handleQRShare}
              >
                <Ionicons name="share-outline" size={16} color="#FFFFFF" />
                <Text style={[styles.qrActionText, { color: '#FFFFFF' }]}>გაზიარება</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.qrActionButton, { 
                  backgroundColor: 'rgba(75, 85, 99, 0.4)',
                  borderWidth: 1,
                  borderColor: 'rgba(156, 163, 175, 0.3)',
                  backdropFilter: 'blur(15px)',
                }]}
                onPress={() => setShowQRModal(false)}
              >
                <Ionicons name="download-outline" size={16} color="#9CA3AF" />
                <Text style={[styles.qrActionText, { color: '#9CA3AF' }]}>შენახვა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    position: 'relative',
    zIndex: 1000,
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabScrollContainer: {
    marginTop: 20,
    marginBottom: 20,
    height: 60,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    backdropFilter: 'blur(25px)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    height: 52,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    minWidth: 100,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    height: 44,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  rewardsContainer: {
    padding: 20,
  },
  leaderboardContainer: {
    padding: 20,
  },
  friendsContainer: {
    padding: 20,
  },
  achievementsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  shareButton: {
    padding: 8,
  },
  referralButton: {
    padding: 8,
  },
  rewardsGrid: {
    gap: 12,
  },
  historyContainer: {
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionCard: {
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  transactionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionDescription: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionService: {
    fontSize: 11,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 9,
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    maxWidth: width - 40,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    backdropFilter: 'blur(25px)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(15px)',
  },
  qrActions: {
    flexDirection: 'row',
    gap: 12,
  },
  qrActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  qrActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Virtual Card Styles
  virtualCard: {
    width: width - 40,
    height: 200,
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    backdropFilter: 'blur(20px)',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(75, 85, 99, 0.2)',
    borderRadius: 20,
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cardLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  cardLogoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardNumber: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cardNumberText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolder: {
    flex: 1,
  },
  cardHolderLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardExpiry: {
    alignItems: 'flex-end',
  },
  cardExpiryLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  cardExpiryDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Leaderboard Styles
  leaderboardCard: {
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(20px)',
  },
  currentUserCard: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(75, 85, 99, 0.4)',
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  userPoints: {
    fontSize: 11,
    fontWeight: '500',
  },
  trophyContainer: {
    padding: 8,
  },
  // Achievement Styles
  achievementCard: {
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(20px)',
  },
  unlockedAchievement: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(75, 85, 99, 0.4)',
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 9,
    fontWeight: '500',
  },
  achievementReward: {
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Friend Styles
  friendCard: {
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(20px)',
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  friendAvatar: {
    position: 'relative',
  },
  friendAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0F0F0F',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendPoints: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 9,
    fontWeight: '500',
  },
  challengeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  // Reward Styles
  rewardCard: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  unavailableReward: {
    opacity: 0.6,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  rewardExpiry: {
    fontSize: 9,
    fontWeight: '500',
  },
  rewardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  rewardPoints: {
    fontSize: 12,
    fontWeight: '700',
  },
  redeemButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  redeemButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});