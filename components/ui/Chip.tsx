import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ChipProps = {
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  active?: boolean;
  onPress?: () => void;
  style?: any;
};

export default function Chip({ label, icon, active = false, onPress, style }: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.base, active ? styles.active : styles.inactive, style]}
    >
      {icon && (
        <View style={{ marginRight: 6 }}>
          <Feather name={icon} size={14} color={active ? '#FFFFFF' : '#6B7280'} />
        </View>
      )}
      <Text style={[styles.text, { color: active ? '#FFFFFF' : '#111827' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  inactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  active: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    letterSpacing: -0.2,
  },
});


