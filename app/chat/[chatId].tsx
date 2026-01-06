import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useCars } from '@/contexts/CarContext';
import { useUser } from '@/contexts/UserContext';
import { requestsApi } from '@/services/requestsApi';
import { socketService, type ChatMessage as SocketChatMessage } from '@/services/socketService';
import { messagesApi, type ChatMessage as ApiChatMessage } from '@/services/messagesApi';
import { financingApi } from '@/services/financingApi';

const { width } = Dimensions.get('window');

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isTyping?: boolean;
};

type ChatData = {
  id: string;
  name: string;
  service: 'parts' | 'mechanic' | 'tow' | 'rental';
  messages: Message[];
  isOnline: boolean;
  lastSeen?: number;
  partnerId?: string;
};

export default function SpecificChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { selectedCar } = useCars();
  const { user } = useUser();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showFinanceBanner, setShowFinanceBanner] = useState(false);
  
  const [latestOfferPrice, setLatestOfferPrice] = useState<number | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [typingAnim] = useState(new Animated.Value(0));
  
  const scrollViewRef = useRef<ScrollView>(null);

  

  useEffect(() => {
    fetchChatData();
    setupSocket();
    
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

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [chatId]);

  const setupSocket = async () => {
    if (!user?.id) {
      console.log('⚠️ [USER_CHAT] No user ID available');
      return;
    }

    console.log('🔌 [USER_CHAT] Setting up socket for userId:', user.id);
    // Connect to socket
    socketService.connect(user.id);

    // Join chat room
    const requestId = chatId?.replace('chat-', '') || '';
    console.log('🔍 [USER_CHAT] Request ID:', requestId);
    
    // Get partnerId from the latest offer for this request
    let partnerId = undefined;
    try {
      const offers = await requestsApi.getOffers(requestId);
      console.log('📦 [USER_CHAT] Offers for request:', offers.length);
      if (offers.length > 0) {
        partnerId = offers[0].partnerId;
        console.log('👤 [USER_CHAT] Partner ID from offer:', partnerId);
      }
    } catch (error) {
      console.error('❌ [USER_CHAT] Error fetching offers for partnerId:', error);
    }
    
    console.log('🚀 [USER_CHAT] Joining chat with:', { requestId, userId: user.id, partnerId });
    socketService.joinChat(requestId, user.id, partnerId);

    // Listen for new messages
    socketService.onMessage((message: SocketChatMessage) => {
      const newMessage: Message = {
        id: message.id,
        role: message.sender === 'partner' ? 'assistant' : 'user',
        text: message.message,
        timestamp: message.timestamp,
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // Listen for chat history
    socketService.onChatHistory((history: ApiChatMessage[]) => {
      const apiMessages: Message[] = history.map((msg: ApiChatMessage) => ({
        id: msg.id,
        role: msg.sender === 'partner' ? 'assistant' : 'user',
        text: msg.message,
        timestamp: msg.timestamp,
      }));
      setMessages(apiMessages);
    });

    // Listen for typing indicators
    socketService.onTypingStart((data) => {
      if (data.sender === 'partner') {
        setPartnerTyping(true);
      }
    });

    socketService.onTypingStop((data) => {
      if (data.sender === 'partner') {
        setPartnerTyping(false);
      }
    });
  };

  const fetchChatData = async () => {
    if (!chatId || !user?.id) return;
    
    setLoading(true);
    try {
      // Extract requestId from chatId (format: "chat-{requestId}")
      const requestId = chatId.replace('chat-', '');
      
      // Fetch request and offers
      const [request, offers] = await Promise.all([
        requestsApi.getRequestById(requestId),
        requestsApi.getOffers(requestId)
      ]);
      
      if (request && offers.length > 0) {
        const latestOffer = offers[0];
        
        const newChatData: ChatData = {
          id: chatId,
          name: latestOffer.providerName,
          service: getServiceFromRequest(request),
          isOnline: Math.random() > 0.5,
          messages: [
            {
              id: '1',
              role: 'assistant',
              text: `გამარჯობა! ${latestOffer.providerName}-იდან ვარ. თქვენი მოთხოვნისთვის გვაქვს შეთავაზება: ${latestOffer.priceGEL}₾, მიწოდების დრო: ${latestOffer.etaMin} წუთი.`,
              timestamp: latestOffer.updatedAt,
            },
          ],
          partnerId: latestOffer.partnerId,
        };
        
        setChatData(newChatData);
        // Financing banner logic (mock: enable for users with flag later; now show if price exists)
        if (latestOffer?.priceGEL && latestOffer.priceGEL > 0) {
          setLatestOfferPrice(latestOffer.priceGEL);
        }
        try {
          // Load real history
          const history = await messagesApi.getChatHistory(requestId);
          const apiMessages: Message[] = history.map((msg: any) => ({
            id: msg.id || msg._id,
            role: msg.sender === 'partner' ? 'assistant' : 'user',
            text: msg.message,
            timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : new Date(msg.createdAt || Date.now()).getTime(),
          }));
          setMessages(apiMessages);
        } catch (e) {
          console.error('Failed to load user chat history:', e);
          setMessages(newChatData.messages);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat data:', error);
      setChatData(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const getServiceFromRequest = (request: any): 'parts' | 'mechanic' | 'tow' | 'rental' => {
    const partName = request?.partName?.toLowerCase() || '';
    
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

  // removed mock chat data fallback

  // Use real chatData if available, otherwise fallback to mock
  const currentChatData = chatData || {
    id: chatId || '',
    name: 'ჩატი',
    service: 'parts' as const,
    isOnline: true,
    messages: [],
  };

  useEffect(() => {
    // Typing animation loop
    const typingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (isLoading) {
      typingAnimation.start();
    } else {
      typingAnimation.stop();
      typingAnim.setValue(0);
    }

    return () => typingAnimation.stop();
  }, [isLoading]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Send message via WebSocket (server will persist and echo back)
      const requestId = chatId?.replace('chat-', '') || '';
      socketService.sendMessage(requestId, messageText, 'user');
      // Rely on socket 'message:new' to append; avoid duplicates
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = (userInput: string) => {
    const responses = {
      parts: [
        'მივიღე თქვენი მოთხოვნა. ვეძებთ შესაბამის ნაწილებს...',
        'ეს ნაწილი ხელმისაწვდომია. რა ღირებულება გაინტერესებთ?',
        'შეგიძლიათ მოვიდეთ მაღაზიაში ან შეუკვეთოთ ონლაინ.',
      ],
      mechanic: [
        'ვხედავ პრობლემას. შემიძლია მოვიდე შემოწმებაზე.',
        'ეს ძალიან ხშირი პრობლემაა. რამდენად სწრაფად გჭირდებათ?',
        'შეგიძლიათ მოგვწეროთ მისამართი და მოვალ.',
      ],
      tow: [
        'ვიცი თქვენი მდებარეობა. ევაკუატორი გზაშია.',
        'რამდენი ხანია ხართ იქ? ყველაფერი კარგადაა?',
        'ჩვენი ევაკუატორი უახლოეს დროს იქნება.',
      ],
      rental: [
        'რა ტიპის მანქანა გჭირდებათ?',
        'რამდენი დღისთვის გჭირდებათ?',
        'შეგიძლიათ მოვიდეთ ოფისში ან შეუკვეთოთ ონლაინ.',
      ],
    };

    const serviceResponses = responses[currentChatData.service] || responses.parts;
    return serviceResponses[Math.floor(Math.random() * serviceResponses.length)];
  };

  

  

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isSameDay = (a: number, b: number) => {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  // AI Finance Suggestions
  const shouldShowFinanceSuggestion = (message: Message, index: number) => {
    // მხოლოდ იუზერის მესიჯების შემდეგ
    if (message.role !== 'user') return false;
    
    // შეამოწმებს რომელიღაც წინა მესიჯში არის ფასი
    const previousMessages = messages.slice(0, index);
    const hasPriceInPrevious = previousMessages.some(m => {
      if (m.role !== 'assistant') return false;
      // უფრო მარტივი regex - ყველა რიცხვი
      const hasNumber = /\d+/gi.test(m.text);
      console.log('Checking message for price:', { text: m.text, hasNumber });
      return hasNumber;
    });
    
    console.log('Final decision:', { 
      messageText: message.text, 
      hasPriceInPrevious, 
      shouldShow: hasPriceInPrevious 
    });
    
    // TEST: ყოველ იუზერის მესიჯზე ჩნდება
    return true;
  };

  const getFinanceSuggestionText = () => {
    const suggestions = [
      "💳 ხომ არ გჭირდება განვადება? შემიძლია დაგეხმარო!",
      "💰 განვადების ოფცია გაქვს - გინდა ვნახოთ?",
      "💡 ეს თანხა განვადებითაც შეიძლება გადაიხადო!",
      "🎯 მარტივი განვადება ხელმისაწვდომია - ვნახოთ?",
      "✨ განვადებით ყიდვა არ გინდა? ძალიან მარტივია!"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const formatDateLabel = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const yday = new Date(Date.now() - 86400000);
    if (isSameDay(ts, today.getTime())) return 'დღეს';
    if (isSameDay(ts, yday.getTime())) return 'გუშინ';
    return d.toLocaleDateString('ka-GE', { day: '2-digit', month: 'short' });
  };

  const renderTypingIndicator = () => (
    <Animated.View style={[styles.typingWrapper, { opacity: typingAnim }]}>
      <View style={styles.typingContainer}>
        <View style={styles.typingAvatar}>
          <Ionicons name={getServiceIcon(currentChatData.service) as any} size={20} color="#FFFFFF" />  
        </View>
        
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
              extrapolate: 'clamp'
            }) }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
              extrapolate: 'clamp'
            }) }]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 3600000) return 'ახლახანს';
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} საათის წინ`;
    return `${Math.floor(diff / 86400000)} დღის წინ`;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.backgroundGradient}>
          <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
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
              <View style={styles.headerGradient} />
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={22} color="#111827" />
              </Pressable>
              
              <View style={styles.headerContent}>
                <View style={[styles.headerAvatar, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  <Ionicons name={getServiceIcon(currentChatData.service) as any} size={20} color="#4F46E5" />
                  <View style={styles.statusDot} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>{currentChatData.name}</Text>
                  <Text style={styles.headerSubtitle}>{currentChatData.isOnline ? 'ონლაინ' : currentChatData.lastSeen ? `ბოლოს ${formatLastSeen(currentChatData.lastSeen)}` : 'ოფლაინ'}</Text>
                </View>
              </View>
              <Pressable style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
              </Pressable>
            </Animated.View>

            {/* Loading State */}
            {loading && (
              <Animated.View 
                style={[
                  styles.loadingContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <View style={styles.loadingIconContainer}>
                  <Ionicons name="hourglass-outline" size={32} color="#6366F1" />
                </View>
                <Text style={styles.loadingText}>ჩატის ჩატვირთვა...</Text>
              </Animated.View>
            )}

            {/* Messages */}
            {!loading && (
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
              {showFinanceBanner && (
                <LinearGradient colors={['rgba(16,185,129,0.18)','rgba(5,150,105,0.12)']} style={styles.financeBanner}>
                  <View style={styles.financeBannerIcon}>
                    <Ionicons name="card" size={18} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.financeBannerTitle}>განვადება</Text>
                    <Text style={styles.financeBannerSub}>30 წამში წინასწარი პასუხი</Text>
                  </View>
                    <Pressable style={styles.financeBannerCta} onPress={() => router.push('/financing-request')}>
                    <Text style={styles.financeBannerCtaText}>გაგრძელება</Text>
                  </Pressable>
                </LinearGradient>
              )}
              {messages.map((message, index) => {
                const prev = messages[index - 1];
                const showDate = !prev || !isSameDay(prev.timestamp, message.timestamp);
                return (
                <Animated.View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { 
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 15 + (index * 5)],
                            extrapolate: 'clamp',
                          })
                        }
                      ]
                    }
                  ]}
                >
                  {showDate && (
                    <View style={styles.dateSeparatorWrapper}>
                      <View style={styles.dateSeparatorLine} />
                      <Text style={styles.dateSeparatorText}>{formatDateLabel(message.timestamp)}</Text>
                      <View style={styles.dateSeparatorLine} />
                    </View>
                  )}
                  <View style={styles.messageContainer}>
                    {message.role === 'assistant' && (
                      <View style={[styles.assistantAvatar, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                        <Ionicons name={getServiceIcon(currentChatData.service) as any} size={16} color="#4F46E5" />
                      </View>
                    )}
                    
                    <View style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble
                    ]}>
                      <Text style={[styles.messageText, message.role === 'user' ? { color: '#FFFFFF' } : { color: '#111827' }]}>{message.text}</Text>
                      <Text style={[styles.messageTime, message.role === 'user' ? { color: 'rgba(255, 255, 255, 0.8)' } : { color: '#9CA3AF' }]}>
                        {new Date(message.timestamp).toLocaleTimeString('ka-GE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      {message.role === 'assistant' && latestOfferPrice && (
                        <View style={styles.inlineChipsRow}>
                          <Pressable style={styles.financeInlineChip} onPress={() => {
                            const requestId = chatId?.replace('chat-', '') || '';
                            router.push(`/financing-request?requestId=${encodeURIComponent(requestId)}&amount=${encodeURIComponent(String(latestOfferPrice))}`);
                          }}>
                            {/* <Ionicons name="card" size={14} color="white" /> */}
                            {/* <Text style={styles.financeInlineChipText}>განვადება</Text> */}
                          </Pressable>
                        </View>
                      )}
                    </View>

                    
                    {message.role === 'user' && (
                      <View style={styles.userAvatar}>
                        <Ionicons name="person" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  {/* AI Finance Suggestion - იუზერის მესიჯის შემდეგ */}
                  {shouldShowFinanceSuggestion(message, index) && (
                    <View style={styles.financeSuggestions}>
                      <View style={styles.aiSuggestionBubble}>
                        <Text style={styles.aiSuggestionText}>
                          {getFinanceSuggestionText()}
                        </Text>
                        <Pressable
                          style={styles.financeSuggestionButton}
                          onPress={() => {
                            const requestId = chatId?.replace('chat-', '') || '';
                            router.push(`/financing-request?requestId=${encodeURIComponent(requestId)}&amount=${encodeURIComponent(String(latestOfferPrice || 0))}`);
                          }}
                        >
                          <Text style={styles.financeSuggestionButtonText}>განვადება</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Animated.View>
                );
              })}
              
              {(isLoading || partnerTyping) && renderTypingIndicator()}
            </ScrollView>
            )}

            {/* Input */}
            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={(text) => {
                    setInputText(text);
                    // Send typing indicator
                    const requestId = chatId?.replace('chat-', '') || '';
                    if (text.length > 0) {
                      socketService.startTyping(requestId, 'user');
                    } else {
                      socketService.stopTyping(requestId, 'user');
                    }
                  }}
                  placeholder="დაწერეთ შეტყობინება..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={500}
                  selectionColor="#3B82F6"
                />
                
                <Pressable
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      {/* Financing Bottom Sheet (modal) */}
      
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: { fontSize: 18, color: '#111827', fontWeight: '700', marginBottom: 4, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '500', letterSpacing: 0.2 },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  // Date Separators
  dateSeparatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateSeparatorText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Messages
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  messagesContent: {
    paddingVertical: 16,
    gap: 12,
  },
  financeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  financeBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeBannerTitle: { color: 'white', fontWeight: '700' },
  financeBannerSub: { color: '#047857', fontSize: 12 },
  financeBannerCta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  financeBannerCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  termChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  termChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  termChipActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  termChipText: { color: '#065F46', fontSize: 12, fontWeight: '700' },
  termChipTextActive: { color: '#FFFFFF' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalField: {
    marginBottom: 12,
  },
  modalFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: { color: '#6B7280', fontSize: 12, marginBottom: 6 },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalBtnText: { color: '#111827', fontWeight: '700' },
  // Bottom sheet styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  bottomHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHint: { color: '#6B7280', fontSize: 12, marginTop: 6 },
  inlineChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  financeInlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    // backgroundColor: 'rgba(16,185,129,0.15)',
    // borderWidth: 1,
    // borderColor: 'rgba(16,185,129,0.35)'
  },
  financeInlineChipText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },

  // Smart Finance Suggestions
  financeSuggestions: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  financeSuggestionTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  financeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  financeOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  financeOptionText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // AI Finance Suggestion
  aiSuggestionBubble: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
  },
  aiSuggestionText: { fontSize: 14, color: '#111827', fontWeight: '500', lineHeight: 20, marginBottom: 10, letterSpacing: 0.2 },
  financeSuggestionButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  financeSuggestionButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  messageWrapper: {
    maxWidth: '90%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: { fontSize: 15, color: '#111827', lineHeight: 20, fontWeight: '400', marginBottom: 4, letterSpacing: 0.1 },
  messageTime: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', letterSpacing: 0.2 },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  // Typing Indicator
  typingWrapper: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },

  // Input
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    minHeight: 40,
    fontWeight: '400',
    paddingVertical: 10,
    paddingHorizontal: 4,
    letterSpacing: 0.2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  sendButtonDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0 },

  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
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
    fontWeight: '600',
  },
});

