import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import API_BASE_URL from '../../config/api';

const { width } = Dimensions.get('window');

type AnyObject = { [key: string]: any };
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: number;
  isRead: boolean;
  data?: AnyObject;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'chat' | 'offer' | 'booking' | 'system'>('all');
  const [displayCount, setDisplayCount] = useState(20);

  const [refreshing, setRefreshing] = useState(false);

  const formatTimeAgo = (ts: number) => {
    const now = Date.now();
    const diff = Math.max(0, now - ts);
    const m = Math.floor(diff / (1000 * 60));
    const h = Math.floor(diff / (1000 * 60 * 60));
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (m < 1) return 'ახლა';
    if (m < 60) return `${m} წთ წინ`;
    if (h < 24) return `${h} სთ წინ`;
    if (d < 7) return `${d} დღე წინ`;
    if (d < 30) return `${Math.floor(d / 7)} კვირა წინ`;
    if (d < 365) return `${Math.floor(d / 30)} თვე წინ`;
    return `${Math.floor(d / 365)} წელი წინ`;
  };

  const loadNotifications = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`${API_BASE_URL}/notifications/user/${user.id}`);
      if (!res.ok) return;
      const json = await res.json();
      const list: AnyObject[] = Array.isArray(json?.data) ? json.data : [];
      const mapped: NotificationItem[] = list.map((n: AnyObject) => {
        const rawTs = n.createdAt || n.timestamp;
        const ts = typeof rawTs === 'number' ? rawTs : rawTs ? new Date(rawTs).getTime() : Date.now();
        const status = typeof n.status === 'string' ? n.status.toLowerCase() : (n.read ? 'read' : '');
        const payload = n.payload || {};
        return {
          id: String(n._id || n.id),
          title: String(payload.title || n.title || 'შეტყობინება'),
          message: String(payload.body || n.body || n.message || ''),
          type: String(n.type || n.category || 'info'),
          createdAt: ts,
          isRead: status === 'read',
          data: payload.data || n.data || {},
        };
      });
      // newest first
      mapped.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(mapped);
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    try { await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' }); } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    const ids = notifications.filter(n => !n.isRead).map(n => n.id);
    await Promise.all(ids.map(id => fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' })));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat_message': return 'chatbubble-ellipses';
      case 'offer_status': return 'pricetag';
      case 'carwash_booking': return 'water';
      case 'carwash_booking_confirmed': return 'checkmark-circle';
      case 'carwash_booking_reminder': return 'alarm';
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      default: return 'notifications';
    }
  };

  const getIconPalette = (type: string) => {
    switch (type) {
      case 'chat_message':
        return { bg: '#DBEAFE', border: '#93C5FD', color: '#1D4ED8' };
      case 'offer_status':
        return { bg: '#EDE9FE', border: '#C4B5FD', color: '#6D28D9' };
      case 'carwash_booking':
        return { bg: '#DCFCE7', border: '#86EFAC', color: '#16A34A' };
      case 'carwash_booking_confirmed':
        return { bg: '#DCFCE7', border: '#86EFAC', color: '#16A34A' };
      case 'carwash_booking_reminder':
        return { bg: '#FEF3C7', border: '#FCD34D', color: '#D97706' };
      case 'success':
        return { bg: '#DCFCE7', border: '#86EFAC', color: '#16A34A' };
      case 'warning':
        return { bg: '#FEF3C7', border: '#FCD34D', color: '#D97706' };
      case 'error':
        return { bg: '#FEE2E2', border: '#FCA5A5', color: '#DC2626' };
      default:
        return { bg: '#E5E7EB', border: '#D1D5DB', color: '#374151' };
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    if (filter === 'chat') return notifications.filter(n => n.type === 'chat_message');
    if (filter === 'offer') return notifications.filter(n => n.type === 'offer_status');
    if (filter === 'booking') return notifications.filter(n => (
      n.type === 'carwash_booking' || n.type === 'carwash_booking_confirmed' || n.type === 'carwash_booking_reminder'
    ));
    return notifications.filter(n => (
      n.type !== 'chat_message' && n.type !== 'offer_status' &&
      n.type !== 'carwash_booking' && n.type !== 'carwash_booking_confirmed' && n.type !== 'carwash_booking_reminder'
    ));
  }, [notifications, filter]);

  const limited = useMemo(() => filtered.slice(0, displayCount), [filtered, displayCount]);

  const groupLabel = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.floor((startOfDay(today) - startOfDay(d)) / (1000*60*60*24));
    if (diffDays === 0) return 'დღეს';
    if (diffDays === 1) return 'გუშინ';
    if (diffDays < 7) return 'ბოლო 7 დღე';
    return d.toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const grouped = useMemo(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const n of limited) {
      const label = groupLabel(n.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    return Array.from(map.entries()).map(([title, items]) => ({ title, items }));
  }, [limited]);

  const handleNavigation = (data?: AnyObject) => {
    const d = data || {};
    const screen = d.screen as string | undefined;
    const requestId = d.requestId as string | undefined;
    const offerId = d.offerId as string | undefined;
    const carwashId = d.carwashId as string | undefined;
    const chatId = d.chatId as string | undefined;
    if (screen === 'AIRecommendations' || screen === 'PartDetails') {
      router.push('/offers');
    } else if (screen === 'RequestDetails' && requestId) {
      router.push(`/offers/${requestId}`);
    } else if (screen === 'OfferDetails' && (offerId || requestId)) {
      router.push(`/offers/${offerId || requestId}`);
    } else if (screen === 'Bookings' && carwashId) {
      router.push(`/bookings/${carwashId}`);
    } else if (screen === 'Chat' && (chatId || offerId)) {
      router.push(`/chat/${chatId || offerId}`);
    } else {
      // fallback details
      router.push('/notifications');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#111827', '#0B1220']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>შეტყობინებები</Text>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllText}>ყველა წაკითხული</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {unreadCount} ახალი შეტყობინება
            </Text>
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {([
          { key: 'all', label: 'ყველა' },
          { key: 'unread', label: 'არაკითხული' },
          { key: 'chat', label: 'ჩათი' },
          { key: 'offer', label: 'შეთავ.' },
          { key: 'booking', label: 'ჯავშ.' },
          { key: 'system', label: 'სისტემა' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, filter === tab.key && styles.filterChipActive]}
            onPress={() => { setFilter(tab.key); setDisplayCount(20); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === tab.key && styles.filterChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {grouped.map(section => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionTitleText}>{section.title}</Text>
            {section.items.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.isRead && styles.unreadCard
                ]}
                onPress={() => {
                  markAsRead(notification.id);
                  handleNavigation(notification.data);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.notificationContent}>
                  {(() => { const p = getIconPalette(notification.type); return (
                    <View style={[
                      styles.iconContainer,
                      { backgroundColor: p.bg, borderColor: p.border }
                    ]}>
                      <Ionicons 
                        name={getNotificationIcon(notification.type) as any} 
                        size={20} 
                        color={p.color} 
                      />
                    </View>
                  ); })()}
                  
                  <View style={styles.notificationText}>
                    <View style={styles.titleRow}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.isRead && styles.unreadTitle
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.timestamp}>
                      {formatTimeAgo(notification.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {filtered.length > displayCount && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => setDisplayCount(c => c + 20)}
            activeOpacity={0.8}
          >
            <Text style={styles.loadMoreText}>მეტის ჩატვირთვა</Text>
          </TouchableOpacity>
        )}
        
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>შეტყობინებები არ არის</Text>
            <Text style={styles.emptySubtitle}>
              ახალი შეტყობინებები აქ გამოჩნდება
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(17,24,39,0.35)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.25)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    fontFamily: 'Inter',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    fontFamily: 'Inter',
  },
  unreadBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderColor: '#6366F1',
  },
  filterChipText: {
    color: '#E5E7EB',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionBlock: {
    paddingTop: 8,
  },
  sectionTitleText: {
    color: '#94A3B8',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  loadMoreText: {
    color: '#F8FAFC',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
  },
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.30)',
  },
  unreadCard: {
    borderColor: '#6366F1',
    borderWidth: 1.5,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  notificationText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    fontFamily: 'Inter',
    flex: 1,
  },
  unreadTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  timestamp: {
    fontSize: 12,
    color: '#A1A1AA',
    fontFamily: 'Inter',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});


