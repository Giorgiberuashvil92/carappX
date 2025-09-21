import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCars } from '../../contexts/CarContext';
import { useUser } from '../../contexts/UserContext';
import { offersApi, type RecommendationItem } from '../../services/offersApi';
import OffersModal from './OffersModal';

const { width: screenWidth } = Dimensions.get('window');

export default function ReminderSection() {
  const router = useRouter();
  const { cars, reminders } = useCars();
  const { user } = useUser();
  
  const [offersByReminder, setOffersByReminder] = useState<Record<string, RecommendationItem[]>>({});
  const [loadingOffers, setLoadingOffers] = useState<Record<string, boolean>>({});
  const [errorOffers, setErrorOffers] = useState<Record<string, string>>({});
  const [offersModalVisible, setOffersModalVisible] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // აქტიური შეხსენებების მიღება
  const getActiveReminders = () => {
    if (!reminders || reminders.length === 0) return [];
    
    const activeReminders = reminders.filter(reminder => 
      !reminder.isCompleted && reminder.isActive
    );
    
    return activeReminders.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      
      const dateA = new Date(a.reminderDate);
      const dateB = new Date(b.reminderDate);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const activeReminders = getActiveReminders();
  const [tab, setTab] = useState<'all' | 'urgent' | 'upcoming'>('all');
  const displayedReminders = useMemo(() => {
    if (tab === 'urgent') return activeReminders.filter((r) => r.isUrgent);
    if (tab === 'upcoming') return activeReminders.filter((r) => !r.isUrgent);
    return activeReminders;
  }, [tab, activeReminders]);

  const loadOffers = async (reminderId: string) => {
    if (!reminderId || offersByReminder[reminderId] || loadingOffers[reminderId]) return;
    setLoadingOffers((p) => ({ ...p, [reminderId]: true }));
    try {
      // eslint-disable-next-line no-console
      console.log('[ReminderSection] loading offers', { reminderId, userId: user?.id });
      const items = await offersApi.getReminderOffers(reminderId, user?.id);
      // eslint-disable-next-line no-console
      console.log('[ReminderSection] offers loaded', { reminderId, count: items?.length });
      setOffersByReminder((p) => ({ ...p, [reminderId]: items }));
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('[ReminderSection] offers error', { reminderId, error: e?.message });
      setErrorOffers((p) => ({ ...p, [reminderId]: e?.message || 'შეთავაზებები ვერ ჩაიტვირთა' }));
    } finally {
      setLoadingOffers((p) => ({ ...p, [reminderId]: false }));
    }
  };

  const openOffersModal = (reminderId: string) => {
    setSelectedReminderId(reminderId);
    void loadOffers(reminderId);
    setOffersModalVisible(true);
  };
  const closeOffersModal = () => setOffersModalVisible(false);

  const toggleCardExpansion = (reminderId: string) => {
    setExpandedCard(expandedCard === reminderId ? null : reminderId);
    if (expandedCard !== reminderId) {
      void loadOffers(reminderId);
    }
  };

  const getReminderIcon = (type: string, isUrgent: boolean) => {
    if (isUrgent) return "flash";
    const iconMap: { [key: string]: string } = {
      'maintenance': 'build',
      'inspection': 'search',
      'battery': 'battery-half',
      'tires': 'ellipse',
      'insurance': 'shield',
      'service': 'settings',
      'oil': 'water',
      'carwash': 'water',
      'fuel': 'car',
      'parts': 'construct',
    };
    return iconMap[type] || 'notifications';
  };

  const getReminderCategoryName = (type: string) => {
    const categoryMap: { [key: string]: string } = {
      'maintenance': 'მოვლა-პატრონობა',
      'inspection': 'ტექდათვალიერება',
      'battery': 'აკუმულატორი',
      'tires': 'ბორბლები',
      'insurance': 'დაზღვევა',
      'service': 'სერვისი',
      'oil': 'ზეთის შეცვლა',
      'carwash': 'სამრეცხაო',
      'fuel': 'საწვავი',
      'parts': 'ნაწილები',
    };
    return categoryMap[type] || 'შეხსენება';
  };

  const getServiceActionInfo = (type: string, isUrgent: boolean) => {
    const actionMap: { [key: string]: { button: string; route: string; icon: string } } = {
      'maintenance': { 
        button: isUrgent ? 'სასწრაფოდ მოვლა' : 'მოვლის დაჯავშნა', 
        route: '/(tabs)/carwash',
        icon: 'build'
      },
      'inspection': { 
        button: isUrgent ? 'ტექდათვალიერება ახლავე' : 'ტექდათვალიერების დაჯავშნა', 
        route: '/booking',
        icon: 'search'
      },
      'battery': { 
        button: isUrgent ? 'აკუმულატორის შეცვლა' : 'აკუმულატორის შემოწმება', 
        route: '/(tabs)/marketplace',
        icon: 'battery-half'
      },
      'tires': { 
        button: isUrgent ? 'ბორბლების შეცვლა' : 'ბორბლების შემოწმება', 
        route: '/(tabs)/marketplace',
        icon: 'ellipse'
      },
      'insurance': { 
        button: isUrgent ? 'დაზღვევის განახლება' : 'დაზღვევის შემოწმება', 
        route: '/(tabs)/management',
        icon: 'shield'
      },
      'service': { 
        button: isUrgent ? 'სასწრაფო სერვისი' : 'სერვისის დაჯავშნა', 
        route: '/(tabs)/carwash',
        icon: 'settings'
      },
      'oil': { 
        button: isUrgent ? 'ზეთის შეცვლა ახლავე' : 'ზეთის შეცვლის დაჯავშნა', 
        route: '/(tabs)/carwash',
        icon: 'water'
      },
      'carwash': { 
        button: isUrgent ? 'სამრეცხაო ახლავე' : 'სამრეცხაოს დაჯავშნა', 
        route: '/(tabs)/carwash',
        icon: 'water'
      },
      'fuel': { 
        button: isUrgent ? 'საწვავის შევსება' : 'საწვავის სადგურის ძებნა', 
        route: '/fuel-stations',
        icon: 'car'
      },
      'parts': { 
        button: isUrgent ? 'ნაწილების შეძენა' : 'ნაწილების ძებნა', 
        route: '/(tabs)/marketplace',
        icon: 'construct'
      },
    };
    return actionMap[type] || { 
      button: isUrgent ? 'დაუყოვნებლივ' : 'დაჯავშნა', 
      route: '/(tabs)/carwash',
      icon: 'arrow-forward'
    };
  };

  // Accent color for UI elements by type
  const getAccentColor = (type: string) => {
    const map: Record<string, string> = {
      oil: '#F59E0B',
      tires: '#6366F1',
      battery: '#10B981',
      service: '#3B82F6',
      parts: '#8B5CF6',
      insurance: '#06B6D4',
      carwash: '#0EA5E9',
      fuel: '#F97316',
      inspection: '#14B8A6',
    };
    return map[(type || '').toLowerCase()] || '#3B82F6';
  };

  const formatReminderTime = (reminderDate: Date) => {
    const today = new Date();
    const diffTime = reminderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} დღის წინ`, color: '#EF4444', progress: 100 };
    } else if (diffDays === 0) {
      return { text: 'დღეს', color: '#F59E0B', progress: 90 };
    } else if (diffDays === 1) {
      return { text: 'ხვალ', color: '#10B981', progress: 70 };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} დღეში`, color: '#3B82F6', progress: 50 };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} დღეში`, color: '#6366F1', progress: 30 };
    } else {
      return { text: `${diffDays} დღეში`, color: '#8B5CF6', progress: 10 };
    }
  };

  // თუ არ არის აქტიური შეხსენებები, არაფერს არ ვაჩვენებთ
  if (activeReminders.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>შეხსენებები</Text>
            <Text style={styles.sectionSubtitle}>{activeReminders.length} აქტიური შეხსენება</Text>
          </View>
          {activeReminders.filter(r => r.isUrgent).length > 0 && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={12} color="#EF4444" />
              <Text style={styles.urgentBadgeText}>{activeReminders.filter(r => r.isUrgent).length} გადაუდებელი</Text>
            </View>
          )}
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { id: 'all', label: 'ყველა', count: activeReminders.length },
            { id: 'urgent', label: 'გადაუდებელი', count: activeReminders.filter(r => r.isUrgent).length },
            { id: 'upcoming', label: 'მომავალი', count: activeReminders.filter(r => !r.isUrgent).length },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id as any)}
              style={[styles.filterTab, tab === (t.id as any) && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, tab === (t.id as any) && styles.filterTabTextActive]}>
                {t.label}
              </Text>
              <View style={[styles.filterTabBadge, tab === (t.id as any) && styles.filterTabBadgeActive]}>
                <Text style={[styles.filterTabBadgeText, tab === (t.id as any) && styles.filterTabBadgeTextActive]}>
                  {t.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ServiceCard Style Reminder Cards */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {displayedReminders.map((reminder) => {
          const car = cars.find(c => c.id === reminder.carId);
          const icon = getReminderIcon(reminder.type, reminder.isUrgent);
          const categoryName = getReminderCategoryName(reminder.type);
          const timeInfo = formatReminderTime(new Date(reminder.reminderDate));
          const actionInfo = getServiceActionInfo(reminder.type, reminder.isUrgent);
          
          return (
            <TouchableOpacity 
              key={reminder.id} 
              activeOpacity={0.9} 
              style={styles.reminderCard}
              onPress={() => router.push(actionInfo.route as any)}
            >
              {/* Beautiful Background with Gradient */}
              <LinearGradient
                colors={reminder.isUrgent 
                  ? ['#FF6B6B', '#FF8E8E', '#FF6B6B'] 
                  : ['#667eea', '#764ba2', '#667eea']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundImage}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.4)"]}
                  style={styles.overlay}
                />
                
                {/* Top Row - Rating and Heart */}
                <View style={styles.topRow}>
                  <View style={[styles.timePill, { backgroundColor: timeInfo.color }]}>
                    <Ionicons name="time" size={14} color="#FFFFFF" />
                    <Text style={styles.timePillText}>{timeInfo.text}</Text>
                  </View>
                  <TouchableOpacity 
                    activeOpacity={0.9} 
                    style={styles.infoButton}
                    onPress={() => openOffersModal(reminder.id)}
                  >
                    <Text style={styles.infoButtonText}>
                      {reminder.isUrgent ? '⚠️ გადაუდებელი' : 'შეთავაზებები'}
                    </Text>
                    {(offersByReminder[reminder.id]?.length || 0) > 0 && (
                      <View style={styles.offersBadge}>
                        <Text style={styles.offersBadgeText}>
                          {offersByReminder[reminder.id]?.length || 0}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Bottom Area */}
                <View style={styles.bottomArea}>
                  <Text numberOfLines={1} style={styles.title}>{reminder.title}</Text>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{categoryName}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Ionicons name="car" size={12} color="#FFFFFF" />
                      <Text style={styles.metaText}>
                        {car ? `${car.make} ${car.model}` : 'მანქანა'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, reminder.isUrgent ? styles.urgentButton : styles.normalButton]}
                      onPress={() => router.push(actionInfo.route as any)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={reminder.isUrgent ? "flash" : "calendar"} 
                        size={14} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.actionButtonText}>
                        {reminder.isUrgent ? 'ახლავე' : 'დაჯავშნა'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Offers Modal */}
      <OffersModal
        visible={offersModalVisible}
        onClose={closeOffersModal}
        items={selectedReminderId ? (offersByReminder[selectedReminderId] || []) : []}
        loading={selectedReminderId ? !!loadingOffers[selectedReminderId] : false}
        error={selectedReminderId ? errorOffers[selectedReminderId] : undefined}
        onSortByPrice={() => {
          if (!selectedReminderId) return;
          const list = offersByReminder[selectedReminderId] || [];
          const sorted = [...list].sort((a, b) => (a.priceGEL || 0) - (b.priceGEL || 0));
          setOffersByReminder((p) => ({ ...p, [selectedReminderId]: sorted }));
        }}
        onSortByDistance={() => {
          if (!selectedReminderId) return;
          const list = offersByReminder[selectedReminderId] || [];
          const sorted = [...list].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
          setOffersByReminder((p) => ({ ...p, [selectedReminderId]: sorted }));
        }}
        onVisit={() => {
          closeOffersModal();
          router.push('/(tabs)/marketplace');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  
  // Header Styles - Garage style
  header: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  urgentBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  
  // Filter Tabs - Carwash style
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterTabBadgeActive: {
    backgroundColor: '#6B7280',
  },
  filterTabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  filterTabBadgeTextActive: {
    color: '#FFFFFF',
  },
  
  // Exact ServiceCard Style
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  reminderCard: {
    width: 360,
    height: 240,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  backgroundImage: { 
    width: '100%', 
    height: '100%' 
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject 
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 14 
  },
  ratingPillText: { 
    color: '#111827', 
    fontFamily: 'Inter', 
    fontSize: 12,
    fontWeight: '600'
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  timePillText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartButton: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    position: 'relative'
  },
  infoButton: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    position: 'relative',
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  bottomArea: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: { 
    color: '#FFFFFF', 
    fontFamily: 'Inter', 
    fontSize: 12,
    fontWeight: '500'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentButton: {
    backgroundColor: '#111827',
  },
  normalButton: {
    backgroundColor: '#111827',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  offersBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  offersBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});