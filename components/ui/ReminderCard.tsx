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
          <View style={[styles.iconWrap, { backgroundColor: `rgba(${accent === '#EF4444' ? '239, 68, 68' : accent === '#F59E0B' ? '245, 158, 11' : '16, 185, 129'}, 0.2)` }]}>
            <Ionicons name={reminder.icon as any} size={18} color={accent} />
          </View>
          <Text numberOfLines={1} style={styles.title}>{reminder.title}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="car-sport-outline" size={16} color="#9CA3AF" />
          <Text style={styles.metaText}>{reminder.car}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
          <Text style={styles.metaText}>{new Date(reminder.date).toLocaleDateString('ka-GE')}</Text>
          <View style={[styles.pill, { backgroundColor: accent }]}>
            <Text style={styles.pillText}>{isOverdue ? 'გადაცილებულია' : `${daysUntil} დღე`}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onSnooze} activeOpacity={0.9} style={styles.snoozeBtn}>
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text style={styles.snoozeText}>შემახსენე მოგვიანებით</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBook} activeOpacity={0.9} style={styles.bookBtn}>
            <Ionicons name="calendar" size={16} color="#FFFFFF" />
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
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  accent: { 
    width: 4, 
    borderTopLeftRadius: 16, 
    borderBottomLeftRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: { 
    flex: 1, 
    padding: 16,
    backgroundColor: 'rgba(75, 85, 99, 0.1)',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 8 
  },
  iconWrap: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  title: { 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 16, 
    color: '#FFFFFF',
    flex: 1,
  },
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 6 
  },
  metaText: { 
    fontFamily: 'NotoSans_500Medium', 
    fontSize: 13, 
    color: '#9CA3AF' 
  },
  pill: { 
    marginLeft: 'auto', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pillText: { 
    color: '#FFFFFF', 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 11 
  },
  actionsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 12, 
    gap: 10 
  },
  snoozeBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(55, 65, 81, 0.4)', 
    borderRadius: 12, 
    paddingVertical: 12, 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    backdropFilter: 'blur(15px)',
  },
  snoozeText: { 
    fontFamily: 'NotoSans_600SemiBold', 
    fontSize: 12, 
    color: '#9CA3AF' 
  },
  bookBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(75, 85, 99, 0.6)', 
    borderRadius: 12, 
    paddingVertical: 12, 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.4)',
    backdropFilter: 'blur(15px)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bookText: { 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 12, 
    color: '#FFFFFF' 
  },
});


