import React, { useMemo, useState, useCallback, memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCars } from '../../contexts/CarContext';
import { useUser } from '../../contexts/UserContext';
import { offersApi, type RecommendationItem } from '../../services/offersApi';
import OffersModal from './OffersModal';

const { width: screenWidth } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = 20;
const CARD_GAP = 20;
const CARD_WIDTH = screenWidth - (CARD_HORIZONTAL_MARGIN * 2);

// ---- Constants & Utilities ----
const ICON_MAP: { [key: string]: string } = {
  maintenance: 'build',
  inspection: 'search',
  battery: 'battery-half',
  tires: 'ellipse',
  insurance: 'shield',
  service: 'settings',
  oil: 'water',
  carwash: 'water',
  fuel: 'car',
  parts: 'construct',
};

const CATEGORY_MAP: { [key: string]: string } = {
  maintenance: 'მოვლა-პატრონობა',
  inspection: 'ტექდათვალიერება',
  battery: 'აკუმულატორი',
  tires: 'ბორბლები',
  insurance: 'დაზღვევა',
  service: 'სერვისი',
  oil: 'ზეთის შეცვლა',
  carwash: 'სამრეცხაო',
  fuel: 'საწვავი',
  parts: 'ნაწილები',
};

const ACTION_MAP: { [key: string]: { button: (isUrgent: boolean) => string; route: string; icon: string } } = {
  maintenance: { button: (u) => (u ? 'სასწრაფოდ მოვლა' : 'მოვლის დაჯავშნა'), route: '/(tabs)/carwash', icon: 'build' },
  inspection: { button: (u) => (u ? 'ტექდათვალიერება ახლავე' : 'ტექდათვალიერების დაჯავშნა'), route: '/booking', icon: 'search' },
  battery: { button: (u) => (u ? 'აკუმულატორის შეცვლა' : 'აკუმულატორის შემოწმება'), route: '/(tabs)/marketplace', icon: 'battery-half' },
  tires: { button: (u) => (u ? 'ბორბლების შეცვლა' : 'ბორბლების შემოწმება'), route: '/(tabs)/marketplace', icon: 'ellipse' },
  insurance: { button: (u) => (u ? 'დაზღვევის განახლება' : 'დაზღვევის შემოწმება'), route: '/(tabs)/management', icon: 'shield' },
  service: { button: (u) => (u ? 'სასწრაფო სერვისი' : 'სერვისის დაჯავშნა'), route: '/(tabs)/carwash', icon: 'settings' },
  oil: { button: (u) => (u ? 'ზეთის შეცვლა ახლავე' : 'ზეთის შეცვლის დაჯავშნა'), route: '/(tabs)/carwash', icon: 'water' },
  carwash: { button: (u) => (u ? 'სამრეცხაო ახლავე' : 'სამრეცხაოს დაჯავშნა'), route: '/(tabs)/carwash', icon: 'water' },
  fuel: { button: (u) => (u ? 'საწვავის შევსება' : 'საწვავის სადგურის ძებნა'), route: '/fuel-stations', icon: 'car' },
  parts: { button: (u) => (u ? 'ნაწილების შეძენა' : 'ნაწილების ძებნა'), route: '/(tabs)/marketplace', icon: 'construct' },
};

const getReminderIcon = (type: string, isUrgent: boolean) => (isUrgent ? 'flash' : ICON_MAP[type] || 'notifications');
const getReminderCategoryName = (type: string) => CATEGORY_MAP[type] || 'შეხსენება';
const getServiceActionInfo = (type: string, isUrgent: boolean) => {
  const def = ACTION_MAP[type];
  if (def) return { button: def.button(isUrgent), route: def.route, icon: def.icon };
  return { button: isUrgent ? 'დაუყოვნებლივ' : 'დაჯავშნა', route: '/(tabs)/carwash', icon: 'arrow-forward' };
};

