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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useCars } from '@/contexts/CarContext';
import { useUser } from '@/contexts/UserContext';
import { useAIRecommendations } from '../hooks/useSubscriptionModal';
import SubscriptionModal from '../components/ui/SubscriptionModal';

const { width } = Dimensions.get('window');

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isTyping?: boolean;
};

type ServiceType = 'parts' | 'mechanic' | 'tow' | 'rental';

export default function AIChatScreen() {
  const { service, requestData, chatId } = useLocalSearchParams<{ service: ServiceType; requestData?: string; chatId?: string }>();
  const { selectedCar } = useCars();
  const { user } = useUser();
  const { canAccessAI, checkAIRecommendationsAccess } = useAIRecommendations();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [typingAnim] = useState(new Animated.Value(0));
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
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

    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      text: getWelcomeMessage(),
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
  }, [service, chatId]);

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

  const handleServicePress = (service: string) => {
    router.push(`/service-form?service=${service}`);
  };

  const handleQuickAction = (action: string) => {
    if (action === 'requests') {
      router.push('/all-requests');
    } else if (action === 'chats') {
      router.push('/ai-chat');
    }
  };

  const services = [
    {
      id: 'parts',
      title: 'ნაწილები',
      subtitle: 'მოძიება',
      icon: 'construct-outline',
      gradient: ['#10B981', '#059669'],
    },
    {
      id: 'mechanic',
      title: 'ხელოსანი',
      subtitle: 'სერვისი',
      icon: 'build-outline',
      gradient: ['#3B82F6', '#1D4ED8'],
    },
    {
      id: 'tow',
      title: 'ევაკუატორი',
      subtitle: 'გამოძახება',
      icon: 'car-outline',
      gradient: ['#F59E0B', '#D97706'],
    },
    {
      id: 'rental',
      title: 'ქირაობა',
      subtitle: 'მანქანა',
      icon: 'car-sport-outline',
      gradient: ['#8B5CF6', '#7C3AED'],
    },
  ];

  const getWelcomeMessage = () => {
    const carInfo = selectedCar ? `${selectedCar.make} ${selectedCar.model} (${selectedCar.year})` : 'მანქანა';
    
    // If we have a specific chatId, show conversation continuation
    if (chatId) {
      switch (chatId) {
        case '1':
          return `გამარჯობა! ნაწილების მაღაზია AutoParts-იდან ვარ. როგორ შემიძლია დაგეხმაროთ?`;
        case '2':
          return `გამარჯობა! ხელოსანი გიორგი ვარ. რა პრობლემა გაქვთ მანქანასთან?`;
        case '3':
          return `გამარჯობა! ევაკუატორი სერვისიდან ვარ. სად ხართ და რა პრობლემა გაქვთ?`;
        case '4':
          return `გამარჯობა! მანქანების ქირაობის სერვისიდან ვარ. რა ტიპის მანქანა გჭირდებათ?`;
        case '5':
          return `გამარჯობა! AI ასისტენტი ვარ. რით შემიძლია დაგეხმაროთ?`;
        default:
          return `გამარჯობა! რით შემიძლია დაგეხმაროთ?`;
      }
    }
    
    if (requestData) {
      try {
        const data = JSON.parse(requestData);
        switch (service) {
          case 'parts':
            return `მივიღე თქვენი მოთხოვნა ${carInfo} ნაწილებისთვის: "${data.description}". ვეძებთ თქვენთვის შესაბამის ვარიანტებს...`;
          case 'mechanic':
            return `მივიღე თქვენი მოთხოვნა ხელოსნისთვის ${carInfo}: "${data.description}". ვეძებთ უახლოეს ხელოსნებს...`;
          case 'tow':
            return `მივიღე თქვენი მოთხოვნა ევაკუატორისთვის ${carInfo}: "${data.description}". ვეძებთ უახლოეს ევაკუატორებს...`;
          case 'rental':
            return `მივიღე თქვენი მოთხოვნა მანქანის ქირაობისთვის: "${data.description}". ვეძებთ შესაბამის ვარიანტებს...`;
          default:
            return `მივიღე თქვენი მოთხოვნა. ვეძებთ შესაბამის ვარიანტებს...`;
        }
      } catch (error) {
        // Fallback to default messages
      }
    }
    
    switch (service) {
      case 'parts':
        return `გამარჯობა! მე დაგეხმარებით ${carInfo} ნაწილების მოძიებაში. რა ნაწილი გჭირდებათ?`;
      case 'mechanic':
        return `გამარჯობა! მე დაგეხმარებით ${carInfo} ხელოსნის მოძიებაში. რა პრობლემა გაქვთ?`;
      case 'tow':
        return `გამარჯობა! მე დაგეხმარებით ${carInfo} ევაკუატორის გამოძახებაში. სად ხართ?`;
      case 'rental':
        return `გამარჯობა! მე დაგეხმარებით მანქანის ქირაობაში. რა ტიპის მანქანა გჭირდებათ?`;
      default:
        return `გამარჯობა! მე დაგეხმარებით მანქანის მოვლაში. რით შემიძლია დაგეხმაროთ?`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Check AI access first
    if (!checkAIRecommendationsAccess()) {
      setShowSubscriptionModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response with typing effect
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: getAIResponse(inputText.trim()),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const getAIResponse = (userInput: string) => {
    const responses = {
      parts: [
        'მე ვეძებთ თქვენთვის შესაბამის ნაწილებს...',
        'ვიპოვე რამდენიმე ვარიანტი. რომელი ნაწილი გაინტერესებთ?',
        'ეს ნაწილი ხელმისაწვდომია რამდენიმე მაღაზიაში.',
      ],
      mechanic: [
        'ვეძებთ თქვენთვის უახლოეს ხელოსნებს...',
        'ვიპოვე რამდენიმე კვალიფიციური ხელოსანი. რომელი გაინტერესებთ?',
        'ეს ხელოსნები სპეციალიზირებულნი არიან თქვენი მანქანის ტიპზე.',
      ],
      tow: [
        'ვეძებთ თქვენთვის უახლოეს ევაკუატორებს...',
        'ვიპოვე რამდენიმე ევაკუატორი. რომელი გაინტერესებთ?',
        'ეს ევაკუატორები ხელმისაწვდომი არიან 24/7.',
      ],
      rental: [
        'ვეძებთ თქვენთვის შესაბამის მანქანებს...',
        'ვიპოვე რამდენიმე ვარიანტი. რომელი მანქანა გაინტერესებთ?',
        'ეს მანქანები ხელმისაწვდომი არიან ქირაობისთვის.',
      ],
    };

    const serviceResponses = responses[service] || responses.parts;
    return serviceResponses[Math.floor(Math.random() * serviceResponses.length)];
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderTypingIndicator = () => (
    <Animated.View style={[styles.typingWrapper, { opacity: typingAnim }]}>
      <View style={styles.typingContainer}>
        <View style={styles.typingAvatar}>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <LinearGradient
                  colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <Pressable
                      style={styles.backButton}
                      onPress={() => router.back()}
                    >
                      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    
                    <Text style={styles.heroTitle}>AI ასისტენტი</Text>
                    <Text style={styles.heroSubtitle}>
                      {selectedCar ? `${selectedCar.make} ${selectedCar.model} (${selectedCar.year})` : 'აირჩიეთ მანქანა'}
                    </Text>
                    <View style={styles.aiIconContainer}>
                      <Ionicons name="sparkles" size={24} color="#6366F1" />
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>სწრაფი ქმედებები</Text>
                <View style={styles.quickActionsGrid}>
                  <Pressable
                    style={styles.quickActionCard}
                    onPress={() => handleQuickAction('requests')}
                  >
                    <LinearGradient
                      colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.2)']}
                      style={styles.quickActionGradient}
                    >
                      <View style={styles.quickActionContent}>
                        <View style={styles.quickActionIcon}>
                          <Ionicons name="list" size={20} color="#EF4444" />
                        </View>
                        <Text style={styles.quickActionText}>ჩემი მოთხოვნები</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    style={styles.quickActionCard}
                    onPress={() => handleQuickAction('chats')}
                  >
                    <LinearGradient
                      colors={['rgba(59, 130, 246, 0.2)', 'rgba(29, 78, 216, 0.2)']}
                      style={styles.quickActionGradient}
                    >
                      <View style={styles.quickActionContent}>
                        <View style={styles.quickActionIcon}>
                          <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.quickActionText}>ჩატები</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>

              {/* Services Grid */}
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>სერვისები</Text>
                <View style={styles.servicesGrid}>
                  {services.map((service, index) => (
                    <Animated.View
                      key={service.id}
                      style={[
                        styles.serviceCard,
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
                        style={styles.servicePressable}
                        onPress={() => handleServicePress(service.id)}
                      >
                <LinearGradient
                  colors={service.gradient as [string, string]}
                  style={styles.serviceGradient}
                >
                          <View style={styles.serviceContent}>
                            <View style={styles.serviceIconContainer}>
                              <Ionicons name={service.icon as any} size={28} color="#FFFFFF" />
                            </View>
                            <Text style={styles.serviceTitle}>{service.title}</Text>
                            <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                            <View style={styles.serviceArrow}>
                              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                            </View>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </View>

              {/* Messages */}
              <View style={styles.messagesSection}>
                <Text style={styles.sectionTitle}>ჩეთი</Text>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesContainer}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {messages.map((message, index) => (
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
                      <View style={styles.messageContainer}>
                        {message.role === 'assistant' && (
                          <View style={styles.assistantAvatar}>
                            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                          </View>
                        )}
                        
                        <View style={[
                          styles.messageBubble,
                          message.role === 'user' ? styles.userBubble : styles.assistantBubble
                        ]}>
                          <Text style={styles.messageText}>{message.text}</Text>
                          <Text style={styles.messageTime}>
                            {new Date(message.timestamp).toLocaleTimeString('ka-GE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                        
                        {message.role === 'user' && (
                          <View style={styles.userAvatar}>
                            <Ionicons name="person" size={18} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  ))}
                  
                  {isLoading && renderTypingIndicator()}
                </ScrollView>
              </View>
            </Animated.View>
          </ScrollView>

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
                onChangeText={setInputText}
                placeholder="დაწერეთ შეტყობინება..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                maxLength={500}
              />
              
              <Pressable
                style={[
                  styles.sendButton,
                  { opacity: inputText.trim() ? 1 : 0.4 }
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <LinearGradient
                  colors={inputText.trim() ? ['#3B82F6', '#2563EB'] : ['rgba(59, 130, 246, 0.3)', 'rgba(37, 99, 235, 0.3)']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          // After successful subscription, allow AI chat
        }}
      />
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
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 32,
    paddingBottom: 100,
  },

  // Hero Section
  heroSection: {
    marginTop: 20,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  heroContent: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontWeight: '800',
    marginTop: 40,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Quick Actions
  quickActionsSection: {
    gap: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  quickActionGradient: {
    padding: 16,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },

  // Services
  servicesSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  servicePressable: {
    flex: 1,
  },
  serviceGradient: {
    padding: 16,
    minHeight: 120,
  },
  serviceContent: {
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  serviceSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  serviceArrow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesSection: {
    gap: 20,
  },
  messagesContainer: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 20,
    gap: 16,
  },
  messageWrapper: {
    maxWidth: '85%',
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
    gap: 8,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  // Typing Indicator
  typingWrapper: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  typingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  // Input
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    minHeight: 40,
    fontWeight: '500',
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});