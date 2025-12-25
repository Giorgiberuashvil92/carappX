import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import BOGPaymentModal from '../components/ui/BOGPaymentModal';
import { bogApi } from '../services/bogApi';
import { carwashApi } from '../services/carwashApi';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'bog' | 'crypto';
  icon: string;
  color: string;
  description: string;
}

interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  context: string;
  orderId?: string;
  successUrl?: string;
  failUrl?: string;
  vinCode?: string;
  isSubscription?: boolean;
  planId?: string;
  planName?: string;
  planPrice?: string;
  planCurrency?: string;
  planDescription?: string;
  metadata?: Record<string, any>;
}

interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  redirectUrl?: string;
  data?: any;
}

export default function PaymentCardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount?: string;
    description?: string;
    context?: string;
    orderId?: string;
    successUrl?: string;
    vinCode?: string;
    isSubscription?: string;
    planId?: string;
    planName?: string;
    planPrice?: string;
    planCurrency?: string;
    planDescription?: string;
    metadata?: string; // JSON string
  }>();

  const successUrlParam = params.successUrl
    ? decodeURIComponent(String(params.successUrl))
    : undefined;

  const navigateInternal = (target: string) => {
    const normalized = target.startsWith('/') ? target : `/${target}`;
    const [pathname, query] = normalized.split('?');
    const queryParams = Object.fromEntries(new URLSearchParams(query || ''));
    router.replace({ pathname: pathname as any, params: queryParams as any });
  };

  // Payment Data-ს შექმნა params-იდან
  const paymentData: PaymentData = {
    amount: parseFloat(params.amount || '0'),
    currency: params.planCurrency || 'GEL',
    description: params.description || 'CarApp სერვისი',
    context: params.context || 'general',
    orderId: params.orderId,
    successUrl: successUrlParam,
    failUrl: undefined, // განვსაზღვრავთ default-ად
    vinCode: params.vinCode,
    isSubscription: params.isSubscription === 'true',
    planId: params.planId,
    planName: params.planName,
    planPrice: params.planPrice,
    planCurrency: params.planCurrency,
    planDescription: params.planDescription,
    metadata: (() => {
      try {
        return params.metadata ? JSON.parse(params.metadata) : {};
      } catch (error) {
        console.warn('⚠️ Metadata parsing შეცდომა:', error);
        return {};
      }
    })(),
  };
  
  const [selectedMethod, setSelectedMethod] = useState<string>('bog');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [savedCard, setSavedCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [vinCode, setVinCode] = useState(params.vinCode || '');
  const [showBOGPaymentModal, setShowBOGPaymentModal] = useState(false);
  const [bogPaymentUrl, setBogPaymentUrl] = useState('');
  const [rememberCard, setRememberCard] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bogOAuthStatus, setBogOAuthStatus] = useState<any>(null);
  const [isCheckingBOG, setIsCheckingBOG] = useState<boolean>(false);
  const [visible, setVisible] = useState(true);
  
  const isSubscription = (params as any).isSubscription === 'true';
  const planId = (params as any).planId;
  const planName = (params as any).planName;
  const planPrice = (params as any).planPrice;
  const planCurrency = (params as any).planCurrency;
  const planDescription = (params as any).planDescription;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

  }, []);

  // BOG OAuth Status Check
  useEffect(() => {
    const checkBOGStatus = async () => {
      setIsCheckingBOG(true);
      try {
        const status = await bogApi.getOAuthStatus();
        setBogOAuthStatus(status);
        console.log('🔍 BOG OAuth სტატუსი:', status);
      } catch (error) {
        console.error('❌ BOG OAuth სტატუსის შემოწმების შეცდომა:', error);
        setBogOAuthStatus({
          isTokenValid: false,
          message: 'BOG OAuth სერვისთან კავშირის შეცდომა'
        });
      } finally {
        setIsCheckingBOG(false);
      }
    };

    checkBOGStatus();
  }, []);
   

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // ზოგადი გადახდის ფუნქცია
  const processPayment = async (method: string): Promise<PaymentResult> => {
    try {
      switch (method) {
        case 'bog':
          return await handleBOGPayment();
        case 'card':
          return await handleCardPayment();
        default:
          throw new Error(`მხარდაჭერილი არ არის გადახდის მეთოდი: ${method}`);
      }
    } catch (error) {
      console.error(`❌ ${method} გადახდის შეცდომა:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'უცნობი შეცდომა',
      };
    }
  };

  // BOG Payment Handler
  const handleBOGPayment = async (): Promise<PaymentResult> => {
    if (!bogOAuthStatus?.isTokenValid) {
      return {
        success: false,
        message: 'BOG OAuth სერვისი არ არის ხელმისაწვდომი',
      };
    }

    if (!user?.id) {
      return {
        success: false,
        message: 'მომხმარებელი არ არის ავტორიზებული',
      };
    }

    if (paymentData.amount <= 0) {
      return {
        success: false,
        message: 'გადახდის თანხა არასწორია',
      };
    }

    setLoading(true);

    try {
      const orderData = {
        callback_url: `${API_BASE_URL}/bog/callback`,
        external_order_id: paymentData.orderId || `carapp_${Date.now()}_${user.id}`,
        total_amount: paymentData.amount,
        currency: paymentData.currency,
        product_id: paymentData.context,
        description: paymentData.description,
        success_url: paymentData.successUrl?.startsWith('http') 
          ? paymentData.successUrl 
          : `${API_BASE_URL}${paymentData.successUrl || '/payment/success'}`,
        fail_url: `${API_BASE_URL}/payment/fail`,
      };

      console.log('🔄 BOG შეკვეთის შექმნა...', orderData);
      console.log('📊 Payment Data:', paymentData);

      const result = await bogApi.createOrder(orderData);
      
      console.log('✅ BOG შეკვეთა შეიქმნა:', result);
      
      // BOG Payment Modal-ის გახსნა
      setBogPaymentUrl(result.redirect_url);
      setShowBOGPaymentModal(true);

      return {
        success: true,
        message: 'BOG გადახდა წარმატებით ინიციალიზებულია',
        redirectUrl: result.redirect_url,
        transactionId: result.id,
        data: result,
      };

    } catch (error) {
      console.error('❌ BOG გადახდის შეცდომა:', error);
      return {
        success: false,
        message: 'BOG გადახდის ინიციალიზაცია ვერ მოხერხდა',
      };
    } finally {
      setLoading(false);
    }
  };

  // Card Payment Handler (placeholder)
  const handleCardPayment = async (): Promise<PaymentResult> => {
    return {
      success: false,
      message: 'ბარათის გადახდა ჯერ არ არის მხარდაჭერილი',
    };
  };

  // გადახდის ინფორმაციის შენახვა backend-ში
  const savePaymentInfo = async () => {
    try {
      if (!user?.id || !paymentData.amount || !paymentData.orderId) {
        return;
      }

      const paymentInfo = {
        userId: user.id,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: 'BOG',
        status: 'completed',
        context: paymentData.context,
        description: paymentData.description,
        paymentDate: new Date().toISOString(),
        metadata: {
          serviceId: paymentData.metadata?.serviceId,
          serviceName: paymentData.metadata?.serviceName,
          locationId: paymentData.metadata?.locationId,
          locationName: paymentData.metadata?.locationName,
          selectedDate: paymentData.metadata?.selectedDate,
          selectedTime: paymentData.metadata?.selectedTime,
          bookingType: paymentData.metadata?.bookingType,
          customerInfo: {
            name: user.name || 'მომხმარებელი',
            phone: user.phone || '',
            email: user.email || ''
          }
        }
      };

      console.log('💾 Saving payment info to backend:', paymentInfo);
      
      // Backend API call to save payment info
      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentInfo),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment info saved successfully:', result);
      } else {
        console.error('❌ Failed to save payment info:', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving payment info:', error);
    }
  };

  const handleTestPayment = () => {
    const fallback =
      paymentData.vinCode && paymentData.context === 'carfax'
        ? `/carfax?paid=1&vinCode=${paymentData.vinCode}`
        : '/payment-success';

    const target = paymentData.successUrl || fallback;
    console.log('🧪 Test payment navigate ->', target);

    setVisible(false);

    if (target.startsWith('http')) {
      Linking.openURL(target);
    } else {
      navigateInternal(target);
    }
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        setVisible(false);
        router.back();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
        
          <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              paddingTop: insets.top,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setVisible(false);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>გადახდის მეთოდი</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View 
            style={[
              styles.heroWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#E0ECFF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroSection}
            >
              <View style={styles.heroIcon}>
                <Ionicons name="card" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadgePill}>
                  <Ionicons name="lock-closed" size={14} color="#2563EB" />
                  <Text style={styles.heroBadgeText}>უსაფრთხო გადახდა</Text>
                </View>
                {paymentData.vinCode ? (
                  <View style={styles.heroBadgePill}>
                    <Ionicons name="car-sport" size={14} color="#2563EB" />
                    <Text style={styles.heroBadgeText}>{paymentData.vinCode}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroTitle}>
                {paymentData.isSubscription ? 'Subscription გადახდა' : 'გადახდის მეთოდი'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {paymentData.isSubscription ? 'აირჩიეთ გადახდის მეთოდი' : 'აირჩიეთ ყველაზე მოსახერხებელი ვარიანტი'}
              </Text>

              {paymentData.isSubscription && paymentData.planName && (
                <View style={styles.subscriptionSection}>
                  <Text style={styles.subscriptionTitle}>🚀 {paymentData.planName}</Text>
                  <Text style={styles.subscriptionPrice}>{paymentData.planPrice} {paymentData.planCurrency}</Text>
                  {paymentData.planDescription && (
                    <Text style={styles.subscriptionDescription}>{paymentData.planDescription}</Text>
                  )}
                </View>
              )}

              {paymentData.amount > 0 && !paymentData.isSubscription && (
                <View style={styles.amountSection}>
                  <Text style={styles.amountText}>{paymentData.amount} {paymentData.currency}</Text>
                  {paymentData.description && (
                    <Text style={styles.descriptionText}>{paymentData.description}</Text>
                  )}
                  {paymentData.context && (
                    <Text style={styles.contextText}>კონტექსტი: {paymentData.context}</Text>
                  )}
                  <View style={styles.amountChips}>
                    <View style={styles.amountChip}>
                      <Ionicons name="flash" size={14} color="#2563EB" />
                      <Text style={styles.amountChipText}>დადასტურება წამებში</Text>
                    </View>
                    <View style={styles.amountChip}>
                      <Ionicons name="shield-checkmark" size={14} color="#2563EB" />
                      <Text style={styles.amountChipText}>ფraud დაცვა</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.testPayButton} onPress={handleTestPayment}>
                    <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                    <Text style={styles.testPayText}>სატესტო გადახდა (იმიტაცია)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </Animated.View>        

          {savedCard && (
            <View style={styles.savedCardSection}>
              <Text style={styles.sectionTitle}>მიბმული ბარათი</Text>
              <View style={styles.savedCard}>
                <View style={styles.cardBackground}>
                  <View style={styles.cardGradient} />
                  <View style={styles.cardPattern} />
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>{savedCard.type}</Text>
                    <View style={styles.cardLogo}>
                      {savedCard.type === 'Visa' ? (
                        <Text style={styles.cardTypeText}>VISA</Text>
                      ) : savedCard.type === 'MasterCard' ? (
                        <View style={styles.mastercardLogo}>
                          <View style={styles.mastercardCircle1} />
                          <View style={styles.mastercardCircle2} />
                        </View>
                      ) : savedCard.type === 'LOYALTY' ? (
                        <View style={styles.loyaltyLogo}>
                          <Text style={styles.loyaltyLogoText}>CA</Text>
                        </View>
                      ) : (
                        <Ionicons name="card" size={20} color="#2563EB" />
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.cardNumber}>
                    <Text style={styles.cardNumberText}>{savedCard.maskedNumber}</Text>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.cardHolder}>
                      <Text style={styles.cardHolderLabel}>CARD HOLDER</Text>
                      <Text style={styles.cardHolderName}>{savedCard.holder.toUpperCase()}</Text>
                    </View>
                    <View style={styles.cardExpiry}>
                      <Text style={styles.cardExpiryLabel}>VALID THRU</Text>
                      <Text style={styles.cardExpiryDate}>{savedCard.expiry}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.payButton}
                onPress={async () => {
                  Alert.alert(
                    'გადახდა',
                    `გსურთ გადაიხადოთ ${savedCard.maskedNumber} ბარათით?`,
                    [
                      { text: 'არა', style: 'cancel' },
                      { 
                        text: 'კი', 
                        onPress: async () => {
                          if (!user?.id) {
                            Alert.alert('შეცდომა', 'მომხმარებელი არ არის ავტორიზებული');
                            return;
                          }

                          setLoading(true);

                          try {
                            const cardId = savedCard.id || savedCard._id;
                            if (!cardId) {
                              throw new Error('ბარათის ID ვერ მოიძებნა');
                            }

                            const paymentData = {
                              userId: user.id,
                              cardId: cardId,
                              amount: parseFloat(params.amount || '14.99'),
                              currency: 'GEL',
                              description: params.description || 'გადახდა'
                            };

                            console.log('💳 გადახდის მონაცემები:', paymentData);
                            console.log('💳 savedCard:', savedCard);

                            // const result = await paymentApi.processPayment(paymentData);
                            const result = { success: false, message: 'Payment services temporarily disabled' };
                            
                            if (result.success) {
                              console.log('✅ გადახდა განხორციელდა');
                              
                              // Success Modal-ის ჩვენება
                              setShowSuccessModal(true);
                              
                              // Success Modal Animation
                              Animated.parallel([
                                Animated.timing(fadeAnim, {
                                  toValue: 1,
                                  duration: 300,
                                  useNativeDriver: true,
                                }),
                                Animated.spring(scaleAnim, {
                                  toValue: 1,
                                  tension: 100,
                                  friction: 8,
                                  useNativeDriver: true,
                                }),
                              ]).start();
                              
                              // 5 წამის შემდეგ ავტომატურად დაბრუნება
                              setTimeout(() => {
                                Animated.parallel([
                                  Animated.timing(fadeAnim, {
                                    toValue: 0,
                                    duration: 200,
                                    useNativeDriver: true,
                                  }),
                                  Animated.timing(scaleAnim, {
                                    toValue: 0.8,
                                    duration: 200,
                                    useNativeDriver: true,
                                  }),
                                ]).start(() => {
                                  setShowSuccessModal(false);
                                  router.back();
                                });
                              }, 5000);
                            } else {
                              throw new Error(result.message || 'გადახდა ვერ განხორციელდა');
                            }
                          } catch (error) {
                            console.error('❌ გადახდის შეცდომა:', error);
                            Alert.alert('შეცდომა', 'გადახდა ვერ განხორციელდა');
                          } finally {
                            setLoading(false);
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <View style={styles.payButtonContent}>
                  {loading ? (
                    <>
                      <Ionicons name="hourglass" size={20} color="#FFFFFF" />
                      <Text style={styles.payButtonText}>მუშაობს...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="card" size={20} color="#FFFFFF" />
                      <Text style={styles.payButtonText}>გადახდა ამ ბარათით</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ბარათის დამახსოვრების ტოგლი */}
          <View style={styles.rememberCardSection}>
            <TouchableOpacity 
              style={styles.rememberCardToggle}
              onPress={() => setRememberCard(!rememberCard)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.toggleSwitch,
                rememberCard && styles.toggleSwitchActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  rememberCard && styles.toggleThumbActive
                ]} />
              </View>
              <View style={styles.rememberCardInfo}>
                <Text style={styles.rememberCardTitle}>ბარათის დამახსოვრება</Text>
                <Text style={styles.rememberCardDescription}>
                  მომავალ გადახდებზე ამ ბარათის გამოყენება
                </Text>
              </View>
              <Ionicons 
                name="card" 
                size={20} 
                color={rememberCard ? "#22C55E" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          </View>

          {/* BOG გადახდა */}
          <View style={styles.methodsSection}>
            <TouchableOpacity 
              onPress={async () => {
                const result = await processPayment('bog');
                if (!result.success) {
                  Alert.alert('შეცდომა', result.message);
                }
              }}
              activeOpacity={0.9}
              style={[
                styles.singlePayButton,
                (!bogOAuthStatus?.isTokenValid || loading) && styles.singlePayButtonDisabled
              ]}
              disabled={!bogOAuthStatus?.isTokenValid || loading}
            >
              <LinearGradient
                colors={
                  !bogOAuthStatus?.isTokenValid 
                    ? ['#6B7280', '#4B5563'] 
                    : ['#22C55E', '#16A34A']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.singlePayGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#0B0B0E" />
                    <Text style={styles.singlePayText}>მუშაობს...</Text>
                  </>
                ) : isCheckingBOG ? (
                  <>
                    <ActivityIndicator size="small" color="#0B0B0E" />
                    <Text style={styles.singlePayText}>BOG შემოწმება...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="card" size={20} color="#0B0B0E" />
                    <Text style={styles.singlePayText}>
                      {bogOAuthStatus?.isTokenValid ? 'BOG გადახდა' : 'BOG არ მზადაა'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            {/* BOG Status Indicator */}
            <View style={styles.bogStatusContainer}>
              {isCheckingBOG ? (
                <Text style={styles.bogStatusText}>BOG სერვისის შემოწმება...</Text>
              ) : bogOAuthStatus?.isTokenValid ? (
                <Text style={[styles.bogStatusText, styles.bogStatusSuccess]}>
                  ✅ BOG OAuth მზადაა
                </Text>
              ) : (
                <Text style={[styles.bogStatusText, styles.bogStatusError]}>
                  ⚠️ BOG OAuth არ მზადაა
                </Text>
              )}
            </View>
          </View>


          {/* Security Notice */}
          <View style={styles.securitySection}>
            <View style={styles.securityCard}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>უსაფრთხო გადახდა</Text>
                <Text style={styles.securityDescription}>
                  ყველა გადახდა დაცულია SSL ენკრიფციით
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </Animated.ScrollView>

        {/* Card Modal */}
        <Modal
          visible={showCardModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCardModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ბარათის მიბმა</Text>
                <TouchableOpacity 
                  onPress={() => setShowCardModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ბარათის ნომერი</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#6B7280"
                    value={cardNumber}
                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.inputLabel}>ვადის გასვლის თარიღი</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor="#6B7280"
                      value={expiryDate}
                      onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor="#6B7280"
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ბარათის მფლობელის სახელი</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="შეიყვანეთ სახელი და გვარი"
                    placeholderTextColor="#6B7280"
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    autoCapitalize="words"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowCardModal(false)}
                >
                  <Text style={styles.cancelButtonText}>გაუქმება</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={() => {
                    // ბარათის მიბმა - მოხერხდება მოგვიანებით
                    Alert.alert('მოხერხდება მალე', 'ბარათის მიბმის ფუნქციონალი მალე იქნება ხელმისაწვდომი');
                    setShowCardModal(false);
                  }}
                >
                  <LinearGradient
                    colors={['#2563EB', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitButtonText}>ბარათის მიბმა</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
      {/* BOG Payment Modal (WebView) */}
      <BOGPaymentModal
        visible={showBOGPaymentModal}
        paymentUrl={bogPaymentUrl}
        onClose={() => setShowBOGPaymentModal(false)}
        onSuccess={async () => {
          console.log('🎉 BOG Payment Success!');
          console.log('🔹 Closing BOG Modal...');
          setShowBOGPaymentModal(false);
          console.log('🔹 BOG Modal closed');
          
          if (paymentData.context === 'carwash' && paymentData.metadata) {
            console.log('🎉 CarWash გადახდა წარმატებულია! ჯავშანი შეიქმნება მომხმარებლის დადასტურების შემდეგ');
          }


          console.log('🔹 Showing Success Modal...');
          setShowSuccessModal(true);
          console.log('🔹 Success Modal shown:', showSuccessModal);
          
          // Success Modal Animation
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
          
          // გადახდის ინფორმაციის შენახვა backend-ში
          await savePaymentInfo();

          // CarWash გადახდის შემთხვევაში მოდალი რჩება ღილაკისთვის
          if (paymentData.context === 'carwash' && paymentData.metadata) {
            console.log('🎉 CarWash გადახდა წარმატებულია! მოდალი რჩება დადასტურებისთვის');
          } else {
            setTimeout(() => {
              setShowSuccessModal(false);
              router.back();
            }, 3000);
          }
        }}
        onError={(error) => {
          console.error('❌ BOG გადახდის შეცდომა:', error);
          setShowBOGPaymentModal(false);
          router.back();
        }}
      />

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <Animated.View 
            style={[
              styles.successModal,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successModalGradient}
            >
              <View style={styles.successModalContent}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
                </View>
                
                <Text style={styles.successModalTitle}>გადახდა წარმატებულია!</Text>
                <Text style={styles.successModalMessage}>
                  თქვენი გადახდა {params.amount}₾ წარმატებით განხორციელდა.
                </Text>
                
                {rememberCard && (
                  <View style={styles.rememberCardSuccess}>
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                    <Text style={styles.rememberCardSuccessText}>
                      ბარათი დამახსოვრებულია მომავალი გადახდებისთვის
                    </Text>
                  </View>
                )}
                
                <View style={styles.successTimerContainer}>
                  <Text style={styles.successTimerText}>
                    ავტომატურად დაბრუნდებით 5 წამში...
                  </Text>
                </View>
                
                {paymentData.context === 'carwash' && paymentData.metadata ? (
                  // CarWash გადახდის შემთხვევაში "დადასტურება" ღილაკი
                  <TouchableOpacity
                    style={styles.successModalButton}
                    onPress={async () => {
                      try {
                        console.log('🚗 CarWash ჯავშნის შექმნა...');
                        
                        const bookingData = {
                          userId: user?.id || '',
                          locationId: paymentData.metadata?.locationId || '',
                          locationName: paymentData.metadata?.locationName || '',
                          locationAddress: paymentData.metadata?.locationName || '',
                          serviceId: paymentData.metadata?.serviceId || '',
                          serviceName: paymentData.metadata?.serviceName || '',
                          servicePrice: paymentData.amount,
                          bookingDate: new Date(paymentData.metadata?.selectedDate || Date.now()).getTime(),
                          bookingTime: paymentData.metadata?.selectedTime || '',
                          carInfo: {
                            make: 'Toyota',
                            model: 'Camry',
                            year: '2020',
                            licensePlate: 'TB-123-AB',
                            color: 'შავი'
                          },
                          customerInfo: {
                            name: user?.name || 'მომხმარებელი',
                            phone: user?.phone || '',
                            email: user?.email || ''
                          }
                        };

                        // CarWash დაჯავშნის შექმნა backend-ში
                        await carwashApi.createBooking(bookingData);
                        console.log('✅ CarWash დაჯავშნა წარმატებით შეიქმნა!');
                        
                        // მოდალის დახურვა და იმავე გვერდზე დარჩენა
                        setShowSuccessModal(false);
                        router.back(); // Payment modal-ის დახურვა
                      } catch (error) {
                        console.error('❌ CarWash დაჯავშნის შექმნის შეცდომა:', error);
                        Alert.alert('შეცდომა', 'ჯავშნის შექმნისას მოხდა შეცდომა');
                      }
                    }}
                  >
                    <Text style={styles.successModalButtonText}>დადასტურება</Text>
                  </TouchableOpacity>
                ) : (
                  // სხვა შემთხვევებში "კარგი" ღილაკი
                  <TouchableOpacity
                    style={styles.successModalButton}
                    onPress={() => {
                      Animated.parallel([
                        Animated.timing(fadeAnim, {
                          toValue: 0,
                          duration: 200,
                          useNativeDriver: true,
                        }),
                        Animated.timing(scaleAnim, {
                          toValue: 0.8,
                          duration: 200,
                          useNativeDriver: true,
                        }),
                      ]).start(() => {
                        setShowSuccessModal(false);
                        router.back(); // Payment modal-ის დახურვა
                      });
                    }}
                  >
                    <Text style={styles.successModalButtonText}>კარგი</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.18)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroWrapper: {
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 26,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: '#F6F8FF',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroBadgeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  amountSection: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  contextText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  amountChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  amountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountChipText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  testPayButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#E0ECFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7DBFF',
  },
  testPayText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  subscriptionSection: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.07)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.16)',
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  subscriptionPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  vinSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  vinInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontFamily: 'Inter',
    letterSpacing: 1,
    marginBottom: 8,
  },
  vinHint: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Inter',
  },
  savedCardSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  savedCard: {
    width: width - 40,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#CBD5E1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#E0ECFF',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 20,
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 1,
    fontFamily: 'Inter',
  },
  cardChip: {
    width: 32,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLines: {
    flexDirection: 'column',
    gap: 1,
  },
  chipLine: {
    width: 18,
    height: 1.5,
    backgroundColor: '#333',
    borderRadius: 1,
  },
  cardLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  loyaltyLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyLogoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Inter',
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -6,
  },
  mastercardCircle1: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  mastercardCircle2: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#60A5FA',
    marginLeft: -6,
  },
  cardNumber: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 2,
    fontFamily: 'Inter',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolder: {
    flex: 1,
  },
  cardHolderLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter',
  },
  cardExpiry: {
    alignItems: 'flex-end',
  },
  cardExpiryLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  cardExpiryDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter',
  },
  payButton: {
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: 12,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  methodsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  singlePayButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  singlePayGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  singlePayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B0B0E',
    fontFamily: 'Inter',
  },
  singlePayButtonDisabled: {
    opacity: 0.6,
  },
  bogStatusContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  bogStatusText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  bogStatusSuccess: {
    color: '#22C55E',
  },
  bogStatusError: {
    color: '#EF4444',
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#CBD5E1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  methodTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  methodDescription: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Inter',
  },
  securitySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  securityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  securityDescription: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Inter',
  },
  // Modal Styles
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontFamily: 'Inter',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Inter',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  // Remember Card Toggle Styles
  rememberCardSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rememberCardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginRight: 12,
  },
  toggleSwitchActive: {
    backgroundColor: '#2563EB',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#CBD5E1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  rememberCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  rememberCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  rememberCardDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    lineHeight: 16,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModal: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
  },
  successModalGradient: {
    padding: 30,
  },
  successModalContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins_700Bold',
  },
  successModalMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
  },
  rememberCardSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  rememberCardSuccessText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  successTimerContainer: {
    marginBottom: 24,
  },
  successTimerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  successModalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Saved Cards Styles
  savedCardsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  savedCardsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  savedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  savedCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  savedCardDetails: {
    marginLeft: 12,
    flex: 1,
  },
  savedCardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  savedCardType: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  deleteCardButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  savedCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  savedCardActionButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
});