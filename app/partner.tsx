import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { registerPushToken } from '@/utils/notifications';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { subscribe, publish, OfferEvent } from '@/utils/OfferBus';

const API_URL = 'http://localhost:4000';

export default function PartnerSimpleFeed() {
  const router = useRouter();
  const { requests, getActiveRequests, searchRequests, postOffer, getOffersForRequest } = useMarketplace();
  const PARTNER_ID = 'partner-demo-1';
  
  const [tab, setTab] = useState<'inbox' | 'mine'>('inbox');
  const [search, setSearch] = useState('');
  const [composeFor, setComposeFor] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [eta, setEta] = useState('');
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('');
  const [isOriginal, setIsOriginal] = useState(false);
  const [myOffers, setMyOffers] = useState<Record<string, any>>({});
  const [myOfferIds, setMyOfferIds] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [chatFor, setChatFor] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; offerId: string; author: 'user' | 'partner'; text: string; createdAt: number }>>([]);
  const [reply, setReply] = useState('');
  const [unreadByOffer, setUnreadByOffer] = useState<Record<string, number>>({});
  const [filterBy, setFilterBy] = useState<'all' | 'urgent' | 'recent'>('all');
  const [remoteRequests, setRemoteRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const unreadTotal = useMemo(() => Object.values(unreadByOffer).reduce((a, b) => a + (b || 0), 0), [unreadByOffer]);

  // Poll backend for open requests
  useEffect(() => {
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

  // Poll backend for my offers so that "ჩემი" ტაბი აღდგეს რესტარტის შემდეგაც
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
        setChatFor(e.payload.offerId);
      }
      if (e.type === 'MESSAGE') {
        setMessages((prev) => [...prev, e.payload.message]);
        if (e.payload.message.author === 'user') {
          const oid = e.payload.message.offerId;
          setUnreadByOffer((prev) => ({ ...prev, [oid]: oid === chatFor ? 0 : ((prev[oid] || 0) + 1) }));
        }
      }
    });
    return () => unsub();
  }, []);

  // Poll backend messages when a chat is opened
  useEffect(() => {
    if (!chatFor) return;
    let cancelled = false;
    const load = async () => {
      try {
        const url = `${API_URL}/messages?offerId=${encodeURIComponent(chatFor)}`;
        console.log('[PARTNER] chatFor=', chatFor);
        console.log('[PARTNER] GET', url);
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          const mapped = data.map((m: any) => ({
            id: String(m.id),
            offerId: String(m.offerId),
            author: (m.author === 'partner' ? 'partner' : 'user') as 'partner' | 'user',
            text: String(m.text || ''),
            createdAt: Number(m.createdAt || Date.now()),
          }));
          console.log('[PARTNER] messages len=', mapped.length);
          setMessages(mapped);
        }
      } catch {}
    };
    const iv = setInterval(load, 1500);
    load();
    return () => { cancelled = true; clearInterval(iv); };
  }, [chatFor]);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <FontAwesome name="chevron-left" size={16} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>მაღაზიის ინბოქსი</Text>
          <RNView style={{ width: 36 }} />
        </View>

        <RNView style={styles.searchRow}>
          <RNView style={styles.searchInputWrap}>
            <FontAwesome name="search" size={14} color="#6B7280" />
            <TextInput
              placeholder="ძებნა: ნაწილი, ბრენდი, მანქანა"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </RNView>
          
          <RNView style={styles.filterRow}>
            <RNView style={styles.segment}>
              <Pressable style={[styles.segBtn, tab === 'inbox' && styles.segBtnActive]} onPress={() => setTab('inbox')}>
                <Text style={[styles.segText, tab === 'inbox' && styles.segTextActive]}>ინბოქსი</Text>
              </Pressable>
              <Pressable style={[styles.segBtn, tab === 'mine' && styles.segBtnActive]} onPress={() => setTab('mine')}>
                <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.segText, tab === 'mine' && styles.segTextActive]}>ჩემი</Text>
                  {unreadTotal > 0 && (
                    <RNView style={styles.notifDot}><Text style={styles.notifText}>{unreadTotal}</Text></RNView>
                  )}
                </RNView>
              </Pressable>
            </RNView>
            
            {tab === 'inbox' && (
              <RNView style={styles.filterSegment}>
                <Pressable style={[styles.filterBtn, filterBy === 'all' && styles.filterBtnActive]} onPress={() => setFilterBy('all')}>
                  <Text style={[styles.filterText, filterBy === 'all' && styles.filterTextActive]}>ყველა</Text>
                </Pressable>
                <Pressable style={[styles.filterBtn, filterBy === 'urgent' && styles.filterBtnActive]} onPress={() => setFilterBy('urgent')}>
                  <Text style={[styles.filterText, filterBy === 'urgent' && styles.filterTextActive]}>საგანგებო</Text>
                </Pressable>
                <Pressable style={[styles.filterBtn, filterBy === 'recent' && styles.filterBtnActive]} onPress={() => setFilterBy('recent')}>
                  <Text style={[styles.filterText, filterBy === 'recent' && styles.filterTextActive]}>ახალი</Text>
                </Pressable>
              </RNView>
            )}
          </RNView>
        </RNView>

        {tab === 'inbox' ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {activeRequests.map((r) => (
              <View key={r.id} style={styles.card}>
                <RNView style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {r.partName}{r.brand ? ` (${r.brand})` : ''}
                  </Text>
                  <RNView style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(r.urgency || 'medium') + '20' }]}>
                    <Text style={[styles.urgencyText, { color: getUrgencyColor(r.urgency || 'medium') }]}>
                      {getUrgencyText(r.urgency || 'medium')}
                    </Text>
                  </RNView>
                </RNView>
                
                <Text style={styles.meta} numberOfLines={1}>
                  {r.vehicle.make} {r.vehicle.model} • {r.vehicle.year}
                </Text>
                
                {r.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {r.description}
                  </Text>
                )}
                
                <RNView style={styles.rowBetween}>
                  <Text style={styles.meta}>ბიუჯეტი: {r.budgetGEL ? `₾${r.budgetGEL}` : '-'}</Text>
                  <Text style={styles.meta}>დისტ.: {r.distanceKm?.toFixed(1) ?? '-'}კმ</Text>
                </RNView>
                
                <RNView style={styles.actions}>
                  <Pressable style={styles.secondaryBtn}>
                    <Text style={styles.secondaryText}>ნახვა</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.primaryBtn} 
                    onPress={() => { 
                      setComposeFor(r); 
                      setPrice(''); 
                      setEta(''); 
                      setNotes('');
                      setWarranty('');
                      setIsOriginal(false);
                    }}
                  >
                    <Text style={styles.primaryText}>შეთავაზება</Text>
                  </Pressable>
                </RNView>
              </View>
            ))}
            
            {activeRequests.length === 0 && (
              <View style={styles.emptyCard}>
                <FontAwesome name="inbox" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>
                  {search.trim() ? 'ვერ მოიძებნა' : 'მოთხოვნები არ არის'}
                </Text>
                <Text style={styles.emptyDesc}>
                  {search.trim() ? 'ცადე სხვა სიტყვებით' : 'ახალი მოთხოვნები აქ გამოჩნდება'}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {Object.keys(myOffers).length === 0 && (
              <View style={styles.emptyCard}>
                <FontAwesome name="handshake-o" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>ჯერ არ გაქვს შეთავაზებები</Text>
                <Text style={styles.emptyDesc}>აირჩიე მოთხოვნა და შესთავაზე ფასი/ETA</Text>
              </View>
            )}
            
            {activeRequests.filter((r) => myOffers[r.id]).map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {r.partName}{r.brand ? ` (${r.brand})` : ''}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {r.vehicle.make} {r.vehicle.model} • {r.vehicle.year}
                </Text>
                <RNView style={styles.rowBetween}>
                  <Text style={styles.meta}>ჩემი: ₾{myOffers[r.id].priceGEL} • {myOffers[r.id].etaMin}წთ</Text>
                  <Text style={styles.meta}>ბიუჯეტი: {r.budgetGEL ? `₾${r.budgetGEL}` : '-'}</Text>
                </RNView>
                
                {(unreadByOffer[myOfferIds[r.id]] || 0) > 0 && (
                  <RNView style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>ახალი {unreadByOffer[myOfferIds[r.id]]}</Text>
                  </RNView>
                )}
                
                {acceptedOfferFor(r.id, accepted, myOfferIds) ? (
                  <RNView style={styles.acceptedPill}>
                    <Text style={styles.acceptedText}>მიიღეს შეკვეთა</Text>
                  </RNView>
                ) : (
                  <RNView style={styles.actions}>
                    <Pressable style={styles.secondaryBtn} onPress={() => setComposeFor(r)}>
                      <Text style={styles.secondaryText}>რედაქტირება</Text>
                    </Pressable>
                    <Pressable
                      style={styles.primaryBtn}
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
                  </RNView>
                )}
                
                {acceptedOfferFor(r.id, accepted, myOfferIds) && (
                  <RNView style={{ marginTop: 6, gap: 4 }}>
                    <Text style={styles.meta}>
                      სტატუსი: დადასტურებულია • მოსვლის დრო: {myOffers[r.id].etaMin}წთ
                    </Text>
                    <Text style={styles.meta}>
                      ინსტრუქცია: ადგილზე გამოუტანეთ ნაწილი ან დაუკავშირდით დროზე დასაზუსტებლად.
                    </Text>
                  </RNView>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {composeFor && (
          <RNView style={styles.modalOverlay}>
            <RNView style={styles.modalCard}>
              <Text style={styles.modalTitle}>შეთავაზება ({composeFor.partName})</Text>
              
              <Text style={styles.modalLabel}>ფასი ₾</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="ფასი ₾"
                placeholderTextColor="#9CA3AF"
                value={price}
                onChangeText={setPrice}
                style={styles.input}
              />
              
              <Text style={styles.modalLabel}>ETA წუთებში</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="ETA წუთებში"
                placeholderTextColor="#9CA3AF"
                value={eta}
                onChangeText={setEta}
                style={styles.input}
              />
              
              <Text style={styles.modalLabel}>შენიშვნა (არასავალდებულო)</Text>
              <TextInput
                placeholder="დამატებითი ინფორმაცია"
                placeholderTextColor="#9CA3AF"
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, { height: 60 }]}
                multiline
              />
              
              <Text style={styles.modalLabel}>გარანტია (არასავალდებულო)</Text>
              <TextInput
                placeholder="მაგ. 6 თვე"
                placeholderTextColor="#9CA3AF"
                value={warranty}
                onChangeText={setWarranty}
                style={styles.input}
              />
              
              <Pressable 
                style={[styles.checkboxRow, isOriginal && styles.checkboxActive]} 
                onPress={() => setIsOriginal(!isOriginal)}
              >
                <RNView style={[styles.checkbox, isOriginal && styles.checkboxChecked]}>
                  {isOriginal && <FontAwesome name="check" size={12} color="#FFFFFF" />}
                </RNView>
                <Text style={styles.checkboxText}>ორიგინალი ნაწილი</Text>
              </Pressable>
              
              <RNView style={styles.modalActions}>
                <Pressable style={styles.secondaryBtn} onPress={() => setComposeFor(null)}>
                  <Text style={styles.secondaryText}>გაუქმება</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryBtn, (!price || !eta) && { opacity: 0.6 }]}
                  disabled={!price || !eta}
                  onPress={async () => {
                    const offerId = `p-${Date.now()}`;
                    setMyOffers((prev) => ({ 
                      ...prev, 
                      [composeFor.id]: { 
                        priceGEL: Number(price), 
                        etaMin: Number(eta) 
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
                          etaMin: Number(eta),
                        }),
                      });
                      const saved = await res.json();
                      const newId = saved?.id || offerId;
                      setMyOfferIds((prev) => ({ ...prev, [composeFor.id]: newId }));
                    } catch {
                      setMyOfferIds((prev) => ({ ...prev, [composeFor.id]: offerId }));
                    }
                    
                    setComposeFor(null);
                    setPrice('');
                    setEta('');
                    setNotes('');
                    setWarranty('');
                    setIsOriginal(false);
                  }}
                >
                  <Text style={styles.primaryText}>გაგზავნა</Text>
                </Pressable>
              </RNView>
            </RNView>
          </RNView>
        )}

        {/* Chat Modal */}
        {chatFor && (
          <RNView style={styles.modalOverlay}>
            <RNView style={[styles.modalCard, { maxHeight: '70%' }]}>
              <Text style={styles.modalTitle}>კომუნიკაცია</Text>
              <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 8 }}>
                {messages.filter((m) => m.offerId === chatFor).map((m) => (
                  <RNView key={m.id} style={[styles.chatBubble, m.author === 'user' ? styles.chatUser : styles.chatPartner]}>
                    <Text style={m.author === 'user' ? styles.chatUserText : styles.chatPartnerText}>{m.text}</Text>
                  </RNView>
                ))}
                {messages.filter((m) => m.offerId === chatFor).length === 0 && (
                  <Text style={styles.meta}>მესიჯები ჯერ არაა. უპასუხე მომხმარებელს.</Text>
                )}
              </ScrollView>
              <RNView style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput
                  placeholder="პასუხი..."
                  placeholderTextColor="#9CA3AF"
                  value={reply}
                  onChangeText={setReply}
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                />
                <Pressable
                  style={[styles.primaryBtn, { height: 44 }]}
                  onPress={async () => {
                    if (!reply.trim() || !chatFor) return;
                    const text = reply.trim();
                    setReply('');
                    try {
                      const res = await fetch(`${API_URL}/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ offerId: chatFor, author: 'partner', text }),
                      });
                      if (res.ok) {
                        const saved = await res.json();
                        setMessages((prev) => [...prev, saved]);
                        publish({ type: 'MESSAGE', payload: { message: saved } });
                      }
                    } catch {}
                  }}
                >
                  <Text style={styles.primaryText}>გაგზავნა</Text>
                </Pressable>
              </RNView>
              <RNView style={styles.modalActions}>
                <Pressable style={styles.secondaryBtn} onPress={() => setChatFor(null)}>
                  <Text style={styles.secondaryText}>დახურვა</Text>
                </Pressable>
              </RNView>
            </RNView>
          </RNView>
        )}
      </View>
    </SafeAreaView>
  );
}

function acceptedOfferFor(reqId: string, acceptedMap: Record<string, boolean>, myOfferIds: Record<string, string>): boolean {
  const offerId = myOfferIds[reqId];
  return Boolean(offerId && acceptedMap[offerId]);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
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
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },

  searchRow: { flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  searchInput: { flex: 1, color: '#111827', fontFamily: 'NotoSans_400Regular' },
  
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segment: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  segBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  segBtnActive: { backgroundColor: '#FFFFFF' },
  segText: { color: '#6B7280', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  segTextActive: { color: '#111827' },
  
  filterSegment: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2 },
  filterBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  filterBtnActive: { backgroundColor: '#FFFFFF' },
  filterText: { color: '#6B7280', fontFamily: 'NotoSans_600SemiBold', fontSize: 11 },
  filterTextActive: { color: '#111827' },

  list: { padding: 14, paddingBottom: 24, gap: 10 },
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
  cardTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 14, flex: 1 },
  urgencyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  urgencyText: { fontFamily: 'NotoSans_700Bold', fontSize: 10 },
  meta: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  description: { color: '#6B7280', fontFamily: 'NotoSans_400Regular', fontSize: 12, fontStyle: 'italic' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  secondaryBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  secondaryText: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#111827' },
  primaryBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  primaryText: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#FFFFFF' },
  acceptedPill: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5' },
  acceptedText: { color: '#065F46', fontFamily: 'NotoSans_700Bold', fontSize: 12 },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F7', padding: 14 },
  modalTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 15, color: '#111827', marginBottom: 10 },
  modalLabel: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    fontFamily: 'NotoSans_400Regular',
    marginTop: 6,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#111827' },
  checkboxChecked: { backgroundColor: '#111827', borderColor: '#111827' },
  checkboxText: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#111827' },

  emptyCard: { alignItems: 'center', gap: 12, padding: 32, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  emptyTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827' },
  emptyDesc: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280', textAlign: 'center' },
  chatBubble: { padding: 10, borderRadius: 12, borderWidth: 1 },
  chatUser: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderColor: '#EEF2F7' },
  chatPartner: { alignSelf: 'flex-end', backgroundColor: '#111827', borderColor: '#111827' },
  chatUserText: { color: '#111827', fontFamily: 'NotoSans_500Medium', fontSize: 13 },
  chatPartnerText: { color: '#FFFFFF', fontFamily: 'NotoSans_500Medium', fontSize: 13 },
  notifDot: { minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  notifText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 10 },
  chatBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#BFDBFE' },
  chatBadgeText: { color: '#1D4ED8', fontFamily: 'NotoSans_700Bold', fontSize: 11 },
});


