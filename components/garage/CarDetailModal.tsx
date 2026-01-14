import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Car } from '../../types/garage';

type Props = {
  visible: boolean;
  car: Car | null;
  onClose: () => void;
};

export default function CarDetailModal({ visible, car, onClose }: Props) {
  if (!car) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{car.make} {car.model}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.row}>
              <Text style={styles.label}>საწარმო</Text>
              <Text style={styles.value}>{car.make}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>მოდელი</Text>
              <Text style={styles.value}>{car.model}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>საწ. წელი</Text>
              <Text style={styles.value}>{car.year}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ნომერი</Text>
              <Text style={styles.value}>{car.plateNumber}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>მოვლის ისტორია</Text>
              <Text style={styles.muted}>აქ გამოვიტანთ timeline-ს (შემდეგი ეტაპი)</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>დოკუმენტები</Text>
              <Text style={styles.muted}>ტექდათვალიერება/დაზღვევა (შემდეგი ეტაპი)</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  label: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  value: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  section: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#111827',
    marginBottom: 6,
    fontWeight: '700',
  },
  muted: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#9CA3AF',
  },
});


