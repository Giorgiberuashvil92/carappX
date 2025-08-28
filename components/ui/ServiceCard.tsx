import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type ServiceCardProps = {
  image: ImageSourcePropType;
  title: string;
  category?: string;
  rating?: number;
  location?: string;
  price?: string;
  priceSuffix?: string;
  onPress?: () => void;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export default function ServiceCard({ image, title, category, rating, location, price, priceSuffix, onPress, showFavorite = true, isFavorite, onToggleFavorite }: ServiceCardProps) {
  const [fav, setFav] = useState(false);
  const favorite = typeof isFavorite === 'boolean' ? isFavorite : fav;
  const toggle = () => {
    if (onToggleFavorite) onToggleFavorite();
    else setFav(v => !v);
  };
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <ImageBackground source={image} style={styles.image} imageStyle={styles.imageRounded}>
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.55)"]}
          style={styles.overlay}
        />
        <View style={styles.topRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#111827" />
            <Text style={styles.ratingPillText}>{rating?.toFixed(1) ?? '4.9'}</Text>
          </View>
          {showFavorite && (
            <TouchableOpacity activeOpacity={0.9} onPress={toggle} style={styles.heartButton}>
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={16} color={favorite ? '#EF4444' : '#111827'} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomArea}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            {location && (
              <View style={styles.metaPill}>
                <Feather name="map-pin" size={12} color="#FFFFFF" />
                <Text style={styles.metaText}>{location}</Text>
              </View>
            )}
            {price && (
              <View style={styles.priceWrap}>
                <Text style={styles.priceText}>{price}</Text>
                {!!priceSuffix && <Text style={styles.priceSuffix}>{priceSuffix}</Text>}
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 200,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  image: { width: '100%', height: '100%' },
  imageRounded: { borderRadius: 28 },
  overlay: { ...StyleSheet.absoluteFillObject },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  ratingPillText: { color: '#111827', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  heartButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  bottomArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: { color: '#FFFFFF', fontFamily: 'Manrope_600SemiBold', fontSize: 12 },
  priceWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  priceText: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 15 },
  priceSuffix: { color: '#E5E7EB', fontFamily: 'Manrope_500Medium', fontSize: 10, marginBottom: 2 },
});


