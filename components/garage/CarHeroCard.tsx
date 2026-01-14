import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Car } from '../../types/garage';

type Props = {
  car: Car;
  onPress?: (car: Car) => void;
  showBackgroundImage?: boolean; // preserved for API compatibility
  isActive?: boolean;
  variant?: 'glass' | 'image' | 'minimal'; // preserved for API compatibility
};

export default function CarHeroCard({ car, onPress, isActive = false }: Props) {
  const [candidateIndex, setCandidateIndex] = useState(0);

  const fallback = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?fm=jpg&auto=format&fit=crop&w=1200&q=70';

  const normalizeUnsplash = (url?: string) => {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      u.searchParams.set('fm', 'jpg');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', '800');
      u.searchParams.set('q', '70');
      return u.toString();
    } catch {
      return url;
    }
  };

  const brandFallback = useMemo(() => {
    const map: { [key: string]: string } = {
      'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?fm=jpg&auto=format&fit=crop&w=1200&q=70',
      'Mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?fm=jpg&auto=format&fit=crop&w=1200&q=70',
      'Mercedes-Benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?fm=jpg&auto=format&fit=crop&w=1200&q=70',
      'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?fm=jpg&auto=format&fit=crop&w=1200&q=70',
    };
    return map[car.make] || fallback;
  }, [car.make]);

  const candidates = useMemo(() => {
    const primary = normalizeUnsplash(car.imageUri);
    const picsum = `https://picsum.photos/seed/${encodeURIComponent(car.make)}-${encodeURIComponent(car.model)}/800/600`;
    return Array.from(new Set([primary, brandFallback, picsum, fallback].filter(Boolean))) as string[];
  }, [car.imageUri, car.make, car.model, brandFallback]);

  useEffect(() => {
    setCandidateIndex(0);
  }, [car.id]);

  return (
    <TouchableOpacity activeOpacity={0.92} style={[styles.card, isActive && styles.cardActive]} onPress={() => onPress?.(car)}>
      <View style={styles.left}>
        <Image
          source={{ uri: candidates[candidateIndex] }}
          style={styles.thumb}
          resizeMode="cover"
          onError={() => {
            if (candidateIndex < candidates.length - 1) setCandidateIndex(candidateIndex + 1);
          }}
        />
      </View>
      <View style={styles.right}>
        <View style={styles.headerRow}>
          <Text style={styles.plate}>{car.plateNumber}</Text>
          {isActive && (
            <View style={styles.activeDot}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={styles.title}>{car.make} {car.model}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="calendar" size={12} color="#111827" />
            <Text style={styles.metaText}>{car.year}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="car" size={12} color="#111827" />
            <Text style={styles.metaText}>მანქანა</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 100,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardActive: {
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.18,
  },
  left: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    alignSelf: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  right: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: '#111827',
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  title: {
    marginTop: 6,
    fontFamily: 'Outfit',
    fontWeight: '500',
    fontSize: 14,
    color: '#111827',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Outfit',
    fontWeight: '500',
    fontSize: 12,
    color: '#111827',
  },
});
