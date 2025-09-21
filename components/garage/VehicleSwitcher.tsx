import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Car } from '../../types/garage';

type VehicleSwitcherProps = {
  cars: Car[];
  selectedCarId?: string | number | null;
  onSelect: (car: Car) => void;
};

export default function VehicleSwitcher({ cars, selectedCarId, onSelect }: VehicleSwitcherProps) {
  const data = useMemo(() => cars, [cars]);

  if (!data?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="car-outline" size={20} color="#9CA3AF" />
        <Text style={styles.emptyText}>ჯერ მანქანები არ გაქვს დამატებული</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isActive = String(selectedCarId) === String(item.id);
          return (
            <TouchableOpacity
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => onSelect(item)}
              activeOpacity={0.9}
            >
              <View style={styles.thumbWrap}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="car" size={16} color="#6B7280" />
                  </View>
                )}
              </View>
              <View style={styles.meta}>
                <Text style={styles.make} numberOfLines={1}>{item.make}</Text>
                <Text style={styles.model} numberOfLines={1}>{item.model}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  item: {
    width: 110,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemActive: {
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.2,
  },
  thumbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  thumb: {
    width: 64,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    alignItems: 'center',
  },
  make: {
    fontSize: 12,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  model: {
    fontSize: 11,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#9CA3AF',
  },
});