// Dribbble-like type gradients
const TYPE_GRADIENTS: Record<string, [string, string]> = {
  oil: ['#F59E0B', '#F97316'],
  tires: ['#6366F1', '#8B5CF6'],
  battery: ['#10B981', '#34D399'],
  service: ['#3B82F6', '#06B6D4'],
  parts: ['#8B5CF6', '#EC4899'],
  insurance: ['#06B6D4', '#3B82F6'],
  carwash: ['#0EA5E9', '#22D3EE'],
  fuel: ['#F97316', '#EF4444'],
  inspection: ['#14B8A6', '#22C55E'],
};

const formatReminderTime = (reminderDate: Date) => {
  const today = new Date();
  const diffTime = reminderDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `${Math.abs(diffDays)} დღის წინ`, color: '#EF4444', progress: 100 };
  if (diffDays === 0) return { text: 'დღეს', color: '#F59E0B', progress: 90 };
  if (diffDays === 1) return { text: 'ხვალ', color: '#10B981', progress: 70 };
  if (diffDays <= 3) return { text: `${diffDays} დღეში`, color: '#3B82F6', progress: 50 };
  if (diffDays <= 7) return { text: `${diffDays} დღეში`, color: '#6366F1', progress: 30 };
  return { text: `${diffDays} დღეში`, color: '#8B5CF6', progress: 10 };
};

// ---- Subcomponents ----
type HeaderProps = { total: number; urgentCount: number };
const Header = memo(function Header({ total, urgentCount }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>შეხსენებები</Text>
          <Text style={styles.sectionSubtitle}>{total} აქტიური შეხსენება</Text>
        </View>
        {urgentCount > 0 && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={12} color="#EF4444" />
            <Text style={styles.urgentBadgeText}>{urgentCount} გადაუდებელი</Text>
          </View>
        )}
      </View>
    </View>
  );
});

