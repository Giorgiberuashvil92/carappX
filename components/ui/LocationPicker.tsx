import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
}

export default function LocationPicker({
  visible,
  onClose,
  onSelect,
  initialCoords,
  initialAddress,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: LocationResult) => void;
  initialCoords?: { latitude: number; longitude: number };
  initialAddress?: string;
}) {
  const initialRegion = useMemo(
    () => ({
      latitude: initialCoords?.latitude ?? 41.7151,
      longitude: initialCoords?.longitude ?? 44.8271,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    [initialCoords]
  );

  const [pickerRegion, setPickerRegion] = useState(initialRegion);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{ title: string; subtitle?: string; lat: number; lon: number }>>([]);
  const [reverseAddress, setReverseAddress] = useState<string>(initialAddress || '');
  const reverseTimerRef = useRef<any>(null);

  const userAgent = 'carappx/1.0 (contact: example@example.com)';

  const searchAddress = async (text: string) => {
    if (!text || text.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(
          text.trim()
        )}`,
        { headers: { 'User-Agent': userAgent } as any }
      );
      const data = await resp.json();
      const mapped = (data || []).map((d: any) => ({
        title: d.display_name as string,
        subtitle: d.type,
        lat: Number(d.lat),
        lon: Number(d.lon),
      }));
      setResults(mapped);
    } catch (_) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`,
        { headers: { 'User-Agent': userAgent } as any }
      );
      const data = await resp.json();
      const name: string = data?.display_name || '';
      setReverseAddress(name);
    } catch (_) {
      setReverseAddress('');
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    reverseTimerRef.current = setTimeout(() => {
      reverseGeocode(pickerRegion.latitude, pickerRegion.longitude);
    }, 500);
    return () => {
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    };
  }, [pickerRegion.latitude, pickerRegion.longitude, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>მისამართის არჩევა</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => {
              onSelect({
                latitude: pickerRegion.latitude,
                longitude: pickerRegion.longitude,
                address:
                  initialAddress || `${pickerRegion.latitude.toFixed(5)}, ${pickerRegion.longitude.toFixed(5)}`,
              });
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>არჩევა</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: '#111827' }}
              placeholder="მოძებნე მისამართი..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={(t) => {
                setQuery(t);
              }}
              onSubmitEditing={() => searchAddress(query)}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => searchAddress(query)}>
              <Text style={{ color: '#3B82F6', fontWeight: '600' }}>ძებნა</Text>
            </TouchableOpacity>
          </View>
          {isSearching && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <ActivityIndicator size={16} color="#3B82F6" />
              <Text style={{ color: '#6B7280' }}>ძებნა...</Text>
            </View>
          )}
          {!!results.length && (
            <ScrollView style={{ maxHeight: 220, marginTop: 8 }} showsVerticalScrollIndicator>
              {results.map((r, idx) => (
                <TouchableOpacity
                  key={`${r.lat}-${r.lon}-${idx}`}
                  style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
                  onPress={() => {
                    setResults([]);
                    setQuery(r.title);
                    setReverseAddress(r.title);
                    setPickerRegion({
                      latitude: r.lat,
                      longitude: r.lon,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                  }}
                >
                  <Text style={{ color: '#111827', fontWeight: '600' }} numberOfLines={2}>{r.title}</Text>
                  {!!r.subtitle && <Text style={{ color: '#6B7280', marginTop: 2 }}>{r.subtitle}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            onRegionChangeComplete={(region) => setPickerRegion(region)}
          />
          <View
            style={{ position: 'absolute', left: 0, right: 0, top: '50%', alignItems: 'center', marginTop: -16 }}
            pointerEvents="none"
          >
            <Ionicons name="location" size={32} color="#EF4444" />
          </View>
          <View
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 16,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text style={{ color: '#111827', fontWeight: '600' }}>არჩეული მისამართი</Text>
            <Text style={{ color: '#374151', marginTop: 4 }} numberOfLines={2}>
              {reverseAddress || `${pickerRegion.latitude.toFixed(6)}, ${pickerRegion.longitude.toFixed(6)}`}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}


