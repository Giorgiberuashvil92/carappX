import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../contexts/SubscriptionContext';
import API_BASE_URL from '../../config/api';

const { width, height } = Dimensions.get('window');

interface SubscriptionStatusModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionStatusModal({ visible, onClose }: SubscriptionStatusModalProps) {
  const { subscription, hasActiveSubscription, refreshSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'diamond';
      case 'basic':
        return 'star';
      default:
        return 'gift';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return '#F59E0B';
      case 'basic':
        return '#3B82F6';
      default:
        return '#22C55E';
    }
  };

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case 'premium':
        return [
          '🚗 გარაჟის მართვა (უსაზღვრო)',
          '🚿 პრიორიტეტული სამრეცხაო ძებნა',
          '🛒 მაღაზიის ძებნა',
          '👥 კომუნიტის ძებნა',
          '🤖 უსაზღვრო AI რეკომენდაციები',
          '📊 1 CarFAX მოხსენება',
          '🔧 ხელოსნების ძებნა',
          '🚛 ევაკუატორის სერვისი',
          '💬 პრიორიტეტული მხარდაჭერა',
        ];
      case 'basic':
        return [
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
        ];
      default:
        return [
          '🚗 გარაჟის მართვა (1 მანქანა)',
          '🚿 სამრეცხაო ძებნა',
          '🛒 მაღაზიის და ნაწილების ძებნა',
          '👥 ჯგუფები - კომუნიკაცია',
        ];
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'არ არის მითითებული';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleRefreshSubscription = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      await refreshSubscription();
      setTestResult('✅ Subscription განახლებულია!');
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('❌ Subscription refresh შეცდომა:', error);
      setTestResult('❌ შეცდომა subscription-ის განახლებისას');
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRecurringPayment = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);

      Alert.alert(
        '🧪 Recurring Payment ტესტი',
        'გსურთ გაუშვათ manual recurring payment trigger?',
        [
          { text: 'გაუქმება', style: 'cancel' },
          {
            text: 'კი',
            onPress: async () => {
              try {
                const response = await fetch(`${API_BASE_URL}/api/recurring-payments/process`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                const result = await response.json();

                if (result.success) {
                  setTestResult(
                    `✅ წარმატებული!\nწარმატებული: ${result.data?.success || 0}\nწარუმატებელი: ${result.data?.failed || 0}\nსულ: ${result.data?.total || 0}`
                  );
                  // Refresh subscription after test
                  await refreshSubscription();
                } else {
                  setTestResult(`❌ შეცდომა: ${result.message || 'უცნობი შეცდომა'}`);
                }
              } catch (error) {
                console.error('❌ Recurring payment test შეცდომა:', error);
                setTestResult('❌ შეცდომა recurring payment trigger-ისას');
              } finally {
                setIsLoading(false);
                setTimeout(() => setTestResult(null), 5000);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Test error:', error);
      setIsLoading(false);
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
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>📋 Subscription სტატუსი</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {subscription && (
              <View style={styles.subscriptionInfo}>
                {/* Plan Badge */}
                <View style={[styles.planBadge, { backgroundColor: getPlanColor(subscription.plan) }]}>
                  <Ionicons 
                    name={getPlanIcon(subscription.plan) as any} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.planName}>
                    {subscription.plan === 'premium' ? 'პრემიუმ' : 
                     subscription.plan === 'basic' ? 'ძირითადი' : 'უფასო'}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>სტატუსი:</Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: subscription.status === 'active' ? '#22C55E' : '#EF4444' 
                  }]}>
                    <Text style={styles.statusText}>
                      {subscription.status === 'active' ? 'აქტიური' : 'არააქტიური'}
                    </Text>
                  </View>
                </View>

                {/* Price */}
                {subscription.price > 0 && (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>ფასი:</Text>
                    <Text style={styles.priceText}>
                      {subscription.price} {subscription.currency}/თვე
                    </Text>
                  </View>
                )}

                {/* Dates */}
                <View style={styles.datesContainer}>
                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>დაწყების თარიღი:</Text>
                    <Text style={styles.dateText}>{formatDate(subscription.startDate)}</Text>
                  </View>
                  {subscription.endDate && (
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>შემდეგი გადახდა:</Text>
                      <Text style={styles.dateText}>{formatDate(subscription.endDate)}</Text>
                    </View>
                  )}
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>ფუნქციები:</Text>
                  {getPlanFeatures(subscription.plan).map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Test Buttons */}
                <View style={styles.testContainer}>
                  <Text style={styles.testTitle}>🧪 ტესტირება</Text>
                  
                  <TouchableOpacity
                    style={[styles.testButton, styles.refreshButton]}
                    onPress={handleRefreshSubscription}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="refresh" size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.testButtonText}>Subscription განახლება</Text>
                  </TouchableOpacity>

                  {hasActiveSubscription && (
                    <TouchableOpacity
                      style={[styles.testButton, styles.triggerButton]}
                      onPress={handleTestRecurringPayment}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="flash" size={18} color="#FFFFFF" />
                      )}
                      <Text style={styles.testButtonText}>Recurring Payment Trigger</Text>
                    </TouchableOpacity>
                  )}

                  {testResult && (
                    <View style={styles.testResultContainer}>
                      <Text style={styles.testResultText}>{testResult}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
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
    minHeight: height * 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subscriptionInfo: {
    gap: 20,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  datesContainer: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuresContainer: {
    gap: 12,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#D1D5DB',
    flex: 1,
  },
  testContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
  },
  triggerButton: {
    backgroundColor: '#F59E0B',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testResultContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  testResultText: {
    fontSize: 12,
    color: '#22C55E',
    textAlign: 'center',
    lineHeight: 18,
  },
});