type TabKey = 'all' | 'urgent' | 'upcoming';
type FilterTabsProps = { tab: TabKey; onChange: (t: TabKey) => void; counts: { all: number; urgent: number; upcoming: number } };
const FilterTabs = memo(function FilterTabs({ tab, onChange, counts }: FilterTabsProps) {
  const tabs = useMemo(
    () => [
      { id: 'all', label: 'ყველა', count: counts.all },
      { id: 'urgent', label: 'გადაუდებელი', count: counts.urgent },
      { id: 'upcoming', label: 'მომავალი', count: counts.upcoming },
    ] as Array<{ id: TabKey; label: string; count: number }>,
    [counts]
  );
  return (
    <View style={styles.filterTabs}>
      {tabs.map((t) => (
        <TouchableOpacity key={t.id} onPress={() => onChange(t.id)} style={[styles.filterTab, tab === t.id && styles.filterTabActive]}>
          <Text style={[styles.filterTabText, tab === t.id && styles.filterTabTextActive]}>{t.label}</Text>
          <View style={[styles.filterTabBadge, tab === t.id && styles.filterTabBadgeActive]}>
            <Text style={[styles.filterTabBadgeText, tab === t.id && styles.filterTabBadgeTextActive]}>{t.count}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
});

type ReminderCardProps = {
  reminder: any;
  carLabel: string;
  onOpenOffers: () => void;
  onPrimaryAction: () => void;
  offersCount: number;
};
const ReminderCard = memo(function ReminderCard({ reminder, carLabel, onOpenOffers, onPrimaryAction, offersCount }: ReminderCardProps) {
  const categoryName = getReminderCategoryName(reminder.type);
  const timeInfo = formatReminderTime(new Date(reminder.reminderDate));
  const accentColor = reminder.isUrgent ? '#EF4444' : '#111827';
  const gradColors: [string, string] = reminder.isUrgent
    ? ['#EF4444', '#F97316']
    : (TYPE_GRADIENTS[(reminder.type || '').toLowerCase()] || ['#4F46E5', '#7C3AED']);
  return (
    <View style={styles.cardContainer}>
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      <TouchableOpacity style={styles.cardBody} activeOpacity={0.9} onPress={onPrimaryAction}>
        <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
          <View pointerEvents="none" style={styles.cardGlassOverlay} />
          <View pointerEvents="none" style={[styles.blobA]} />
          <View pointerEvents="none" style={[styles.blobB]} />

          <View style={styles.compactRowOnDark}>
            <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)' }]}>
              <Ionicons name={getReminderIcon(reminder.type, reminder.isUrgent) as any} size={16} color="#FFFFFF" />
            </View>
            <View style={styles.compactMiddle}>
              <Text numberOfLines={1} style={styles.cardTitleOnDark}>{reminder.title}</Text>
              <View style={styles.cardMetaRow}>
                <View style={styles.categoryPillGlass}>
                  <Text style={styles.categoryTextOnDark}>{categoryName}</Text>
                </View>
                <View style={styles.timePillGlass}>
                  <Ionicons name="time" size={12} color="#FFFFFF" />
                  <Text style={styles.timePillGlassText}>{timeInfo.text}</Text>
                </View>
              </View>
            </View>
            <View style={styles.compactRight}>
              <TouchableOpacity onPress={onOpenOffers} style={styles.ghostBtn} activeOpacity={0.85}>
                <Ionicons name="pricetags" size={14} color="#FFFFFF" />
                {(offersCount || 0) > 0 && (
                  <View style={styles.badgeDot}><Text style={styles.badgeDotText}>{offersCount || 0}</Text></View>
                )}
              </TouchableOpacity>
              <LinearGradient colors={["rgba(255,255,255,0.85)", "rgba(255,255,255,0.65)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientPrimaryBtn}>
                <Ionicons name={reminder.isUrgent ? 'flash' : 'calendar'} size={16} color={accentColor} />
              </LinearGradient>
            </View>
          </View>

          <View style={styles.progressBarOuterGlass}>
            <View style={[styles.progressBarInnerGlass, { width: `${Math.min(Math.max(timeInfo.progress, 5), 100)}%` }]} />
          </View>

          <View style={styles.cardFooterInlineDark}>
            <Ionicons name="car" size={12} color="rgba(255,255,255,0.85)" />
            <Text numberOfLines={1} style={styles.metaTextOnDark}>{carLabel}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

// Featured Upcoming (large dark card)
type FeaturedUpcomingProps = {
  reminder: any;
  carLabel: string;
  locationText?: string;
  priceText?: string;
  onPrimary: () => void;
  onDetails: () => void;
  offersCount?: number;
  offersLoading?: boolean;
};
const FeaturedUpcomingCard = memo(function FeaturedUpcomingCard({ reminder, carLabel, locationText, priceText, onPrimary, onDetails, offersCount = 0, offersLoading = false }: FeaturedUpcomingProps) {
  const date = new Date(reminder.reminderDate);
  const today = new Date();
  const diffMs = date.getTime() - today.getTime();
  const diffDaysRaw = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysLabel = diffDaysRaw < 0 ? 'ვადაგასული' : (diffDaysRaw === 0 ? 'დღეს' : `${diffDaysRaw} დღე`);
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onDetails} style={styles.featureWrap}>
      <LinearGradient colors={["#0B1220", "#0E1627"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureCard}>
        <Image source={require('../../assets/images/car-bg.png')} resizeMode="contain" style={styles.featureCarBg} />
        <View pointerEvents="none" style={styles.featureCardInnerBorder} />
        <View pointerEvents="none" style={styles.lightStreakA} />
        <View pointerEvents="none" style={styles.lightStreakB} />
        <View style={styles.featureTopRow}>
          <View style={styles.featureTopPill}>
            <Ionicons name="location" size={12} color="#FFFFFF" />
            <Text style={styles.featureTopPillText} numberOfLines={1}>{locationText || 'კატეგორია'}</Text>
          </View>
          <TouchableOpacity onPress={onDetails} activeOpacity={0.9} style={styles.featureOffersBtn}>
            <Ionicons name="pricetags" size={14} color="#FFFFFF" />
            <Text style={styles.featureOffersText}>შეთავაზებები</Text>
            {(offersCount > 0 || offersLoading) && (
              <View style={styles.featureOffersBadge}><Text style={styles.featureOffersBadgeText}>{offersLoading ? '…' : offersCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.featureDateRow}>
          <Text numberOfLines={1} style={styles.featureBigDate}>{reminder.title || locationText || 'შეხსენება'}</Text>
          <Text style={styles.featureBigTime}>{daysLabel}</Text>
        </View>
        <View style={styles.featureUserRow}>
          <View style={styles.featureAvatar}><Ionicons name={getReminderIcon(reminder.type, reminder.isUrgent) as any} size={18} color="#0B1220" /></View>
        </View>
        <TouchableOpacity activeOpacity={0.9} onPress={onPrimary}>
          <LinearGradient colors={["#7C3AED", "#A78BFA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featurePrimaryGradient}>
            <Text style={styles.featurePrimaryText}>{priceText ? `გადახდა • ${priceText}` : 'დაჯავშნა'}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
});

type PastItemProps = {
  reminder: any;
  carLabel: string;
  priceText?: string;
  onPress: () => void;
};
const PastItem = memo(function PastItem({ reminder, carLabel, priceText, onPress }: PastItemProps) {
  const date = new Date(reminder.reminderDate);
  const month = date.toLocaleString('en', { month: 'long' });
  const day = date.getDate();
  const time = date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  return (
    <TouchableOpacity style={styles.pastItem} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.pastLeft}>
        <View style={styles.pastAvatar}><Ionicons name={getReminderIcon(reminder.type, reminder.isUrgent) as any} size={16} color="#0B1220" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pastTitle} numberOfLines={1}>{carLabel}</Text>
          <Text style={styles.pastSubtitle} numberOfLines={1}>{getReminderCategoryName(reminder.type)} — {day} {month} · {time}</Text>
        </View>
      </View>
      <View style={styles.pastPricePill}><Text style={styles.pastPriceText}>{priceText || '—'}</Text></View>
    </TouchableOpacity>
  );
});

type CarReminderCardProps = {
  reminder: any;
  car: { make?: string; model?: string; year?: number; plateNumber?: string; imageUri?: string } | undefined;
  onPress: () => void;
  onOpenOffers: () => void;
  offersCount?: number;
  offersLoading?: boolean;
};

const CarReminderCard = memo(function CarReminderCard({ reminder, car, onPress, onOpenOffers, offersCount = 0, offersLoading = false }: CarReminderCardProps) {
  const title = `${car?.make || ''} ${car?.model || ''}`.trim() || 'მანქანა';
  const yearText = car?.year ? String(car.year) : '';
  const plate = car?.plateNumber || '—';
  const timeInfo = formatReminderTime(new Date(reminder.reminderDate));
  const bg = car?.imageUri || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop';
  const categoryName = getReminderCategoryName(reminder.type);
  const urgent = !!reminder.isUrgent;

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} style={styles.garageCardWrap}>
      <View style={[styles.garageCard, urgent && styles.garageCardUrgent]}>
        <Image source={{ uri: bg }} resizeMode="cover" style={styles.garageCardBg} />
        <View style={styles.garageTopRow}>
          <View style={styles.categoryChip}>
            <Ionicons name={getReminderIcon(reminder.type, urgent) as any} size={12} color="#FFFFFF" />
            <Text style={styles.categoryChipText}>{categoryName}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.9} onPress={onOpenOffers} style={styles.garageOffersBtn}>
            <Ionicons name="pricetags" size={14} color="#FFFFFF" />
            <Text style={styles.garageOffersText}>შეთავაზებები</Text>
            {(offersLoading || (offersCount || 0) > 0) && (
              <View style={styles.garageOffersBadge}>
                <Text style={styles.garageOffersBadgeText}>{offersLoading ? '…' : offersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.garageBottomOverlay}>
          <View>
            <Text style={styles.garageTitle}>{title}</Text>
            {!!yearText && <Text style={styles.garageSubtitle}>{yearText}</Text>}
          </View>
          <View style={styles.garagePillsRow}>
            <View style={styles.garagePill}>
              <Ionicons name="pricetag-outline" size={12} color="#E5E7EB" />
              <Text style={styles.garagePillText}>{plate}</Text>
            </View>
            <View style={styles.garagePill}>
              <Ionicons name="time-outline" size={12} color="#E5E7EB" />
              <Text style={styles.garagePillText}>{timeInfo.text}</Text>
            </View>
          </View>
          <View style={styles.garageProgressOuter}>
            <View style={[styles.garageProgressInner, { width: `${Math.min(Math.max(timeInfo.progress, 5), 100)}%`, backgroundColor: urgent ? '#EF4444' : '#A78BFA' }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ReminderSection() {
  const router = useRouter();
  const { cars, reminders } = useCars();
  const { user } = useUser();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [offersByReminder, setOffersByReminder] = useState<Record<string, RecommendationItem[]>>({});
  const [loadingOffers, setLoadingOffers] = useState<Record<string, boolean>>({});
  const [errorOffers, setErrorOffers] = useState<Record<string, string>>({});
  const [offersModalVisible, setOffersModalVisible] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // აქტიური შეხსენებების მიღება
  const getActiveReminders = () => {
    if (!reminders || reminders.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const activeReminders = reminders.filter(reminder => {
      if (reminder.isCompleted || !reminder.isActive) return false;
      
      // Filter out reminders that are in the past (before today)
      const reminderDate = new Date(reminder.reminderDate);
      reminderDate.setHours(0, 0, 0, 0);
      
      // Keep only reminders from today onwards (>= today)
      return reminderDate.getTime() >= today.getTime();
    });
    
    return activeReminders.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      
      const dateA = new Date(a.reminderDate);
      const dateB = new Date(b.reminderDate);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const activeReminders = getActiveReminders();
  const urgentCount = activeReminders.filter(r => r.isUrgent).length;
  const upcomingCount = activeReminders.filter(r => !r.isUrgent).length;
  const [tab, setTab] = useState<'all' | 'urgent' | 'upcoming'>('all');
  const displayedReminders = useMemo(() => {
    if (tab === 'urgent') return activeReminders.filter((r) => r.isUrgent);
    if (tab === 'upcoming') return activeReminders.filter((r) => !r.isUrgent);
    return activeReminders;
  }, [tab, activeReminders]);

  const loadOffers = useCallback(async (reminderId: string, force = false) => {
    if (!reminderId || (!force && (offersByReminder[reminderId] || loadingOffers[reminderId]))) return;
    
    // Find reminder to get its type
    const reminder = activeReminders.find((r) => r.id === reminderId);
    if (!reminder || !reminder.type) {
      console.log('[ReminderSection] reminder not found or no type', { reminderId });
      return;
    }

    setLoadingOffers((p) => ({ ...p, [reminderId]: true }));
    try {
      // eslint-disable-next-line no-console
      console.log('[ReminderSection] loading offers by type', { reminderId, reminderType: reminder.type, userId: user?.id });
      // Load offers by reminder type instead of reminder ID
      const items = await offersApi.getOffersByReminderType(reminder.type, user?.id);
      // eslint-disable-next-line no-console
      console.log('[ReminderSection] offers loaded', { reminderId, reminderType: reminder.type, count: items?.length });
      setOffersByReminder((p) => ({ ...p, [reminderId]: items }));
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('[ReminderSection] offers error', { reminderId, error: e?.message });
      setErrorOffers((p) => ({ ...p, [reminderId]: e?.message || 'შეთავაზებები ვერ ჩაიტვირთა' }));
    } finally {
      setLoadingOffers((p) => ({ ...p, [reminderId]: false }));
    }
  }, [offersByReminder, loadingOffers, user?.id, activeReminders]);

  // Auto-load offers for all active reminders on mount/user change
  const reminderIds = useMemo(() => activeReminders.map((r) => r.id).join(','), [activeReminders]);
  React.useEffect(() => {
    if (!user?.id || activeReminders.length === 0) return;
    activeReminders.forEach((r) => {
      // Load offers for each reminder (only if not already loaded)
      if (!offersByReminder[r.id] && !loadingOffers[r.id]) {
        void loadOffers(r.id, false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, reminderIds]);

  const openOffersModal = useCallback((reminderId: string) => {
    setSelectedReminderId(reminderId);
    void loadOffers(reminderId);
    setOffersModalVisible(true);
  }, [loadOffers]);
  const closeOffersModal = useCallback(() => setOffersModalVisible(false), []);

  const toggleCardExpansion = (reminderId: string) => {
    setExpandedCard(expandedCard === reminderId ? null : reminderId);
    if (expandedCard !== reminderId) {
      void loadOffers(reminderId);
    }
  };


  // Group reminders by timing
  const groups = useMemo(() => {
    const result: Record<string, any[]> = { overdue: [], today: [], soon: [], later: [] };
    activeReminders.forEach((r) => {
      const info = formatReminderTime(new Date(r.reminderDate));
      const t = info.text;
      const numMatch = t.match(/(\d+)/);
      const num = numMatch ? parseInt(numMatch[1], 10) : undefined;
      const isOverdue = t.includes('წინ');
      const isToday = t === 'დღეს';
      const isSoon = t.includes('დღეში') && (num || 0) <= 3;
      if (isOverdue) result.overdue.push(r);
      else if (isToday) result.today.push(r);
      else if (isSoon) result.soon.push(r);
      else result.later.push(r);
    });
    return result;
  }, [activeReminders]);

  const sectionOrder = ['overdue', 'today', 'soon', 'later'] as const;
  const sectionTitles: Record<string, string> = {
    overdue: 'ვადაგასული',
    today: 'დღეს',
    soon: 'მალე',
    later: 'მოგვიანებით',
  };

  // თუ არ არის აქტიური შეხსენებები, არაფერს არ ვაჩვენებთ
  if (activeReminders.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Header total={activeReminders.length} urgentCount={urgentCount} />
      <View style={styles.tabsSurface}>
        <FilterTabs
          tab={tab}
          onChange={setTab}
          counts={{ all: activeReminders.length, urgent: urgentCount, upcoming: upcomingCount }}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: 0 }}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x || 0;
          const idx = Math.round(x / (CARD_WIDTH + CARD_GAP));
          if (idx !== currentSlide) setCurrentSlide(idx);
        }}
        scrollEventThrottle={16}
      >
        {displayedReminders
          .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
          .map((reminder) => {
            const car = cars.find(c => c.id === reminder.carId);
            const offers = offersByReminder[reminder.id];
            const offersCount = offers?.length || 0;
            return (
              <View key={reminder.id} style={[styles.carouselItem, { width: CARD_WIDTH }] }>
                <CarReminderCard
                  reminder={reminder}
                  car={car as any}
                  onPress={() => openOffersModal(reminder.id)}
                  onOpenOffers={() => openOffersModal(reminder.id)}
                  offersCount={offersCount}
                  offersLoading={!!loadingOffers[reminder.id]}
                />
              </View>
            );
          })}
      </ScrollView>

      {/* Carousel indicators */}
      <View style={[styles.indicatorsRow, { width: CARD_WIDTH }]}>
        {displayedReminders.map((_, idx) => (
          <View
            key={`dot-${idx}`}
            style={[styles.indicatorDot, idx === currentSlide && styles.indicatorDotActive]}
          />
        ))}
      </View>

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
    marginHorizontal: 0,
    marginBottom: 10,
  },
  sectionSurface: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  
  // Header Styles - Garage style
  header: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabsSurface: {
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Outfit',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
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
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Outfit',
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
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Outfit',
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
    display: 'none'
  },
  backgroundImage: {},
  overlay: {},
  topRow: {},
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
    fontFamily: 'Outfit', 
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
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
  },
  bottomArea: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit', 
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
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
  },
  // New vertical list styles
  verticalScroll: {
    flexGrow: 0,
  },
  verticalScrollContent: {
    paddingBottom: 16,
    gap: 8,
  },
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingLeft: CARD_HORIZONTAL_MARGIN,
    paddingRight: CARD_HORIZONTAL_MARGIN,
    paddingTop: 8,
    paddingBottom: 20,
    gap: CARD_GAP,
  },
  carouselItem: {
    paddingHorizontal: 0,
  },
  indicatorsRow: {
    marginTop: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  indicatorDotActive: {
    width: 18,
    backgroundColor: '#6366F1',
  },
  sectionBlock: {
    gap: 8,
  },
  featureWrap: {
    marginBottom: 24,
  },
  featureCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  featureCardInnerBorder: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  featureTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureTopPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
  },
  featureTopPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Outfit',
  },
  featureOffersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    position: 'relative',
  },
  featureOffersText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  featureOffersBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  featureOffersBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  lightStreakA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    left: -60,
    transform: [{ rotate: '20deg' } as any],
  },
  lightStreakB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -60,
    right: -40,
    transform: [{ rotate: '-15deg' } as any],
  },
  featureCarBg: {
    position: 'absolute',
    right: -24,
    bottom: -10,
    width: 220,
    height: 120,
    opacity: 0.18,
    transform: [{ rotate: '-6deg' } as any],
  },
  featureLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Outfit',
    fontSize: 12,
    marginBottom: 12,
  },
  featureDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featureBigDate: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Outfit',
  },
  featureBigTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Outfit',
  },
  featureUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  featureAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitlePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  featureTitlePillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Outfit',
  },
  featurePrimaryBtn: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featurePrimaryGradient: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featurePrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Outfit',
  },
  pastItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  pastAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  pastSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  pastPricePill: {
    minWidth: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastPriceText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    fontWeight: '800',
    fontSize: 11,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 6,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 12,
  },
  cardGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  blobA: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: -40,
    right: -40,
  },
  blobB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    bottom: -30,
    left: -30,
  },
  compactRowOnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitleOnDark: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  categoryPillGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  categoryTextOnDark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    textTransform: 'uppercase',
  },
  timePillGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  timePillGlassText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  ghostBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    position: 'relative',
  },
  gradientPrimaryBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarOuterGlass: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressBarInnerGlass: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)'
  },
  cardFooterInlineDark: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTextOnDark: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '600',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  compactMiddle: {
    flex: 1,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeDotText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  primaryIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarOuter: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: 6,
    borderRadius: 3,
  },
  cardFooterInline: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  categoryPillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTextDark: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit',
    textTransform: 'uppercase',
  },
  timePillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  timePillLightText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'relative',
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  badgeSmall: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  cardFooterRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaPillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaTextDark: {
    color: '#374151',
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '500',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '700',
  },
  garageCardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  garageCard: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.2)'
  },
  garageCardUrgent: {
    borderColor: 'rgba(239,68,68,0.6)',
    backgroundColor: 'transparent'
  },
  garageCardBg: {
    ...StyleSheet.absoluteFillObject as any,
    opacity: 0.9,
  },
  garageTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 0,
    borderColor: 'transparent'
  },
  categoryChipText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    fontSize: 11,
    fontWeight: '700',
  },
  garageBottomOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 8,
  },
  garageTitle: {
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  garageSubtitle: {
    color: '#9CA3AF',
    fontFamily: 'Outfit',
    fontSize: 12,
    marginTop: 2,
  },
  garagePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  garagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 0,
    borderColor: 'transparent'
  },
  garagePillText: {
    color: '#E5E7EB',
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '600',
  },
  garageProgressOuter: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(17,24,39,0.45)',
    overflow: 'hidden',
  },
  garageProgressInner: {
    height: 6,
    borderRadius: 3,
  },
  garageEditFloating: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(17,24,39,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(156,163,175,0.35)',
    zIndex: 2,
  },
  garageEditText: {
    color: '#E5E7EB',
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '700',
  },
  garageOffersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    position: 'relative',
  },
  garageOffersText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    fontSize: 11,
    fontWeight: '700',
  },
  garageOffersBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  garageOffersBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
});