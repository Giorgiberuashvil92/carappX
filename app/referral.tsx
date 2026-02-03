import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Clipboard,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { referralsApi } from '../services/referralsApi';

const { width } = Dimensions.get('window');

export default function ReferralScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { success, error } = useToast();
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<
    Array<{
      userId: string;
      name: string;
      points: number;
      rank: number;
      referrals: number;
      isCurrentUser: boolean;
      createdAt: number;
    }>
  >([]);
  const [leaderboardOffset, setLeaderboardOffset] = useState(0);
  const [hasMoreLeaderboard, setHasMoreLeaderboard] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showInfoCard, setShowInfoCard] = useState(true);
  const [referralHistory, setReferralHistory] = useState<{
    inviterId: string;
    inviterName: string;
    referralCode: string;
    totalReferrals: number;
    history: Array<{
      referralId: string;
      inviteeId: string;
      inviteeName: string;
      appliedAt: number;
      appliedAtFormatted: string;
      subscriptionEnabled: boolean;
      rewardsGranted: boolean;
      firstBookingAt?: number;
      firstBookingAtFormatted?: string;
      createdAt: Date;
      updatedAt: Date;
      daysSinceApplied: number;
    }>;
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      console.log('🔄 [FRONTEND] useEffect triggered, loading referral data for user:', user.id);
      loadReferralData(true);
    } else {
      console.log('⚠️ [FRONTEND] useEffect: No user ID available');
    }
  }, [user?.id]);

  // დალოგვა როცა leaderboard state იცვლება
  useEffect(() => {
    console.log('📋 [FRONTEND] Leaderboard State Changed:', {
      leaderboardLength: leaderboard.length,
      leaderboardEntries: leaderboard.map((entry) => ({
        rank: entry.rank,
        name: entry.name,
        points: entry.points,
        referrals: entry.referrals,
        isCurrentUser: entry.isCurrentUser,
      })),
      hasMore: hasMoreLeaderboard,
      offset: leaderboardOffset,
      stats: stats ? {
        totalReferrals: stats.totalReferrals,
        totalPointsEarned: stats.totalPointsEarned,
        referralCode: stats.referralCode,
      } : null,
    });
  }, [leaderboard, hasMoreLeaderboard, leaderboardOffset, stats]);

  const loadReferralData = async (reset: boolean = false) => {
    if (!user?.id) return;
    
    try {
      if (reset) {
        setLoading(true);
        setLeaderboardOffset(0);
        setHasMoreLeaderboard(true);
      }
      
      const offset = reset ? 0 : leaderboardOffset;
      
      console.log('🏆 [FRONTEND] ლიდერბორდის მოთხოვნა:', {
        userId: user.id,
        reset,
        offset,
        limit: 20,
      });
      
      const [code, referralStats, leaderboardResponse, history] = await Promise.all([
        referralsApi.getReferralCode(user.id),
        referralsApi.getReferralStats(user.id),
        referralsApi.getReferralLeaderboard(user.id, 20, offset),
        referralsApi.getUserReferralHistory(user.id).catch(() => null), // თუ არ მუშაობს, null-ს დავაბრუნებთ
      ]);
      
      console.log('📥 [FRONTEND] Backend Response:', {
        referralCode: code,
        stats: referralStats,
        leaderboardResponse: {
          total: leaderboardResponse.total,
          hasMore: leaderboardResponse.hasMore,
          leaderboardCount: leaderboardResponse.leaderboard.length,
          leaderboard: leaderboardResponse.leaderboard.map((entry) => ({
            rank: entry.rank,
            userId: entry.userId,
            name: entry.name,
            points: entry.points,
            referrals: entry.referrals,
            isCurrentUser: entry.isCurrentUser,
            createdAt: entry.createdAt,
          })),
        },
      });
      
      // დეტალური ანალიზი
      const usersWithPoints = leaderboardResponse.leaderboard.filter(e => e.points > 0).length;
      const usersWithReferrals = leaderboardResponse.leaderboard.filter(e => e.referrals > 0).length;
      const currentUserEntry = leaderboardResponse.leaderboard.find(e => e.isCurrentUser);
      
      console.log('📊 [FRONTEND] Leaderboard Analysis:', {
        totalUsers: leaderboardResponse.total,
        returnedUsers: leaderboardResponse.leaderboard.length,
        usersWithPoints,
        usersWithReferrals,
        usersWithZeroPoints: leaderboardResponse.leaderboard.length - usersWithPoints,
        top5Users: leaderboardResponse.leaderboard.slice(0, 5).map((u, idx) => ({
          rank: u.rank,
          name: u.name,
          points: u.points,
          referrals: u.referrals,
        })),
        currentUserEntry: currentUserEntry ? {
          rank: currentUserEntry.rank,
          name: currentUserEntry.name,
          points: currentUserEntry.points,
          referrals: currentUserEntry.referrals,
        } : 'Current user not found in leaderboard',
        allUsersWithPoints: leaderboardResponse.leaderboard
          .filter(e => e.points > 0)
          .map(e => ({
            rank: e.rank,
            name: e.name,
            points: e.points,
            referrals: e.referrals,
          })),
      });
      
      setReferralCode(code);
      setStats(referralStats);
      if (history) {
        setReferralHistory(history);
        console.log('📜 [FRONTEND] Referral History loaded:', {
          totalReferrals: history.totalReferrals,
          historyCount: history.history.length,
          history: history.history.map((h) => ({
            inviteeName: h.inviteeName,
            appliedAt: h.appliedAtFormatted,
            rewardsGranted: h.rewardsGranted,
          })),
        });
      }
      
      if (reset) {
        setLeaderboard(leaderboardResponse.leaderboard);
        console.log('✅ [FRONTEND] Leaderboard reset with', leaderboardResponse.leaderboard.length, 'entries');
      } else {
        setLeaderboard((prev) => {
          const updated = [...prev, ...leaderboardResponse.leaderboard];
          console.log('✅ [FRONTEND] Leaderboard appended, total entries:', updated.length);
          return updated;
        });
      }
      
      // Debug: log leaderboard to see what we're getting
      if (reset) {
        console.log('🏆 [FRONTEND] Leaderboard loaded:', {
          total: leaderboardResponse.leaderboard.length,
          topUser: leaderboardResponse.leaderboard[0],
          first3: leaderboardResponse.leaderboard.slice(0, 3).map(u => ({ 
            rank: u.rank,
            name: u.name, 
            points: u.points,
            referrals: u.referrals,
            isCurrentUser: u.isCurrentUser,
          })),
        });
      }
      
      setHasMoreLeaderboard(leaderboardResponse.hasMore);
      setLeaderboardOffset(offset + leaderboardResponse.leaderboard.length);
      
      console.log('📊 [FRONTEND] Leaderboard State Updated:', {
        hasMore: leaderboardResponse.hasMore,
        newOffset: offset + leaderboardResponse.leaderboard.length,
      });
    } catch (err: any) {
      console.error('Error loading referral data:', err);
      error('შეცდომა', err.message || 'რეფერალური კოდის ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreLeaderboard = async () => {
    if (!hasMoreLeaderboard || loadingMore || !user?.id) return;
    
    try {
      setLoadingMore(true);
      await loadReferralData(false);
    } catch (err: any) {
      console.error('Error loading more leaderboard:', err);
      error('შეცდომა', 'მეტი მონაცემის ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCopyCode = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
      success('კოპირებულია!', 'რეფერალური კოდი დაკოპირდა');
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    try {
      const message = `🎁 გამოიყენე ჩემი რეფერალური კოდი და მიიღე ქულები!\n\nკოდი: ${referralCode}\n\nჩამოტვირთე აპლიკაცია და გამოიყენე ეს კოდი რეგისტრაციის დროს!`;
      
      const result = await Share.share({
        message,
        title: 'რეფერალური კოდი',
      });

      if (result.action === Share.sharedAction) {
        success('გაზიარებულია!', 'რეფერალური კოდი გაზიარდა');
      }
    } catch (err: any) {
      error('შეცდომა', 'გაზიარება ვერ მოხერხდა');
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>იტვირთება...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Leaderboard Section - Main Feature */}
          {leaderboard.length > 0 && (
            <View style={styles.leaderboardSection}>
              {/* Header */}
              <View style={styles.pageHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
                  <Ionicons name="arrow-back" size={22} color="#111827" />
                </TouchableOpacity>
                <View style={styles.pageTitleContainer}>
                  <Text style={styles.pageTitle}>ლიდერბორდი</Text>
                  {leaderboard.length > 0 && leaderboard[0] && (
                    <Text style={styles.pageSubtitle}>
                      ლიდერბორდი • {leaderboard[0]?.name || 'მომხმარებელი'} #1
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={handleShare} style={styles.headerShareButton}>
                  <Ionicons name="share-social-outline" size={22} color="#111827" />
                </TouchableOpacity>
              </View>

              {leaderboard.length > 0 && leaderboard[0] && (
                <View style={styles.topUserSection}>
                  <View style={styles.topUserWinnerLabel}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                    <Text style={styles.topUserWinnerText}>მომავალი გამარჯვებული</Text>
                  </View>
                  <View style={styles.topUserContainer}>
                    <View style={styles.topUserAvatarContainer}>
                      <View style={styles.topUserAvatar}>
                        <Text style={styles.topUserAvatarText}>
                          {(user?.name || 'მ')?.charAt(0)?.toUpperCase() || 'მ'}
                        </Text>
                      </View>
                      {(() => {
                        const currentUserRank = leaderboard.findIndex(u => u.isCurrentUser) + 1;
                        return currentUserRank > 0 ? (
                          <View style={styles.topUserRankBadge}>
                            <Text style={styles.topUserRankText}>#{currentUserRank}</Text>
                          </View>
                        ) : null;
                      })()}
                    </View>
                    <View style={styles.topUserNameContainer}>
                      <Text 
                        style={styles.topUserName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {user?.name || 'მომხმარებელი'}
                      </Text>
                      <Text style={styles.topUserPoints}>
                        {stats?.totalPointsEarned || 0} ქულა
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Info Card */}
              {showInfoCard && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <View style={styles.infoCardIconContainer}>
                      <Ionicons name="information-circle" size={20} color="#6366F1" />
                    </View>
                    <Text style={styles.infoCardTitle}>როგორ მუშაობს?</Text>
                    <TouchableOpacity 
                      onPress={() => setShowInfoCard(false)} 
                      style={styles.infoCardCloseButton}
                    >
                      <Ionicons name="close" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.infoCardContent}>
                    <View style={styles.infoItem}>
                      <Ionicons name="gift" size={16} color="#8B5CF6" />
                      <Text style={styles.infoText}>
                        გაუზიარე კოდი მეგობრებს
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.infoText}>
                        მიიღე <Text style={styles.infoHighlight}>100 ქულა</Text> რეგისტრაციისთვის, 
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="trophy" size={16} color="#10B981" />
                      <Text style={styles.infoText}>
                        მოიგე <Text style={styles.infoHighlight}>200 ლიტრი ბენზინი</Text> ლიდერბორდში #1-ისთვის
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Quick Code & Share */}
              <View style={styles.quickActionsSection}>
                <View style={styles.quickCodeCard}>
                  <View style={styles.quickCodeRow}>
                    <Text style={styles.quickCodeText}>{referralCode}</Text>
                    <TouchableOpacity onPress={handleCopyCode} style={styles.quickCopyButton}>
                      <Ionicons name="copy-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                {stats && (
                  <View style={styles.quickStatsCard}>
                    <View style={styles.quickStatItem}>
                      <Ionicons name="people" size={16} color="#8B5CF6" />
                      <Text style={styles.quickStatLabel}>მოწვეული</Text>
                      <Text style={styles.quickStatValue}>{stats.totalReferrals}</Text>
                    </View>
                    <View style={styles.quickStatDivider} />
                    <View style={styles.quickStatItem}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.quickStatLabel}>ქულა</Text>
                      <Text style={styles.quickStatValue}>{stats.totalPointsEarned}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Leaderboard List */}
              <View style={styles.leaderboardListContainer}>
                {(() => {
                  console.log('🎨 [FRONTEND] Rendering Leaderboard:', {
                    leaderboardLength: leaderboard.length,
                    entriesToRender: leaderboard.map((e) => ({
                      rank: e.rank,
                      name: e.name,
                      points: e.points,
                      referrals: e.referrals,
                      isCurrentUser: e.isCurrentUser,
                    })),
                  });
                  return null;
                })()}
                <View style={styles.leaderboardList}>
                  {leaderboard.map((entry, index) => {
                    if (index < 3) {
                      console.log(`🎯 [FRONTEND] Rendering entry ${index + 1}:`, {
                        rank: entry.rank,
                        name: entry.name,
                        points: entry.points,
                        referrals: entry.referrals,
                        isCurrentUser: entry.isCurrentUser,
                      });
                    }
                    return (
                    <View
                      key={entry.userId}
                      style={[
                        styles.leaderboardItem,
                        entry.isCurrentUser && styles.leaderboardItemCurrent,
                      ]}
                    >
                      {entry.rank === 2 ? (
                        <Ionicons name="trophy" size={20} color="#F59E0B" />
                      ) : (
                        <View style={styles.rankCircle}>
                          <Text style={styles.rankCircleText}>{entry.rank}</Text>
                        </View>
                      )}
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {entry.name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text
                          style={[
                            styles.userName,
                            entry.isCurrentUser && styles.userNameCurrent,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {entry.name}
                        </Text>
                      </View>
                      <Text style={styles.userPoints}>
                        {entry.points} <Text style={styles.pointsLabel}>ქულა</Text>
                      </Text>
                    </View>
                    );
                  })}
                </View>
                
                {/* Load More Button */}
                {hasMoreLeaderboard && (
                  <View style={styles.loadMoreContainer}>
                    {loadingMore ? (
                      <ActivityIndicator size="small" color="#8B5CF6" />
                    ) : (
                      <TouchableOpacity
                        onPress={loadMoreLeaderboard}
                        style={styles.loadMoreButton}
                      >
                        <Text style={styles.loadMoreText}>მეტის ჩატვირთვა</Text>
                        <Ionicons name="chevron-down" size={18} color="#8B5CF6" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'NotoSans_400Regular',
  },
  leaderboardSection: {
    paddingTop: 8,
    marginBottom: 24,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  headerShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  rulesSection: {
    gap: 20,
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 8,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  ruleCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  ruleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 17,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
    lineHeight: 22,
  },
  pointsList: {
    gap: 12,
    marginTop: 4,
  },
  pointItem: {
    flexDirection: 'row',
    gap: 12,
  },
  pointBullet: {
    marginTop: 2,
  },
  pointContent: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  pointText: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  pointHighlight: {
    fontFamily: 'NotoSans_700Bold',
    color: '#8B5CF6',
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  prizeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#92400E',
    lineHeight: 20,
  },
  prizeHighlight: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 15,
  },
  tipsList: {
    gap: 10,
    marginTop: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  tipText: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
    flex: 1,
  },
  warningList: {
    gap: 12,
    marginTop: 4,
  },
  warningItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  warningHighlight: {
    fontFamily: 'NotoSans_700Bold',
    color: '#DC2626',
  },
  topUserSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  topUserWinnerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  topUserWinnerText: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  topUserContainer: {
    alignItems: 'center',
  },
  topUserAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  topUserAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  topUserAvatarText: {
    fontSize: 48,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  topUserRankBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  topUserRankText: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  topUserNameContainer: {
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
    maxWidth: '90%',
    alignSelf: 'center',
  },
  topUserName: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 4,
    fontStyle: 'italic',
    maxWidth: '100%',
    textAlign: 'center',
  },
  topUserPoints: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  infoCardCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  infoHighlight: {
    fontFamily: 'NotoSans_700Bold',
    color: '#6366F1',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  quickCodeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickCodeLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: 'black',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '90%',
    fontWeight: '500',

  },
  quickCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickCodeText: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    letterSpacing: 1.5,
  },
  quickCopyButton: {
    padding: 4,
  },
  quickStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  quickStatValue: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  leaderboardListContainer: {
    paddingHorizontal: 20,
  },
  leaderboardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'visible', // Changed from 'hidden' to 'visible' to allow scrolling
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  leaderboardItemCurrent: {
    backgroundColor: '#F9FAFB',
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  rankCircleText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    width: '100%',
  },
  userNameCurrent: {
    color: '#8B5CF6',
  },
  userPoints: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    flexShrink: 0,
    marginLeft: 'auto',
    textAlign: 'right',
    minWidth: 60,
  },
  pointsLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: '#6B7280',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadMoreText: {
    fontSize: 15,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#8B5CF6',
  },
});
