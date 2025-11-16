import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../contexts/SubscriptionContext';

const { width, height } = Dimensions.get('window');

interface SubscriptionStatusModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionStatusModal({ visible, onClose }: SubscriptionStatusModalProps) {
  const { subscription, hasActiveSubscription } = useSubscription();

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
});
