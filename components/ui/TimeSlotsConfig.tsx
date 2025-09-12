import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface WorkingDay {
  day: string; // monday, tuesday, etc.
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface BreakTime {
  start: string;
  end: string;
  name: string;
}

export interface TimeSlotsConfig {
  workingDays: WorkingDay[];
  interval: number; // წუთებში (30, 60, etc.)
  breakTimes: BreakTime[];
}

interface TimeSlotsConfigProps {
  config: TimeSlotsConfig;
  onConfigChange: (config: TimeSlotsConfig) => void;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'ორშაბათი' },
  { key: 'tuesday', label: 'სამშაბათი' },
  { key: 'wednesday', label: 'ოთხშაბათი' },
  { key: 'thursday', label: 'ხუთშაბათი' },
  { key: 'friday', label: 'პარასკევი' },
  { key: 'saturday', label: 'შაბათი' },
  { key: 'sunday', label: 'კვირა' },
];

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 წუთი' },
  { value: 30, label: '30 წუთი' },
  { value: 60, label: '1 საათი' },
  { value: 120, label: '2 საათი' },
];

const DEFAULT_CONFIG: TimeSlotsConfig = {
  workingDays: DAYS_OF_WEEK.map(day => ({
    day: day.key,
    startTime: '09:00',
    endTime: '18:00',
    isWorking: day.key !== 'sunday',
  })),
  interval: 30,
  breakTimes: [
    { start: '13:00', end: '14:00', name: 'ლანჩის შესვენება' }
  ],
};

