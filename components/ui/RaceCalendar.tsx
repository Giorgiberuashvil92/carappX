import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';

const { width } = Dimensions.get('window');

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
}

// Mock data for race events
const MOCK_RACES: RaceEvent[] = [
  {
    id: '1',
    title: 'პარალელური რბოლა',
    type: 'drag',
    date: 'დღეს',
    time: '18:00',
    location: 'რუსთაველის ავტოსფერო',
    entryFee: 50,
    maxParticipants: 16,
    currentParticipants: 12,
    prizePool: 800,
    difficulty: 'intermediate',
    isRegistered: false,
    isUpcoming: true,
    requirements: ['მინ. 200 ცხენი', 'სპორტ ბორბლები'],
    description: '400მ სწორ ხაზზე სიჩქარის შეჯიბრი'
  },
  {
    id: '2',
    title: 'დრაგ რეისი',
    type: 'drag',
    date: 'ხვალ',
    time: '20:00',
    location: 'თბილისის ავტოდრომი',
    entryFee: 75,
    maxParticipants: 20,
    currentParticipants: 8,
    prizePool: 1500,
    difficulty: 'advanced',
    isRegistered: true,
    isUpcoming: true,
    requirements: ['მინ. 300 ცხენი', 'სლიკ ბორბლები', 'რბოლის ლიცენზია'],
    description: 'პროფესიონალური დრაგ რბოლა'
  },
  {
    id: '3',
    title: 'ქალაქის ტური',
    type: 'circuit',
    date: 'შაბათს',
    time: '16:00',
    location: 'ვაკის პარკი',
    entryFee: 30,
    maxParticipants: 25,
    currentParticipants: 18,
    prizePool: 600,
    difficulty: 'beginner',
    isRegistered: false,
    isUpcoming: true,
    requirements: ['ნებისმიერი მანქანა'],
    description: 'მოყვარულთა რბოლა ქალაქის ცენტრში'
  },
  {
    id: '4',
    title: 'ჩემპიონატის ფინალი',
    type: 'championship',
    date: 'კვირას',
    time: '14:00',
    location: 'რუსთაველის ავტოსფერო',
    entryFee: 100,
    maxParticipants: 32,
    currentParticipants: 28,
    prizePool: 5000,
    difficulty: 'pro',
    isRegistered: false,
    isUpcoming: true,
    requirements: ['კვალიფიკაცია', 'პრო ლიცენზია', 'მინ. 400 ცხენი'],
    description: 'წლის მთავარი ჩემპიონატის ფინალური რბოლა'
  },
  {
    id: '5',
    title: 'დრიფტ შოუ',
    type: 'drift',
    date: 'ორშაბათს',
    time: '19:00',
    location: 'ავტოდრომი "სპიდი"',
    entryFee: 60,
    maxParticipants: 12,
    currentParticipants: 5,
    prizePool: 900,
    difficulty: 'intermediate',
    isRegistered: false,
    isUpcoming: true,
    requirements: ['RWD მანქანა', 'დრიფტ ბორბლები'],
    description: 'სტილისა და ტექნიკის შეჯიბრი'
  }
];

