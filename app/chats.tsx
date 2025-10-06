import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { requestsApi } from '@/services/requestsApi';

const { width } = Dimensions.get('window');

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  avatar?: string;
  isOnline: boolean;
  service: 'parts' | 'mechanic' | 'tow' | 'rental';
};

export default function ChatsScreen() {
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

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
  }, [user?.id]);

  const fetchChats = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const userRequests = await requestsApi.getRequests(user.id);
      
      const chatPromises = userRequests.map(async (request) => {
        try {
          const offers = await requestsApi.getOffers(request.id);
          
          if (offers.length > 0) {
            // Create a chat for each offer (or combine them into one chat per request)
            const latestOffer = offers[0]; // Get the latest offer
            return {
              id: `chat-${request.id}`,
              name: latestOffer.providerName,
              lastMessage: `შეთავაზება: ${latestOffer.priceGEL}₾ | ${latestOffer.etaMin} წუთი`,
              timestamp: latestOffer.updatedAt,
              unreadCount: latestOffer.status === 'pending' ? 1 : 0,
              avatar: undefined,
              isOnline: Math.random() > 0.5, // Mock online status
              service: getServiceFromRequest(request) as 'parts' | 'mechanic' | 'tow' | 'rental',
              requestId: request.id,
            } as Chat & { requestId: string };
          }
          return null;
        } catch (error) {
          console.error('Error fetching offers for request:', error);
          return null;
        }
      });

      const resolvedChats = await Promise.all(chatPromises);
      setChats(resolvedChats.filter(chat => chat !== null) as Chat[]);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const getServiceFromRequest = (request: any) => {
    const partName = request.partName?.toLowerCase() || '';
    
    if (partName.includes('ბრეიკ') || partName.includes('ლამპ') || 
        partName.includes('ფარ') || partName.includes('ძრავ') ||
        partName.includes('ჰაერ') || partName.includes('ფილტრ')) {
      return 'parts';
    } else if (partName.includes('შემოწმებ') || partName.includes('რემონტ') || 
               partName.includes('დიაგნოსტ')) {
      return 'mechanic';
    } else if (partName.includes('ევაკუაცია') || partName.includes('ევაკუატორ')) {
      return 'tow';
    } else if (partName.includes('ქირაობა') || partName.includes('rental')) {
      return 'rental';
    }
    
    return 'parts'; // Default
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'parts':
        return 'construct-outline';
      case 'mechanic':
        return 'build-outline';
      case 'tow':
        return 'car-outline';
      case 'rental':
        return 'car-sport-outline';
      default:
        return 'chatbubbles-outline';
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'parts':
        return '#10B981';
      case 'mechanic':
        return '#3B82F6';
      case 'tow':
        return '#F59E0B';
      case 'rental':
        return '#8B5CF6';
      default:
        return '#6366F1';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'ახლა';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} წუთი`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} საათი`;
    return `${Math.floor(diff / 86400000)} დღე`;
  };

  const handleChatPress = (chat: Chat) => {
    router.push(`/chat/${chat.id}`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.backgroundGradient}
      >
        <View style={styles.container}>
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            
            <Text style={styles.headerTitle}>ჩატები</Text>
            
            <Pressable style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </Pressable>
          </Animated.View>

          {/* Chats List */}
          <ScrollView
            style={styles.chatsContainer}
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
                    opacity: fadeAnim,
                    transform: [
                      { 
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 20 + (index * 10)],
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
                    colors={['rgba(59, 130, 246, 0.2)', 'rgba(29, 78, 216, 0.2)']}
                    style={styles.chatGradient}
                  >
                    <View style={styles.chatContent}>
                      {/* Avatar */}
                      <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: `${getServiceColor(chat.service)}20` }]}>
                          <Ionicons 
                            name={getServiceIcon(chat.service) as any} 
                            size={24} 
                            color={getServiceColor(chat.service)} 
                          />
                        </View>
                        {chat.isOnline && <View style={styles.onlineIndicator} />}
                      </View>

                      {/* Chat Info */}
                      <View style={styles.chatInfo}>
                        <View style={styles.chatHeader}>
                          <Text style={styles.chatName}>{chat.name}</Text>
                          <Text style={styles.chatTime}>{formatTime(chat.timestamp)}</Text>
                        </View>
                        
                        <View style={styles.chatFooter}>
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
                      <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
            
            {loading && (
              <Animated.View 
                style={[
                  styles.loadingState,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <View style={styles.loadingIconContainer}>
                  <Ionicons name="hourglass-outline" size={32} color="#6366F1" />
                </View>
                <Text style={styles.loadingText}>ჩატების ჩატვირთვა...</Text>
              </Animated.View>
            )}
            
            {chats.length === 0 && !loading && (
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
                  როცა შეთავაზებებს მიიღებთ, ჩატები აქ გამოჩნდება
                </Text>
              </Animated.View>
            )}
          </ScrollView>

          {/* New Chat Button */}
          <Animated.View 
            style={[
              styles.newChatButton,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Pressable
              style={styles.newChatPressable}
              onPress={() => router.push('/ai-chat')}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.newChatGradient}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chats
  chatsContainer: {
    flex: 1,
  },
  chatsContent: {
    paddingVertical: 20,
    gap: 12,
  },
  chatWrapper: {
    paddingHorizontal: 20,
  },
  chatCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  chatGradient: {
    padding: 16,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  chatInfo: {
    flex: 1,
    gap: 6,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // New Chat Button
  newChatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  newChatPressable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  newChatGradient: {
    width: '100%',
    height: '100%',
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

  // Loading State
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6366F1',
    textAlign: 'center',
    fontWeight: '600',
  },
});
