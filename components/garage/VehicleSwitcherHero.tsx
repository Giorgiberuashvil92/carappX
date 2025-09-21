import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Car } from '../../types/garage';

type Props = {
  cars: Car[];
  selectedCarId?: string | number | null;
  onSelect: (car: Car) => void;
  height?: number;
  overlayEnabled?: boolean;
  overlayStops?: [number, number, number];
};

export default function VehicleSwitcherHero({ cars, selectedCarId, onSelect, height = 220, overlayEnabled = true, overlayStops = [0.02, 0.12, 0.22] }: Props) {
  const data = useMemo(() => cars, [cars]);
  const active = data.find((c) => String(c.id) === String(selectedCarId)) || data[0];
  const [bgFailed, setBgFailed] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);

  // არჩევანის შეცვლისას თავიდან სცადოს სურათის ჩატვირთვა
  useEffect(() => {
    setBgFailed(false);
  }, [selectedCarId]);

  useEffect(() => {
    console.log('🔎 VehicleSwitcherHero: selectedCarId=', selectedCarId);
    console.log('🔎 VehicleSwitcherHero: active car =', active ? { id: active.id, make: active.make, model: active.model, imageUri: active.imageUri } : null);
  }, [selectedCarId, active]);

  const normalizeUnsplash = (url?: string) => {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      // enforce jpg, crop, width and quality for RN stability
      u.searchParams.set('fm', 'jpg');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', '1200');
      u.searchParams.set('q', '70');
      return u.toString();
    } catch {
      return url;
    }
  };

  const getFallbackImage = (make?: string) => {
    const map: { [key: string]: string } = {
      'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?fm=jpg&auto=format&fit=crop&w=1200&q=70',
      'Mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?fm=jpg&auto=format&fit=crop&w=1200&q=70',
      'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?fm=jpg&auto=format&fit=crop&w=1200&q=70',
      'Toyota': 'https://images.unsplash.com/photo-1549317336-206569e8475c?fm=jpg&auto=format&fit=crop&w=1200&q=70',
      'Honda': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?fm=jpg&auto=format&fit=crop&w=1200&q=70',
    };
    const url = map[make || ''] || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?fm=jpg&auto=format&fit=crop&w=1200&q=70';
    console.log('🌐 Fallback image for make=', make, '→', url);
    return url;
  };

  const candidates = useMemo(() => {
    const primary = normalizeUnsplash(active?.imageUri);
    const brand = getFallbackImage(active?.make);
    const picsum = `https://picsum.photos/seed/${encodeURIComponent(active?.make || 'car')}-${encodeURIComponent(active?.model || '')}/1200/700`;
    return Array.from(new Set([primary, brand, picsum].filter(Boolean))) as string[];
  }, [active]);

  const backgroundUri = !bgFailed ? candidates[candidateIndex] : undefined;

  useEffect(() => {
    console.log('🖼️ backgroundUri =', backgroundUri, ' bgFailed=', bgFailed);
  }, [backgroundUri, bgFailed]);

  if (!data || data.length === 0) {
    console.log('ℹ️ VehicleSwitcherHero: cars list is empty');
    return (
      <View style={[styles.container, { height }]}> 
        <LinearGradient
          colors={["#111827", "#0f172a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject as any}
        />
        <View style={styles.topMeta}>
          <View style={styles.badge}>
            <Ionicons name="car" size={12} color="#111827" />
            <Text style={styles.badgeText}>მანქანები არ არის</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}> 
      {backgroundUri ? (
        <ImageBackground
          source={{ uri: backgroundUri }}
          style={StyleSheet.absoluteFillObject as any}
          resizeMode="cover"
          onLoadStart={() => console.log('⏳ Image load start:', backgroundUri)}
          onLoad={() => console.log('✅ Image loaded:', backgroundUri)}
          onError={(e) => {
            console.log('❌ Image load error for:', backgroundUri, e.nativeEvent);
            if (candidateIndex < candidates.length - 1) {
              setCandidateIndex(candidateIndex + 1);
            } else {
              setBgFailed(true);
            }
          }}
        >
          {overlayEnabled && (
            <LinearGradient
              colors={[`rgba(0,0,0,${overlayStops[0]})`, `rgba(0,0,0,${overlayStops[1]})`, `rgba(0,0,0,${overlayStops[2]})`]}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject as any}
            />
          )}
        </ImageBackground>
      ) : (
        <ImageBackground
          source={{ uri: candidates[candidateIndex] || getFallbackImage(active?.make) }}
          style={StyleSheet.absoluteFillObject as any}
          resizeMode="cover"
          onLoadStart={() => console.log('⏳ Fallback load start')}
          onLoad={() => console.log('✅ Fallback loaded')}
          onError={(e) => {
            console.log('❌ Fallback load error', e.nativeEvent);
            if (candidateIndex < candidates.length - 1) {
              setCandidateIndex(candidateIndex + 1);
            }
          }}
        >
          {overlayEnabled && (
            <LinearGradient
              colors={[`rgba(0,0,0,${overlayStops[0]})`, `rgba(0,0,0,${overlayStops[1]})`, `rgba(0,0,0,${overlayStops[2]})`]}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject as any}
            />
          )}
        </ImageBackground>
      )}

      <View style={styles.topMeta}>
        <View style={styles.badge}>
          <Ionicons name="car" size={12} color="#111827" />
          <Text style={styles.badgeText}>მანქანის არჩევა</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isActive = String(selectedCarId ?? active?.id) === String(item.id);
            return (
              <TouchableOpacity
                style={[styles.item, isActive && styles.itemActive]}
                onPress={() => onSelect(item)}
                activeOpacity={0.95}
              >
                <Text style={styles.itemPlate} numberOfLines={1}>{item.plateNumber}</Text>
                <Text style={styles.itemMeta} numberOfLines={1}>{item.make} {item.model}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
    marginBottom: 12,
  },
  topMeta: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    color: '#111827',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 12,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  item: {
    width: 150,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  itemActive: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  itemPlate: {
    color: '#FFFFFF',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  itemMeta: {
    color: '#E5E7EB',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
  },
});


