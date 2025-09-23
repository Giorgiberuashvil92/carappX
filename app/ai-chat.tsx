import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from '@/components/Themed';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCars } from '@/contexts/CarContext';
import { useUser } from '@/contexts/UserContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';

type Mode = 'parts' | 'tow' | 'mechanic' | null;

type Message = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  text: string;
};

type Offer = {
  id: string;
  providerName: string;
  rating: number;
  priceGEL: number;
  etaMin: number;
  distanceKm?: number;
  status?: 'new' | 'counter' | 'accepted';
  source: 'ai' | 'partner';
  createdAt?: number;
};

import API_BASE_URL from '../config/api';
const API_URL = API_BASE_URL;
// socket.io-client will be used for realtime offers
let ioRef: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ioRef = require('socket.io-client').io as typeof import('socket.io-client').io;
} catch {}

export default function AIChatScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [form, setForm] = useState<Record<string, any>>({});

  const quickActions = useMemo(() => buildQuickActions(mode), [mode]);
  const [step, setStep] = useState<number>(0);
  const insets = useSafeAreaInsets();
  const { selectedCar } = useCars();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const [showOffers, setShowOffers] = useState<boolean>(false);
  const { offers: ctxOffers, postMessage, acceptOffer } = useMarketplace();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'eta' | 'rating'>('price');
  const [filterBy, setFilterBy] = useState<'all' | 'ai' | 'partner'>('all');
  const [partnerFeedStarted, setPartnerFeedStarted] = useState<boolean>(false);
  const [showMyOfferModal, setShowMyOfferModal] = useState<boolean>(false);
  const [myOfferPrice, setMyOfferPrice] = useState<string>('');
  const [counterFor, setCounterFor] = useState<Offer | null>(null);
  const [counterPrice, setCounterPrice] = useState<string>('');
  const socketRef = useRef<ReturnType<typeof ioRef> | null>(null);

  // Debug: log user from context once available
  useEffect(() => {
    console.log('[AI] UserContext user:', user ? { id: (user as any).id, phone: (user as any).phone, email: (user as any).email } : null);
  }, [user]);

  // Dropdown pickers (modal-based) for parts flow
  const [pickerModal, setPickerModal] = useState<null | 'make' | 'model' | 'year' | 'yearFrom' | 'yearTo' | 'brand'>(null);
  const [pickerSearch, setPickerSearch] = useState<string>('');

  // In-memory catalogs (can be replaced with API-backed lists later)
  const popularMakes = ['BMW', 'Mercedes', 'Toyota', 'Audi', 'Volkswagen', 'Honda'];
  const modelsByMake: Record<string, string[]> = {
    BMW: ['320i', '520i', 'X5', 'F30', 'E90'],
    Mercedes: ['C200', 'E220', 'GLC', 'W204', 'W212'],
    Toyota: ['Camry', 'Corolla', 'RAV4', 'Prius'],
    Audi: ['A4', 'A6', 'Q5', 'B8'],
    Volkswagen: ['Golf', 'Passat', 'Tiguan'],
    Honda: ['Civic', 'Accord', 'CR-V'],
  };
  const brands = ['Bosch', 'ATE', 'Febi', 'Mahle', 'NGK', 'Sachs'];

  const [offerDetails, setOfferDetails] = useState<Offer | null>(null);

  const displayOffers = useMemo(() => {
    return sortOffers(offers, sortBy).filter((o) => (filterBy === 'all' ? true : o.source === filterBy));
  }, [offers, sortBy, filterBy]);

  function getInitials(name: string): string {
    const parts = String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  }

  function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'ახლა';
    if (minutes < 60) return `${minutes} წთ`;
    if (hours < 24) return `${hours} სთ`;
    return `${Math.floor(hours / 24)} დღე`;
  }

  useEffect(() => {
    if (selectedCar && mode === null) {
      setForm((prev) => ({
        ...prev,
        car: `${selectedCar.make} ${selectedCar.model} ${selectedCar.year}`,
        vehicle: {
          make: selectedCar.make,
          model: selectedCar.model,
          year: String(selectedCar.year),
          vin: prev?.vehicle?.vin ?? (selectedCar as any)?.vin,
        },
      }));
    }
  }, [selectedCar, mode]);

  useEffect(() => {
    // Auto-resume if requested
    (async () => {
      const resume = (params as any)?.resume;
      const resumeOffers = (params as any)?.resumeOffers;
      const reqIdParam = (params as any)?.requestId as string | undefined;
      if (resume === '1') {
        try {
          const raw = await AsyncStorage.getItem('ai_last_draft');
          const rawData = await AsyncStorage.getItem('ai_draft_data');
          if (raw && rawData) {
            const d = JSON.parse(raw) as { mode: 'parts'|'tow'|'mechanic'; step: number; summary: string };
            const data = JSON.parse(rawData) as { mode: 'parts'|'tow'|'mechanic'; form: Record<string, any> };
            setMode(d.mode);
            setStep(Math.min(2, Math.max(0, d.step)));
            setForm(data.form || {});
            setShowOffers(false);
          }
        } catch {}
      } else if (resumeOffers === '1') {
        try {
          const raw = await AsyncStorage.getItem('ai_last_draft');
          const ridStored = await AsyncStorage.getItem('ai_last_request_id');
          const rid = reqIdParam || ridStored || null;
          if (raw && rid) {
            const d = JSON.parse(raw) as { mode: 'parts'|'tow'|'mechanic'; step: number; summary: string };
            setMode(d.mode);
            setStep(getTotalSteps(d.mode) - 1);
            setRequestId(rid);
            setShowOffers(true);
          }
        } catch {}
      }
    })();
  }, [params?.resume, params?.resumeOffers, params?.requestId]);

  // simulate incoming partner offers when offers view is open
  useEffect(() => {
    if (!showOffers || partnerFeedStarted) return;
    setPartnerFeedStarted(true);
    const t1 = setTimeout(() => {
      setOffers((prev) => [
        { id: `p-${Date.now()}`, providerName: 'Gio Parts', rating: 4.9, priceGEL: 110, etaMin: 40, distanceKm: 2.2, source: 'partner', createdAt: Date.now() },
        ...prev,
      ]);
    }, 1800);
    const t2 = setTimeout(() => {
      setOffers((prev) => [
        { id: `p-${Date.now()+1}`, providerName: 'Tow+ Leo', rating: 4.7, priceGEL: 85, etaMin: 22, distanceKm: 3.1, source: 'partner', createdAt: Date.now() },
        ...prev,
      ]);
    }, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showOffers, partnerFeedStarted]);

  // Sync offers from context
  useEffect(() => {
    setOffers((prev) => {
      const mapped = ctxOffers.map((o) => ({ id: o.id, providerName: o.providerName, rating: o.rating ?? 5, priceGEL: o.priceGEL, etaMin: o.etaMin, distanceKm: o.distanceKm ?? undefined, status: o.status as any, source: 'partner' as const, createdAt: o.createdAt }));
      return mapped;
    });
  }, [ctxOffers]);

  // Realtime offers via socket.io when request is created
  useEffect(() => {
    if (!showOffers || !requestId || !ioRef) return;
    // disconnect previous if any
    try { socketRef.current?.disconnect(); } catch {}
    const url = `${API_URL}/offers`;
    console.log('[SOCKET] connecting to', url, 'for requestId=', requestId, 'userId=', (user?.id as string) || 'demo-user');
    const socket = ioRef(url, {
      transports: ['websocket'],
      extraHeaders: {
        'X-User-ID': (user?.id as string) || 'demo-user',
      },
    });
    socketRef.current = socket;

    socket.on('connect', async () => {
      console.log('[SOCKET] connected', socket.id);
      socket.emit('join_request', { requestId });
      // One-shot seed: pull existing offers once after joining
      try {
        const url = `${API_URL}/offers?requestId=${encodeURIComponent(requestId)}`;
        console.log('[API] one-shot GET', url);
        const res = await fetch(url);
        const data = await res.json();
        const mapped: Offer[] = (Array.isArray(data) ? data : []).map((o: any) => ({
          id: String(o.id),
          providerName: String(o.providerName || 'Partner'),
          rating: Number(o.rating || 5),
          priceGEL: Number(o.priceGEL || 0),
          etaMin: Number(o.etaMin || 0),
          distanceKm: typeof o.distanceKm === 'number' ? o.distanceKm : undefined,
          source: 'partner',
          createdAt: o.createdAt ? Number(o.createdAt) : Date.now(),
        }));
        setOffers(mapped);
      } catch (e) {
        console.log('[API] one-shot GET /offers error', e);
      }
    });

    socket.on('offer:new', (payload: any) => {
      console.log('[SOCKET] offer:new', payload);
      setOffers((prev) => {
        const exists = prev.find((o) => o.id === String(payload?.id));
        const next: Offer = {
          id: String(payload?.id),
          providerName: String(payload?.providerName || 'Partner'),
          rating: Number(payload?.rating || 5),
          priceGEL: Number(payload?.priceGEL || 0),
          etaMin: Number(payload?.etaMin || 0),
          distanceKm: typeof payload?.distanceKm === 'number' ? payload.distanceKm : undefined,
          source: 'partner',
          createdAt: payload?.createdAt ? Number(payload.createdAt) : Date.now(),
        };
        return exists ? prev : [next, ...prev];
      });
    });

    socket.on('offer:update', (payload: any) => {
      console.log('[SOCKET] offer:update', payload);
      setOffers((prev) => prev.map((o) => (o.id === String(payload?.id)
        ? {
            id: String(payload?.id),
            providerName: String(payload?.providerName || o.providerName),
            rating: Number(payload?.rating ?? o.rating),
            priceGEL: Number(payload?.priceGEL ?? o.priceGEL),
            etaMin: Number(payload?.etaMin ?? o.etaMin),
            distanceKm: typeof payload?.distanceKm === 'number' ? payload.distanceKm : o.distanceKm,
            source: 'partner',
            createdAt: o.createdAt,
          }
        : o)));
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] disconnected');
    });

    return () => {
      try {
        console.log('[SOCKET] cleanup disconnect');
        socket.disconnect();
      } catch {}
    };
  }, [showOffers, requestId]);

  const send = (preset?: string) => {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <FontAwesome name="chevron-left" size={16} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{titleByMode(mode)}</Text>
        {mode !== null && (
          <RNView style={styles.stepperWrap}>
            {Array.from({ length: getTotalSteps(mode) }, (_, i) => (
              <RNView key={i} style={[styles.dot, i <= step ? styles.dotActive : undefined]} />
            ))}
          </RNView>
        )}
        <RNView style={{ width: 36 }} />
      </View>

      {mode === null ? (
        <ScrollView contentContainerStyle={styles.modePicker} showsVerticalScrollIndicator={false}>
          <View style={styles.modeHeader}>
            <Text style={styles.modeTitle}>აირჩიე ფუნქცია</Text>
            <Text style={styles.modeSubtitle}>რა გჭირდება დღეს?</Text>
          </View>
          
          <RNView style={styles.modeList}>
            <Pressable onPress={() => onPickMode('parts', setMode, setMessages)} style={styles.modeBtn}>
              <RNView style={styles.modeIcon}>
                <FontAwesome name="cogs" size={18} color="#10B981" />
              </RNView>
              <RNView style={{ flex: 1 }}>
                <Text style={styles.modeName}>ნაწილების AI მოძიება</Text>
                <Text style={styles.modeDesc}>მარკა/მოდელი/წელი და საჭირო ნაწილი</Text>
              </RNView>
              <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
            </Pressable>

            <Pressable onPress={() => onPickMode('tow', setMode, setMessages)} style={styles.modeBtn}>
              <RNView style={styles.modeIcon}>
                <FontAwesome name="truck" size={18} color="#3B82F6" />
              </RNView>
              <RNView style={{ flex: 1 }}>
                <Text style={styles.modeName}>ევაკუატორის გამოძახება</Text>
                <Text style={styles.modeDesc}>მდებარეობა + პრობლემა</Text>
              </RNView>
              <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
            </Pressable>

            <Pressable onPress={() => onPickMode('mechanic', setMode, setMessages)} style={styles.modeBtn}>
              <RNView style={styles.modeIcon}>
                <FontAwesome name="wrench" size={18} color="#EF4444" />
              </RNView>
              <RNView style={{ flex: 1 }}>
                <Text style={styles.modeName}>ხელოსნის სერვისი</Text>
                <Text style={styles.modeDesc}>პრობლემის აღწერა + დრო</Text>
              </RNView>
              <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
            </Pressable>
          </RNView>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.chat} showsVerticalScrollIndicator={false}>
          {showOffers ? (
            <>
              <View style={styles.summaryCardNew}>
                <RNView style={styles.summaryHeader}>
                  <RNView style={styles.summaryIcon}>
                    <FontAwesome name="clipboard" size={16} color="#10B981" />
                  </RNView>
                  <Text style={styles.summaryTitleNew}>შეკვეთის დეტალები</Text>
                  <Pressable style={styles.summaryEditNew} onPress={() => setShowOffers(false)}>
                    <FontAwesome name="edit" size={14} color="#6B7280" />
                  </Pressable>
                </RNView>
                
                <RNView style={styles.summaryContent}>
                  <RNView style={styles.summaryRow}>
                    <RNView style={styles.summaryLabel}>
                      <FontAwesome name="car" size={12} color="#6B7280" />
                      <Text style={styles.summaryLabelText}>მანქანა</Text>
                    </RNView>
                    <Text style={styles.summaryValue}>
                      {form?.vehicle?.make} {form?.vehicle?.model} {form?.vehicle?.year}
                    </Text>
                  </RNView>
                  
                  {form?.partName && (
                    <RNView style={styles.summaryRow}>
                      <RNView style={styles.summaryLabel}>
                        <FontAwesome name="cogs" size={12} color="#6B7280" />
                        <Text style={styles.summaryLabelText}>ნაწილი</Text>
                      </RNView>
                      <Text style={styles.summaryValue}>{form.partName}</Text>
                    </RNView>
                  )}
                  
                  {form?.partDetails && (
                    <RNView style={styles.summaryRow}>
                      <RNView style={styles.summaryLabel}>
                        <FontAwesome name="info-circle" size={12} color="#6B7280" />
                        <Text style={styles.summaryLabelText}>დეტალები</Text>
                      </RNView>
                      <Text style={styles.summaryValue}>{form.partDetails}</Text>
                    </RNView>
                  )}
                  
                  <RNView style={styles.summaryRow}>
                    <RNView style={styles.summaryLabel}>
                      <FontAwesome name="clock-o" size={12} color="#6B7280" />
                      <Text style={styles.summaryLabelText}>პრიორიტეტი</Text>
                    </RNView>
                    <RNView style={styles.urgencyBadgeUrgent}>
                      <Text style={styles.urgencyTextUrgent}>სასწრაფო</Text>
                    </RNView>
                  </RNView>
                </RNView>
              </View>

              <Text style={styles.offersTitle}>შეთავაზებები ({displayOffers.length})</Text>
              <RNView style={[styles.sortRow, { alignItems: 'center' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.sortScrollContent}>
                  <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {(['price','eta','rating'] as const).map((k) => (
                      <Pressable key={k} style={[styles.sortPill, sortBy === k && styles.sortPillActive]} onPress={() => setSortBy(k)}>
                        <RNView style={styles.chipContent}>
                          <FontAwesome name={k === 'price' ? 'tag' : k === 'eta' ? 'clock-o' : 'star'} size={12} color={sortBy === k ? '#FFFFFF' : '#6B7280'} />
                          <Text style={[styles.sortText, sortBy === k && styles.sortTextActive]}>
                            {k === 'price' ? 'ფასი' : k === 'eta' ? 'ETA' : 'რეიტინგი'}
                          </Text>
                        </RNView>
                      </Pressable>
                    ))}
                    {(['all','ai','partner'] as const).map((f) => (
                      <Pressable key={f} style={[styles.sortPill, filterBy === f && styles.sortPillActive]} onPress={() => setFilterBy(f)}>
                        <RNView style={styles.chipContent}>
                          <FontAwesome name={f === 'all' ? 'list-ul' : f === 'ai' ? 'magic' : 'users'} size={12} color={filterBy === f ? '#FFFFFF' : '#6B7280'} />
                          <Text style={[styles.sortText, filterBy === f && styles.sortTextActive]}>
                            {f === 'all' ? 'ყველა' : f === 'ai' ? 'AI' : 'პარტნიორი'}
                          </Text>
                        </RNView>
                      </Pressable>
                    ))}
                  </RNView>
                </ScrollView>
                <Pressable style={styles.myOfferBtn} onPress={() => setShowMyOfferModal(true)}>
                  <Text style={styles.myOfferBtnText}>ჩემი შეთავაზება</Text>
                </Pressable>
                <Pressable
                  style={styles.myOfferBtn}
                  onPress={() => {
                    // Close any open modals/pickers before navigating
                    setPickerModal(null);
                    setPickerSearch('');
                    setShowMyOfferModal(false);
                    setCounterFor(null);
                    requestAnimationFrame(() => router.push('/partner'));
                  }}
                >
                  <Text style={styles.myOfferBtnText}>მაღაზიის ხედვა</Text>
                </Pressable>
              </RNView>
              {offers.length === 0 && (
                <>
                  {[1,2,3].map((i) => (
                    <RNView key={i} style={styles.skeletonCard} />
                  ))}
                </>
              )}
              {displayOffers.map((o) => (
                <View key={o.id} style={styles.offerCard}>
                  {/* Main offer info */}
                  <RNView style={styles.offerCardMain}>
                    <RNView style={styles.offerCardLeft}>
                      <RNView style={styles.providerAvatar}>
                        <Text style={styles.providerInitials}>{getInitials(o.providerName)}</Text>
                      </RNView>
                      <RNView style={styles.offerInfo}>
                        <Text style={styles.offerName}>{o.providerName}</Text>
                        <RNView style={styles.offerMeta}>
                          <RNView style={styles.ratingContainer}>
                            <FontAwesome name="star" size={10} color="#F59E0B" />
                            <Text style={styles.ratingText}>{o.rating.toFixed(1)}</Text>
                          </RNView>
                          <RNView style={[styles.sourceBadge, o.source === 'ai' ? styles.sourceBadgeAi : styles.sourceBadgePartner]}>
                            <FontAwesome name={o.source === 'ai' ? 'magic' : 'user'} size={8} color={o.source === 'ai' ? '#7C3AED' : '#059669'} />
                            <Text style={[styles.sourceBadgeText, o.source === 'ai' ? styles.sourceBadgeTextAi : styles.sourceBadgeTextPartner]}>
                              {o.source === 'ai' ? 'AI' : 'პარტნიორი'}
                            </Text>
                          </RNView>
                        </RNView>
                      </RNView>
                    </RNView>
                    
                    <RNView style={styles.offerCardRight}>
                      <RNView style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>{o.priceGEL}</Text>
                        <Text style={styles.priceCurrency}>₾</Text>
                      </RNView>
                      <RNView style={styles.etaContainer}>
                        <FontAwesome name="clock-o" size={10} color="#6B7280" />
                        <Text style={styles.etaText}>{o.etaMin} წთ</Text>
                      </RNView>
                    </RNView>
                  </RNView>
                  
                  {/* Action buttons */}
                  <RNView style={styles.offerActions}>
                    <RNView style={styles.offerDetails}>
                      <RNView style={styles.detailItem}>
                        <FontAwesome name="map-marker" size={10} color="#6B7280" />
                        <Text style={styles.detailText}>{o.distanceKm ?? '-'} კმ</Text>
                      </RNView>
                      {o.createdAt && (
                        <RNView style={styles.detailItem}>
                          <FontAwesome name="clock-o" size={10} color="#6B7280" />
                          <Text style={styles.detailText}>{formatTimeAgo(o.createdAt)}</Text>
                        </RNView>
                      )}
                    </RNView>
                    
                    <RNView style={styles.actionButtons}>
                      <Pressable 
                        style={styles.chatButton}
                        onPress={() => {
                          const sel = offers.find((offer) => offer.id === o.id);
                          const next = { 
                            id: sel?.id, 
                            providerName: sel?.providerName, 
                            priceGEL: sel?.priceGEL, 
                            etaMin: sel?.etaMin, 
                            distanceKm: sel?.distanceKm ?? null 
                          };
                          router.push({ 
                            pathname: `/chat/${o.id}` as any, 
                            params: { 
                              role: 'user', 
                              offer: JSON.stringify(next), 
                              summary: buildSummary(mode as Exclude<Mode, null>, form) 
                            } 
                          });
                        }}
                      >
                        <FontAwesome name="comments" size={12} color="#FFFFFF" />
                        <Text style={styles.chatButtonText}>ჩატი</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.selectButton, selectedOfferId === o.id && styles.selectButtonActive]}
                        onPress={() => setSelectedOfferId(selectedOfferId === o.id ? null : o.id)}
                      >
                        <FontAwesome 
                          name={selectedOfferId === o.id ? "check-circle" : "circle-o"} 
                          size={14} 
                          color={selectedOfferId === o.id ? "#FFFFFF" : "#6B7280"} 
                        />
                        <Text style={[styles.selectButtonText, selectedOfferId === o.id && styles.selectButtonTextActive]}>
                          {selectedOfferId === o.id ? 'არჩეული' : 'არჩევა'}
                        </Text>
                      </Pressable>
                    </RNView>
                  </RNView>
                </View>
              ))}

              {offers.length === 0 && ( 
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>ველოდებით პარტნიორების შეთავაზებებს…</Text>
                  <Text style={styles.emptyDesc}>ჩვეულებრივ 1-3 წინადადება შემოდის რამდენიმე წუთში.</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={[styles.aiBubble, styles.promptCard]}>
                <Text style={styles.promptTitle}>{getStepTitle(mode, step)}</Text>
                <Text style={styles.promptDesc}>{getStepDesc(mode, step)}</Text>
              </View>
              {renderStepFields(mode, step, form, setForm, (t) => { setPickerModal(t); setPickerSearch(''); })}
              

            </>
          )}
        </ScrollView>
      )}

      {mode !== null && (
        showOffers ? (
          <RNView style={[styles.footerRow, { paddingBottom: 10 + insets.bottom }]}>
            <Pressable onPress={() => setShowOffers(false)} style={styles.secondaryBtn}>
              <FontAwesome name="edit" size={14} color="#6B7280" />
              <Text style={styles.secondaryText}>რედაქტირება</Text>
            </Pressable>
            
            {selectedOfferId && (
              <Pressable
                style={styles.chatButtonFooter}
                onPress={() => {
                  const sel = offers.find((o) => o.id === selectedOfferId);
                  const next = { 
                    id: sel?.id, 
                    providerName: sel?.providerName, 
                    priceGEL: sel?.priceGEL, 
                    etaMin: sel?.etaMin, 
                    distanceKm: sel?.distanceKm ?? null 
                  };
                  router.push({ 
                    pathname: `/chat/${selectedOfferId}` as any, 
                    params: { 
                      role: 'user', 
                      offer: JSON.stringify(next), 
                      summary: buildSummary(mode as Exclude<Mode, null>, form) 
                    } 
                  });
                }}
              >
                <FontAwesome name="comments" size={14} color="#FFFFFF" />
                <Text style={styles.chatButtonFooterText}>ჩატი</Text>
              </Pressable>
            )}
            
            <Pressable
              disabled={!selectedOfferId}
              onPress={() => {
                if (!selectedOfferId) return;
                const id = selectedOfferId as string;
                acceptOffer(id);
                postMessage({ offerId: id, author: 'user', text: 'გამარჯობა, ვადასტურებ. როდის იქნება მზად?' });
                const sel = offers.find((o) => o.id === selectedOfferId);
                const next = { id: sel?.id, providerName: sel?.providerName, priceGEL: sel?.priceGEL, etaMin: sel?.etaMin, distanceKm: sel?.distanceKm ?? null };
                router.push({ pathname: `/chat/${selectedOfferId}` as any, params: { role: 'user', offer: JSON.stringify(next), summary: buildSummary(mode as Exclude<Mode, null>, form) } });
              }}
              style={[styles.primaryBtn, !selectedOfferId && { opacity: 0.6 }]}
            >
              <FontAwesome name="check" size={14} color="#FFFFFF" />
              <Text style={styles.primaryText}>დაჯავშნა</Text>
            </Pressable>
          </RNView>
        ) : (
          <RNView style={[styles.footerRow, { paddingBottom: 10 + insets.bottom }]}>
            {step > 0 && (
              <Pressable onPress={() => setStep(step - 1)} style={styles.backButton}>
                <FontAwesome name="chevron-left" size={14} color="#6B7280" />
                <Text style={styles.backButtonText}>უკან</Text>
              </Pressable>
            )}
            {step === 0 && (
              <Pressable onPress={() => onSkip(step, setStep)} style={styles.backButton}>
                <FontAwesome name="times" size={14} color="#6B7280" />
                <Text style={styles.backButtonText}>გამოტოვება</Text>
              </Pressable>
            )}
            <Pressable 
              onPress={() => onAdvance(mode, step, setStep, form, setForm, setShowOffers, setOffers, setRequestId, (user?.id as string) || 'demo-user')} 
              style={[styles.nextButton, !canProceed(mode, step, form) && styles.nextButtonDisabled]}
              disabled={!canProceed(mode, step, form)}
            >
              <Text style={[styles.nextButtonText, !canProceed(mode, step, form) && styles.nextButtonTextDisabled]}>
                {step === getTotalSteps(mode) - 1 ? 'დასრულება' : 'შემდეგი'}
              </Text>
              <FontAwesome name="chevron-right" size={14} color={canProceed(mode, step, form) ? "#FFFFFF" : "#9CA3AF"} />
            </Pressable>
          </RNView>
        )
      )}

      {/* Picker Modal */}
      {pickerModal && (
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalCard, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>
              {pickerModal === 'make' && 'აირჩიე მარკა'}
              {pickerModal === 'model' && 'აირჩიე მოდელი'}
              {pickerModal === 'year' && 'აირჩიე წელი'}
              {pickerModal === 'brand' && 'აირჩიე ბრენდი'}
            </Text>
            <TextInput
              placeholder="ძიება"
              placeholderTextColor="#9CA3AF"
              value={pickerSearch}
              onChangeText={setPickerSearch}
              style={styles.input}
            />
            <ScrollView style={{ marginTop: 8 }}>
              {(() => {
                const vehicle = (form as any).vehicle || {};
                const list = pickerModal === 'make'
                  ? popularMakes
                  : pickerModal === 'model'
                    ? (vehicle.make ? (modelsByMake[vehicle.make] || []) : [])
                    : pickerModal === 'year' || pickerModal === 'yearFrom' || pickerModal === 'yearTo'
                      ? generateRecentYears(30)
                      : brands;
                const q = pickerSearch.trim().toLowerCase();
                const filtered = q ? list.filter((x) => x.toLowerCase().includes(q)) : list;
                return filtered.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.optionRow}
                    onPress={() => {
                      if (pickerModal === 'make') {
                        setForm({ ...form, vehicle: { ...(form as any).vehicle, make: item, model: '' } });
                      } else if (pickerModal === 'model') {
                        setForm({ ...form, vehicle: { ...(form as any).vehicle, model: item } });
                      } else if (pickerModal === 'year') {
                        setForm({ ...form, vehicle: { ...(form as any).vehicle, year: item } });
                      } else if (pickerModal === 'yearFrom') {
                        setForm({ ...form, vehicle: { ...(form as any).vehicle, yearRange: { ...(form as any).vehicle?.yearRange, from: item } } });
                      } else if (pickerModal === 'yearTo') {
                        setForm({ ...form, vehicle: { ...(form as any).vehicle, yearRange: { ...(form as any).vehicle?.yearRange, to: item } } });
                      } else if (pickerModal === 'brand') {
                        setForm({ ...form, partBrand: item });
                      }
                      setPickerModal(null);
                      setPickerSearch('');
                    }}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                  </Pressable>
                ));
              })()}
            </ScrollView>
            <RNView style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => { setPickerModal(null); setPickerSearch(''); }}>
                <Text style={styles.secondaryText}>დახურვა</Text>
              </Pressable>
            </RNView>
          </RNView>
        </RNView>
      )}

      

      {/* My Offer Modal */}
      {showOffers && showMyOfferModal && (
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.modalCard}>
            <Text style={styles.modalTitle}>ჩემი შეთავაზება</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="ფასი ₾"
              placeholderTextColor="#9CA3AF"
              value={myOfferPrice}
              onChangeText={setMyOfferPrice}
              style={styles.input}
            />
            <RNView style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setShowMyOfferModal(false)}><Text style={styles.secondaryText}>გაუქმება</Text></Pressable>
              <Pressable
                style={[styles.primaryBtn, !myOfferPrice && { opacity: 0.6 }]}
                disabled={!myOfferPrice}
                onPress={() => {
                  const mine: Offer = { id: `u-${Date.now()}`, providerName: 'თქვენი შეთავაზება', rating: 5, priceGEL: Number(myOfferPrice), etaMin: 0, source: 'partner', createdAt: Date.now() };
                  setOffers((prev) => [mine, ...prev]);
                  setSelectedOfferId(mine.id);
                  setShowMyOfferModal(false);
                  setMyOfferPrice('');
                }}
              >
                <Text style={styles.primaryText}>გაგზავნა</Text>
              </Pressable>
            </RNView>
          </RNView>
        </RNView>
      )}

      {/* Counter Modal */}
      {counterFor && (
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.modalCard}>
            <Text style={styles.modalTitle}>კონტრშეთავაზება ({counterFor.providerName})</Text>
            <TextInput
              keyboardType="numeric"
              placeholder={`ფასი ₾ (ახლა: ${counterFor.priceGEL})`}
              placeholderTextColor="#9CA3AF"
              value={counterPrice}
              onChangeText={setCounterPrice}
              style={styles.input}
            />
            <RNView style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => { setCounterFor(null); setCounterPrice(''); }}><Text style={styles.secondaryText}>გაუქმება</Text></Pressable>
              <Pressable
                style={[styles.primaryBtn, !counterPrice && { opacity: 0.6 }]}
                disabled={!counterPrice}
                onPress={() => {
                  setOffers((prev) => prev.map(o => o.id === counterFor.id ? { ...o, priceGEL: Number(counterPrice), status: 'counter' } : o));
                  setCounterFor(null);
                  setCounterPrice('');
                }}
              >
                <Text style={styles.primaryText}>გაგზავნა</Text>
              </Pressable>
            </RNView>
          </RNView>
        </RNView>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function titleByMode(mode: Mode): string {
  switch (mode) {
    case null:
      return 'AI ასისტენტი';
    case 'parts':
      return 'ნაწილების AI მოძიება';
    case 'tow':
      return 'ევაკუატორის გამოძახება';
    case 'mechanic':
      return 'ხელოსნის სერვისი';
  }
}

