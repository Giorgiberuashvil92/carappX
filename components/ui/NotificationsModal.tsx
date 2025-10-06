import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
  action?: {
    label: string;
    route: string;
  };
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsModal({ visible, onClose }: Props) {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'ჯავშნის შეხსენება',
      message: 'თქვენი მანქანის სერვისი დაგეგმილია ხვალ 14:00-ზე',
      type: 'info',
      timestamp: '2 საათის წინ',
      isRead: false,
      action: {
        label: 'დეტალურად',
        route: '/booking/123'
      }
    },
    {
      id: '2',
      title: 'ფასდაკლება',
      message: 'AutoClean Pro-ში 20% ფასდაკლება ყველა სერვისზე',
      type: 'success',
      timestamp: '4 საათის წინ',
      isRead: false,
      action: {
        label: 'გამოყენება',
        route: '/carwash/autoclean-pro'
      }
    },
    {
      id: '3',
      title: 'მიღწევა',
      message: 'გილოცავთ! მიიღეთ "ლოიალური მომხმარებელი" ბეჯი',
      type: 'success',
      timestamp: '1 დღის წინ',
      isRead: true,
      action: {
        label: 'ჯილდოები',
        route: '/(tabs)/loyalty'
      }
    },
    {
      id: '4',
      title: 'შეხსენება',
      message: 'თქვენი მანქანის ზეთის შეცვლის დროა',
      type: 'warning',
      timestamp: '2 დღის წინ',
      isRead: true,
      action: {
        label: 'ჯავშნა',
        route: '/booking'
      }
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
                {notifications.slice(0, 3).map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.isRead && styles.unreadCard
                    ]}
                    onPress={() => {
                      markAsRead(notification.id);
                      onClose();
                      router.push({
                        pathname: '/notifications/[id]',
                        params: {
                          id: notification.id,
                          title: notification.title,
                          message: notification.message,
                          type: notification.type,
                          timestamp: notification.timestamp,
                          actionLabel: notification.action?.label ?? '',
                          actionRoute: notification.action?.route ?? '',
                        },
                      } as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notificationContent}>
                      <View style={[
                        styles.iconContainer,
                        { backgroundColor: getNotificationColor(notification.type) + '20' }
                      ]}>
                        <Ionicons 
                          name={getNotificationIcon(notification.type) as any} 
                          size={16} 
                          color={getNotificationColor(notification.type)} 
                        />
                      </View>
                      
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
                          {notification.timestamp}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 15, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
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
    color: '#FFFFFF',
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    backdropFilter: 'blur(15px)',
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
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    backdropFilter: 'blur(20px)',
  },
  unreadCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#FFFFFF',
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
    color: '#9CA3AF',
    lineHeight: 16,
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  timestamp: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
  },
  viewAllButton: {
    backgroundColor: 'rgba(75, 85, 99, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.4)',
    backdropFilter: 'blur(15px)',
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});

export default NotificationsModal;
