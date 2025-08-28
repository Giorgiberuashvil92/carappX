import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Feather } from '@expo/vector-icons';

type MiniServiceCardProps = {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  price?: string;
  onPress?: () => void;
};

export default function MiniServiceCard({ image, title, subtitle, price, onPress }: MiniServiceCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <Image source={image} style={styles.thumbnail} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {!!subtitle && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}
        {!!price && (
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>{price}</Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  thumbnail: { width: 52, height: 52, borderRadius: 12 },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111827' },
  subtitle: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#6B7280' },
  pricePill: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  priceText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 12 },
});