export default function TimeSlotsConfig({ config, onConfigChange }: TimeSlotsConfigProps) {
  const [editingBreakTime, setEditingBreakTime] = useState<BreakTime | null>(null);
  const [showBreakTimeForm, setShowBreakTimeForm] = useState(false);

  const handleWorkingDayToggle = (dayKey: string) => {
    const updatedDays = config.workingDays.map(day => 
      day.day === dayKey ? { ...day, isWorking: !day.isWorking } : day
    );
    onConfigChange({ ...config, workingDays: updatedDays });
  };

  const handleTimeChange = (dayKey: string, field: 'startTime' | 'endTime', time: string) => {
    const updatedDays = config.workingDays.map(day => 
      day.day === dayKey ? { ...day, [field]: time } : day
    );
    onConfigChange({ ...config, workingDays: updatedDays });
  };

  const handleIntervalChange = (interval: number) => {
    onConfigChange({ ...config, interval });
  };

  const handleAddBreakTime = () => {
    const newBreakTime: BreakTime = {
      start: '13:00',
      end: '14:00',
      name: '',
    };
    setEditingBreakTime(newBreakTime);
    setShowBreakTimeForm(true);
  };

  const handleEditBreakTime = (breakTime: BreakTime) => {
    setEditingBreakTime(breakTime);
    setShowBreakTimeForm(true);
  };

  const handleSaveBreakTime = () => {
    if (!editingBreakTime) return;

    if (!editingBreakTime.name.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ შესვენების სახელი');
      return;
    }

    if (editingBreakTime.start >= editingBreakTime.end) {
      Alert.alert('შეცდომა', 'დაწყების დრო უნდა იყოს დასრულების დროზე ნაკლები');
      return;
    }

    const isNewBreakTime = !config.breakTimes.find(bt => 
      bt.start === editingBreakTime.start && bt.end === editingBreakTime.end
    );
    
    if (isNewBreakTime) {
      onConfigChange({ ...config, breakTimes: [...config.breakTimes, editingBreakTime] });
    } else {
      onConfigChange({ 
        ...config, 
        breakTimes: config.breakTimes.map(bt => 
          bt.start === editingBreakTime.start && bt.end === editingBreakTime.end ? editingBreakTime : bt
        )
      });
    }

    setEditingBreakTime(null);
    setShowBreakTimeForm(false);
  };

  const handleDeleteBreakTime = (breakTime: BreakTime) => {
    Alert.alert(
      'შესვენების წაშლა',
      'ნამდვილად გსურთ ამ შესვენების წაშლა?',
      [
        { text: 'არა', style: 'cancel' },
        { 
          text: 'კი', 
          style: 'destructive',
          onPress: () => {
            onConfigChange({ 
              ...config, 
              breakTimes: config.breakTimes.filter(bt => 
                !(bt.start === breakTime.start && bt.end === breakTime.end)
              )
            });
          }
        }
      ]
    );
  };

  const handleUseDefaults = () => {
    Alert.alert(
      'ნაგულისხმები კონფიგურაცია',
      'ნამდვილად გსურთ ნაგულისხმები კონფიგურაციის გამოყენება? ეს ჩაანაცვლებს არსებულ კონფიგურაციას.',
      [
        { text: 'არა', style: 'cancel' },
        { 
          text: 'კი', 
          onPress: () => {
            onConfigChange(DEFAULT_CONFIG);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>დროის სლოტების კონფიგურაცია</Text>
        <TouchableOpacity style={styles.defaultButton} onPress={handleUseDefaults}>
          <Ionicons name="refresh" size={16} color="#6B7280" />
          <Text style={styles.defaultButtonText}>ნაგულისხმები</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Interval Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>სლოტების ინტერვალი</Text>
          <View style={styles.intervalOptions}>
            {INTERVAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.intervalOption,
                  config.interval === option.value && styles.intervalOptionActive
                ]}
                onPress={() => handleIntervalChange(option.value)}
              >
                <Text style={[
                  styles.intervalOptionText,
                  config.interval === option.value && styles.intervalOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Working Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>სამუშაო დღეები</Text>
          {DAYS_OF_WEEK.map((day) => {
            const workingDay = config.workingDays.find(wd => wd.day === day.key);
            return (
              <View key={day.key} style={styles.workingDayCard}>
                <View style={styles.workingDayHeader}>
                  <TouchableOpacity
                    style={styles.workingDayToggle}
                    onPress={() => handleWorkingDayToggle(day.key)}
                  >
                    <View style={[
                      styles.toggleSwitch,
                      workingDay?.isWorking && styles.toggleSwitchActive
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        workingDay?.isWorking && styles.toggleThumbActive
                      ]} />
                    </View>
                    <Text style={styles.workingDayLabel}>{day.label}</Text>
                  </TouchableOpacity>
                </View>

                {workingDay?.isWorking && (
                  <View style={styles.timeInputs}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>დაწყება</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={workingDay.startTime}
                        onChangeText={(text) => handleTimeChange(day.key, 'startTime', text)}
                        placeholder="09:00"
                      />
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeInputLabel}>დასრულება</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={workingDay.endTime}
                        onChangeText={(text) => handleTimeChange(day.key, 'endTime', text)}
                        placeholder="18:00"
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Break Times */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>შესვენებები</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddBreakTime}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>დამატება</Text>
            </TouchableOpacity>
          </View>

          {config.breakTimes.map((breakTime, index) => (
            <View key={index} style={styles.breakTimeCard}>
              <View style={styles.breakTimeInfo}>
                <Text style={styles.breakTimeName}>{breakTime.name}</Text>
                <Text style={styles.breakTimeTime}>
                  {breakTime.start} - {breakTime.end}
                </Text>
              </View>
              <View style={styles.breakTimeActions}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEditBreakTime(breakTime)}
                >
                  <Ionicons name="pencil" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteBreakTime(breakTime)}
                >
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {config.breakTimes.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>შესვენებები არ არის</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Break Time Modal */}
      {showBreakTimeForm && editingBreakTime && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>შესვენების დამატება</Text>
              <TouchableOpacity onPress={() => setShowBreakTimeForm(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>შესვენების სახელი *</Text>
                <TextInput
                  style={styles.input}
                  value={editingBreakTime.name}
                  onChangeText={(text) => setEditingBreakTime({ ...editingBreakTime, name: text })}
                  placeholder="მაგ. ლანჩის შესვენება"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>დაწყება *</Text>
                  <TextInput
                    style={styles.input}
                    value={editingBreakTime.start}
                    onChangeText={(text) => setEditingBreakTime({ ...editingBreakTime, start: text })}
                    placeholder="13:00"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>დასრულება *</Text>
                  <TextInput
                    style={styles.input}
                    value={editingBreakTime.end}
                    onChangeText={(text) => setEditingBreakTime({ ...editingBreakTime, end: text })}
                    placeholder="14:00"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowBreakTimeForm(false)}
              >
                <Text style={styles.cancelButtonText}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveBreakTime}
              >
                <Text style={styles.saveButtonText}>შენახვა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  defaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 4,
  },
  defaultButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 12,
  },
  intervalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  intervalOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  intervalOptionText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  intervalOptionTextActive: {
    color: '#FFFFFF',
  },
  workingDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  workingDayHeader: {
    marginBottom: 8,
  },
  workingDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#3B82F6',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  workingDayLabel: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  breakTimeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakTimeInfo: {
    flex: 1,
    marginRight: 12,
  },
  breakTimeName: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  breakTimeTime: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  breakTimeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
});
