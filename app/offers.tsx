import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Pressable, View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMarketplace } from '@/contexts/MarketplaceContext';

type Offer = {
  id: string;
  providerName: string;
  rating?: number;
  priceGEL: number;
  etaMin: number;
  distanceKm?: number;
  notes?: string;
  warranty?: string;
  isOriginal?: boolean;
  status?: string;
};

export default function OffersScreen() {
  const router = useRouter();
  const { offers, getOffersForRequest, acceptOffer } = useMarketplace();
  const [sortBy, setSortBy] = useState<'price' | 'eta' | 'rating' | 'distance'>('price');
  const [filterBy, setFilterBy] = useState<'all' | 'original' | 'warranty'>('all');

  // Mock offers for demonstration - in real app this would come from context
  const mockOffers: Offer[] = [
    { 
      id: '1', 
      providerName: 'AutoParts GEO', 
      rating: 4.7, 
      priceGEL: 120, 
      etaMin: 45, 
      distanceKm: 2.1,
      notes: 'ორიგინალი Bosch ფილტრი, 6 თვის გარანტია',
      warranty: '6 თვე',
      isOriginal: true
    },
    { 
      id: '2', 
      providerName: 'City Parts', 
      rating: 4.8, 
      priceGEL: 90, 
      etaMin: 25, 
      distanceKm: 3.4,
      notes: 'მაღალი ხარისხის ფილტრი, 3 თვის გარანტია',
      warranty: '3 თვე',
      isOriginal: false 
    },
    { 
      id: '3', 
      providerName: 'Mechanic+ Gurami', 
      rating: 4.6, 
      priceGEL: 150, 
      etaMin: 60, 
      distanceKm: 1.6,
      notes: 'ორიგინალი ნაწილი, 12 თვის გარანტია',
      warranty: '12 თვე',
      isOriginal: true
    },
    { 
      id: '4', 
      providerName: 'Fast Parts', 
      rating: 4.5, 
      priceGEL: 85, 
      etaMin: 30, 
      distanceKm: 4.2,
      notes: 'საშუალო ხარისხის ფილტრი',
      isOriginal: false
    },
  ];

  const filteredAndSortedOffers = useMemo(() => {
    let filtered = mockOffers;
    
    if (filterBy === 'original') {
      filtered = filtered.filter(o => o.isOriginal);
    } else if (filterBy === 'warranty') {
      filtered = filtered.filter(o => o.warranty);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.priceGEL - b.priceGEL;
        case 'eta':
          return a.etaMin - b.etaMin;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          return (a.distanceKm || 0) - (b.distanceKm || 0);
        default:
          return 0;
      }
    });
  }, [mockOffers, sortBy, filterBy]);

  const handleAcceptOffer = (offer: Offer) => {
    acceptOffer(offer.id);
    router.push('/parts-order');
  };

  const getSortIcon = (field: string) => {
    if (sortBy === field) {
      return <FontAwesome name="sort" size={12} color="#111827" />;
    }
    return <FontAwesome name="sort" size={12} color="#6B7280" />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <RNView style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <FontAwesome name="chevron-left" size={16} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>შეთავაზებები</Text>
        <RNView style={{ width: 36 }} />
      </RNView>

      <RNView style={styles.summaryRow}>
        <Text style={styles.summaryText}>ნაპოვნია {filteredAndSortedOffers.length} შეთავაზება</Text>
      </RNView>

      {/* Filters */}
      <RNView style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <Pressable 
            style={[styles.filterChip, filterBy === 'all' && styles.filterChipActive]} 
            onPress={() => setFilterBy('all')}
          >
            <Text style={[styles.filterChipText, filterBy === 'all' && styles.filterChipTextActive]}>ყველა</Text>
          </Pressable>
          <Pressable 
            style={[styles.filterChip, filterBy === 'original' && styles.filterChipActive]} 
            onPress={() => setFilterBy('original')}
          >
            <Text style={[styles.filterChipText, filterBy === 'original' && styles.filterChipTextActive]}>ორიგინალი</Text>
          </Pressable>
          <Pressable 
            style={[styles.filterChip, filterBy === 'warranty' && styles.filterChipActive]} 
            onPress={() => setFilterBy('warranty')}
          >
            <Text style={[styles.filterChipText, filterBy === 'warranty' && styles.filterChipTextActive]}>გარანტიით</Text>
          </Pressable>
        </ScrollView>
      </RNView>

      {/* Sort Options */}
      <RNView style={styles.sortContainer}>
        <Text style={styles.sortLabel}>დალაგება:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          <Pressable 
            style={[styles.sortChip, sortBy === 'price' && styles.sortChipActive]} 
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortChipText, sortBy === 'price' && styles.sortChipTextActive]}>ფასით</Text>
            {getSortIcon('price')}
          </Pressable>
          <Pressable 
            style={[styles.sortChip, sortBy === 'eta' && styles.sortChipActive]} 
            onPress={() => setSortBy('eta')}
          >
            <Text style={[styles.sortChipText, sortBy === 'eta' && styles.sortChipTextActive]}>დროთი</Text>
            {getSortIcon('eta')}
          </Pressable>
          <Pressable 
            style={[styles.sortChip, sortBy === 'rating' && styles.sortChipActive]} 
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.sortChipText, sortBy === 'rating' && styles.sortChipTextActive]}>რეიტინგით</Text>
            {getSortIcon('rating')}
          </Pressable>
          <Pressable 
            style={[styles.sortChip, sortBy === 'distance' && styles.sortChipActive]} 
            onPress={() => setSortBy('distance')}
          >
            <Text style={[styles.sortChipText, sortBy === 'distance' && styles.sortChipTextActive]}>მანძილით</Text>
            {getSortIcon('distance')}
          </Pressable>
        </ScrollView>
      </RNView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredAndSortedOffers.map((o) => (
          <Pressable 
            key={o.id} 
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.97 }]} 
            android_ripple={{ color: '#00000010' }} 
            onPress={() => handleAcceptOffer(o)}
          >
            <RNView style={styles.cardHeader}>
              <RNView style={{ flex: 1 }}>
                <Text style={styles.name}>{o.providerName}</Text>
                <RNView style={styles.ratingRow}>
                  <FontAwesome name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{o.rating?.toFixed(1)}</Text>
                  <Text style={styles.meta}>• ETA {o.etaMin}წთ • {o.distanceKm?.toFixed(1) ?? '-'}კმ</Text>
                </RNView>
              </RNView>
              <RNView style={styles.pricePill}>
                <Text style={styles.priceText}>{o.priceGEL} ₾</Text>
              </RNView>
            </RNView>

            {o.notes && (
              <Text style={styles.notes} numberOfLines={2}>
                {o.notes}
              </Text>
            )}

            <RNView style={styles.badgesRow}>
              {o.isOriginal && (
                <RNView style={styles.badge}>
                  <FontAwesome name="check-circle" size={10} color="#10B981" />
                  <Text style={styles.badgeText}>ორიგინალი</Text>
                </RNView>
              )}
              {o.warranty && (
                <RNView style={styles.badge}>
                  <FontAwesome name="shield" size={10} color="#3B82F6" />
                  <Text style={styles.badgeText}>{o.warranty}</Text>
                </RNView>
              )}
            </RNView>
          </Pressable>
        ))}

        {filteredAndSortedOffers.length === 0 && (
          <RNView style={styles.emptyState}>
            <FontAwesome name="search" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>შეთავაზებები არ მოიძებნა</Text>
            <Text style={styles.emptyDesc}>ცადე სხვა ფილტრებით</Text>
          </RNView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  headerTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 16 },
  navBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  
  summaryRow: { paddingHorizontal: 14, paddingVertical: 12 },
  summaryText: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 14 },
  
  filtersContainer: { paddingHorizontal: 14, paddingBottom: 8 },
  filtersScroll: { gap: 8 },
  filterChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: '#F3F4F6', 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipText: { color: '#6B7280', fontFamily: 'NotoSans_600SemiBold', fontSize: 12 },
  filterChipTextActive: { color: '#FFFFFF' },
  
  sortContainer: { paddingHorizontal: 14, paddingBottom: 12 },
  sortLabel: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12, marginBottom: 8 },
  sortScroll: { gap: 8 },
  sortChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  sortChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  sortChipText: { color: '#6B7280', fontFamily: 'NotoSans_600SemiBold', fontSize: 11 },
  sortChipTextActive: { color: '#FFFFFF' },
  
  list: { padding: 14, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  name: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 16, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#F59E0B', fontFamily: 'NotoSans_600SemiBold', fontSize: 12 },
  meta: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  pricePill: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    backgroundColor: '#111827' 
  },
  priceText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
  notes: { color: '#6B7280', fontFamily: 'NotoSans_400Regular', fontSize: 13, fontStyle: 'italic' },
  badgesRow: { flexDirection: 'row', gap: 8 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  badgeText: { color: '#6B7280', fontFamily: 'NotoSans_600SemiBold', fontSize: 10 },
  
  emptyState: { 
    alignItems: 'center', 
    gap: 12, 
    padding: 32, 
    borderRadius: 16, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#EEF2F7' 
  },
  emptyTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  emptyDesc: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
});


