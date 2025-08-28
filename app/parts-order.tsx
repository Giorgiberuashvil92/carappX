import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from '@/components/Themed';

export default function PartsOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const offer = params.offer ? JSON.parse(params.offer as string) : null as null | { id: string; providerName: string; priceGEL: number; etaMin: number; distanceKm: number | null };
  const summary = params.summary ? String(params.summary) : '';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const canSubmit = useMemo(() => name.trim() && phone.trim(), [name, phone]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <FontAwesome name="chevron-left" size={16} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ნაწილების შეძენა</Text>
        <RNView style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {offer && (
          <View style={styles.offerCard}>
            <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.offerTitle}>{offer.providerName}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{offer.distanceKm ?? '-'}კმ</Text></View>
            </RNView>
            <RNView style={styles.pillRow}>
              <RNView style={styles.pill}>
                <FontAwesome name="tag" size={12} color="#111827" />
                <Text style={styles.pillText}>₾{offer.priceGEL}</Text>
              </RNView>
              <RNView style={styles.pill}>
                <FontAwesome name="clock-o" size={12} color="#111827" />
                <Text style={styles.pillText}>{offer.etaMin}წთ</Text>
              </RNView>
              <RNView style={styles.pill}>
                <FontAwesome name="map-marker" size={12} color="#111827" />
                <Text style={styles.pillText}>{offer.distanceKm ?? '-'}კმ</Text>
              </RNView>
            </RNView>
          </View>
        )}

        {summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>შეკვეთის შეჯამება</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>თქვენი მონაცემები</Text>
        <Text style={styles.label}>სახელი</Text>
        <TextInput value={name} onChangeText={setName} placeholder="მაგ. გიორგი" placeholderTextColor="#9CA3AF" style={styles.input} />
        <Text style={styles.label}>ტელეფონი</Text>
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="5XX XX XX XX" placeholderTextColor="#9CA3AF" style={styles.input} />
        <Text style={styles.label}>შენიშვნა (არასავალდებულო)</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="დამატებითი დეტალი" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 80 }]} multiline />

        <TouchableOpacity disabled={!canSubmit} style={[styles.submitBtn, !canSubmit && { opacity: 0.6 }]} onPress={() => router.replace('/bookings')}>
          <Text style={styles.submitText}>დადასტურება</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  headerTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 16 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  container: { padding: 14, gap: 14 },
  offerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F7', padding: 14, gap: 10 },
  offerTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
  offerMeta: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  badgeText: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#111827' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB' },
  pillText: { color: '#111827', fontFamily: 'NotoSans_600SemiBold', fontSize: 12 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F7', padding: 12 },
  summaryTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#111827', marginBottom: 6 },
  summaryText: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#111827', marginTop: 8 },
  label: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827', marginTop: 10 },
  input: { height: 44, borderRadius: 14, paddingHorizontal: 14, color: '#111827', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7', fontFamily: 'NotoSans_400Regular', marginTop: 6 },
  submitBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', marginTop: 16 },
  submitText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
});


