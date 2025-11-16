import React, { useState } from 'react';
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
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'უფასო',
    price: 0,
    currency: '₾',
    period: 'სამუდამოდ',
    features: [
      '🚗 გარაჟის მართვა (1 მანქანა) - აუტომატური შეხსენებები',
      '🚿 სამრეცხაო ძებნა',
      '🛒 მაღაზიის და ნაწილების ძებნა',
      '👥 ჯგუფები - კომუნიკაცია',
    ],
    icon: 'gift-outline',
    color: '#22C55E',
  },
  {
    id: 'basic',
    name: 'ძირითადი',
    price: 2.99,
    currency: '₾',
    period: 'თვეში',
    yearlyPrice: 29.9,
    discountLabel: '2 თვე საჩუქრად',
    features: [
      '0 პროცენტიანი განვადება',
      'გათამაშებაში ჩართვა - და პრიზები',
      'ჯარიმების შეხსენება',
      'აუტო შეხსენებები ყველაფერზე',
      '🚗 გარაჟის მართვა (უსაზღვრო)',
      '🚿 სამრეცხაო დაჯავშნა',
      '🛒 მაღაზიის ძებნა',
      '👥 ჯგუფები - კომუნიკაცია',
      '🤖 უსაზღვრო AI რეკომენდაციები',
      '🔧 ხელოსნების ძებნა',
      '💬 პრიორიტეტული მხარდაჭერა',
      'მანქანის მოძიება AI დახმარებით ..'

    ],
    icon: 'star-outline',
    color: '#3B82F6',
  },
  {
    id: 'premium',
    name: 'პრემიუმ',
    price: 4.99,
    currency: '₾',
    period: 'თვეში',
    yearlyPrice: 49.9,
    discountLabel: '2 თვე საჩუქრად',
    features: [
      '🚗 გარაჟის მართვა (უსაზღვრო)',
      '🚿 პრიორიტეტული სამრეცხაო ძებნა',
      '🛒 მაღაზიის ძებნა',
      '👥 კომუნიტის ძებნა',
      '🤖 უსაზღვრო AI რეკომენდაციები',
      '📊 1 CarFAX მოხსენება',
      '🔧 ხელოსნების ძებნა',
      '🚛 ევაკუატორის სერვისი',
      '💬 პრიორიტეტული მხარდაჭერა',
      'მანქანის მოძიება AI დახმარებით ..',
      'ნაწილების დაჯავშნა და მოძიება AI დახმარებით ..',
    ],
    popular: true,
    icon: 'diamond-outline',
    color: '#F59E0B',
  },
];

