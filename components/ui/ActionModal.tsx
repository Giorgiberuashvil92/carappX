import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  hasStore?: boolean;
  hasDismantlers?: boolean;
}

export default function ActionModal({
  visible,
  onClose,
  hasStore = false,
  hasDismantlers = false,
}: ActionModalProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable 
          style={styles.panelModalContent}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>რას გააკეთებთ?</Text>
            <Text style={styles.modalSubtitle}>
              აირჩიეთ სასურველი ოფცია
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Parts Request Option - ყოველთვის ჩანს */}
            <Pressable
              style={[styles.optionCard, { backgroundColor: '#F0F9FF', borderColor: '#3B82F6' }]}
              onPress={() => {
                onClose();
                router.push('/parts-requests' as any);
              }}
            >
              <View style={[styles.optionIconBg, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="construct-outline" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: '#1E40AF' }]}>ნაწილის მოთხოვნა</Text>
                <Text style={[styles.optionDescription, { color: '#1E40AF' }]}>
                  გამოაქვეყნე მოთხოვნა და მიიღე შეთავაზებები
                </Text>
              </View>
              <View style={styles.optionArrow}>
                <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
              </View>
            </Pressable>

            <Pressable
              style={[styles.optionCard, { backgroundColor: '#F0FDF4', borderColor: '#10B981' }]}
              onPress={() => {
                onClose();
                router.push('/search-repairmen' as any);
              }}
            >
              <View style={[styles.optionIconBg, { backgroundColor: '#10B981' }]}>
                <Ionicons name="build-outline" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: '#065F46' }]}>ხელოსნის მოძიება</Text>
                <Text style={[styles.optionDescription, { color: '#065F46' }]}>
                  გამოაქვეყნე მოთხოვნა და მიიღე შეთავაზებები ხელოსნებისგან
                </Text>
              </View>
              <View style={styles.optionArrow}>
                <Ionicons name="chevron-forward" size={18} color="#10B981" />
              </View>
            </Pressable>

            {/* Car Rental Option - ყოველთვის ჩანს */}
            {/* <Pressable
              style={[styles.optionCard, { backgroundColor: '#FFF7ED', borderColor: '#F59E0B' }]}
              onPress={() => {
                onClose();
                router.push('/car-rental-list' as any);
              }}
            >
              <View style={[styles.optionIconBg, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="car-sport-outline" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: '#92400E' }]}>მანქანების გაქირავება</Text>
                <Text style={[styles.optionDescription, { color: '#92400E' }]}>
                  იპოვე და იქირავე მანქანა შენი საჭიროებისთვის
                </Text>
              </View>
              <View style={styles.optionArrow}>
                <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
              </View>
            </Pressable> */}

            {/* Search Repairmen Option - ყოველთვის ჩანს */}


            {/* Business Panel Option - მხოლოდ თუ აქვს seller assets */}
            {(hasStore || hasDismantlers) && (
              <Pressable
                style={[styles.optionCard, styles.businessOptionCard]}
                onPress={() => {
                  onClose();
                  // თუ აქვს დაშლილები, გადავიყვანოთ dismantler-dashboard-ზე
                  // თუ მხოლოდ store აქვს, partner-dashboard-ზე
                  if (hasDismantlers) {
                    router.push('/dismantler-dashboard' as any);
                  } else {
                    router.push('/partner-dashboard-store' as any);
                  }
                }}
              >
                <View style={[styles.optionIconBg, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="construct" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>ბიზნესის მართვა</Text>
                  <Text style={styles.optionDescription}>
                    {hasDismantlers ? 'დაშლილების' : 'მაღაზიის'} მოთხოვნები და ჩატები
                  </Text>
                </View>
                <View style={styles.optionArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#10B981" />
                </View>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  panelModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aiOptionCard: {
    borderColor: '#4F46E5',
    backgroundColor: '#F8F9FF',
  },
  businessOptionCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  optionIconWrapper: {
    marginBottom: 0,
  },
  optionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
    flex: 1,
  },
  optionDescription: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    flex: 1,
  },
  optionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
