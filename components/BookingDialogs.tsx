import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface BookingDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  booking: any;
}

interface CancelBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  booking: any;
}

interface ReBookModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  booking: any;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  visible,
  onClose,
  booking,
}) => {
  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ჯავშნის დეტალები</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.detailRow}>
              <Ionicons name="business" size={20} color="#3B82F6" />
              <Text style={styles.detailLabel}>სამრეცხაო:</Text>
              <Text style={styles.detailValue}>{booking.title}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color="#10B981" />
              <Text style={styles.detailLabel}>თარიღი:</Text>
              <Text style={styles.detailValue}>{booking.date}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={20} color="#F59E0B" />
              <Text style={styles.detailLabel}>ფასი:</Text>
              <Text style={styles.detailValue}>{booking.price}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>სტატუსი:</Text>
              <Text style={styles.detailValue}>{booking.status}</Text>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>დახურვა</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>რედაქტირება</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  visible,
  onClose,
  onConfirm,
  booking,
}) => {
  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ჯავშნის გაუქმება</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.warningIcon}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>
            <Text style={styles.warningText}>
              დარწმუნებული ხართ რომ გსურთ "{booking.title}"-ის გაუქმება?
            </Text>
            <Text style={styles.warningSubtext}>
              ეს მოქმედება შეუქცევადია.
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>არა</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={onConfirm}>
              <Text style={styles.dangerButtonText}>გაუქმება</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const ReBookModal: React.FC<ReBookModalProps> = ({
  visible,
  onClose,
  onConfirm,
  booking,
}) => {
  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ხელახლა დაჯავშნა</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.successText}>
              გსურთ "{booking.title}"-ის ხელახლა დაჯავშნა?
            </Text>
            <Text style={styles.successSubtext}>
              ჯავშანი დაჯავშნილი იქნება იმავე პარამეტრებით.
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>არა</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
              <Text style={styles.primaryButtonText}>დაჯავშნა</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6B7280',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 60,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  warningIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  warningSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  successSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#374151',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
