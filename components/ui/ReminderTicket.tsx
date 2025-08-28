import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type ReminderTicketProps = {
  title: string;
  car: string;
  date: string; // ISO
  icon: string;
  onPress?: () => void;
};

export default function ReminderTicket({ title, car, date, icon, onPress }: ReminderTicketProps) {
  const daysUntil = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isUrgent = daysUntil <= 7;
  const accent = isUrgent ? '#EF4444' : '#3B82F6';

  return (
    <LinearGradient
      colors={[ '#FFFFFF', '#F7F8FA' ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrapper}
    >
      {/* decorative blobs */}
      <View style={[styles.blob, { backgroundColor: accent + '14', left: 14, top: 10 }]} />
      <View style={[styles.blob, { backgroundColor: '#11182714', right: 14, bottom: 10 }]} />

      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: accent + '1A' }]}>
          <Ionicons name={icon as any} size={18} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="car-sport-outline" size={13} color="#6B7280" />
            <Text numberOfLines={1} style={styles.meta}>{car}</Text>
          </View>
        </View>
        <View>
          <LinearGradient colors={[accent, '#111827']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.days}>
            <Text style={styles.daysText}>{daysUntil > 0 ? `${daysUntil} დღე` : 'დღეს'}</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={[styles.metaRow, { marginTop: 8 }]}>
        <Ionicons name="calendar-outline" size={13} color="#6B7280" />
        <Text style={styles.meta}>{new Date(date).toLocaleDateString('ka-GE')}</Text>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity activeOpacity={0.9} style={styles.ghostBtn}>
          <Ionicons name="time-outline" size={14} color="#111827" />
          <Text style={styles.ghostText}>შემახსენე</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.9} style={styles.blackBtn} onPress={onPress}>
          <Ionicons name="calendar" size={14} color="#FFFFFF" />
          <Text style={styles.blackText}>დაჯავშნა</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 320,
    borderRadius: 20,
    marginRight: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  meta: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  days: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  daysText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 11 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  ghostBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 14, paddingVertical: 10 },
  ghostText: { fontFamily: 'NotoSans_700Bold', fontSize: 12, color: '#111827' },
  blackBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#111827', borderRadius: 14, paddingVertical: 10 },
  blackText: { fontFamily: 'NotoSans_700Bold', fontSize: 12, color: '#FFFFFF' },
  blob: { position: 'absolute', width: 80, height: 80, borderRadius: 40 },
});