function getTotalSteps(mode: Exclude<Mode, null>): number {
  switch (mode) {
    case 'parts':
      return 2; // 2 steps for parts
    case 'tow':
      return 3; // 3 steps for tow
    case 'mechanic':
      return 3; // 3 steps for mechanic
  }
}

function canProceed(mode: Exclude<Mode, null>, step: number, form: Record<string, any>): boolean {
  if (mode === 'parts') {
    switch (step) {
      case 0: // მანქანის ინფო
        return !!(form.vehicle?.make && form.vehicle?.model);
      case 1: // ნაწილის დეტალები
        return !!(form.partName && form.partDetails && form.vehicle?.year);
      default:
        return false;
    }
  }
  // TODO: Add validation for other modes
  return true;
}

function getStepTitle(mode: Exclude<Mode, null>, step: number): string {
  if (mode === 'parts') {
    return ['მანქანის ინფორმაცია', 'ნაწილის დეტალები'][step] ?? '';
  }
  if (mode === 'tow') {
    return ['რა მოხდა?', 'სად ხარ ახლა?', 'მანქანის დეტალები'][step] ?? '';
  }
  return ['რა სიმპტომები გაქვს?', 'როდის შეგეძლება? ბიუჯეტი?', 'სად გესტურო?'][step] ?? '';
}

