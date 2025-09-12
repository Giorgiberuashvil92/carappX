import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface RealTimeStatus {
  isOpen: boolean;
  currentWaitTime: number; // წუთებში
  currentQueue: number;
  estimatedWaitTime: number; // წუთებში
  lastStatusUpdate: number;
}

interface RealTimeStatusConfigProps {
  status: RealTimeStatus;
  onStatusChange: (status: RealTimeStatus) => void;
}

const DEFAULT_STATUS: RealTimeStatus = {
  isOpen: true,
  currentWaitTime: 10,
  currentQueue: 0,
  estimatedWaitTime: 10,
  lastStatusUpdate: Date.now(),
};

export default function RealTimeStatusConfig({ status, onStatusChange }: RealTimeStatusConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempStatus, setTempStatus] = useState<RealTimeStatus>(status);

  const handleSave = () => {
    const updatedStatus = {
      ...tempStatus,
      lastStatusUpdate: Date.now(),
    };
    onStatusChange(updatedStatus);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempStatus(status);
    setIsEditing(false);
  };

  const handleReset = () => {
    Alert.alert(
      'სტატუსის გადატვირთვა',
      'ნამდვილად გსურთ სტატუსის ნაგულისხმებ მნიშვნელობებზე დაბრუნება?',
      [
        { text: 'არა', style: 'cancel' },
        { 
          text: 'კი', 
          onPress: () => {
            onStatusChange(DEFAULT_STATUS);
          }
        }
      ]
    );
  };

  const handleQuickUpdate = (field: keyof RealTimeStatus, value: any) => {
    const updatedStatus = {
      ...status,
      [field]: value,
      lastStatusUpdate: Date.now(),
    };
    onStatusChange(updatedStatus);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} წთ`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ს ${mins}წთ` : `${hours} საათი`;
  };

  const getStatusColor = (isOpen: boolean) => {
    return isOpen ? '#10B981' : '#EF4444';
  };

  const getStatusText = (isOpen: boolean) => {
    return isOpen ? 'ღიაა' : 'დახურულია';
  };

  const getWaitTimeColor = (waitTime: number) => {
    if (waitTime <= 10) return '#10B981';
    if (waitTime <= 30) return '#F59E0B';
    return '#EF4444';
  };

  const getWaitTimeText = (waitTime: number) => {
    if (waitTime <= 10) return 'სწრაფი';
    if (waitTime <= 30) return 'საშუალო';
    return 'ნელი';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>რეალური დროის სტატუსი</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={16} color="#6B7280" />
            <Text style={styles.resetButtonText}>გადატვირთვა</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.editButton, isEditing && styles.editButtonActive]} 
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons name={isEditing ? "checkmark" : "pencil"} size={16} color={isEditing ? "#FFFFFF" : "#3B82F6"} />
            <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
              {isEditing ? 'შენახვა' : 'რედაქტირება'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status.isOpen) }]} />
              <Text style={styles.statusText}>{getStatusText(status.isOpen)}</Text>
            </View>
            <Text style={styles.lastUpdate}>
              ბოლო განახლება: {new Date(status.lastStatusUpdate).toLocaleTimeString('ka-GE')}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>სწრაფი ქმედებები</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: getStatusColor(!status.isOpen) }]}
              onPress={() => handleQuickUpdate('isOpen', !status.isOpen)}
            >
              <Ionicons name={status.isOpen ? "close" : "checkmark"} size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>
                {status.isOpen ? 'დახურება' : 'გახსნა'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickUpdate('currentWaitTime', 5)}
            >
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>5 წთ</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickUpdate('currentWaitTime', 15)}
            >
              <Ionicons name="time" size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>15 წთ</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickUpdate('currentWaitTime', 30)}
            >
              <Ionicons name="hourglass" size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>30 წთ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detailed Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>დეტალური კონფიგურაცია</Text>
          
          {/* Open/Close Status */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>სტატუსი</Text>
                <Text style={styles.settingDescription}>სამრეცხაო ღიაა თუ დახურულია</Text>
              </View>
              <Switch
                value={isEditing ? tempStatus.isOpen : status.isOpen}
                onValueChange={(value) => {
                  if (isEditing) {
                    setTempStatus({ ...tempStatus, isOpen: value });
                  } else {
                    handleQuickUpdate('isOpen', value);
                  }
                }}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={isEditing ? tempStatus.isOpen : status.isOpen ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>

          {/* Wait Time */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>მიმდინარე ლოდინის დრო</Text>
                <Text style={styles.settingDescription}>
                  {formatTime(isEditing ? tempStatus.currentWaitTime : status.currentWaitTime)} - {getWaitTimeText(isEditing ? tempStatus.currentWaitTime : status.currentWaitTime)}
                </Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={[styles.valueText, { color: getWaitTimeColor(isEditing ? tempStatus.currentWaitTime : status.currentWaitTime) }]}>
                  {isEditing ? tempStatus.currentWaitTime : status.currentWaitTime}
                </Text>
                <Text style={styles.valueUnit}>წთ</Text>
              </View>
            </View>
            {isEditing && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.numberInput}
                  value={tempStatus.currentWaitTime.toString()}
                  onChangeText={(text) => setTempStatus({ ...tempStatus, currentWaitTime: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
            )}
          </View>

          {/* Queue */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>რიგი</Text>
                <Text style={styles.settingDescription}>მიმდინარე ჯავშნების რაოდენობა</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>
                  {isEditing ? tempStatus.currentQueue : status.currentQueue}
                </Text>
                <Text style={styles.valueUnit}>ჯავშანი</Text>
              </View>
            </View>
            {isEditing && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.numberInput}
                  value={tempStatus.currentQueue.toString()}
                  onChangeText={(text) => setTempStatus({ ...tempStatus, currentQueue: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            )}
          </View>

          {/* Estimated Wait Time */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>სავარაუდო ლოდინის დრო</Text>
                <Text style={styles.settingDescription}>
                  ავტომატურად გამოითვლება რიგის მიხედვით
                </Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={[styles.valueText, { color: getWaitTimeColor(isEditing ? tempStatus.estimatedWaitTime : status.estimatedWaitTime) }]}>
                  {isEditing ? tempStatus.estimatedWaitTime : status.estimatedWaitTime}
                </Text>
                <Text style={styles.valueUnit}>წთ</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>სტატისტიკა</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{formatTime(status.currentWaitTime)}</Text>
              <Text style={styles.statLabel}>ლოდინი</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color="#10B981" />
              <Text style={styles.statValue}>{status.currentQueue}</Text>
              <Text style={styles.statLabel}>რიგი</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{formatTime(status.estimatedWaitTime)}</Text>
              <Text style={styles.statLabel}>სავარაუდო</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color={getStatusColor(status.isOpen)} />
              <Text style={styles.statValue}>{getStatusText(status.isOpen)}</Text>
              <Text style={styles.statLabel}>სტატუსი</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Mode Actions */}
      {isEditing && (
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>გაუქმება</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>შენახვა</Text>
          </TouchableOpacity>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  editButtonActive: {
    backgroundColor: '#3B82F6',
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#3B82F6',
  },
  editButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  lastUpdate: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  valueText: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  valueUnit: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  inputContainer: {
    marginTop: 12,
  },
  numberInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  editActions: {
    flexDirection: 'row',
    paddingTop: 16,
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
