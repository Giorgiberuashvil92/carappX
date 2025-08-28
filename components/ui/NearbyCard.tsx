import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NearbyCardProps = {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string; // e.g., district
  rating?: number;
  distance?: string;
  price?: string;
  onPress?: () => void;
};

export default function NearbyCard({ image, title, subtitle, rating, distance, price, onPress }: NearbyCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <Image source={image} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle && (
          <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
        )}
        <View style={styles.metaRow}>
          {typeof rating === 'number' && (
            <View style={styles.chip}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.chipText}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {distance && (
            <View style={styles.chip}>
              <Ionicons name="navigate-outline" size={12} color="#6B7280" />
              <Text style={styles.chipText}>{distance}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.rightCol}>
        {price && (
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>{price}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  thumb: { width: 64, height: 64, borderRadius: 16 },
  title: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  subtitle: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 11, color: '#374151' },
  rightCol: { alignItems: 'flex-end', gap: 8 },
  pricePill: { backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  priceText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
});