function getStepDesc(mode: Exclude<Mode, null>, step: number): string {
  if (mode === 'parts') {
    return ['აირჩიე მანქანის მარკა, მოდელი და VIN კოდი.', 'მიუთითე ნაწილის დასახელება, დეტალები და მანქანის წელი.'][step] ?? '';
  }
  if (mode === 'tow') {
    return ['აირჩიე პრობლემა ან აღწერე მოკლედ.', 'მიამაგრე ახლანდელი ლოკაცია.', 'დაადასტურე მანქანა და შენიშვნა.'][step] ?? '';
  }
  return ['აირჩიე სიმპტომები ჩიპებით.', 'დროის ფანჯარა და ბიუჯეტი სურვილისამებრ.', 'მისამართი/ლოკაცია.'][step] ?? '';
}

function generateRecentYears(count: number = 15): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => String(current - i));
}

function renderStepFields(
  mode: Exclude<Mode, null>,
  step: number,
  form: Record<string, any>,
  setForm: (next: Record<string, any>) => void,
  openPicker: (t: 'make' | 'model' | 'year' | 'yearFrom' | 'yearTo' | 'brand') => void,
) {
  if (mode === 'parts') {
    if (step === 0) {
      // Step 1: მანქანის ინფო
      const popularMakes = ['BMW', 'Mercedes', 'Toyota', 'Audi', 'Volkswagen', 'Honda', 'Ford', 'Nissan', 'Hyundai', 'Kia'];
      const modelsByMake: Record<string, string[]> = {
        BMW: ['320i', '520i', 'X5', 'F30', 'E90', 'X3', 'X1', '118i'],
        Mercedes: ['C200', 'E220', 'GLC', 'W204', 'W212', 'A180', 'B200'],
        Toyota: ['Camry', 'Corolla', 'RAV4', 'Prius', 'Yaris', 'Hilux'],
        Audi: ['A4', 'A6', 'Q5', 'B8', 'A3', 'Q3', 'TT'],
        Volkswagen: ['Golf', 'Passat', 'Tiguan', 'Polo', 'Jetta', 'Touareg'],
        Honda: ['Civic', 'Accord', 'CR-V', 'Jazz', 'HR-V'],
        Ford: ['Focus', 'Mondeo', 'Kuga', 'Fiesta', 'Explorer'],
        Nissan: ['Qashqai', 'Juke', 'Micra', 'X-Trail', 'Leaf'],
        Hyundai: ['i30', 'Tucson', 'Santa Fe', 'i20', 'Kona'],
        Kia: ['Sportage', 'Ceed', 'Rio', 'Sorento', 'Picanto'],
      };
      const vehicle = form.vehicle || {};
      const selectedModels = vehicle.make && modelsByMake[vehicle.make] ? modelsByMake[vehicle.make] : [];
      
      return (
        <View style={styles.newStepContainer}>
          <View style={styles.newStepHeader}>
            <View style={styles.newStepIcon}>
              <FontAwesome name="car" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.newStepContent}>
              <Text style={styles.newStepTitle}>მანქანის ინფორმაცია</Text>
              <Text style={styles.newStepSubtitle}>აირჩიე მანქანის ძირითადი მონაცემები</Text>
            </View>
            <View style={styles.newStepBadge}>
              <Text style={styles.newStepBadgeText}>1/2</Text>
            </View>
          </View>
          
          <View style={styles.newFieldContainer}>
            <View style={styles.newFieldGroup}>
              <Text style={styles.newFieldLabel}>მარკა *</Text>
              <Pressable style={styles.newPickerInput} onPress={() => openPicker('make')}>
                <Text style={[styles.newPickerText, !vehicle.make && { color: '#9CA3AF' }]}>
                  {vehicle.make || 'აირჩიე მარკა'}
                </Text>
                <FontAwesome name="chevron-down" size={16} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.newFieldGroup}>
              <Text style={styles.newFieldLabel}>მოდელი *</Text>
              <Pressable 
                disabled={!vehicle.make} 
                style={[styles.newPickerInput, !vehicle.make && styles.newPickerDisabled]} 
                onPress={() => vehicle.make && openPicker('model')}
              >
                <Text style={[styles.newPickerText, !vehicle.model && { color: '#9CA3AF' }]}>
                  {vehicle.model || (vehicle.make ? 'აირჩიე მოდელი' : 'ჯერ აირჩიე მარკა')}
                </Text>
                <FontAwesome name="chevron-down" size={16} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.newFieldGroup}>
              <Text style={styles.newFieldLabel}>VIN კოდი (არასავალდებულო)</Text>
              <TextInput 
                placeholder="WVWZZZ1KZ3W386752" 
                placeholderTextColor="#9CA3AF" 
                value={(form.vehicle && form.vehicle.vin) || ''} 
                onChangeText={(t) => setForm({ ...form, vehicle: { ...(form.vehicle || {}), vin: t } })} 
                style={styles.newInput} 
              />
            </View>
          </View>
        </View>
      );
    }
    
    if (step === 1) {
      // Step 2: ნაწილის დეტალები
      const vehicle = form.vehicle || {};
      const years = generateRecentYears(30);
      
      return (
        <View style={styles.newStepContainer}>
          <View style={styles.newStepHeader}>
            <View style={styles.newStepIcon}>
              <FontAwesome name="cogs" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.newStepContent}>
              <Text style={styles.newStepTitle}>ნაწილის დეტალები</Text>
              <Text style={styles.newStepSubtitle}>მიუთითე ნაწილის ინფორმაცია</Text>
            </View>
            <View style={styles.newStepBadge}>
              <Text style={styles.newStepBadgeText}>2/2</Text>
            </View>
          </View>
          
          <View style={styles.newFieldContainer}>
            <View style={styles.newFieldGroup}>
              <Text style={styles.newFieldLabel}>ნაწილის დასახელება *</Text>
              <TextInput 
                placeholder="მაგ. ზეთის ფილტრი, ბრეკის ხუნდები, ფარები" 
                placeholderTextColor="#9CA3AF" 
                value={form.partName || ''} 
                onChangeText={(t) => setForm({ ...form, partName: t })} 
                style={styles.newInput} 
              />
            </View>
            
            <View style={styles.newFieldGroup}>
              <Text style={styles.newFieldLabel}>დამატებითი დეტალები *</Text>
              <TextInput 
                placeholder="მაგ. უკანა მარჯვენა კარები, წინა მარცხენა ფარები, ძრავის ზედა ნაწილი" 
                placeholderTextColor="#9CA3AF" 
                value={form.partDetails || ''} 
                onChangeText={(t) => setForm({ ...form, partDetails: t })} 
                style={[styles.newInput, { height: 80, textAlignVertical: 'top' }]} 
                multiline 
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.newFieldGroup}>
              <Text style={styles.newFieldLabel}>მანქანის წელი *</Text>
              <Pressable style={styles.newPickerInput} onPress={() => openPicker('year')}>
                <Text style={[styles.newPickerText, !vehicle.year && { color: '#9CA3AF' }]}>
                  {vehicle.year || 'აირჩიე წელი'}
                </Text>
                <FontAwesome name="chevron-down" size={16} color="#6B7280" />
              </Pressable>
            </View>
          </View>
        </View>
      );
    }
  }
  
  // TODO: Add other modes
  return null;
}