const RaceCalendar: React.FC = () => {
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
      case 'beginner':
        return '#22C55E';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      case 'pro':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'დამწყები';
      case 'intermediate':
        return 'საშუალო';
      case 'advanced':
        return 'მაღალი';
      case 'pro':
        return 'პროფესიონალი';
      default:
        return 'უცნობი';
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

  const handleRaceDetails = (race: RaceEvent) => {
    Alert.alert(
      race.title,
      `${race.description}\n\n📍 ${race.location}\n🕐 ${race.date} ${race.time}\n💰 შესვლა: ${race.entryFee}₾\n🏆 ჯილდო: ${race.prizePool}₾\n👥 ${race.currentParticipants}/${race.maxParticipants} მონაწილე\n\n📋 მოთხოვნები:\n${race.requirements?.join('\n') || 'არ არის'}`,
      [
        { text: 'დახურვა', style: 'cancel' },
        {
          text: race.isRegistered ? 'გაუქმება' : 'რეგისტრაცია',
          onPress: () => handleRegistration(race)
        }
      ]
    );
  };

  const renderRaceCard = (race: RaceEvent) => (
    <TouchableOpacity
      key={race.id}
      style={[
        styles.raceCard,
        race.isRegistered && styles.registeredCard
      ]}
      onPress={() => handleRaceDetails(race)}
      activeOpacity={0.8}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={race.isRegistered 
          ? ['#10B981', '#059669'] 
          : ['#1F2937', '#111827']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.raceCardGradient}
      >
        {/* Racing Pattern */}
        <View style={styles.racingPattern}>
          <View style={styles.checkeredFlag}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={[
                styles.checkeredSquare,
                { backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'transparent' }
              ]} />
            ))}
          </View>
        </View>

        {/* Race Header */}
        <View style={styles.raceHeader}>
          <View style={styles.raceTypeContainer}>
            <View style={[styles.raceTypeIcon, { backgroundColor: getRaceTypeColor(race.type) }]}>
              <Ionicons name={getRaceTypeIcon(race.type) as any} size={18} color="#FFFFFF" />
            </View>
            <View style={styles.raceTitleContainer}>
              <Text style={styles.raceTitle} numberOfLines={1}>
                {race.title}
              </Text>
              <Text style={styles.raceType}>
                {raceTypes.find(t => t.id === race.type)?.title || 'რბოლა'}
              </Text>
            </View>
          </View>
          
          {race.isRegistered && (
            <View style={styles.registeredBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.registeredText}>✓</Text>
            </View>
          )}
        </View>

        {/* Race Info */}
        <View style={styles.raceInfo}>
          <View style={styles.raceInfoRow}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.raceInfoText}>{race.date} • {race.time}</Text>
          </View>
          <View style={styles.raceInfoRow}>
            <Ionicons name="location" size={16} color="#EF4444" />
            <Text style={styles.raceInfoText} numberOfLines={1}>{race.location}</Text>
          </View>
        </View>

        {/* Prize Pool Highlight */}
        <View style={styles.prizeHighlight}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.prizeGradient}
          >
            <Ionicons name="trophy" size={16} color="#FFFFFF" />
            <Text style={styles.prizeText}>{race.prizePool}₾ ჯილდო</Text>
          </LinearGradient>
        </View>

        {/* Race Stats */}
        <View style={styles.raceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{race.entryFee}₾</Text>
            <Text style={styles.statLabel}>შესვლა</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{race.currentParticipants}/{race.maxParticipants}</Text>
            <Text style={styles.statLabel}>მონაწილე</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(race.difficulty) }]} />
            <Text style={styles.statValue}>{getDifficultyText(race.difficulty)}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            race.isRegistered && styles.unregisterButton,
            race.currentParticipants >= race.maxParticipants && !race.isRegistered && styles.fullButton
          ]}
          onPress={() => handleRegistration(race)}
          disabled={race.currentParticipants >= race.maxParticipants && !race.isRegistered}
        >
          <LinearGradient
            colors={race.isRegistered 
              ? ['#6B7280', '#4B5563'] 
              : race.currentParticipants >= race.maxParticipants 
                ? ['#D1D5DB', '#9CA3AF']
                : ['#EF4444', '#DC2626']
            }
            style={styles.buttonGradient}
          >
            <Ionicons 
              name={race.isRegistered ? "close-circle" : "flash"} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.registerButtonText}>
              {race.isRegistered 
                ? 'გაუქმება' 
                : race.currentParticipants >= race.maxParticipants 
                  ? 'სავსეა' 
                  : 'რეგისტრაცია'
              }
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Racing Theme */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <View style={styles.racingIcon}>
              <Ionicons name="car-sport" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.title}>🏁 RACING ZONE</Text>
              <Text style={styles.subtitle}>მომავალი რბოლები</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewAllButton}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.viewAllGradient}
            >
              <Text style={styles.viewAllText}>ყველა</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Racing Stripes */}
        <View style={styles.racingStripes}>
          <View style={[styles.stripe, { backgroundColor: '#EF4444' }]} />
          <View style={[styles.stripe, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.stripe, { backgroundColor: '#EF4444' }]} />
        </View>
      </LinearGradient>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <View style={styles.statsContent}>
            <View style={styles.statsBannerItem}>
              <Text style={styles.statsBannerValue}>
                {races.filter(r => r.isUpcoming).length}
              </Text>
              <Text style={styles.statsBannerLabel}>მომავალი რბოლა</Text>
            </View>
            <View style={styles.statsBannerDivider} />
            <View style={styles.statsBannerItem}>
              <Text style={styles.statsBannerValue}>
                {races.filter(r => r.isRegistered).length}
              </Text>
              <Text style={styles.statsBannerLabel}>რეგისტრირებული</Text>
            </View>
            <View style={styles.statsBannerDivider} />
            <View style={styles.statsBannerItem}>
              <Text style={styles.statsBannerValue}>
                {races.reduce((sum, r) => sum + (r.isRegistered ? r.prizePool : 0), 0)}₾
              </Text>
              <Text style={styles.statsBannerLabel}>პოტენციური ჯილდო</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

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
              styles.filterButton,
              selectedType === type.id && styles.selectedFilterButton,
              selectedType === type.id && { backgroundColor: type.color }
            ]}
            onPress={() => setSelectedType(type.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={type.icon as any} 
              size={16} 
              color={selectedType === type.id ? '#FFFFFF' : type.color} 
            />
            <Text style={[
              styles.filterText,
              selectedType === type.id && styles.selectedFilterText
            ]}>
              {type.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Races List */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.racesContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#EF4444" />
            <Text style={styles.loadingText}>რბოლები იტვირთება...</Text>
          </View>
        ) : filteredRaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>რბოლები არ არის</Text>
            <Text style={styles.emptySubtitle}>მალე ახალი რბოლები დაემატება!</Text>
          </View>
        ) : (
          filteredRaces.map((race) => renderRaceCard(race))
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="trophy-outline" size={16} color="#F59E0B" />
          <Text style={styles.quickActionText}>ლიდერბორდი</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="car-outline" size={16} color="#3B82F6" />
          <Text style={styles.quickActionText}>ჩემი მანქანა</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="people-outline" size={16} color="#8B5CF6" />
          <Text style={styles.quickActionText}>გუნდი</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    position: 'relative',
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  racingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  viewAllButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  racingStripes: {
    flexDirection: 'row',
    height: 4,
  },
  stripe: {
    flex: 1,
    height: '100%',
  },
  statsBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 16,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsBannerItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsBannerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  statsBannerLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  statsBannerDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedFilterButton: {
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  selectedFilterText: {
    color: '#FFFFFF',
  },
  racesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  raceCard: {
    width: 300,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  registeredCard: {
    // Handled by gradient colors
  },
  raceCardGradient: {
    padding: 20,
    position: 'relative',
  },
  racingPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    opacity: 0.1,
  },
  checkeredFlag: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
  },
  checkeredSquare: {
    width: '33.33%',
    height: '33.33%',
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  raceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  raceTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  raceTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  raceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  raceType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  registeredBadge: {
    alignItems: 'center',
    gap: 4,
  },
  registeredText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  raceInfo: {
    gap: 6,
    marginBottom: 12,
  },
  raceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raceInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter',
    flex: 1,
    fontWeight: '500',
  },
  prizeHighlight: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prizeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prizeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  raceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  raceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  registerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  unregisterButton: {
    backgroundColor: '#6B7280',
  },
  fullButton: {
    backgroundColor: '#D1D5DB',
  },
  registerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  unregisterButtonText: {
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  quickActionText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});

export default RaceCalendar;
