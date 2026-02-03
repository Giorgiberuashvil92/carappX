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
import { useUser } from '@/contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { messagesApi, type ChatMessage } from '@/services/messagesApi';
import { socketService } from '@/services/socketService';
import { TextInput, KeyboardAvoidingView, Platform } from 'react-native';

const { width } = Dimensions.get('window');

// Types are now imported from requestsApi

export default function OffersScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [request, setRequest] = useState<Request | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number | null>(null);
  const [expandedChatOfferId, setExpandedChatOfferId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [newChatMessage, setNewChatMessage] = useState<Record<string, string>>({});


  useEffect(() => {
    // Load last viewed timestamp
    const loadLastViewed = async () => {
      try {
        const stored = await AsyncStorage.getItem(`offers_lastViewed_${requestId}`);
        if (stored) {
          setLastViewedTimestamp(parseInt(stored, 10));
        } else {
          // First time viewing - set current time
          const now = Date.now();
          setLastViewedTimestamp(now);
          await AsyncStorage.setItem(`offers_lastViewed_${requestId}`, String(now));
        }
      } catch (error) {
        console.error('Failed to load last viewed timestamp:', error);
      }
    };
    
    loadLastViewed();
    fetchData();
    
    // Setup socket for chat
    if (user?.id && requestId) {
      socketService.connect(user.id);
      socketService.joinChat(requestId, user.id);
      
      // Listen for new messages
      socketService.onMessage((message: ChatMessage) => {
        setChatMessages(prev => {
          const offerId = message.partnerId || message.userId;
          const existing = prev[offerId] || [];
          return {
            ...prev,
            [offerId]: [...existing, message],
          };
        });
      });
      
      // Load chat history for each offer
      const loadChatHistory = async () => {
        try {
          const history = await messagesApi.getChatHistory(requestId);
          const grouped: Record<string, ChatMessage[]> = {};
          history.forEach((msg: ChatMessage) => {
            const offerId = msg.partnerId || msg.userId;
            if (!grouped[offerId]) grouped[offerId] = [];
            grouped[offerId].push(msg);
          });
          setChatMessages(grouped);
        } catch (error) {
          console.error('Failed to load chat history:', error);
        }
      };
      loadChatHistory();
    }
    
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => {
      socketService.disconnect();
    };
  }, [requestId, user?.id]);

  // Update last viewed timestamp when component unmounts
  useEffect(() => {
    return () => {
      // Save current time as last viewed when leaving the page
      AsyncStorage.setItem(`offers_lastViewed_${requestId}`, String(Date.now())).catch(() => {});
    };
  }, [requestId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestData, offersData] = await Promise.all([
        requestsApi.getRequestById(requestId || '1'),
        requestsApi.getOffers(requestId || '1')
      ]);
      setRequest(requestData);
      
      // მხოლოდ request owner-მა ხედავს შეთავაზებებს
      const isRequestOwner = user?.id && requestData.userId === user.id;
      if (isRequestOwner) {
        setOffers(offersData);
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.error('Failed to fetch from API:', error);
      setRequest(null);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
        return 'help-outline';
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

  const getServiceGradient = (service: string) => {
    switch (service) {
      case 'parts':
        return ['#10B981', '#059669'];
      case 'mechanic':
        return ['#3B82F6', '#1D4ED8'];
      case 'tow':
        return ['#F59E0B', '#D97706'];
      case 'rental':
        return ['#8B5CF6', '#7C3AED'];
      default:
        return ['#6366F1', '#4F46E5'];
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return '#10B981';
      case 'busy':
        return '#F59E0B';
      case 'offline':
        return '#6B7280';
      default:
        return '#6366F1';
    }
  };

  const handleOfferPress = (offer: Offer) => {
    // Toggle chat expansion for this offer
    if (expandedChatOfferId === offer.id) {
      setExpandedChatOfferId(null);
    } else {
      setExpandedChatOfferId(offer.id);
    }
  };
  
  const handleSendChatMessage = async (offer: Offer) => {
    const messageText = newChatMessage[offer.id]?.trim();
    if (!messageText || !requestId || !user?.id) return;
    
    const partnerId = offer.partnerId || offer.userId;
    const sender: 'user' | 'partner' = request?.userId === user.id ? 'user' : 'partner';
    
    try {
      await messagesApi.createMessage({
        requestId,
        userId: request?.userId || user.id,
        partnerId: partnerId || '',
        sender,
        message: messageText,
      });
      
      // Clear input
      setNewChatMessage(prev => ({ ...prev, [offer.id]: '' }));
      
      // Send via socket
      socketService.sendMessage(requestId, messageText, sender);
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 3600000) return 'ახლახანს';
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} საათის წინ`;
    return `${Math.floor(diff / 86400000)} დღის წინ`;
  };

  if (!request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>იტვირთება...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Header / Summary */}
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerCard}
            >
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerTexts}>
                <Text style={styles.heroTitle}>შეთავაზებები</Text>
                <Text style={styles.heroSubtitle}>
                  {request.partName} • {request.vehicle.make} {request.vehicle.model} ({request.vehicle.year})
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{offers.length}</Text>
                <Text style={styles.countBadgeSub}>შეთავაზება</Text>
              </View>
            </LinearGradient>

            {/* Request Info */}
            <View style={styles.requestInfoSection}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFF']}
                style={styles.requestCard}
              >
                <View style={styles.requestRow}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.requestIconContainer}
                  >
                    <Ionicons name={getServiceIcon(request.service || 'parts') as any} size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.requestDetails}>
                    <Text style={styles.requestTitle}>{request.partName}</Text>
                    <View style={styles.vehicleInfoRow}>
                      <Ionicons name="car-outline" size={14} color="#6366F1" />
                      <Text style={styles.vehicleInfo}>
                        {request.vehicle.make} {request.vehicle.model} ({request.vehicle.year})
                      </Text>
                    </View>
                    {request.location && (
                      <View style={styles.locationPill}>
                        <Ionicons name="location-outline" size={14} color="#6366F1" />
                        <Text style={styles.locationPillText}>{request.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {request.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.requestDescriptionLight} numberOfLines={3}>
                      {request.description}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Offers List */}
            <View style={styles.offersSection}>
              <Text style={styles.sectionTitle}>შეთავაზებები ({offers.length})</Text>
              <ScrollView 
                style={styles.offersContainer}
                contentContainerStyle={styles.offersContent}
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
                {/* Check if user is request owner */}
                {user?.id && request && request.userId !== user.id ? (
                  <View style={styles.restrictedView}>
                    <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
                    <Text style={styles.restrictedTitle}>შეთავაზებები მხოლოდ request owner-ს ხედავს</Text>
                    <Text style={styles.restrictedSubtitle}>
                      შეთავაზებების სანახავად თქვენ უნდა იყოთ ამ მოთხოვნის მფლობელი
                    </Text>
                  </View>
                ) : (
                  offers.map((offer, index) => {
                  const service = (offer as any)?.service || request.service || 'parts';
                  const price = (offer as any)?.price ?? (offer as any)?.priceGEL;
                  const currency = (offer as any)?.currency ?? '₾';
                  const isOnline = Boolean((offer as any)?.isOnline);
                  const availability = (offer as any)?.availability ?? 'available';
                  const rating = (offer as any)?.rating ?? '5.0';
                  const reviewCount = (offer as any)?.reviewCount ?? 0;
                  const responseTime = (offer as any)?.responseTime ?? `${offer.etaMin || 30} წთ`;
                  const description = (offer as any)?.description ?? 'აღწერა არ არის მოცემული';
                  const estimatedTime = (offer as any)?.estimatedTime ?? (offer.etaMin ? `${offer.etaMin} წთ` : undefined);
                  const location = (offer as any)?.location ?? request.location;
                  const warranty = (offer as any)?.warranty;
                  
                  // Check if offer is new (created after last viewed timestamp)
                  // TODO: დროებით - ყველა შეთავაზება გამოჩნდება როგორც ახალი
                  const isNewOffer = true; // lastViewedTimestamp !== null && offer.createdAt > lastViewedTimestamp;
                  
                  // Check if this offer is from current user
                  const isMyOffer = user?.id && (
                    offer.userId === user.id || 
                    offer.partnerId === user.id ||
                    String(offer.userId) === String(user.id) ||
                    String(offer.partnerId) === String(user.id)
                  );

                  return (
                  <Animated.View
                    key={offer.id}
                    style={[
                      styles.offerWrapper,
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
                      style={styles.offerCard}
                      onPress={() => handleOfferPress(offer)}
                    >
                      <LinearGradient
                        colors={['#FFFFFF', '#F8FAFF']}
                        style={[
                          styles.offerGradient,
                          isNewOffer && {
                            borderColor: '#3B82F6',
                            borderWidth: 2,
                          }
                        ]}
                      >
                        <View style={styles.offerContent}>
                          {/* Header with provider + price */}
                          <View style={styles.offerHeaderRow}>
                            <View style={styles.providerInfo}>
                              <View style={styles.providerAvatarContainer}>
                                <View style={[styles.providerAvatar, { backgroundColor: `${getServiceColor(service)}20` }]}>
                                  <Ionicons 
                                    name={getServiceIcon(service) as any} 
                                    size={24} 
                                    color={getServiceColor(service)} 
                                  />
                                </View>
                                {isOnline && <View style={styles.onlineIndicator} />}
                              </View>
                              
                              <View style={styles.providerDetails}>
                                <View style={styles.providerHeader}>
                                  <Text style={styles.providerName}>{offer.providerName}</Text>
                                  <View style={styles.badgesContainer}>
                                   {isNewOffer && (
                          <View style={styles.newOfferBadge}>
                            <Ionicons name="sparkles" size={14} color="#3B82F6" />
                            <Text style={styles.newOfferBadgeText}>ახალი</Text>
                          </View>
                        )}
                        {isMyOffer && (
                          <View style={styles.myOfferBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.myOfferBadgeText}>ჩემგან</Text>
                          </View>
                        )}
                                  </View>
                                </View>
                                
                               
                                
                                <Text style={styles.responseTime}>პასუხი: {responseTime}</Text>
                              </View>
                            </View>

                          </View>

                          {/* Offer Details */}
                          <View style={styles.offerDetails}>
                            <Text style={styles.offerDescription} numberOfLines={2}>
                              {description}
                            </Text>
                            
                            <View style={styles.offerMetaRow}>
                              {estimatedTime && (
                                <View style={styles.metaPill}>
                                  <Ionicons name="time-outline" size={12} color="#E5E7EB" />
                                  <Text style={styles.metaText}>{estimatedTime}</Text>
                                </View>
                              )}
                              {location && (
                                <View style={styles.metaPill}>
                                  <Ionicons name="location-outline" size={12} color="#E5E7EB" />
                                  <Text style={styles.metaText}>{location}</Text>
                                </View>
                              )}
                              {warranty && (
                                <View style={styles.metaPill}>
                                  <Ionicons name="shield-checkmark-outline" size={12} color="#E5E7EB" />
                                  <Text style={styles.metaText}>{warranty} გარანტია</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Action */}
                          <View style={styles.offerFooter}>
                            <LinearGradient
                              colors={[`${getServiceColor(service)}15`, `${getServiceColor(service)}08`]}
                              style={styles.priceBadge}
                            >
                              <Text style={[styles.priceBadgeAmount, { color: getServiceColor(service) }]}>
                                {price ?? '—'} {currency}
                              </Text>
                              <Text style={styles.priceBadgeLabel}>ფასი</Text>
                            </LinearGradient>
                            <View style={styles.chatButtonContainer}>
                              <Pressable
                                style={styles.chatButton}
                                onPress={() => handleOfferPress(offer)}
                              >
                                <LinearGradient
                                  colors={[getServiceColor(service), `${getServiceColor(service)}DD`]}
                                  style={styles.chatButtonGradient}
                                >
                                  <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
                                  <Text style={styles.chatButtonText}>ჩატი</Text>
                                </LinearGradient>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                    
                    {/* Chat Section */}
                    {expandedChatOfferId === offer.id && (
                      <View style={styles.chatSection}>
                        <View style={styles.chatHeader}>
                          <Text style={styles.chatHeaderText}>მიწერ-მოწერა</Text>
                          <Pressable onPress={() => setExpandedChatOfferId(null)}>
                            <Ionicons name="chevron-up" size={20} color="#6B7280" />
                          </Pressable>
                        </View>
                        
                        <ScrollView 
                          style={styles.chatMessagesContainer}
                          contentContainerStyle={styles.chatMessagesContent}
                        >
                          {(chatMessages[offer.id] || []).map((msg) => {
                            const isMyMessage = (request?.userId === user?.id && msg.sender === 'user') ||
                              (offer.partnerId === user?.id && msg.sender === 'partner');
                            
                            return (
                              <View
                                key={msg.id}
                                style={[
                                  styles.chatMessage,
                                  isMyMessage ? styles.chatMessageMy : styles.chatMessageOther,
                                ]}
                              >
                                <Text style={[
                                  styles.chatMessageText,
                                  isMyMessage ? styles.chatMessageTextMy : styles.chatMessageTextOther,
                                ]}>
                                  {msg.message}
                                </Text>
                                <Text style={[
                                  styles.chatMessageTime,
                                  isMyMessage ? styles.chatMessageTimeMy : styles.chatMessageTimeOther,
                                ]}>
                                  {new Date(msg.timestamp).toLocaleTimeString('ka-GE', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Text>
                              </View>
                            );
                          })}
                          {(!chatMessages[offer.id] || chatMessages[offer.id].length === 0) && (
                            <View style={styles.chatEmpty}>
                              <Text style={styles.chatEmptyText}>ჯერ არ არის შეტყობინებები</Text>
                            </View>
                          )}
                        </ScrollView>
                        
                        <KeyboardAvoidingView
                          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                          style={styles.chatInputContainer}
                        >
                          <TextInput
                            style={styles.chatInput}
                            placeholder="დაწერე შეტყობინება..."
                            placeholderTextColor="#9CA3AF"
                            value={newChatMessage[offer.id] || ''}
                            onChangeText={(text) => setNewChatMessage(prev => ({ ...prev, [offer.id]: text }))}
                            multiline
                          />
                          <Pressable
                            style={styles.chatSendButton}
                            onPress={() => handleSendChatMessage(offer)}
                          >
                            <Ionicons name="send" size={20} color="#FFFFFF" />
                          </Pressable>
                        </KeyboardAvoidingView>
                      </View>
                    )}
                  </Animated.View>
                  );
                })
                )}
                
                {offers.length === 0 && user?.id && request && request.userId === user.id && (
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
                    <Text style={styles.emptyTitle}>შეთავაზებები ჯერ არ არის</Text>
                    <Text style={styles.emptySubtitle}>
                      მაღაზიები გამოგიგზავნიან შეთავაზებებს მალე
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
    backgroundColor: '#F6F7FB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  content: {
    padding: 20,
    gap: 32,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F7FB',
  },
  loadingText: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '600',
  },

  // Hero Section
  headerCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    minWidth: 70,
  },
  countBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  countBadgeSub: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
  },

  // Request Info
  requestInfoSection: {
    gap: 16,
  },
  requestCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    padding: 18,
  },
  requestRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  requestIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  requestDetails: {
    gap: 8,
    flex: 1,
    alignItems: 'flex-start',
  },
  requestTitle: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'left',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'left',
    fontWeight: '600',
  },
  requestDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 18,
  },
  descriptionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
  },
  requestDescriptionLight: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    marginTop: 4,
  },
  locationPillText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '700',
  },
  locationText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Offers Section
  offersSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#111827',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  offersContainer: {
    // allow full height; outer ScrollView handles scrolling
  },
  offersContent: {
    gap: 10,
    paddingBottom: 14,
  },
  offerWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 4,
  },
  offerCard: {
    flex: 1,
  },
  offerGradient: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  chatButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  newOfferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  newOfferBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  myOfferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  myOfferBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  offerContent: {
    gap: 12,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },

  // Provider Info
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  providerAvatarContainer: {
    position: 'relative',
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  providerDetails: {
    flex: 1,
    gap: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.3,
  },
  availabilityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  responseTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Offer Details
  offerDetails: {
    gap: 10,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  offerDescription: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  offerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // Offer Footer
  offerFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priceBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priceBadgeAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  priceBadgeLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  restrictedView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 16,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 8,
  },
  restrictedSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Chat Section
  chatSection: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 400,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chatHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  chatMessagesContainer: {
    maxHeight: 250,
    padding: 12,
  },
  chatMessagesContent: {
    gap: 8,
  },
  chatMessage: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '80%',
  },
  chatMessageMy: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
  },
  chatMessageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chatMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatMessageTextMy: {
    color: '#FFFFFF',
  },
  chatMessageTextOther: {
    color: '#111827',
  },
  chatMessageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  chatMessageTimeMy: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chatMessageTimeOther: {
    color: '#6B7280',
  },
  chatEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  chatEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 100,
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