export default function SubscriptionModal({ visible, onClose, onSuccess }: SubscriptionModalProps) {
  const { user } = useUser();
  const { subscription, hasActiveSubscription, refreshSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);



  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (selectedPlan === 'free') {
      Alert.alert(
        'უფასო პაკეტი',
        'უფასო პაკეტი უკვე აქტიურია!',
        [{ text: 'კარგი', onPress: onClose }]
      );
      return;
    }

    // Check if user already has the same plan
    if (hasActiveSubscription && subscription?.plan === selectedPlan) {
      Alert.alert(
        'ინფორმაცია',
        `თქვენ უკვე გაქვთ ${subscription.plan === 'premium' ? 'პრემიუმ' : 'ძირითადი'} პაკეტი!`,
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
      
      const subscriptionMetadata = {
        planId: selectedPlan,
        planName: plan.name,
        planPrice: plan.price,
        planCurrency: plan.currency,
        planPeriod: plan.period,
        features: plan.features,
        subscriptionType: 'premium'
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

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;
    const isPopular = plan.popular;
    const isCurrentPlan = hasActiveSubscription && subscription?.plan === plan.id;
    const isDisabled = isCurrentPlan;
    const displayPrice = billingPeriod === 'monthly' || !plan.yearlyPrice
      ? (plan.price === 0 ? 'უფასო' : `${plan.price}${plan.currency}`)
      : `${plan.yearlyPrice}${plan.currency}`;
    const previewFeatures = plan.features.slice(0, 3);
    const remainingCount = Math.max(0, plan.features.length - previewFeatures.length);

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isPopular && styles.popularPlan,
          isDisabled && styles.disabledPlan,
          isSelected && { transform: [{ scale: 1.02 }] },
        ]}
        onPress={() => !isDisabled && handlePlanSelect(plan.id)}
        activeOpacity={isDisabled ? 1 : 0.8}
        disabled={isDisabled}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardDecoration}
        />
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>⭐ პოპულარული</Text>
          </View>
        )}

        {isCurrentPlan && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.currentPlanText}>✅ აქტიური</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={[styles.planIcon, { backgroundColor: plan.color }]}> 
            <Ionicons name={plan.icon as any} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPeriod}>{billingPeriod === 'monthly' ? 'თვეში' : 'წლიურად'}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{displayPrice}</Text>
            {plan.price > 0 && (
              <Text style={styles.priceSuffix}>
                {billingPeriod === 'monthly' ? '/თვე' : (plan.discountLabel || '/წლიური')}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.cardDivider} />

        <View style={styles.featuresContainer}>
          {previewFeatures.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {remainingCount > 0 && (
            <Text style={styles.moreText}>+{remainingCount} ფუნქცია</Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
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
          <LinearGradient
            colors={["rgba(99,102,241,0.3)", "rgba(17,24,39,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerDecoration}
          />
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>გახდი პრემიუმ</Text>
              <Text style={styles.subtitle}>გახსენი ყველა ფუნქცია და მიიღე საუკეთესო გამოცდილება</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  subscription?.plan === 'premium' && styles.premiumStatus,
                  subscription?.plan === 'basic' && styles.basicStatus,
                  subscription?.plan === 'free' && styles.freeStatus,
                ]}>
                  <Ionicons 
                    name={subscription?.plan === 'premium' ? 'diamond' : subscription?.plan === 'basic' ? 'star' : 'card'} 
                    size={12} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.statusText}>
                    {subscription?.plan === 'premium' ? 'პრემიუმ' : 
                     subscription?.plan === 'basic' ? 'ძირითადი' : 
                     'უფასო'}
                  </Text>
                </View>
                {hasActiveSubscription && subscription?.endDate && (
                  <Text style={styles.nextBilling}>
                    შემდეგი: {new Date(subscription.endDate).toLocaleDateString('ka-GE')}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.billingToggleContainer}>
            <TouchableOpacity
              style={[styles.togglePill, billingPeriod === 'monthly' && styles.toggleActive]}
              onPress={() => setBillingPeriod('monthly')}
            >
              <Text style={[styles.toggleText, billingPeriod === 'monthly' && styles.toggleTextActive]}>თვიური</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.togglePill, billingPeriod === 'yearly' && styles.toggleActive]}
              onPress={() => setBillingPeriod('yearly')}
            >
              <Text style={[styles.toggleText, billingPeriod === 'yearly' && styles.toggleTextActive]}>წლიური</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plansCarousel}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                const cardWidth = 260 + 12; // width + marginRight
                const idx = Math.max(0, Math.min(subscriptionPlans.length - 1, Math.round(x / cardWidth)));
                setCarouselIndex(idx);
              }}
              scrollEventThrottle={16}
            >
              {subscriptionPlans.map(renderPlanCard)}
            </ScrollView>

            <View style={styles.pagination}>
              {subscriptionPlans.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === carouselIndex && styles.dotActive]}
                />
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.perksCarousel}
              snapToInterval={240}
              decelerationRate="fast"
            >
              <View style={styles.perkCard}>
                <View style={[styles.perkIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)' }]}>
                  <Ionicons name="sparkles" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.perkTitle}>უსაზღვრო AI რეკომენდაციები</Text>
              </View>
              <View style={styles.perkCard}>
                <View style={[styles.perkIconWrap, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.35)' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#22C55E" />
                </View>
                <Text style={styles.perkTitle}>პრიორიტეტული მხარდაჭერა</Text>
              </View>
              <View style={styles.perkCard}>
                <View style={[styles.perkIconWrap, { backgroundColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.35)' }]}>
                  <Ionicons name="card" size={18} color="#60A5FA" />
                </View>
                <Text style={styles.perkTitle}>0% განვადება</Text>
              </View>
            </ScrollView>
          </ScrollView>

          <View style={styles.footer}>
            {hasActiveSubscription ? (
              <View style={styles.activeSubscriptionContainer}>
                <View style={styles.activeInfo}>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <Text style={styles.activeText}>
                    {subscription?.plan === 'premium' ? 'პრემიუმ' : 'ძირითადი'} პაკეტი აქტიურია
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={async () => {
                    const currentPlan = subscription?.plan;
                    const targetPlan = currentPlan === 'basic' ? 'premium' : 'basic';
                    
                    // Check if trying to upgrade to same plan
                    if (currentPlan === targetPlan) {
                      Alert.alert(
                        'ინფორმაცია',
                        `თქვენ უკვე გაქვთ ${currentPlan === 'premium' ? 'პრემიუმ' : 'ძირითადი'} პაკეტი!`,
                        [{ text: 'კარგი' }]
                      );
                      return;
                    }
                    
                    setSelectedPlan(targetPlan);
                    
                    // Navigate to payment
                    if (!user?.id) {
                      Alert.alert('შეცდომა', 'მომხმარებელი არ არის ავტორიზებული');
                      return;
                    }

                    const plan = subscriptionPlans.find(p => p.id === targetPlan);
                    if (!plan) return;

                    setIsProcessing(true);

                    try {
                      const orderId = `subscription_${targetPlan}_${user.id}_${Date.now()}`;
                      
                      console.log('💳 Subscription upgrade:', plan);

                      // Modal-ის დახურვა და payment-card-ზე გადაყვანა
                      onClose();
                      
                      // Plan-ის ინფორმაცია payment-card-ზე გადაცემა
                      const upgradeMetadata = {
                        planId: targetPlan,
                        planName: plan.name,
                        planPrice: plan.price,
                        planCurrency: plan.currency,
                        planPeriod: plan.period,
                        features: plan.features,
                        subscriptionType: 'upgrade',
                        currentPlan: subscription?.plan || 'free'
                      };

                      router.push({
                        pathname: '/payment-card',
                        params: {
                          amount: plan.price.toString(),
                          description: `CarAppX ${plan.name} პაკეტი - ${plan.period}`,
                          context: 'subscription',
                          planId: targetPlan,
                          planName: plan.name,
                          planPrice: plan.price.toString(),
                          planCurrency: plan.currency,
                          planDescription: `CarAppX ${plan.name} პაკეტი - ${plan.period}`,
                          isSubscription: 'true',
                          orderId: orderId,
                          metadata: JSON.stringify(upgradeMetadata)
                        }
                      });

                    } catch (error) {
                      console.error('❌ Subscription upgrade შეცდომა:', error);
                      Alert.alert(
                        'შეცდომა',
                        'გადახდის გვერდზე გადაყვანა ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით.',
                        [{ text: 'კარგი' }]
                      );
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                >
                  <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                  <Text style={styles.upgradeButtonText}>
                    {subscription?.plan === 'basic' ? 'პრემიუმზე გადასვლა' : 
                     subscription?.plan === 'premium' ? 'ძირითადზე გადასვლა' : 
                     'განახლება'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.subscribeButton, isProcessing && styles.disabledButton]}
                onPress={handleSubscribe}
                disabled={isProcessing}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.subscribeGradient}
                />
                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.subscribeButtonText}>მუშაობს...</Text>
                  </View>
                ) : (
                  <View style={styles.subscribeContent}>
                    <Ionicons 
                      name={selectedPlan === 'free' ? 'gift' : 'card'} 
                      size={18} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.subscribeButtonText}>
                      {selectedPlan === 'free' ? 'უფასო პაკეტი' : 'გადახდა'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
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
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    minHeight: height * 0.9,
    overflow: 'hidden',
    position: 'relative',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  grabber: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumStatus: {
    backgroundColor: '#F59E0B',
  },
  basicStatus: {
    backgroundColor: '#3B82F6',
  },
  freeStatus: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  nextBilling: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  plansContainer: {
    gap: 16,
  },
  plansCarousel: {
    paddingHorizontal: 12,
    gap: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: '#6366F1',
    width: 10,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
    width: 220,
    marginRight: 12,
    overflow: 'hidden',
  },
  cardDecoration: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  selectedPlan: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 3,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  popularPlan: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  disabledPlan: {
    opacity: 0.6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F59E0B',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#22C55E',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  currentPlanText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  planPeriod: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  priceBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    borderWidth: 1.2,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  priceText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
  },
  priceSuffix: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    lineHeight: 12,
  },
  featuresContainer: {
    gap: 6,
    marginTop: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Inter',
    flex: 1,
    lineHeight: 14,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.2)',
    marginVertical: 8,
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
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  subscribeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  subscribeGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscribeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
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
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
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
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
