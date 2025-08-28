import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const title = (params.title as string) || 'Standard Cleaning Services';
  const latitude = Number(params.lat ?? 41.7151);
  const longitude = Number(params.lng ?? 44.8271);

  return (
    <View style={styles.container}>
      <View style={styles.mapHeader}>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          region={{ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
          pointerEvents="none"
        >
          <Marker coordinate={{ latitude, longitude }} />
        </MapView>
        <LinearGradient colors={[ 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)' ]} style={StyleSheet.absoluteFill} />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleButton}>
            <Feather name="phone" size={18} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.chipsRow}>
            <View style={styles.chip}><Feather name="award" size={12} color="#6B7280" /><Text style={styles.chipText}>Top rated</Text></View>
            <View style={styles.chip}><Feather name="clock" size={12} color="#6B7280" /><Text style={styles.chipText}>Open now</Text></View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.statTitle}>Rating</Text>
              <Text style={styles.statValue}>4.9</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="map-pin" size={14} color="#3B82F6" />
              <Text style={styles.statTitle}>Distance</Text>
              <Text style={styles.statValue}>1.2 კმ</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="tag" size={14} color="#10B981" />
              <Text style={styles.statTitle}>Price</Text>
              <Text style={styles.statValue}>15₾+</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <Text style={styles.sectionTitle}>სერვისის დეტალები</Text>
          <Text style={styles.paragraph}>პრემიუმ ხარისხის მომსახურება, სწრაფად და უსაფრთხოდ. არჩევანი შენი მანქანისთვის საუკეთესოა.</Text>

          <View style={{ marginTop: 12, gap: 10 }}>
            <View style={styles.bulletRow}><Feather name="check-circle" size={16} color="#10B981" /><Text style={styles.paragraph}>სრული გარე/შიდა წმენდა</Text></View>
            <View style={styles.bulletRow}><Feather name="check-circle" size={16} color="#10B981" /><Text style={styles.paragraph}>ცვილის ფენა და ბრწყინვალება</Text></View>
            <View style={styles.bulletRow}><Feather name="check-circle" size={16} color="#10B981" /><Text style={styles.paragraph}>ქიმწმენდა მოთხოვნისას</Text></View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.priceTag}><Text style={styles.priceText}>15₾</Text></View>
          <Text style={styles.priceHint}>საწყისი ფასი</Text>
        </View>
        <TouchableOpacity activeOpacity={0.9} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>დაჯავშნა</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  mapHeader: { height: 260, backgroundColor: '#E5E7EB', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 58 : 20, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  circleButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  sheet: { marginTop: -20, marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 },
  title: { fontFamily: 'NotoSans_700Bold', fontSize: 20, color: '#111827' },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  chipText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#6B7280' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  statTitle: { fontFamily: 'NotoSans_500Medium', fontSize: 11, color: '#6B7280' },
  statValue: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  sectionTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 16, color: '#111827' },
  paragraph: { fontFamily: 'NotoSans_400Regular', color: '#4B5563', marginTop: 6, lineHeight: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  footer: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceTag: { backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  priceText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
  priceHint: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  primaryButton: { backgroundColor: '#0B0B0E', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 22, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 15 },
});


