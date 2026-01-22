import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  popular?: boolean;
  icon: string;
  color: string;
  yearlyPrice?: number;
  discountLabel?: string;
  originalPrice?: number;
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'ძირითადი',
    price: 0,
    currency: '₾',
    period: 'უფასო',
    features: [
      'განცხადებების ნახვა',
      'მანქანის დამატება',
      'ნაწილების მოძიება',
      'ავტოსერვისებით სარგებლობა',
      'მანქანის ქირაობა',
      'ჯგუფით სარგებლობა',
    ],
    icon: 'star-outline',
    color: '#3B82F6',
  },
  {
    id: 'premium-monthly',
    name: 'პრემიუმ - თვეში',
    price: 2.99,
    currency: '₾',
    period: 'თვეში',
    features: [
      'ყველა ძირითადი ფუნქცია',
      '5 ოფიციალური CarFAX რეპორტი',
      'კრედო ბანკის 0% განვადება',
      'ფასდაკლებები პარტნიორებთან',
      'ჯარიმების კონტროლი',
      'შეხსენებები სერვისზე',
      'AI დამხმარე',
    ],
    icon: 'diamond-outline',
    color: '#F59E0B',
  },
];

export default function SubscriptionModal({ visible, onClose, onSuccess }: SubscriptionModalProps) {
  const { user } = useUser();
  const { subscription, hasActiveSubscription, refreshSubscription, updateSubscription, isPremiumUser } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium-monthly');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // თუ premium არ აქვს, basic იყოს selected და disabled
  useEffect(() => {
    if (!isPremiumUser && hasActiveSubscription && subscription?.plan === 'basic') {
      setSelectedPlan('basic');
    }
  }, [hasActiveSubscription, subscription?.plan]);



  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (selectedPlan === 'basic') {
      // Basic პაკეტი უფასოა, ასე რომ უბრალოდ დავაყენოთ
      if (!user?.id) {
        Alert.alert('შეცდომა', 'მომხმარებელი არ არის ავტორიზებული');
        return;
      }

      setIsProcessing(true);
      try {
        const basicSubscription = {
          id: `basic_${user.id}_${Date.now()}`,
          plan: 'basic' as const,
          status: 'active' as const,
          startDate: new Date().toISOString(),
          autoRenew: false,
          price: 0,
          currency: '₾',
        };

        // Update subscription context
        await updateSubscription(basicSubscription);
        
        Alert.alert(
          'წარმატება',
          'ძირითადი პაკეტი აქტივირებულია!',
          [{ text: 'კარგი', onPress: () => {
            onClose();
            onSuccess?.();
          }}]
        );
      } catch (error) {
        console.error('❌ Basic subscription activation error:', error);
        Alert.alert('შეცდომა', 'პაკეტის აქტივაცია ვერ მოხერხდა');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Check if user already has premium plan
    if (hasActiveSubscription && subscription?.plan === 'premium' && selectedPlan.startsWith('premium')) {
      Alert.alert(
        'ინფორმაცია',
        'თქვენ უკვე გაქვთ პრემიუმ პაკეტი!',
        [{ text: 'კარგი' }]
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('შეცდომა', 'მომხმარებელი არ არის ავტორიზებული');
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsProcessing(true);

    try {
      const orderId = `subscription_${selectedPlan}_${user.id}_${Date.now()}`;
      
      console.log('💳 Subscription plan არჩეული:', plan);

      // Modal-ის დახურვა და payment-card-ზე გადაყვანა
      onClose();
      
          // Premium-ის ყველა ვერსია premium-ად განვიხილოთ
          const isPremium = selectedPlan.startsWith('premium');
          const subscriptionMetadata = {
        planId: isPremium ? 'premium' : selectedPlan,
        planName: plan.name,
        planPrice: plan.price,
        planCurrency: plan.currency,
        planPeriod: plan.period,
        features: plan.features,
        subscriptionType: isPremium ? 'premium' : 'basic',
        subscriptionVariant: selectedPlan // premium-monthly, premium-6months, premium-yearly
      };

      router.push({
        pathname: '/payment-card',
        params: {
          amount: plan.price.toString(),
          description: `CarAppX ${plan.name} პაკეტი - ${plan.period}`,
          context: 'subscription',
          planId: selectedPlan,
          planName: plan.name,
          planPrice: plan.price.toString(),
          planCurrency: plan.currency,
          planDescription: `CarAppX ${plan.name} პაკეტი - ${plan.period}`,
          isSubscription: 'true',
          orderId: orderId,
          metadata: JSON.stringify(subscriptionMetadata)
        }
      });

    } catch (error) {
      console.error('❌ Subscription navigation შეცდომა:', error);
      Alert.alert(
        'შეცდომა',
        'გადახდის გვერდზე გადაყვანა ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით.',
        [{ text: 'კარგი' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#0B1220" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>პაკეტი</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>1 of 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33.33%' }]} />
            </View>
          </View>

          {/* Main Content */}
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.mainTitle}>აირჩიე შენთვის შესაფერისი პაკეტი</Text>
            <Text style={styles.mainSubtitle}>დაწევა ან გაზრდა ნებისმიერ დროს</Text>

            {/* Plan Cards */}
            <View style={styles.plansContainer}>
              {subscriptionPlans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                // Check if this is the current active plan
                let isCurrentPlan = false;
                if (hasActiveSubscription && subscription) {
                  if (plan.id === 'basic' && subscription.plan === 'basic') {
                    isCurrentPlan = true;
                  } else if (plan.id === 'premium-monthly' && subscription.plan === 'premium') {
                    // Match by planPeriod or planId
                    if (subscription.planPeriod) {
                      if (subscription.planPeriod === 'თვეში' || subscription.planPeriod === 'monthly') {
                        isCurrentPlan = true;
                      }
                    }
                    // Also check by planId if available
                    if (!isCurrentPlan && subscription.planId) {
                      if (subscription.planId === 'premium-monthly' || subscription.planId === 'premium') {
                        isCurrentPlan = true;
                      }
                    }
                  }
                }
                // Basic პაკეტი disabled იყოს თუ premium არ აქვს
                const isBasicDisabled = plan.id === 'basic' && !isPremiumUser && hasActiveSubscription && subscription?.plan === 'basic';

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                      (isCurrentPlan || isBasicDisabled) && styles.planCardCurrent,
                    ]}
                    onPress={() => !isCurrentPlan && !isBasicDisabled && handlePlanSelect(plan.id)}
                    activeOpacity={0.7}
                    disabled={isCurrentPlan || isBasicDisabled}
                  >
                    {/* Active Plan Badge */}
                    {isCurrentPlan && (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                        <Text style={styles.activeBadgeText}>აქტიური</Text>
                      </View>
                    )}

                    {/* Discount Badge for Yearly */}
                    {isSelected && plan.discountLabel && !isCurrentPlan && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{plan.discountLabel}</Text>
                      </View>
                    )}

                    {/* Radio Button */}
                    <View style={styles.radioContainer}>
                      {isSelected ? (
                        <View style={styles.radioSelected}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.radioUnselected} />
                      )}
                    </View>

                    {/* Plan Info */}
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.featuresList}>
                        {plan.features.map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            {plan.id !== 'basic' && (
                              <Ionicons 
                                name="checkmark-circle" 
                                size={14} 
                                color={isSelected ? '#6366F1' : '#10B981'} 
                                style={styles.featureIcon}
                              />
                            )}
                            {plan.id === 'basic' && (
                              <View style={styles.basicBullet} />
                            )}
                            <Text style={[styles.planSubtext, isSelected && styles.planSubtextSelected]}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Price */}
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>
                        {plan.price > 0 ? `${plan.price}${plan.currency}` : 'უფასო'}
                      </Text>
                      {plan.originalPrice && (
                        <Text style={styles.originalPrice}>
                          {plan.originalPrice}{plan.currency}
                        </Text>
                      )}
                      {plan.price > 0 && !plan.originalPrice && (
                        <Text style={styles.pricePeriod}>/{plan.period}</Text>
                      )}
                      {plan.price > 0 && plan.originalPrice && (
                        <Text style={styles.pricePeriod}>/{plan.period}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.subscribeButton, 
                (isProcessing || 
                 (hasActiveSubscription && subscription?.plan === 'basic' && selectedPlan === 'basic') ||
                 (hasActiveSubscription && subscription?.plan === 'premium' && selectedPlan.startsWith('premium'))
                ) && styles.disabledButton
              ]}
              onPress={handleSubscribe}
              disabled={
                isProcessing || 
                (hasActiveSubscription && subscription?.plan === 'basic' && selectedPlan === 'basic') ||
                (hasActiveSubscription && subscription?.plan === 'premium' && selectedPlan.startsWith('premium'))
              }
              activeOpacity={0.9}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {selectedPlan === 'basic' ? 'უფასო პაკეტი' : 'გადახდის მეთოდის დამატება'}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.footerNote}>
              გაუქმება ნებისმიერ დროს. ვალდებულება არ არის
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.90,
    minHeight: height * 0.85,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1220',
    fontFamily: 'System',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'System',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1220',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 20,
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  planCardSelected: {
    backgroundColor: '#F5F5DC',
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  planCardCurrent: {
    opacity: 0.7,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'System',
  },
  radioContainer: {
    marginRight: 12,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  originalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 2,
    fontFamily: 'System',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1220',
    marginBottom: 8,
    fontFamily: 'System',
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  featureIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  basicBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7280',
    marginTop: 6,
    marginRight: 2,
    flexShrink: 0,
  },
  planSubtext: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    flex: 1,
    fontFamily: 'System',
  },
  planSubtextSelected: {
    color: '#374151',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B1220',
    fontFamily: 'System',
  },
  pricePeriod: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'System',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  billingToggleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  togglePill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  toggleActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99,102,241,0.22)',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    fontSize: 12,
  },
  toggleTextActive: {
    color: '#6366F1',
  },
  perksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  perksCarousel: {
    paddingHorizontal: 12,
    gap: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  perkCard: {
    width: 220,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.25)',
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
  },
  perkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  perkTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.2,
    borderColor: 'rgba(148,163,184,0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
  },
  perkText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subscribeButton: {
    backgroundColor: '#0B1220',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  footerNote: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'System',
  },
  activeSubscriptionContainer: {
    gap: 12,
  },
  activeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  activeText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
