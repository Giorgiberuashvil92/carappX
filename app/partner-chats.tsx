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

  const partnerId = user?.id || 'demo-partner-123'; // Use real user ID

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
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>ჩატები</Text>
                <Text style={styles.headerSubtitle}>{getPartnerTitle()}</Text>
              </View>
              
              <Pressable style={styles.searchButton}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Chats List */}
            <View style={styles.chatsContainer}>
              <ScrollView 
                style={styles.chatsList}
                contentContainerStyle={styles.chatsContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#6366F1"
                    colors={['#6366F1']}
                  />
                }
              >
                {chats.map((chat, index) => (
                  <Animated.View
                    key={chat.id}
                    style={[
                      styles.chatWrapper,
                      {
                        transform: [
                          { 
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 50],
                              outputRange: [0, 50 + (index * 20)],
                              extrapolate: 'clamp',
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <Pressable
                      style={styles.chatCard}
                      onPress={() => handleChatPress(chat)}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                        style={styles.chatGradient}
                      >
                        <View style={styles.chatContent}>
                          {/* User Avatar */}
                          <View style={styles.avatarContainer}>
                            <LinearGradient
                              colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
                              style={styles.avatarGradient}
                            >
                              <Ionicons name="person" size={20} color="#6366F1" />
                            </LinearGradient>
                            {chat.isOnline && <View style={styles.onlineIndicator} />}
                          </View>

                          {/* Chat Info */}
                          <View style={styles.chatInfo}>
                            <View style={styles.chatHeader}>
                              <Text style={styles.userName}>{chat.userName}</Text>
                              <Text style={styles.chatTime}>{formatTimeAgo(chat.lastMessageTime)}</Text>
                            </View>
                            
                            <Text style={styles.vehicleInfo}>
                              {chat.request?.vehicle?.make} {chat.request?.vehicle?.model} ({chat.request?.vehicle?.year})
                            </Text>
                            
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

                          {/* Service Icon */}
                          <View style={styles.serviceIconContainer}>
                            <LinearGradient
                              colors={[getServiceColor(chat.request), getServiceColor(chat.request) + 'CC']}
                              style={styles.serviceIcon}
                            >
                              <Ionicons 
                                name={getServiceIcon(chat.request) as any} 
                                size={16} 
                                color="#FFFFFF" 
                              />
                            </LinearGradient>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                ))}
                
                {chats.length === 0 && (
                  <Animated.View 
                    style={[
                      styles.emptyState,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                      }
                    ]}
                  >
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="chatbubbles-outline" size={48} color="#6366F1" />
                    </View>
                    <Text style={styles.emptyTitle}>ჩატები ჯერ არ არის</Text>
                    <Text style={styles.emptySubtitle}>
                      როცა მომხმარებლები შეთავაზებებს მიიღებენ, ჩატები აქ გამოჩნდება
                    </Text>
                  </Animated.View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    gap: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chats
  chatsContainer: {
    flex: 1,
  },
  chatsList: {
    flex: 1,
  },
  chatsContent: {
    gap: 16,
  },
  chatWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  chatCard: {
    flex: 1,
  },
  chatGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chatTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  vehicleInfo: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  serviceIconContainer: {
    alignItems: 'center',
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