async function onAdvance(
  mode: Exclude<Mode, null>,
  step: number,
  setStep: (s: number) => void,
  form: Record<string, any>,
  setForm: (next: Record<string, any>) => void,
  setShowOffers: (v: boolean) => void,
  setOffers: (v: Offer[]) => void,
  setRequestId: (id: string | null) => void,
  userId: string,
) {
  // Check if we can proceed using our new validation function
  if (!canProceed(mode, step, form)) {
    return;
  }

  const totalSteps = getTotalSteps(mode);
  const isLast = step >= totalSteps - 1;
  const nextStep = isLast ? totalSteps - 1 : step + 1;

  const summary = buildSummary(mode, form);
  try {
    await AsyncStorage.setItem('ai_last_draft', JSON.stringify({ mode, step: nextStep, summary }));
    await AsyncStorage.setItem('ai_draft_data', JSON.stringify({ mode, form }));
  } catch {}

  if (!isLast) {
    setStep(nextStep);
    return;
  }
  
      // Submit request to backend and show offers
    try {
      const payload: any = {
        partName: form.partName,
        partDetails: form.partDetails,
        urgency: 'სასწრაფო', // ყოველთვის უმაღლესი პრიორიტეტი
        vehicle: form.vehicle || undefined,
      };
    console.log('[API] POST /requests payload', payload, 'userId=', userId);
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-ID': userId },
      body: JSON.stringify(payload),
    });
    console.log('[API] /requests status', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('[API] /requests response', data);
      if (data && data.id) {
        setRequestId(String(data.id));
        try {
          await AsyncStorage.setItem('ai_last_request_id', String(data.id));
        } catch {}
      } else {
        setRequestId(null);
      }
    } else {
      setRequestId(null);
    }
  } catch (e) {
    console.log('[API] /requests error', e);
    setRequestId(null);
  }
  console.log('[UI] showOffers -> true');
  setShowOffers(true);
}

