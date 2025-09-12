import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View as RNView, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { registerPushToken } from '@/utils/notifications';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { subscribe, publish, OfferEvent } from '@/utils/OfferBus';
import Constants from 'expo-constants';

function resolveApiBase(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  // Try to infer host (works in Expo Go/dev client)
  const hostUri = (Constants as any).expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host && /\d+\.\d+\.\d+\.\d+/.test(host)) {
      return `http://${host}:4000`;
    }
  }
  return 'http://localhost:4000';
}

const API_URL = resolveApiBase();

export default function PartnerSimpleFeed() {
  const router = useRouter();
  const { requests, getActiveRequests, searchRequests, postOffer, getOffersForRequest } = useMarketplace();
  const PARTNER_ID = 'partner-demo-1';
  
  const [search, setSearch] = useState('');
  const [composeFor, setComposeFor] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [myOffers, setMyOffers] = useState<Record<string, any>>({});
  const [myOfferIds, setMyOfferIds] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [unreadByOffer, setUnreadByOffer] = useState<Record<string, number>>({});
  const [filterBy, setFilterBy] = useState<'all' | 'urgent' | 'recent'>('all');
  const [remoteRequests, setRemoteRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Poll backend for open requests
  useEffect(() => {
    console.log('[PARTNER] Using API_URL =', API_URL);
    // Register push token for partner role on partner inbox
    (async () => {
      try {
        await registerPushToken({ backendUrl: API_URL, role: 'partner', partnerId: PARTNER_ID });
      } catch {}
    })();
    let cancelled = false;
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/requests`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setRemoteRequests(data);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    const iv = setInterval(fetchRequests, 4000);
    fetchRequests();
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  // Poll backend for my offers
  useEffect(() => {
    let cancelled = false;
    const loadMyOffers = async () => {
      try {
        const url = `${API_URL}/offers?partnerId=${encodeURIComponent(PARTNER_ID)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          const ids: Record<string, string> = {};
          const byReq: Record<string, { priceGEL: number; etaMin: number }> = {};
          for (const o of data) {
            ids[String(o.requestId)] = String(o.id);
            byReq[String(o.requestId)] = { priceGEL: Number(o.priceGEL || 0), etaMin: Number(o.etaMin || 0) };
          }
          setMyOfferIds(ids);
          setMyOffers(byReq);
        }
      } catch {}
    };
    const iv = setInterval(loadMyOffers, 4000);
    loadMyOffers();
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  // Get active requests and filter them
  const activeRequests = useMemo(() => {
    const source = remoteRequests.length > 0 ? remoteRequests : (search.trim() ? searchRequests(search) : getActiveRequests());
    let filtered = source;
    if (search.trim() && remoteRequests.length > 0) {
      const q = search.toLowerCase();
      filtered = remoteRequests.filter((r: any) => {
        const v = `${r.partName || ''} ${r.brand || ''} ${r.vehicle?.make || ''} ${r.vehicle?.model || ''}`.toLowerCase();
        return v.includes(q);
      });
    }
    
    if (filterBy === 'urgent') {
      filtered = filtered.filter((r: any) => r.urgency === 'high');
    } else if (filterBy === 'recent') {
      filtered = filtered.filter((r: any) => Date.now() - r.createdAt < 1000 * 60 * 30); // Last 30 minutes
    }
    
    return filtered.sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [requests, remoteRequests, search, filterBy]);

  // Listen for acceptance events from user side
  useEffect(() => {
    const unsub = subscribe((e: OfferEvent) => {
      if (e.type === 'ACCEPTED') {
        setAccepted((prev) => ({ ...prev, [e.payload.offerId]: true }));
      }
      if (e.type === 'MESSAGE') {
        if (e.payload.message.author === 'user') {
          const oid = e.payload.message.offerId;
          setUnreadByOffer((prev) => ({ ...prev, [oid]: (prev[oid] || 0) + 1 }));
        }
      }
    });
    return () => unsub();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/requests`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRemoteRequests(data);
      }
    } catch {}
    setRefreshing(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'საგანგებო';
      case 'medium': return 'საშუალო';
      case 'low': return 'დაბალი';
      default: return 'უცნობი';
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'ახლა';
    if (minutes < 60) return `${minutes} წთ წინ`;
    if (hours < 24) return `${hours} სთ წინ`;
    if (days < 7) return `${days} დღე წინ`;
    return `${Math.floor(days / 7)} კვირა წინ`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <FontAwesome name="chevron-left" size={16} color="#111827" />
            </Pressable>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>მაღაზიის ინბოქსი</Text>
              <Text style={styles.headerSubtitle}>{activeRequests.length} მოთხოვნა</Text>
            </View>
            <View style={styles.headerStats}>
              <Text style={styles.headerStatsText}>{activeRequests.length}</Text>
            </View>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <FontAwesome name="search" size={16} color="#6B7280" />
              <TextInput
                placeholder="ძებნა: ნაწილი, ბრენდი, მანქანა"
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
            
            <View style={styles.filterContainer}>
              {[
                { key: 'all', label: 'ყველა', icon: 'list' },
                { key: 'urgent', label: 'საგანგებო', icon: 'exclamation-triangle' },
                { key: 'recent', label: 'ახალი', icon: 'clock-o' }
              ].map((filter) => (
                <Pressable
                  key={filter.key}
                  style={[styles.filterTab, filterBy === filter.key && styles.filterTabActive]}
                  onPress={() => setFilterBy(filter.key as any)}
                >
                  <FontAwesome 
                    name={filter.icon as any} 
                    size={12} 
                    color={filterBy === filter.key ? '#FFFFFF' : '#111827'} 
                  />
                  <Text style={[styles.filterTabText, filterBy === filter.key && styles.filterTabTextActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Requests List */}
          <ScrollView 
            contentContainerStyle={styles.list} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#111827']}
                tintColor="#111827"
              />
            }
          >
            {activeRequests.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {r.partName}{r.brand ? ` (${r.brand})` : ''}
                  </Text>
                  <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(r.urgency || 'medium') + '20' }]}>
                    <Text style={[styles.urgencyText, { color: getUrgencyColor(r.urgency || 'medium') }]}>
                      {getUrgencyText(r.urgency || 'medium')}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.meta} numberOfLines={1}>
                  {r.vehicle.make} {r.vehicle.model} • {r.vehicle.year}
                </Text>
                
                {r.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {r.description}
                  </Text>
                )}
                

                
                <View style={styles.actions}>
                  {myOffers[r.id] ? (
                    <>
                      <Text style={styles.myOfferText}>
                        უკვე შეთავაზებული ფასი: ₾{myOffers[r.id].priceGEL}
                      </Text>
                      <Pressable 
                        style={[styles.primaryBtn, { flex: 0, paddingHorizontal: 20 }]} 
                        onPress={async () => {
                          let offerId = myOfferIds[r.id];
                          if (!offerId) {
                            // სცადე სერვერიდან ამ მოთხოვნაზე ჩვენი პირველი შეთავაზების პოვნა
                            try {
                              const res = await fetch(`${API_URL}/offers?requestId=${encodeURIComponent(r.id)}`);
                              const data = await res.json();
                              const mine = Array.isArray(data) ? data.find((o: any) => o.partnerId === 'partner-demo-1') || data[0] : null;
                              if (mine?.id) {
                                offerId = String(mine.id);
                                setMyOfferIds((prev) => ({ ...prev, [r.id]: offerId! }));
                              }
                            } catch {}
                          }
                          if (!offerId) return;
                          const payload = {
                            id: offerId,
                            providerName: 'თქვენი მაღაზია',
                            priceGEL: myOffers[r.id].priceGEL,
                            etaMin: myOffers[r.id].etaMin,
                            distanceKm: r.distanceKm ?? null,
                          };
                          (router as any).push({
                            pathname: `/chat/${offerId}`,
                            params: {
                              role: 'partner',
                              offer: JSON.stringify(payload),
                              summary: `${r.vehicle.make} ${r.vehicle.model} • ${r.vehicle.year} • ${r.partName}${r.brand ? ` (${r.brand})` : ''}`,
                            },
                          });
                          setUnreadByOffer((prev) => ({ ...prev, [offerId!]: 0 }));
                        }}
                      >
                        <Text style={styles.primaryText}>ჩატი</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable 
                      style={styles.primaryBtn} 
                      onPress={() => { 
                        setComposeFor(r); 
                        setPrice(''); 
                        setMessage('');
                      }}
                    >
                      <Text style={styles.primaryText}>მიწერე ფასი</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
            
            {activeRequests.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <FontAwesome name="inbox" size={48} color="#111827" />
                </View>
                <Text style={styles.emptyTitle}>
                  {search.trim() ? 'ვერ მოიძებნა' : 'მოთხოვნები არ არის'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {search.trim() ? 'ცადე სხვა სიტყვებით' : 'ახალი მოთხოვნები აქ გამოჩნდება'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Simplified Offer Modal */}
          {composeFor && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>შეთავაზება</Text>
                  <Pressable onPress={() => setComposeFor(null)} style={styles.closeBtn}>
                    <FontAwesome name="times" size={16} color="#6B7280" />
                  </Pressable>
                </View>
                
                <View style={styles.modalContent}>
                  <Text style={styles.modalLabel}>ფასი ₾</Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="შეიყვანეთ ფასი"
                    placeholderTextColor="#9CA3AF"
                    value={price}
                    onChangeText={setPrice}
                    style={styles.input}
                  />
                  
                  <Text style={styles.modalLabel}>შეტყობინება (არასავალდებულო)</Text>
                  <TextInput
                    placeholder="დამატებითი ინფორმაცია მომხმარებელს..."
                    placeholderTextColor="#9CA3AF"
                    value={message}
                    onChangeText={setMessage}
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.modalActions}>
                  <Pressable style={styles.secondaryBtn} onPress={() => setComposeFor(null)}>
                    <Text style={styles.secondaryText}>გაუქმება</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, (!price) && styles.primaryBtnDisabled]}
                    disabled={!price}
                    onPress={async () => {
                      const offerId = `p-${Date.now()}`;
                      setMyOffers((prev) => ({ 
                        ...prev, 
                        [composeFor.id]: { 
                          priceGEL: Number(price), 
                          etaMin: 30 // Default 30 minutes
                        } 
                      }));
                      
                      try {
                        const res = await fetch(`${API_URL}/offers`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            requestId: composeFor.id,
                            partnerId: 'partner-demo-1',
                            providerName: 'თქვენი მაღაზია',
                            priceGEL: Number(price),
                            etaMin: 30,
                          }),
                        });
                        const saved = await res.json();
                        const newId = saved?.id || offerId;
                        setMyOfferIds((prev) => ({ ...prev, [composeFor.id]: newId }));
                        
                        // Send message if provided
                        if (message.trim()) {
                          try {
                            await fetch(`${API_URL}/messages`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                offerId: newId,
                                author: 'partner',
                                text: message.trim(),
                              }),
                            });
                          } catch {}
                        }
                        
                        // Navigate to chat immediately
                        const payload = {
                          id: newId,
                          providerName: 'თქვენი მაღაზია',
                          priceGEL: Number(price),
                          etaMin: 30,
                        };
                        (router as any).push({
                          pathname: `/chat/${newId}`,
                          params: {
                            role: 'partner',
                            offer: JSON.stringify(payload),
                            summary: `${composeFor.vehicle.make} ${composeFor.vehicle.model} • ${composeFor.vehicle.year} • ${composeFor.partName}${composeFor.brand ? ` (${composeFor.brand})` : ''}`,
                          },
                        });
                      } catch {
                        setMyOfferIds((prev) => ({ ...prev, [composeFor.id]: offerId }));
                      }
                      
                      setComposeFor(null);
                      setPrice('');
                      setMessage('');
                    }}
                  >
                    <Text style={styles.primaryText}>გაგზავნა და ჩატი</Text>
                    <FontAwesome name="chevron-right" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#717171',
  },
  headerStats: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerStatsText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  searchRow: {
    padding: 20,
    paddingTop: 16,
    gap: 16,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  filterTabActive: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
    color: '#717171',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 12, flex: 1 },
  urgencyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  urgencyText: { fontFamily: 'NotoSans_700Bold', fontSize: 10 },
  meta: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 11 },
  description: { color: '#6B7280', fontFamily: 'NotoSans_400Regular', fontSize: 11, fontStyle: 'italic' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  myOfferInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myOfferText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
    color: '#111827',
  },
  chatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chatBadgeText: {
    color: '#1D4ED8',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 12,
  },
  primaryBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryText: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#FFFFFF' },
  secondaryBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  secondaryText: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#111827' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 15,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 18,
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    gap: 16,
  },
  modalLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#111827',
  },
  input: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    color: '#111827',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 15,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});


