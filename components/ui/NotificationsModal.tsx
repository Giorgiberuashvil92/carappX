import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import API_BASE_URL from '../../config/api';
import { useUser } from '../../contexts/UserContext';

const { width, height } = Dimensions.get('window');

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

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsModal({ visible, onClose }: Props) {
  const router = useRouter();
  const { user, setShouldOpenPremiumModal } = useUser();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'business' | 'user'>('user');

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

  const load = async () => {
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
        const target = n.target || {};
        const payloadData = payload.data || n.data || {};
        return {
          id: String(n._id || n.id),
          title: String(payload.title || n.title || 'შეტყობინება'),
          message: String(payload.body || n.body || n.message || ''),
          type: String(n.type || n.category || 'info'),
          createdAt: ts,
          isRead: status === 'read',
          data: {
            ...payloadData,
            target: target, // დავამატოთ target ინფორმაცია
            // დავამატოთ requestId/offerId სხვადასხვა ველებიდან
            requestId: payloadData.requestId || payloadData.reqId || payloadData.request_id,
            offerId: payloadData.offerId || payloadData.offer_id,
            screen: payloadData.screen,
            chatId: payloadData.chatId || payloadData.chat_id,
            carwashId: payloadData.carwashId || payloadData.carwash_id,
          },
        };
      });
      mapped.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(mapped);
    } catch {}
  };

  useEffect(() => {
    if (visible) load();
  }, [visible, user?.id]);

  const markAsRead = async (id: string) => {
    try { await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' }); } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNavigation = (notification: NotificationItem) => {
    const d = notification.data || {};
    const screen = d.screen as string | undefined;
    const requestId = d.requestId as string | undefined;
    const offerId = d.offerId as string | undefined;
    const carwashId = d.carwashId as string | undefined;
    const chatId = d.chatId as string | undefined;
    const target = d.target || {};
    
    // დალოგე notification-ის მონაცემები
    console.log('🔔 [NOTIFICATIONS] Navigation clicked:', {
      notificationId: notification.id,
      notificationType: notification.type,
      notificationTitle: notification.title,
      screen,
      requestId,
      offerId,
      chatId,
      carwashId,
      target,
      fullData: d,
    });
    
    // ვალიდაცია: თუ requestId/offerId არ არის, ვერ გადავიდეთ offers/partner-chat გვერდებზე
    const isValidId = (id: string | undefined): boolean => {
      if (!id) return false;
      const str = String(id).trim();
      return str !== '' && str !== 'undefined' && str !== 'null' && str !== '1' && str.length > 0;
    };
    
    const hasValidRequestId = isValidId(requestId);
    const hasValidOfferId = isValidId(offerId);
    
    console.log('🔔 [NOTIFICATIONS] Validation:', {
      hasValidRequestId,
      hasValidOfferId,
      requestIdValue: requestId,
      offerIdValue: offerId,
    });
    
    const isBusiness = target.partnerId || target.storeId || target.dismantlerId || 
                       target.role === 'partner' || target.role === 'store' || target.role === 'dismantler';
    
    // notification type-ის მიხედვითაც შევამოწმოთ
    const isBusinessType = notification.type === 'offer' && isBusiness;
    const isUserType = notification.type === 'request' || (notification.type === 'offer' && !isBusiness);
    
    console.log('🔔 [NOTIFICATIONS] Navigation logic:', {
      isBusiness,
      isBusinessType,
      isUserType,
      notificationType: notification.type,
    });
    
    if (screen === 'Subscription' || notification.type === 'subscription_activated' || screen === "subscription_activated" || d.type === 'subscription_activated') {
      onClose();
      console.log('🔔 [NOTIFICATIONS] Navigating to home with premium modal');
      router.push('/' as any);
      setShouldOpenPremiumModal(true);
      return;
    }
    
    // Garage reminder-ებისთვის
    if (screen === 'Garage' || d.type === 'garage_reminder') {
      onClose();
      console.log('🔔 [NOTIFICATIONS] Navigating to Garage');
      router.push('/(tabs)/garage' as any);
      return;
    }
    
    // New Offer-ისთვის
    if (d.type === 'new_offer' || notification.type === 'offer' && !isBusiness) {
      onClose();
      console.log('🔔 [NOTIFICATIONS] Navigating to Offers');
      router.push('/offers' as any);
      return;
    }
    
    onClose();
    
    // ბიზნესის ნოტიფიკაციებისთვის
    if (isBusiness || isBusinessType) {
      let route = '';
      if (screen === 'RequestDetails' && hasValidRequestId) {
        route = `/partner-chat/${requestId}`;
      } else if (screen === 'OfferDetails' && (hasValidOfferId || hasValidRequestId)) {
        route = `/partner-chat/${hasValidOfferId ? offerId : requestId}`;
      } else if (screen === 'Chat' && (chatId || hasValidOfferId || hasValidRequestId)) {
        route = `/partner-chat/${chatId || offerId || requestId}`;
      } else if (target.storeId || target.dismantlerId) {
        route = '/partner-dashboard';
      } else if (hasValidRequestId || hasValidOfferId) {
        route = `/partner-chat/${requestId || offerId}`;
      } else {
        route = '/partner-chats';
      }
      console.log('🔔 [NOTIFICATIONS] Navigating to BUSINESS route:', route);
      router.push(route as any);
    } 
    // იუზერის ნოტიფიკაციებისთვის
    else if (isUserType || !isBusiness) {
      let route = '';
      if (screen === 'AIRecommendations' || screen === 'PartDetails') {
        route = '/all-requests';
      } else if (screen === 'RequestDetails' && hasValidRequestId) {
        route = `/offers/${requestId}`;
      } else if (screen === 'OfferDetails' && hasValidRequestId) {
        // OfferDetails-ისთვის ყოველთვის requestId-ს ვიყენებთ, რადგან /offers/[requestId] გვერდი ელის requestId-ს
        route = `/offers/${requestId}`;
      } else if (screen === 'Bookings' && carwashId) {
        route = `/bookings/${carwashId}`;
      } else if (screen === 'Chat' && (chatId || hasValidOfferId)) {
        route = `/chat/${chatId || offerId}`;
      } else if (hasValidRequestId) {
        // ყოველთვის requestId-ს ვიყენებთ /offers გვერდისთვის
        route = `/offers/${requestId}`;
      } else {
        // თუ requestId არ არის, უბრალოდ all-requests-ზე გადავიდეთ
        route = '/all-requests';
      }
      console.log('🔔 [NOTIFICATIONS] Navigating to USER route:', route);
      router.push(route as any);
    } 
    // სისტემური და სხვა ნოტიფიკაციები
    else {
      // თუ სპეციფიკური route არ არის, უბრალოდ მოდალს ვხურავთ
      // რათა არ მოხდეს უსასრულო მარყუჟი
      console.log('🔔 [NOTIFICATIONS] No specific route, closing modal');
      return;
    }
  };

  const handleViewAll = () => {
    onClose();
    router.push('/notifications');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        
        {/* Glassmorphism Modal Card */}
        <View style={styles.modalCard}>
          <View style={styles.modalGradient}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerStrip} />
              <View style={styles.headerContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>შეტყობინებები</Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.notificationsList}>
                {notifications.slice(0, 5).map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.isRead && styles.unreadCard
                    ]}
                    onPress={() => {
                      markAsRead(notification.id);
                      handleNavigation(notification);
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
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.timestamp}>
                          {formatTimeAgo(notification.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
                <Text style={styles.viewAllButtonText}>ყველა შეტყობინება</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  modalGradient: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerStrip: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    fontFamily: 'Outfit',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationsList: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  unreadCard: {
    borderColor: '#6366F1',
    borderWidth: 1.5,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
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
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
    marginBottom: 6,
    fontFamily: 'Outfit',
  },
  timestamp: {
    fontSize: 10,
    color: '#A1A1AA',
    fontFamily: 'Outfit',
  },
  
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.25)',
  },
  viewAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    fontFamily: 'Outfit',
  },
});

export default NotificationsModal;
