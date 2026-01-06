import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../contexts/SubscriptionContext';

const { height } = Dimensions.get('window');

interface PremiumInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumInfoModal({
  visible,
  onClose,
}: PremiumInfoModalProps) {
  const { subscription } = useSubscription();

  // Show modal for both premium and basic plans
  if (!subscription || (subscription.plan !== 'premium' && subscription.plan !== 'basic')) {
    return null;
  }

  // განახლების თარიღის ფორმატირება
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'უცნობი';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('ka-GE', { month: 'long' });
      const year = date.getFullYear();
      return `${day} ${month}, ${year}`;
    } catch {
      return 'უცნობი';
    }
  };

  const renewalDate = subscription.endDate
    ? formatDate(subscription.endDate)
    : 'უცნობი';

  const price = subscription.price || 0;
  const currency = subscription.currency || '₾';

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
            <Text style={styles.headerTitle}>პრემიუმი</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Main Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="diamond" size={48} color="#F59E0B" />
            </View>
           
            <Text style={styles.mainSubtitle}>
              თქვენ გაქვთ პრემიუმ გამოწერა
            </Text>

            {/* Info Cards */}
            <View style={styles.infoContainer}>
              {/* Renewal Date */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#0B1220" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>განახლება</Text>
                    <Text style={styles.infoValue}>{renewalDate}</Text>
                  </View>
                </View>
              </View>

              {/* Price Info */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={20} color="#0B1220" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>გადახდილი თანხა</Text>
                    <Text style={styles.infoValue}>
                      {price.toFixed(2)} {currency}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Plan Period */}
              {subscription.planPeriod && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#0B1220" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>პერიოდი</Text>
                      <Text style={styles.infoValue}>
                        {subscription.planPeriod === 'monthly' ||
                        subscription.planPeriod === 'თვეში'
                          ? 'თვიური'
                          : subscription.planPeriod === 'yearly' ||
                            subscription.planPeriod === 'წლიური'
                          ? 'წლიური'
                          : subscription.planPeriod}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Features List */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>პრემიუმ ფუნქციები:</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.featureText}>
                    ყველა ძირითადი ფუნქცია
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.featureText}>CarFAX მოხსენებები</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.featureText}>
                    უსაზღვრო AI რეკომენდაციები
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.featureText}>
                    პრიორიტეტული მხარდაჭერა
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.9}
            >
              <Text style={styles.closeButtonText}>დახურვა</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    height: height * 0.80,
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
  content: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
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
    fontSize: 16,
    color: '#0B1220',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
    fontWeight: '600',
  },
  infoContainer: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'System',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1220',
    fontFamily: 'System',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1220',
    marginBottom: 12,
    fontFamily: 'System',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#0B1220',
    fontFamily: 'System',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButton: {
    backgroundColor: '#0B1220',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

