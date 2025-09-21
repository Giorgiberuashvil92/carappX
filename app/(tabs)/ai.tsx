import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View as RNView, Switch, Image, ActivityIndicator, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCars } from '@/contexts/CarContext';

import { Text, View } from '@/components/Themed';
import Button from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { registerPushToken } from '@/utils/notifications';
import API_BASE_URL from '../../config/api';

export default function AILandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCar } = useCars();
  const API_URL = API_BASE_URL;

  const [rememberLocation, setRememberLocation] = useState<boolean>(false);
  const [lastDraft, setLastDraft] = useState<null | { mode: 'parts' | 'tow' | 'mechanic'; step: number; summary: string }>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentRequests();
  }, []);

  const fetchRecentRequests = async () => {
    try {
      console.log('[API] GET /requests (recent)');
      const response = await fetch(`${API_URL}/requests`);
      if (response.ok) {
        const data = await response.json();
        console.log('[API] recent requests received:', data.length);
        
        // Take only the first 4 requests for recent section
        const recentRequests = data.slice(0, 4).map((req: any) => ({
          id: String(req.id),
          partName: req.partName || 'ნაწილის მოძიება',
          vehicle: {
            make: req.vehicle?.make || '',
            model: req.vehicle?.model || '',
            year: req.vehicle?.year || '',
          },
          status: req.status === 'completed' ? 'დასრულებული' : 'აქტიური',
          createdAt: req.createdAt,
          offers: req.offersCount || 0,
        }));
        
        setRequests(recentRequests);
      } else {
        console.log('[API] GET /requests failed:', response.status);
        // Fallback to mock data if API fails
        setRequests(getMockRecentRequests());
      }
    } catch (error) {
      console.log('[API] GET /requests error:', error);
      // Fallback to mock data if API fails
      setRequests(getMockRecentRequests());
    } finally {
      setLoading(false);
    }
  };

  const getMockRecentRequests = () => [
    {
      id: '1',
      partName: 'ზეთის ფილტრი',
      vehicle: { make: 'BMW', model: '320i', year: '2018' },
      status: 'აქტიური',
      createdAt: '2024-01-15T10:30:00Z',
      offers: 3
    },
    {
      id: '2', 
      partName: 'ბრეკის ხუნდები',
      vehicle: { make: 'Mercedes', model: 'C200', year: '2020' },
      status: 'აქტიური',
      createdAt: '2024-01-15T10:18:00Z',
      offers: 2
    },
    {
      id: '3',
      partName: 'ფარები',
      vehicle: { make: 'Toyota', model: 'Camry', year: '2019' },
      status: 'აქტიური', 
      createdAt: '2024-01-15T10:05:00Z',
      offers: 4
    },
    {
      id: '4',
      partName: 'ძრავის ზეთი',
      vehicle: { make: 'Audi', model: 'A4', year: '2021' },
      status: 'აქტიური',
      createdAt: '2024-01-15T09:30:00Z',
      offers: 1
    }
  ];

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 1) return 'ახლა';
    if (diffInMinutes < 60) return `${diffInMinutes} წთ წინ`;
    if (diffInHours < 24) return `${diffInHours} სთ წინ`;
    return `${Math.floor(diffInHours / 24)} დღე წინ`;
  };

  const nearbyCounts = useMemo(() => ({ parts: 5, tow: 3, mechanic: 4 }), []);
  const priceRanges = useMemo(() => ({ parts: '₾50–₾120', tow: '₾60–₾90', mechanic: '₾80–₾200' }), []);

  const goToChat = () => {
    router.push('/ai-chat');
  };

  const goToMyOffers = async () => {
    // გახსნის AI ჩატს პირდაპირ შეთავაზებების ხედით ბოლო requestId-ზე
    try {
      const rid = await AsyncStorage.getItem('ai_last_request_id');
      const fallback = requests?.[0]?.id as string | undefined;
      const target = rid || fallback;
      if (target) {
        router.push({ pathname: '/ai-chat', params: { resumeOffers: '1', requestId: String(target) } } as any);
      } else {
        // თუ ვერ ვპოულობთ ბოლო მოთხოვნას, უბრალოდ გახსენი ჩატი საწყისი ფლოუთი
        router.push('/ai-chat');
      }
    } catch {
      router.push('/ai-chat');
    }
  };

  const openOffersForRequest = (requestId: string) => {
    router.push({ pathname: '/ai-chat', params: { resumeOffers: '1', requestId } } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          {selectedCar && (
            <View style={styles.carBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.carThumbWrap}>
                  <Image source={{ uri: selectedCar.imageUri }} style={styles.carThumb} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.carTitle}>{selectedCar.make} {selectedCar.model}</Text>
                  <Text style={styles.carMeta}>{selectedCar.year} • {selectedCar.plateNumber}</Text>
                </View>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/garage')} style={styles.carChangeBtn} android_ripple={{ color: '#00000010' }}>
                <Text style={styles.carChangeText}>შეცვლა</Text>
              </Pressable>
            </View>
          )}

          {lastDraft && (
            <Pressable onPress={() => router.push({ pathname: '/ai-chat', params: { resume: '1' } } as any)} style={styles.resumeCard} android_ripple={{ color: '#00000010' }}>
              <View style={styles.resumeBadge}>
                <View style={[styles.resumeDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.resumeBadgeText}>გაგრძელება • საფეხური {lastDraft.step + 1}/3</Text>
              </View>
              <Text style={styles.resumeTitle}>ბოლო მოთხოვნა ({titleBy(lastDraft.mode)})</Text>
              <Text style={styles.resumeDesc} numberOfLines={2}>{lastDraft.summary}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={styles.resumeCta}><Text style={styles.resumeCtaText}>გაგრძელება</Text><FontAwesome name="chevron-right" size={12} color="#9CA3AF" /></View>
                <Pressable onPress={goToMyOffers} style={[styles.cardCta, { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#111827' }]}> 
                  <Text style={{ color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 }}>ჩემი შეთავაზებები</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        <View style={styles.heroCard}>
          <ImageBackground source={require('@/assets/images/car-bg.png')} style={styles.heroBg} imageStyle={styles.heroBgImage}>
            <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.25)"]} style={styles.heroGradient}>
              <Text style={styles.heroTitle}>AI ასისტენტი</Text>
              <Text style={styles.heroSubtitle}>მოთხოვნის შექმნა • შეთავაზებები • ჩატი</Text>
              <RNView style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="ახალი მოთხოვნა" rightIcon="chevron-right" onPress={goToChat} variant="outline" size="sm" style={styles.heroButtonSm} />
                <Button title="ჩემი შეთავაზებები" rightIcon="chevron-right" onPress={goToMyOffers} variant="black" size="sm" style={styles.heroButtonSm} />
              </RNView>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.grid}>
          <ActionCard
            icon="cogs"
            title="ნაწილების ძებნა"
            desc="იპოვე ნაწილი ახლოს/ონლაინ"
            badge={`ახლოს: ${nearbyCounts.parts}`}
            price={priceRanges.parts}
            onPress={goToChat}
          />
          <ActionCard
            icon="truck"
            title="ევაკუატორი"
            desc="უახლოესი მძღოლი ETA-ით"
            badge={`ონლაინ: ${nearbyCounts.tow}`}
            price={priceRanges.tow}
            onPress={goToChat}
          />
          <ActionCard
            icon="wrench"
            title="ხელოსანი"
            desc="სანდო სპეციალისტები"
            badge={`ახლოს: ${nearbyCounts.mechanic}`}
            price={priceRanges.mechanic}
            onPress={goToChat}
          />
        </View>

        {/* Recent Requests from backend */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ჩემი მოთხოვნილი ნაწილები</Text>
          <Pressable onPress={() => router.push('/all-requests')} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>ყველა</Text>
            <FontAwesome name="chevron-right" size={12} color="#6B7280" />
          </Pressable>
        </View>
        
        {/* Mock data for recent requests */}
        <RNView style={{ gap: 12 }}>
          {loading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : requests.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome name="search" size={24} color="#6B7280" />
              <Text style={styles.emptyTitle}>მოთხოვნები არ მოიძებნა</Text>
              <Text style={styles.emptyDesc}>გახსენით ახალი მოთხოვნა ან გამოიყენეთ ნაწილების ძებნა</Text>
            </View>
          ) : (
            requests.map((r) => (
              <RNView key={r.id} style={styles.reqCard}>
                <RNView style={styles.reqCardHeader}>
                  <RNView style={styles.reqCardIcon}>
                    <FontAwesome name="search" size={14} color="#6B7280" />
                  </RNView>
                  <RNView style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.reqTitle} numberOfLines={1}>
                      {r.partName}
                    </Text>
                    <Text style={styles.reqMeta} numberOfLines={1}>
                      {r.vehicle.make} {r.vehicle.model} • {r.vehicle.year}
                    </Text>
                  </RNView>
                  <RNView style={styles.reqStatusBadge}>
                    <FontAwesome name="clock-o" size={10} color="#6B7280" />
                    <Text style={styles.reqStatusText}>{r.status}</Text>
                  </RNView>
                </RNView>
                <RNView style={styles.reqCardFooter}>
                  <RNView style={styles.reqCardStats}>
                    <RNView style={styles.reqStatItem}>
                      <FontAwesome name="tag" size={10} color="#6B7280" />
                      <Text style={styles.reqStatText}>{r.offers} შეთავაზება</Text>
                    </RNView>
                    <RNView style={styles.reqStatItem}>
                      <FontAwesome name="clock-o" size={10} color="#6B7280" />
                      <Text style={styles.reqStatText}>{formatTimeAgo(r.createdAt)}</Text>
                    </RNView>
                  </RNView>
                  <Pressable onPress={() => openOffersForRequest(r.id)} style={styles.reqBtn} android_ripple={{ color: '#00000010' }}>
                    <Text style={styles.reqBtnText}>მოძიებული ნაწილები</Text>
                    <FontAwesome name="chevron-right" size={10} color="#FFFFFF" />
                  </Pressable>
                </RNView>
              </RNView>
            ))
          )}
        </RNView>

        <View style={styles.toggleCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={styles.toggleIcon}><FontAwesome name="map-marker" size={14} color="#6B7280" /></View>
            <Text style={styles.toggleTitle}>ლოკაციის დამახსოვრება</Text>
          </View>
          <Switch
            value={rememberLocation}
            onValueChange={async (val) => {
              setRememberLocation(val);
              try { await AsyncStorage.setItem('remember_location', val ? '1' : '0'); } catch {}
            }}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function titleBy(mode: 'parts' | 'tow' | 'mechanic'): string {
  switch (mode) {
    case 'parts':
      return 'ნაწილების AI მოძიება';
    case 'tow':
      return 'ევაკუატორის გამოძახება';
    case 'mechanic':
      return 'ხელოსნის სერვისი';
  }
}

function ActionCard({ icon, title, desc, badge, price, onPress }: { icon: React.ComponentProps<typeof FontAwesome>['name']; title: string; desc: string; badge?: string; price?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]} android_ripple={{ color: '#00000010' }}>
      <View style={styles.cardIcon}><FontAwesome name={icon} size={18} color="#111827" /></View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
      {(badge || price) && (
        <RNView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {badge ? <Text style={styles.cardBadge}>{badge}</Text> : <View />}
          {price ? <Text style={styles.cardPrice}>{price}</Text> : null}
        </RNView>
      )}
      <View style={styles.cardCta}><Text style={styles.cardCtaText}>გადასვლა</Text><FontAwesome name="chevron-right" size={12} color="#9CA3AF" /></View>
    </Pressable>
  );
}

function SmallCard({ icon, label, onPress }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.smallCard} android_ripple={{ color: '#00000010' }}>
      <FontAwesome name={icon} size={13} color="#6B7280" />
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 32, gap: 18 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroBg: { width: '100%' },
  heroBgImage: { width: '100%', height: 160, resizeMode: 'cover' },
  heroGradient: {
    padding: 18,
    gap: 10,
  },
  heroBadge: { display: 'none' },
  heroTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 20, color: '#FFFFFF' },
  heroSubtitle: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#E5E7EB' },
  heroButton: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 12 },
  heroButtonSm: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  cardDesc: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  cardBadge: { fontFamily: 'NotoSans_600SemiBold', fontSize: 11, color: '#10B981', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  cardPrice: { fontFamily: 'NotoSans_700Bold', fontSize: 12, color: '#111827' },
  cardCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCtaText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#6B7280' },

  subGrid: { flexDirection: 'row', gap: 10 },
  sectionHeader: { marginTop: 6, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  reqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  reqCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reqCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  reqMeta: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  reqStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reqStatusText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 11, color: '#10B981' },
  reqCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqCardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  reqStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqStatText: { fontFamily: 'NotoSans_500Medium', fontSize: 11, color: '#6B7280' },
  reqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  reqBtnText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  emptyCard: { alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  emptyTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  emptyDesc: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  smallCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  smallText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827' },
  carBanner: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EEF2F7', padding: 14, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  carThumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  carThumb: { width: '100%', height: '100%' },
  carTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  carMeta: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  carChangeBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  carChangeText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827' },
  resumeCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EEF2F7', padding: 14, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  resumeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resumeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  resumeBadgeText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 11, color: '#6B7280' },
  resumeTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  resumeDesc: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  resumeCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resumeCtaText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#6B7280' },
  toggleCard: { marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EEF2F7', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  toggleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  toggleTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#111827' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#6B7280' },
});