function onSkip(step: number, setStep: (s: number) => void) {
  if (step < 2) setStep(step + 1);
}

function buildSummary(mode: Exclude<Mode, null>, form: Record<string, any>): string {
  if (mode === 'parts') {
    const v = form.vehicle || {};
    const vehicleStr = [v.make, v.model, v.year].filter(Boolean).join(' ');
    return `მანქანა: ${vehicleStr || '-'} • ნაწილი: ${form.partName || '-'} • დეტალები: ${form.partDetails || '-'}`;
  }
  if (mode === 'tow') {
    return `პრობლემა: ${form.problem || '-'} • ლოკაცია: ${form.location || '-'} • მანქანა: ${form.car || '-'}`;
  }
  return `სიმპტომი: ${form.symptom || '-'} • დრო: ${form.time || '-'} • ლოკაცია: ${form.location || '-'}`;
}

function sortOffers(items: Offer[], key: 'price' | 'eta' | 'rating'): Offer[] {
  const arr = [...items];
  if (key === 'price') return arr.sort((a, b) => a.priceGEL - b.priceGEL);
  if (key === 'eta') return arr.sort((a, b) => a.etaMin - b.etaMin);
  return arr.sort((a, b) => b.rating - a.rating);
}
function seedPrompt(mode: Mode): string {
  if (mode === 'parts') {
    return 'მითხარი მანქანის მარკა/მოდელი, წელი და რომელი ნაწილი გჭირდება. სურვილის შემთხვევაში გადაიღე ფოტო.';
  }
  if (mode === 'tow') {
    return 'მოგვწერე შენი მდებარეობა ან მონიშნე რუკაზე, აგრეთვე მანქანის მოდელი და პრობლემა.';
  }
  return 'აღწერე პრობლემა, მდებარეობა და სასურველი დრო. მოვძებნით ხელმისაწვდომ ხელოსნებს.';
}

