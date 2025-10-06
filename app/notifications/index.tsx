import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

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

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();
  
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
    },
    {
      id: '5',
      title: 'სისტემის განახლება',
      message: 'ახალი ფუნქციები დაემატა: AI ჩეტბოტი და რუკის ინტეგრაცია',
      type: 'info',
      timestamp: '3 დღის წინ',
      isRead: true
    }
  ]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB', '#F3F4F6']}
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

      {/* Notifications List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.isRead && styles.unreadCard
            ]}
            onPress={() => {
              markAsRead(notification.id);
              // Open details route
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
                  size={20} 
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
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.timestamp}>
                  {notification.timestamp}
                </Text>
              </View>
              
              {notification.action && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push({
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
                  } as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>
                    {notification.action.label}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
        
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#111827',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  unreadBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignSelf: 'ფlex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unreadCard: {
    borderColor: '#111827',
    borderWidth: 2,
    backgroundColor: '#F9FAFB',
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
    color: '#374151',
    fontFamily: 'Inter',
    flex: 1,
  },
  unreadTitle: {
    color: '#111827',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
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


