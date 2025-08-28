import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type Reminder = {
  id: string;
  title: string;
  car: string;
  date: string; // ISO or yyyy-mm-dd
  type: 'service' | 'inspection' | string;
  icon: string;
};

type Props = {
  reminder: Reminder;
  onBook?: () => void;
  onSnooze?: () => void;
};

export default function ReminderCard({ reminder, onBook, onSnooze }: Props) {
  const daysUntil = Math.ceil((new Date(reminder.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isOverdue = daysUntil < 0;
  const isUrgent = daysUntil <= 7;

  const accent = isOverdue ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981';

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={reminder.icon as any} size={16} color={accent} />
          </View>
          <Text numberOfLines={1} style={styles.title}>{reminder.title}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="car-sport-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{reminder.car}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{new Date(reminder.date).toLocaleDateString('ka-GE')}</Text>
          <View style={[styles.pill, { backgroundColor: accent }]}>
            <Text style={styles.pillText}>{isOverdue ? 'გადაცილებულია' : `${daysUntil} დღე`}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onSnooze} activeOpacity={0.9} style={styles.snoozeBtn}>
            <Ionicons name="time-outline" size={14} color="#111827" />
            <Text style={styles.snoozeText}>შემახსენე მოგვიანებით</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBook} activeOpacity={0.9} style={styles.bookBtn}>
            <Ionicons name="calendar" size={14} color="#FFFFFF" />
            <Text style={styles.bookText}>დაჯავშნა</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  accent: { width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  content: { flex: 1, padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  pill: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 11 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  snoozeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 10, justifyContent: 'center' },
  snoozeText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827' },
  bookBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 10, justifyContent: 'center' },
  bookText: { fontFamily: 'NotoSans_700Bold', fontSize: 12, color: '#FFFFFF' },
});


