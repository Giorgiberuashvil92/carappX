import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const { width, height } = Dimensions.get('window');

interface RaceEvent {
  id: string;
  title: string;
  type: 'drag' | 'circuit' | 'drift' | 'rally' | 'championship';
  date: string;
  time: string;
  location: string;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  isRegistered: boolean;
  isUpcoming: boolean;
  requirements?: string[];
  description: string;
  status: 'live' | 'upcoming' | 'finished';
}

// Mock data for race events
const MOCK_RACES: RaceEvent[] = [
  {
    id: '1',
    title: 'Thunder Drag Championship',
    type: 'drag',
    date: 'დღეს',
    time: '18:00',
    location: 'რუსთაველის ავტოსფერო',
    entryFee: 100,
    maxParticipants: 16,
    currentParticipants: 14,
    prizePool: 2500,
    difficulty: 'pro',
    isRegistered: false,
    isUpcoming: true,
    requirements: ['მინ. 400 ცხენი', 'სლიკ ბორბლები', 'რბოლის ლიცენზია'],
    description: 'წლის ყველაზე დიდი დრაგ რბოლა',
    status: 'live'
  },
  {
    id: '2',
    title: 'Night Circuit Masters',
    type: 'circuit',
    date: 'ხვალ',
    time: '20:00',
    location: 'თბილისის ავტოდრომი',
    entryFee: 75,
    maxParticipants: 20,
    currentParticipants: 8,
    prizePool: 1800,
    difficulty: 'advanced',
    isRegistered: true,
    isUpcoming: true,
    requirements: ['მინ. 250 ცხენი', 'სპორტ ბორბლები'],
    description: 'ღამის ტრასაზე სიჩქარის შეჯიბრი',
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'Drift King Battle',
    type: 'drift',
    date: 'შაბათს',
    time: '16:00',
    location: 'ავტოდრომი "სპიდი"',
    entryFee: 60,
    maxParticipants: 12,
    currentParticipants: 9,
    prizePool: 1200,
    difficulty: 'intermediate',
    isRegistered: false,
    isUpcoming: true,
    requirements: ['RWD მანქანა', 'დრიფტ ბორბლები'],
    description: 'სტილისა და ტექნიკის შეჯიბრი',
    status: 'upcoming'
  },
  {
    id: '4',
    title: 'Street Racing League',
    type: 'circuit',
    date: 'კვირას',
    time: '14:00',
    location: 'ვაკის პარკი',
    entryFee: 50,
    maxParticipants: 25,
    currentParticipants: 22,
    prizePool: 1500,
    difficulty: 'beginner',
    isRegistered: false,
    isUpcoming: true,
    requirements: ['ნებისმიერი მანქანა'],
    description: 'მოყვარულთა ლიგის რბოლა',
    status: 'upcoming'
  }
];

const RacingScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const { success, error } = useToast();
  const [races, setRaces] = useState<RaceEvent[]>(MOCK_RACES);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const raceTypes = [
    { id: 'all', title: 'ყველა', icon: 'grid-outline', color: '#6B7280' },
    { id: 'drag', title: 'დრაგ', icon: 'flash-outline', color: '#EF4444' },
    { id: 'circuit', title: 'ტრასა', icon: 'refresh-outline', color: '#3B82F6' },
    { id: 'drift', title: 'დრიფტი', icon: 'swap-horizontal-outline', color: '#8B5CF6' },
    { id: 'rally', title: 'რალი', icon: 'trail-sign-outline', color: '#F59E0B' },
    { id: 'championship', title: 'ჩემპიონატი', icon: 'trophy-outline', color: '#10B981' },
  ];

  const getRaceTypeIcon = (type: string) => {
    const raceType = raceTypes.find(t => t.id === type);
    return raceType?.icon || 'car-outline';
  };

  const getRaceTypeColor = (type: string) => {
    const raceType = raceTypes.find(t => t.id === type);
    return raceType?.color || '#6B7280';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22C55E';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      case 'pro': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'დამწყები';
      case 'intermediate': return 'საშუალო';
      case 'advanced': return 'მაღალი';
      case 'pro': return 'პროფესიონალი';
      default: return 'უცნობი';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#EF4444';
      case 'upcoming': return '#F59E0B';
      case 'finished': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'upcoming': return 'მალე';
      case 'finished': return 'დასრულდა';
      default: return '';
    }
  };

  const filteredRaces = selectedType === 'all' 
    ? races 
    : races.filter(race => race.type === selectedType);

  const handleRegistration = (race: RaceEvent) => {
    if (race.isRegistered) {
      Alert.alert(
        'რეგისტრაცია',
        'გსურთ რეგისტრაციის გაუქმება?',
        [
          { text: 'არა', style: 'cancel' },
          {
            text: 'კი',
            style: 'destructive',
            onPress: () => {
              setRaces(prev => prev.map(r => 
                r.id === race.id 
                  ? { ...r, isRegistered: false, currentParticipants: r.currentParticipants - 1 }
                  : r
              ));
              success('✅ წარმატება', 'რეგისტრაცია გაუქმდა');
            }
          }
        ]
      );
    } else {
      if (race.currentParticipants >= race.maxParticipants) {
        error('😔 სამწუხაროდ', 'ადგილები ამოიწურა');
        return;
      }

      Alert.alert(
        'რეგისტრაცია',
        `გსურთ რეგისტრაცია რბოლაზე "${race.title}"?\n\nღირებულება: ${race.entryFee}₾\nჯილდო: ${race.prizePool}₾`,
        [
          { text: 'გაუქმება', style: 'cancel' },
          {
            text: 'რეგისტრაცია',
            onPress: () => {
              setRaces(prev => prev.map(r => 
                r.id === race.id 
                  ? { ...r, isRegistered: true, currentParticipants: r.currentParticipants + 1 }
                  : r
              ));
              success('🏁 წარმატება!', `რეგისტრაცია დასრულდა "${race.title}"-ზე`);
            }
          }
        ]
      );
    }
  };

  const renderRaceCard = (race: RaceEvent, index: number) => (
    <View key={race.id} style={styles.raceCard}>
      <View style={styles.raceCardContent}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.raceTypeTag}>
            <Ionicons name={getRaceTypeIcon(race.type) as any} size={16} color={getRaceTypeColor(race.type)} />
            <Text style={[styles.raceTypeText, { color: getRaceTypeColor(race.type) }]}>
              {raceTypes.find(t => t.id === race.type)?.title || 'რბოლა'}
            </Text>
          </View>
          
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(race.status) }]}>
            <Text style={styles.statusTagText}>{getStatusText(race.status)}</Text>
            {race.status === 'live' && <View style={styles.livePulse} />}
          </View>
        </View>

        {/* Race Title */}
        <Text style={styles.raceCardTitle}>{race.title}</Text>
        <Text style={styles.raceCardDescription}>{race.description}</Text>

        {/* Race Details */}
        <View style={styles.raceDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{race.date} • {race.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{race.location}</Text>
          </View>
        </View>

        {/* Prize Pool */}
        <View style={styles.prizeContainer}>
          <View style={styles.prizeIcon}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.prizeAmount}>{race.prizePool}₾</Text>
          <Text style={styles.prizeLabel}>ჯილდო</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{race.entryFee}₾</Text>
            <Text style={styles.statBoxLabel}>შესვლა</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{race.currentParticipants}/{race.maxParticipants}</Text>
            <Text style={styles.statBoxLabel}>მონაწილე</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.difficultyIndicator, { backgroundColor: getDifficultyColor(race.difficulty) }]} />
            <Text style={styles.statBoxLabel}>{getDifficultyText(race.difficulty)}</Text>
          </View>
        </View>

        {/* Requirements */}
        {race.requirements && race.requirements.length > 0 && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>მოთხოვნები:</Text>
            <View style={styles.requirementsList}>
              {race.requirements.map((req, idx) => (
                <View key={idx} style={styles.requirementTag}>
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            race.isRegistered && styles.registeredButton,
            race.currentParticipants >= race.maxParticipants && !race.isRegistered && styles.disabledButton
          ]}
          onPress={() => handleRegistration(race)}
          disabled={race.currentParticipants >= race.maxParticipants && !race.isRegistered}
        >
          <Ionicons 
            name={race.isRegistered ? "checkmark-circle" : race.currentParticipants >= race.maxParticipants ? "close-circle" : "add-circle"} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.actionButtonText}>
            {race.isRegistered 
              ? 'რეგისტრირებული' 
              : race.currentParticipants >= race.maxParticipants 
                ? 'ადგილები ამოიწურა' 
                : 'რეგისტრაცია'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.title}>🏁 Racing Events</Text>
            <Text style={styles.subtitle}>მომავალი რბოლები</Text>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.statNumber}>{races.filter(r => r.isUpcoming).length}</Text>
          <Text style={styles.statLabel}>მომავალი რბოლა</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{races.filter(r => r.isRegistered).length}</Text>
          <Text style={styles.statLabel}>რეგისტრირებული</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>
            {races.reduce((sum, r) => sum + (r.isRegistered ? r.prizePool : 0), 0)}₾
          </Text>
          <Text style={styles.statLabel}>პოტენციური ჯილდო</Text>
        </View>
      </ScrollView>

      {/* Race Type Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {raceTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterChip,
              selectedType === type.id && styles.selectedFilterChip
            ]}
            onPress={() => setSelectedType(type.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={type.icon as any} 
              size={16} 
              color={selectedType === type.id ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[
              styles.filterChipText,
              selectedType === type.id && styles.selectedFilterChipText
            ]}>
              {type.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Races List */}
      <ScrollView 
        style={styles.racesScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.racesContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={styles.loadingText}>რბოლები იტვირთება...</Text>
          </View>
        ) : filteredRaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-sport-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>რბოლები არ არის</Text>
            <Text style={styles.emptySubtitle}>მალე ახალი რბოლები დაემატება!</Text>
          </View>
        ) : (
          filteredRaces.map((race, index) => renderRaceCard(race, index))
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Outfit',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedFilterChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  selectedFilterChipText: {
    color: '#FFFFFF',
  },
  racesScrollView: {
    flex: 1,
  },
  racesContainer: {
    paddingHorizontal: 20,
  },
  raceCard: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  raceCardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  raceTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  raceTypeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  raceCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Outfit',
    marginBottom: 8,
  },
  raceCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
    lineHeight: 20,
    marginBottom: 16,
  },
  raceDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  prizeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: 'Outfit',
    flex: 1,
  },
  prizeLabel: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Outfit',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  difficultyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  requirementsContainer: {
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Outfit',
    marginBottom: 8,
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requirementTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  requirementText: {
    fontSize: 12,
    color: '#1E40AF',
    fontFamily: 'Outfit',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  registeredButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Outfit',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
});

export default RacingScreen;
