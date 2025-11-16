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
import { requestsApi, type Request, type Offer } from '@/services/requestsApi';
import { useUser } from '@/contexts/UserContext';
import { socketService, type ChatMessage as SocketChatMessage } from '@/services/socketService';
import { messagesApi, type ChatMessage as ApiChatMessage } from '@/services/messagesApi';
import { financingApi } from '@/services/financingApi';

const { width, height } = Dimensions.get('window');

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

export default function PartnerChatScreen() {
  const { requestId, partnerType } = useLocalSearchParams<{ 
    requestId: string; 
    partnerType: PartnerType; 
  }>();
  const { user } = useUser();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [request, setRequest] = useState<Request | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  const scrollViewRef = useRef<ScrollView>(null);
  const partnerId = user?.id || 'demo-partner-123'; // Use real user ID
  const [showFinanceBanner, setShowFinanceBanner] = useState(true);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [finAmount, setFinAmount] = useState('');
  const [finDown, setFinDown] = useState('');
  const [finTerm, setFinTerm] = useState('12');
  const [finPersonalId, setFinPersonalId] = useState('');
  const [finPhone, setFinPhone] = useState('');
  const [finLoading, setFinLoading] = useState(false);

  useEffect(() => {
    fetchData();
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
  }, [requestId]);

  const setupSocket = () => {
    console.log('🔌 [PARTNER_CHAT] Setting up socket for partnerId:', partnerId);
    // Connect as partner
    socketService.connect(partnerId, partnerId);

    // Join chat room
    socketService.joinChat(requestId || '', partnerId, partnerId);

    // Listen for new messages
    socketService.onMessage((message: SocketChatMessage) => {
      const newMessage: ChatMessage = {
        id: message.id,
        requestId: message.requestId,
        userId: message.userId,
        partnerId: message.partnerId || '',
        sender: message.sender,
        message: message.message,
        timestamp: message.timestamp,
        isRead: message.isRead,
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // Listen for chat history
    socketService.onChatHistory((history: ApiChatMessage[]) => {
      const apiMessages: ChatMessage[] = history.map((msg: ApiChatMessage) => ({
        id: msg.id,
        requestId: msg.requestId,
        userId: msg.userId,
        partnerId: msg.partnerId || '',
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        isRead: msg.isRead,
      }));
      setMessages(apiMessages);
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch request and offer data
      const [requestData, offersData] = await Promise.all([
        requestsApi.getRequestById(requestId || '1'),
        requestsApi.getOffers(requestId || '1')
      ]);
      
      setRequest(requestData);
      
      // Find our offer for this request
      const ourOffer = offersData.find(o => o.partnerId === partnerId);
      setOffer(ourOffer || null);
      if ((ourOffer?.priceGEL || 0) > 0) {
        setFinAmount(String(ourOffer?.priceGEL));
      }
      
      // Load real chat history
      try {
        const history = await messagesApi.getChatHistory(requestId || '');
        const apiMessages: ChatMessage[] = history.map((msg: any) => ({
          id: msg.id || msg._id,
          requestId: msg.requestId,
          userId: msg.userId,
          partnerId: msg.partnerId,
          sender: msg.sender,
          message: msg.message,
          timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : new Date(msg.createdAt || Date.now()).getTime(),
          isRead: Boolean(msg.isRead),
        }));
        setMessages(apiMessages);
      } catch (e) {
        console.error('Failed to load chat history:', e);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch chat data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Send message via WebSocket (server will persist and echo back)
      socketService.sendMessage(requestId || '', messageText, 'partner');
      // Rely on socket 'message:new' to append; avoid duplicates
    } catch (error) {
      console.error('Error sending partner message:', error);
    }
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

  const submitFinancing = async () => {
    if (!requestId || !request?.userId) return;
    const amount = parseFloat(finAmount) || 0;
    const down = parseFloat(finDown) || 0;
    const term = parseInt(finTerm || '12', 10);
    if (!amount || term <= 0) return;
    setFinLoading(true);
    try {
      const res = await financingApi.apply({
        userId: request.userId,
        requestId,
        amount,
        downPayment: down,
        termMonths: term,
        personalId: finPersonalId,
        phone: finPhone,
      });
      const sysText = res?.status === 'pre_approved'
        ? `განვადება წინასწურად დამტკიცებულია. თვიური ~ ${res.monthlyEstimate}₾`
        : 'განვადების განაცხადი მიღებულია. მიმდინარეობს განხილვა.';
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        requestId,
        userId: request.userId,
        partnerId: partnerId,
        sender: 'partner',
        message: sysText,
        timestamp: Date.now(),
        isRead: false,
      };
      setMessages(prev => [...prev, sysMsg]);
      setShowFinanceModal(false);
      setShowFinanceBanner(false);
    } catch (e) {
      const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        requestId,
        userId: request?.userId || '',
        partnerId: partnerId,
        sender: 'partner',
        message: 'განვადების გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან.',
        timestamp: Date.now(),
        isRead: false,
      };
      setMessages(prev => [...prev, sysMsg]);
    } finally {
      setFinLoading(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ka-GE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isPartner = message.sender === 'partner';
    
    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          isPartner ? styles.partnerMessageContainer : styles.userMessageContainer,
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
        <View style={styles.messageContent}>
          {isPartner && (
            <View style={styles.partnerAvatar}>
              <Ionicons name="business" size={16} color="#6366F1" />
            </View>
          )}
          
          <View style={[
            styles.messageBubble,
            isPartner ? styles.partnerBubble : styles.userBubble
          ]}>
            <Text style={[
              styles.messageText,
              isPartner ? styles.partnerMessageText : styles.userMessageText
            ]}>
              {message.message}
            </Text>
            <Text style={[
              styles.messageTime,
              isPartner ? styles.partnerMessageTime : styles.userMessageTime
            ]}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
          
          {!isPartner && (
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={16} color="#10B981" />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <Animated.View style={[styles.messageContainer, styles.userMessageContainer]}>
        <View style={styles.messageContent}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="#10B981" />
          </View>
          
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
              <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
              <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {request?.vehicle?.make && request?.vehicle?.model
                ? `${request.vehicle.make} ${request.vehicle.model}`
                : 'ჩატი'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {request?.partName || 'მოთხოვნა'}
            </Text>
          </View>
          
          <Pressable style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {showFinanceBanner && (
              <View style={styles.financeBanner}>
                <View style={styles.financeBannerIcon}>
                  <Ionicons name="card" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.financeBannerTitle}>გნებავთ მომხმარებელმა განვადება?</Text>
                  <Text style={styles.financeBannerSub}>შეავსეთ განაცხადი მის სახელზე.</Text>
                </View>
                <Pressable style={styles.financeBannerCta} onPress={() => setShowFinanceModal(true)}>
                  <Text style={styles.financeBannerCtaText}>განვადება</Text>
                </Pressable>
              </View>
            )}
            {request && (
              <View style={styles.requestInfoCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.requestInfoGradient}
                >
                  <View style={styles.requestInfoHeader}>
                    <Ionicons name="car" size={20} color="#6366F1" />
                    <Text style={styles.requestInfoTitle}>მოთხოვნის ინფო</Text>
                  </View>
                  <Text style={styles.requestInfoText}>
                    {request.partName} - {request.vehicle?.make} {request.vehicle?.model} ({request.vehicle?.year})
                  </Text>
                  {offer && (
                    <Text style={styles.offerInfoText}>
                      შეთავაზება: {offer?.priceGEL}₾ | {offer?.etaMin} წუთი
                    </Text>
                  )}
                </LinearGradient>
              </View>
            )}

            {messages.map((message, index) => renderMessage(message, index))}
            {renderTypingIndicator()}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="შეიყვანეთ შეტყობინება..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                maxLength={500}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  { opacity: newMessage.trim() ? 1 : 0.5 }
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 16,
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
  financeBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  financeBannerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
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
  requestInfoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  requestInfoGradient: {
    padding: 16,
  },
  requestInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requestInfoTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  requestInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  offerInfoText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },

  // Message styles
  messageContainer: {
    marginBottom: 8,
  },
  partnerMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: width * 0.8,
    gap: 8,
  },
  partnerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: width * 0.7,
  },
  partnerBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
  },
  partnerMessageText: {
    color: '#FFFFFF',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '400',
  },
  partnerMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'left',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },

  // Typing indicator
  typingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },

  // Input
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