function buildQuickActions(mode: Mode): string[] {
  if (mode === 'parts') {
    return ['ფილტრი BMW F30 2015', 'ბრეკის ხუნდები Toyota Camry 2018', 'თერმოსტატი Audi A4 B8'];
  }
  if (mode === 'tow') {
    return ['ბატარეა დაჯდა', 'ბორბალი დაუცდა', 'ავარია მოხდა'];
  }
  return ['ძრავის ხმა უცნაურია', 'საჭე კანკალებს', 'ზეთი ჟონავს'];
}

function mockReply(mode: Mode, userText: string): string {
  if (mode === 'parts') {
    return `ვიპოვე რამდენიმე შეთავაზება ახლოს. გინდა გავგზავნო მოთხოვნა მაღაზიებში? \n\nტექსტი: ${userText}`;
  }
  if (mode === 'tow') {
    return `შევძლებთ 25-35 წუთში. დავგზავნო მოთხოვნა უახლოეს მძღოლებთან? \n\nტექსტი: ${userText}`;
  }
  return `შემიძლია შემოგთავაზო 2 ხელოსანი დღეს. გინდა ვუგზავნო მოთხოვნა? \n\nტექსტი: ${userText}`;
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
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  headerTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 16 },
  stepperWrap: { flexDirection: 'row', gap: 8, position: 'absolute', left: '50%', transform: [{ translateX: -24 }], bottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#10B981' },
  chat: { padding: 16, gap: 10 },
  modePicker: { padding: 16, gap: 12 },
  modeHeader: { 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 16 
  },
  modeTitle: { 
    color: '#111827', 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 20, 
    textAlign: 'center' 
  },
  modeSubtitle: { 
    color: '#6B7280', 
    fontFamily: 'NotoSans_500Medium', 
    fontSize: 14,
    textAlign: 'center'
  },
  modeList: { 
    gap: 12 
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeName: { 
    color: '#111827', 
    fontFamily: 'NotoSans_700Bold', 
    fontSize: 14 
  },
  modeDesc: { 
    color: '#6B7280', 
    fontFamily: 'NotoSans_500Medium', 
    fontSize: 12 
  },
  photoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoUploadText: {
    color: '#6B7280',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
  },
  yearSelectionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  yearOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  yearOptionActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  yearOptionText: {
    color: '#6B7280',
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
  },
  yearOptionTextActive: {
    color: '#FFFFFF',
  },
  yearRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearRangeSeparator: {
    color: '#6B7280',
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
  },
  yearRangeContainer: {
    gap: 8,
  },
  yearRangeLabel: {
    color: '#6B7280',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    marginBottom: 4,
  },
  yearRangeInputContainer: {
    flex: 1,
    gap: 4,
  },
  yearRangeInputLabel: {
    color: '#374151',
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
  },
  yearRangeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  yearRangeInputText: {
    color: '#111827',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
  },
  yearRangeDivider: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  yearRangeDividerLine: {
    width: 20,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  stepContainer: {
    gap: 20,
  },
  stepHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepTitle: {
    color: '#111827',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  stepSubtitle: {
    color: '#6B7280',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  fieldGroup: {
    gap: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#374151',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 15,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  nextButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 15,
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
  modernStepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  modernStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  modernStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernStepContent: {
    flex: 1,
  },
  modernStepTitle: {
    color: '#1F2937',
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 18,
    marginBottom: 2,
  },
  modernStepSubtitle: {
    color: '#6B7280',
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  modernStepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernStepBadgeText: {
    color: '#475569',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 11,
  },
  modernFieldContainer: {
    gap: 16,
  },
  modernFieldGroup: {
    gap: 6,
  },
  modernFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  modernFieldLabel: {
    color: '#374151',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
  },
  modernPickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  modernPickerDisabled: {
    opacity: 0.4,
    backgroundColor: '#F1F5F9',
  },
  modernPickerText: {
    color: '#1F2937',
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
  },
  modernInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1F2937',
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  modernPhotoUploadBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  modernPhotoUploadText: {
    color: '#64748B',
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
  },
  modernYearSelectionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modernYearOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernYearOptionActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  modernYearOptionText: {
    color: '#64748B',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
  },
  modernYearOptionTextActive: {
    color: '#FFFFFF',
  },
  modernYearRangeContainer: {
    gap: 12,
  },
  modernYearRangeLabel: {
    color: '#374151',
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  modernYearRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernYearRangeInputContainer: {
    flex: 1,
    gap: 4,
  },
  modernYearRangeInputLabel: {
    color: '#6B7280',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
  },
  modernYearRangeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernYearRangeInputText: {
    color: '#111827',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
  },
  modernYearRangeDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  modernYearRangeDividerLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  modernChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modernChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  modernChipText: {
    color: '#64748B',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
  },
  modernChipTextActive: {
    color: '#FFFFFF',
  },
  bubble: {
    maxWidth: '86%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  bubbleText: { color: '#111827', fontFamily: 'NotoSans_500Medium', fontSize: 13 },
  promptCard: { padding: 14, borderRadius: 16 },
  promptTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 14, color: '#111827', marginBottom: 4 },
  promptDesc: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  fieldLabel: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827', marginTop: 10, marginBottom: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827' },
  chipTextActive: { color: '#FFFFFF' },
  offersTitle: { marginTop: 4, marginBottom: 6, color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 16 },
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  sortScrollContent: { paddingRight: 8 },
  sortPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  sortPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  sortText: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, color: '#111827' },
  sortTextActive: { color: '#FFFFFF' },
  chipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerCard: { padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 10 },
  offerCardActive: { borderColor: '#10B981' },
  offerName: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  pricePill: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  priceText: { color: '#065F46', fontFamily: 'NotoSans_700Bold', fontSize: 13 },
  pricePillLg: { backgroundColor: '#111827', borderColor: '#111827', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  priceTextLg: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
  avatar: { display: 'none' },
  avatarText: { display: 'none' },
  verifiedBadge: { display: 'none' },
  verifiedText: { display: 'none' },
  linkText: { display: 'none' },
  skeletonCard: { height: 70, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#EEF2F7', marginBottom: 10 },
  badgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  badgeAi: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  badgePartner: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  badgeSmallText: { fontFamily: 'NotoSans_700Bold', fontSize: 10 },
  badgeAiText: { color: '#111827' },
  badgePartnerText: { color: '#065F46' },
  distanceChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  distanceText: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#111827' },

  myOfferBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#111827' },
  myOfferBtnText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  emptyCard: { alignItems: 'center', gap: 6, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  emptyTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#111827' },
  emptyDesc: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F7', padding: 14 },
  modalTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 15, color: '#111827', marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderTopWidth: 1, borderTopColor: '#EEF2F7', backgroundColor: '#FFFFFF' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  secondaryText: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#111827' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', backgroundColor: '#111827' },
  primaryText: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#FFFFFF' },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    fontFamily: 'NotoSans_400Regular',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginBottom: 8,
  },
  pickerInputText: { fontFamily: 'NotoSans_400Regular', fontSize: 13, color: '#111827' },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: { fontFamily: 'NotoSans_500Medium', fontSize: 13, color: '#111827' },
  partnerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F7', padding: 14, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  partnerTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
  partnerMeta: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  partnerBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  partnerBadgeText: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#111827' },
  providerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInitials: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sourceBadgeAi: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  sourceBadgePartner: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  sourceBadgeText: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 10 },
  sourceBadgeTextAi: { color: '#111827' },
  sourceBadgeTextPartner: { color: '#065F46' },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceAmount: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 16 },
  priceCurrency: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerCardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  offerInfo: {
    flex: 1,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  offerCardRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    minWidth: 80,
  },
  etaText: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 11 },
  offerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  offerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#111827',
  },
  chatButtonText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  selectButtonActive: { borderColor: '#10B981' },
  selectButtonText: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  selectButtonTextActive: { color: '#10B981' },
  chatButtonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  chatButtonFooterText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryCardNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 12,
    marginBottom: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitleNew: {
    color: '#111827',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
  },
  summaryEditNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabelText: {
    color: '#6B7280',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
  },
  summaryValue: {
    color: '#111827',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  urgencyBadgeUrgent: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  urgencyBadgeNormal: { backgroundColor: '#F3FAF7', borderColor: '#C6F6E4' },
  urgencyBadgeLow: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  urgencyText: {
    color: '#15803D',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 12,
  },
  urgencyTextUrgent: { color: '#B42318', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  urgencyTextNormal: { color: '#15803D', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  urgencyTextLow: { color: '#4D7C0F', fontFamily: 'NotoSans_700Bold', fontSize: 12 },
  newStepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  newStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  newStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  newStepContent: {
    flex: 1,
  },
  newStepTitle: {
    color: '#1F2937',
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 18,
    marginBottom: 2,
  },
  newStepSubtitle: {
    color: '#6B7280',
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  newStepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  newStepBadgeText: {
    color: '#475569',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 11,
  },
  newFieldContainer: {
    gap: 16,
  },
  newFieldGroup: {
    gap: 6,
  },
  newFieldLabel: {
    color: '#374151',
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
  },
  newPickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  newPickerDisabled: {
    opacity: 0.4,
    backgroundColor: '#F1F5F9',
  },
  newPickerText: {
    color: '#1F2937',
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
  },
  newInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1F2937',
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
});

function onPickMode(next: Exclude<Mode, null>, setMode: (m: Mode) => void, setMessages: (fn: (prev: Message[]) => Message[]) => void) {
  setMode(next);
  const first: Message = { id: String(Date.now()), role: 'assistant', text: seedPrompt(next) };
  setMessages(() => [first]);
}

function advanceOrSend(
  mode: Mode,
  step: number,
  setStep: (s: number) => void,
  input: string,
  setInput: (v: string) => void,
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  router: ReturnType<typeof useRouter>,
) {
  // disabled in form-wizard mode
  return;
}

function onAttachPhoto(setMessages: (fn: (prev: Message[]) => Message[]) => void) {
  const msg: Message = { id: String(Date.now()), role: 'assistant', text: 'ფოტოს ატვირთვა მალე დაემატება.' };
  setMessages((prev) => [...prev, msg]);
}

function onPickLocation(setMessages: (fn: (prev: Message[]) => Message[]) => void) {
  const msg: Message = { id: String(Date.now()), role: 'assistant', text: 'მდებარეობის მონიშვნა მალე დაემატება.' };
  setMessages((prev) => [...prev, msg]);
}

function stepHint(mode: Exclude<Mode, null>, step: number): string {
  return '';
}


