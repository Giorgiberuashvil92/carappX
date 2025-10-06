import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Hide default header for this screen
export const options = {
  headerShown: false,
};

export default function NotificationDetailsScreen() {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'related'>('details');
  
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    message?: string;
    type?: string;
    timestamp?: string;
    actionLabel?: string;
    actionRoute?: string;
  }>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const colorByType: Record<string, { primary: string; light: string; gradient: string[] }> = {
    success: { 
      primary: '#10B981', 
      light: 'rgba(16, 185, 129, 0.2)',
      gradient: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)']
    },
    warning: { 
      primary: '#F59E0B', 
      light: 'rgba(245, 158, 11, 0.2)',
      gradient: ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.1)']
    },
    error: { 
      primary: '#EF4444', 
      light: 'rgba(239, 68, 68, 0.2)',
      gradient: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']
    },
    info: { 
      primary: '#6366F1', 
      light: 'rgba(99, 102, 241, 0.2)',
      gradient: ['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.1)']
    },
  };

  const iconByType: Record<string, any> = {
    success: 'checkmark-circle',
    warning: 'warning',
    error: 'alert-circle',
    info: 'information-circle',
  };

  const type = params.type ?? 'info';
  const colors = colorByType[type] ?? colorByType.info;
  const icon = iconByType[type] ?? 'information-circle';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${params.title || 'შეტყობინება'}\n\n${params.message || ''}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#E5E7EB" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setBookmarked(!bookmarked)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={bookmarked ? "bookmark" : "bookmark-outline"} 
                  size={18} 
                  color={bookmarked ? colors.primary : "#9CA3AF"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Badge */}
          <View style={styles.heroSection}>
            <View style={[styles.heroIconContainer, { backgroundColor: colors.light }]}>
              <Ionicons name={icon} size={36} color={colors.primary} />
            </View>

            <View style={[styles.typeBadge, { backgroundColor: colors.light, borderColor: colors.primary }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                {type.toUpperCase()}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View 
          style={[
            styles.titleSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.mainTitle}>
            {params.title || 'შეტყობინება'}
          </Text>

          {params.timestamp && (
            <View style={styles.timestampRow}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.timestampText}>{params.timestamp}</Text>
            </View>
          )}
        </Animated.View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              დეტალები
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'actions' && styles.activeTab]}
            onPress={() => setActiveTab('actions')}
          >
            <Text style={[styles.tabText, activeTab === 'actions' && styles.activeTabText]}>
              მოქმედებები
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'related' && styles.activeTab]}
            onPress={() => setActiveTab('related')}
          >
            <Text style={[styles.tabText, activeTab === 'related' && styles.activeTabText]}>
              დაკავშირებული
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Content based on active tab */}
        {activeTab === 'details' && (
          <>
            {/* Main Content Card */}
            <Animated.View 
              style={[
                styles.contentCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text style={styles.cardHeaderText}>შეტყობინების დეტალები</Text>
              </View>
              
              <Text style={styles.messageText}>
                {params.message || 'მოკლე შეტყობინება სერვისის ან სისტემური სტატუსის შესახებ. აქ შეგიძლიათ იხილოთ დამატებითი დეტალები და მნიშვნელოვანი ინფორმაცია ნოტიფიკაციის შესახებ.'}
              </Text>

              <View style={styles.divider} />

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                <View style={[styles.infoCard, { backgroundColor: colors.light }]}>
                  <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                  <Text style={styles.infoCardLabel}>ტიპი</Text>
                  <Text style={[styles.infoCardValue, { color: colors.primary }]}>
                    {type}
                  </Text>
                </View>

                {params.id && (
                  <View style={styles.infoCard}>
                    <Ionicons name="finger-print-outline" size={18} color="#6B7280" />
                    <Text style={styles.infoCardLabel}>ID</Text>
                    <Text style={styles.infoCardValue}>#{params.id.slice(0, 8)}</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Engagement Stats */}
            <Animated.View 
              style={[
                styles.statsCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.statItem}>
                <TouchableOpacity 
                  onPress={() => setLiked(!liked)}
                  activeOpacity={0.7}
                  style={styles.statButton}
                >
                  <Ionicons 
                    name={liked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={liked ? "#EF4444" : "#6B7280"} 
                  />
                  <Text style={styles.statText}>{liked ? 48 : 47}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={styles.statButton}>
                  <Ionicons name="eye-outline" size={20} color="#6B7280" />
                  <Text style={styles.statText}>234</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={styles.statButton}>
                  <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                  <Text style={styles.statText}>12</Text>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {activeTab === 'actions' && (
          <Animated.View 
            style={[
              styles.actionsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {params.actionRoute && (
              <TouchableOpacity
                style={[styles.primaryActionCard, { backgroundColor: colors.light, borderColor: colors.primary }]}
                onPress={() => router.push(params.actionRoute as any)}
                activeOpacity={0.85}
              >
                <View style={styles.actionCardContent}>
                  <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.actionTextContent}>
                    <Text style={styles.actionTitle}>
                      {params.actionLabel || 'გაგრძელება'}
                    </Text>
                    <Text style={styles.actionSubtitle}>აღმოაჩინეთ მეტი</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryActionCard} activeOpacity={0.7}>
              <Ionicons name="flag-outline" size={18} color="#9CA3AF" />
              <Text style={styles.secondaryActionText}>მოხსენება</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionCard} activeOpacity={0.7}>
              <Ionicons name="notifications-off-outline" size={18} color="#9CA3AF" />
              <Text style={styles.secondaryActionText}>გამორთვა</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionCard} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.secondaryActionText, { color: '#EF4444' }]}>წაშლა</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {activeTab === 'related' && (
          <Animated.View 
            style={[
              styles.relatedSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>დაკავშირებული შეტყობინებები</Text>
            
            {[1, 2, 3].map((item) => (
              <TouchableOpacity 
                key={item}
                style={styles.relatedCard}
                activeOpacity={0.7}
              >
                <View style={[styles.relatedIcon, { backgroundColor: colors.light }]}>
                  <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.relatedContent}>
                  <Text style={styles.relatedTitle}>დაკავშირებული შეტყობინება #{item}</Text>
                  <Text style={styles.relatedSubtitle}>2 საათის წინ</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#4B5563" />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    gap: 16,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 12,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timestampText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#6366F1',
  },
  contentCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statButton: {
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  actionsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContent: {
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  secondaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  relatedSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  relatedIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedContent: {
    flex: 1,
    gap: 4,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  relatedSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});