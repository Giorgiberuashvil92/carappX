import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type GarageHeaderProps = {
  totalCars: number;
  totalReminders: number;
  onAddCar: () => void;
  onAddReminder?: () => void;
  onSearch?: () => void;
};

export default function GarageHeader({ totalCars, totalReminders, onAddCar, onAddReminder, onSearch }: GarageHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>ფარეხი</Text>
          <Text style={styles.headerSubtitle}>{totalCars} მანქანა • {totalReminders} შეხსენება</Text>
        </View>
        <View style={styles.headerActions}>
          {onAddReminder && (
            <TouchableOpacity style={styles.headerButtonAlt} onPress={onAddReminder} activeOpacity={0.9}>
              <Ionicons name="alarm" size={20} color="#111827" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={onAddCar} activeOpacity={0.9}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          {onSearch && (
            <TouchableOpacity style={styles.headerButton} onPress={onSearch} activeOpacity={0.9}>
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerButtonAlt: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});


