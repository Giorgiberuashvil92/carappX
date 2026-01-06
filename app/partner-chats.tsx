import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { requestsApi, type Request, type Offer } from '@/services/requestsApi';
import { messagesApi, type RecentChat } from '@/services/messagesApi';
import { useUser } from '@/contexts/UserContext';

const { width } = Dimensions.get('window');

type PartnerType = 'store' | 'mechanic' | 'tow' | 'rental';

interface ChatMessage {
  id: string;
  requestId: string;
  userId: string;
  partnerId: string;
  sender: 'user' | 'partner';
  message: string;
  timestamp: number;
  isRead: boolean;
}

interface PartnerChat {
  id: string;
  requestId: string;
  offerId?: string; // Add offerId to track specific offer
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isOnline: boolean;
  request: Request;
  offer?: Offer;
}

export default function PartnerChatsScreen() {
  // Safe user context handling
  let user = null;
  try {
    const userContext = useUser();
    user = userContext.user;
  } catch (error) {
    console.log('⚠️ [PARTNER_CHATS] Error getting user context, using default:', error);
    user = { id: 'usr_1759151287420', name: 'Demo User', email: 'demo@example.com', role: 'user' };
  }
  
  // Safe parameter handling
  let partnerType: PartnerType = 'store'; // Default
  try {
    const params = useLocalSearchParams<{ partnerType?: PartnerType }>();
    partnerType = params.partnerType || 'store';
  } catch (error) {
    console.log('⚠️ [PARTNER_CHATS] Error getting params, using default:', error);
    partnerType = 'store';
  }
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<PartnerChat[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const partnerId = user?.id || ''; // Use real user ID if available

  useEffect(() => {
    fetchChats();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [partnerType]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      console.log('🔍 [PARTNER_CHATS] Fetching conversations for partnerId:', partnerId);
      const conversations: RecentChat[] = await messagesApi.getRecentChats(undefined, partnerId);

      const chatPromises = conversations.map(async (conv) => {
        try {
          const request = await requestsApi.getRequestById(conv.requestId);
          const lastTs =
            typeof conv.lastMessageAt === 'number' && isFinite(conv.lastMessageAt)
              ? conv.lastMessageAt
              : new Date((conv as any).updatedAt || (conv as any).createdAt || Date.now()).getTime();
          return {
            id: `chat-${conv.requestId}`,
            requestId: conv.requestId,
            userId: conv.userId,
            userName: request?.vehicle?.make && request?.vehicle?.model
              ? `${request.vehicle.make} ${request.vehicle.model}`
              : `მომხმარებელი ${conv.userId.slice(-4)}`,
            userAvatar: undefined,
            lastMessage: conv.lastMessage || (request?.partName ? request.partName : 'ახალი შეტყობინება'),
            lastMessageTime: isFinite(lastTs) ? lastTs : Date.now(),
            unreadCount: conv.unreadCounts?.partner || 0,
            isOnline: Math.random() > 0.5,
            request,
          } as PartnerChat;
        } catch (error) {
          console.error('Error fetching request for conversation:', error);
          return null;
        }
      });

      const resolved = await Promise.all(chatPromises);
      setChats(resolved.filter(Boolean) as PartnerChat[]);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleChatPress = (chat: PartnerChat) => {
    // Navigate to specific chat
    router.push(`/partner-chat/${chat.requestId}?partnerType=${partnerType}` as any);
  };

  const getPartnerTitle = (): string => {
    switch (partnerType) {
      case 'store':
        return 'ნაწილების მაღაზია';
      case 'mechanic':
        return 'ხელოსანი';
      case 'tow':
        return 'ევაკუატორი';
      case 'rental':
        return 'ქირაობის სერვისი';
      default:
        return 'პარტნიორი';
    }
  };

  const getServiceIcon = (request: Request) => {
    const serviceLower = (request?.partName ?? '').toLowerCase();
    
    if (serviceLower.includes('ბრეიკ') || serviceLower.includes('ლამპ') || 
        serviceLower.includes('ფარ') || serviceLower.includes('ძრავ') ||
        serviceLower.includes('ჰაერ') || serviceLower.includes('ფილტრ')) {
      return 'construct-outline';
    } else if (serviceLower.includes('შემოწმებ') || serviceLower.includes('რემონტ') || 
               serviceLower.includes('დიაგნოსტ')) {
      return 'build-outline';
    } else if (serviceLower.includes('ევაკუაცია') || serviceLower.includes('ევაკუატორ')) {
      return 'car-outline';
    } else if (serviceLower.includes('ქირაობა') || serviceLower.includes('rental')) {
      return 'car-sport-outline';
    }
    
    return 'construct-outline';
  };

  const getServiceColor = (request: Request) => {
    const serviceLower = (request?.partName ?? '').toLowerCase();
    
    if (serviceLower.includes('ბრეიკ') || serviceLower.includes('ლამპ') || 
        serviceLower.includes('ფარ') || serviceLower.includes('ძრავ') ||
        serviceLower.includes('ჰაერ') || serviceLower.includes('ფილტრ')) {
      return '#10B981';
    } else if (serviceLower.includes('შემოწმებ') || serviceLower.includes('რემონტ') || 
               serviceLower.includes('დიაგნოსტ')) {
      return '#3B82F6';
    } else if (serviceLower.includes('ევაკუაცია') || serviceLower.includes('ევაკუატორ')) {
      return '#F59E0B';
    } else if (serviceLower.includes('ქირაობა') || serviceLower.includes('rental')) {
      return '#8B5CF6';
    }
    
    return '#6366F1';
  };

  const formatTimeAgo = (timestamp?: number | string): string => {
    const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp || Date.now()).getTime();
    if (!isFinite(ts)) return 'ახლა';
    const now = Date.now();
    const diff = now - ts;
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 60 * 60));
    const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'ახლა';
    if (diffInMinutes < 60) return `${diffInMinutes} წთ წინ`;
    if (diffInHours < 24) return `${diffInHours} სთ წინ`;
    if (diffInDays < 7) return `${diffInDays} დღე წინ`;
    return `${Math.floor(diffInDays / 7)} კვირა წინ`;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>ჩატები</Text>
            <Text style={styles.headerSubtitle}>{chats.length} აქტიური</Text>
          </View>
          
          <View style={{ width: 44 }} />
        </View>

        {/* Chats List */}
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.chatsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10B981"
              colors={['#10B981']}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {chats.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubbles-outline" size={64} color="#6B7280" />
                </View>
                <Text style={styles.emptyTitle}>ჩატები არ არის</Text>
                <Text style={styles.emptyText}>
                  როდესაც კლიენტებთან დაიწყებთ საუბარს, ისინი გამოჩნდება აქ
                </Text>
              </View>
            ) : (
              chats.map((chat) => (
                <Pressable
                  key={chat.id}
                  style={styles.chatCard}
                  onPress={() => handleChatPress(chat)}
                >
                  {/* Avatar */}
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={['#EEF2FF', '#E0E7FF']}
                      style={styles.avatarGradient}
                    >
                      <Ionicons name="person" size={24} color="#6366F1" />
                    </LinearGradient>
                    {chat.isOnline && <View style={styles.onlineIndicator} />}
                  </View>

                  {/* Chat Info */}
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.userName}>{chat.userName}</Text>
                      <Text style={styles.chatTime}>{formatTimeAgo(chat.lastMessageTime)}</Text>
                    </View>
                    
                    <View style={styles.vehicleRow}>
                      <Ionicons name="car-sport" size={14} color="#10B981" />
                      <Text style={styles.vehicleInfo}>
                        {chat.request?.vehicle?.make} {chat.request?.vehicle?.model}
                        {chat.request?.vehicle?.year && ` • ${chat.request?.vehicle?.year}`}
                      </Text>
                    </View>
                    
                    <View style={styles.lastMessageContainer}>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {chat.lastMessage}
                      </Text>
                      {chat.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Arrow */}
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </Pressable>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 22,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  chatsContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 22,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    gap: 6,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
  },
  chatTime: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#9CA3AF',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleInfo: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: '#6B7280',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
  },
  unreadBadge: {
    backgroundColor: '#10B981',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});
