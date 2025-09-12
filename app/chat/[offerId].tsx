import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View as RNView, Alert, RefreshControl, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from '@/components/Themed';
import Constants from 'expo-constants';

function resolveApiBase(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
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

type Role = 'user' | 'partner';

type ChatMessage = { id: string; offerId: string; author: 'user' | 'partner'; text: string; createdAt: number; status?: 'sending' | 'sent' | 'error'; temp?: boolean };

type ReplyRef = { id: string; author: 'user' | 'partner'; text: string } | null;

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const offerId = String(params.offerId);
  const role: Role = (params.role as Role) || 'user';
  const offer = params.offer ? JSON.parse(params.offer as string) : null as null | { id: string; providerName: string; priceGEL: number; etaMin: number; distanceKm: number | null };
  const summary = params.summary ? String(params.summary) : '';

  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyRef>(null);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef(0);
  const scrollYRef = useRef(0);

  useEffect(() => {
    console.log('[CHAT] Using API_URL =', API_URL);
  }, []);

  // Backend polling for messages
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const url = `${API_URL}/messages?offerId=${encodeURIComponent(offerId)}`;
        console.log('[CHAT] role=', role, 'offerId=', offerId);
        console.log('[CHAT] GET', url);
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          const mapped: ChatMessage[] = data.map((m: any) => ({
            id: String(m.id),
            offerId: String(m.offerId),
            author: m.author === 'partner' ? 'partner' : 'user',
            text: String(m.text || ''),
            createdAt: Number(m.createdAt || Date.now()),
            status: 'sent',
          }));
          console.log('[CHAT] messages len=', mapped.length);
          setLocal((prev) => mergeServerMessages(prev, mapped));
          if (atBottom) requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        }
      } catch (e) {
        console.log('[CHAT] poll error:', e);
      }
    };
    const iv = setInterval(poll, 1500);
    poll();
    return () => { cancelled = true; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId, role, atBottom]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/messages?offerId=${encodeURIComponent(offerId)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: ChatMessage[] = data.map((m: any) => ({
          id: String(m.id),
          offerId: String(m.offerId),
          author: m.author === 'partner' ? 'partner' : 'user',
          text: String(m.text || ''),
          createdAt: Number(m.createdAt || Date.now()),
          status: 'sent',
        }));
        setLocal((prev) => mergeServerMessages(prev, mapped));
      }
    } catch (e) {
      console.log('[CHAT] refresh error:', e);
    }
    setIsRefreshing(false);
  };

  // Optimistic send with retry
  const send = async () => {
    const t = input.trim();
    if (!t) return;
    setInput('');
    const tempId = `tmp_${Date.now()}`;
    const optimistic: ChatMessage = { id: tempId, offerId, author: role, text: replyTo ? `↪ ${replyTo.text}\n${t}` : t, createdAt: Date.now(), status: 'sending', temp: true };
    setLocal((prev) => [...prev, optimistic]);
    setReplyTo(null);
    setIsSending(true);
    try {
      const payload = { offerId, author: role, text: t };
      console.log('[CHAT] POST payload:', payload);
      const url = `${API_URL}/messages`;
      console.log('[CHAT] POST', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('[CHAT] Response status:', res.status, 'ok:', res.ok);
      if (!res.ok) {
        const txt = await res.text();
        console.log('[CHAT] Error body:', txt);
        throw new Error('send-failed');
      }
      const saved = await res.json();
      console.log('[CHAT] Saved message:', saved);
      setLocal((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: saved.id, createdAt: saved.createdAt ?? m.createdAt, status: 'sent', temp: false } : m)));
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      console.log('[CHAT] send error:', e);
      setLocal((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m)));
      Alert.alert('შეტყობინება', 'გაგზავნა ვერ მოხერხდა. სცადე კვლავ.');
    } finally {
      setIsSending(false);
    }
  };

  const retrySend = async (msg: ChatMessage) => {
    if (msg.status !== 'error') return;
    setLocal((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'sending' } : m)));
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, author: role, text: msg.text }),
      });
      if (!res.ok) throw new Error('retry-failed');
      const saved = await res.json();
      setLocal((prev) => prev.map((m) => (m.id === msg.id ? { ...m, id: saved.id, createdAt: saved.createdAt ?? m.createdAt, status: 'sent', temp: false } : m)));
    } catch (e) {
      console.log('[CHAT] retry error:', e);
      setLocal((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'error' } : m)));
    }
  };

  // Helpers
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayLabel = (d: Date) => {
    const today = new Date();
    const diff = Math.floor((stripTime(today).getTime() - stripTime(d).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'დღეს';
    if (diff === 1) return 'გუშინ';
    return d.toLocaleDateString();
  };
  const groupByDate = (items: ChatMessage[]) => {
    const groups: Record<string, { dateKey: string; label: string; items: ChatMessage[] }> = {};
    for (const m of items) {
      const d = new Date(m.createdAt || Date.now());
      const key = stripTime(d).toISOString();
      if (!groups[key]) groups[key] = { dateKey: key, label: dayLabel(d), items: [] };
      groups[key].items.push(m);
    }
    return Object.values(groups);
  };
  const copyText = (text: string) => {
    try {
      // @ts-ignore – best effort in RN environments
      if (global?.navigator?.clipboard?.writeText) global.navigator.clipboard.writeText(text);
    } catch {}
  };
  const openMsgMenu = (m: ChatMessage) => {
    Alert.alert('მესიჯი', undefined, [
      { text: 'კოპირება', onPress: () => copyText(m.text) },
      { text: 'პასუხი', onPress: () => setReplyTo({ id: m.id, author: m.author, text: m.text }) },
      { text: 'დახურვა', style: 'cancel' },
    ]);
  };

  const onScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    scrollYRef.current = contentOffset.y;
    contentHeightRef.current = contentSize.height;
    const isBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 60;
    if (isBottom !== atBottom) setAtBottom(isBottom);
  };
  const onContentSizeChange = (_: number, h: number) => { contentHeightRef.current = h; };
  const onLayout = (_e: LayoutChangeEvent) => { /* no-op but keeps layout stable */ };

  const renderStatus = (m: ChatMessage) => {
    if (m.status === 'sending') return <Text style={styles.statusText}>იგზავნება…</Text>;
    if (m.status === 'error') return (
      <RNView style={styles.errorRow}>
        <Text style={[styles.statusText, { color: '#DC2626' }]}>შეცდომა</Text>
        <Pressable onPress={() => retrySend(m)} style={styles.retryBtn}><Text style={styles.retryText}>ხელახლა</Text></Pressable>
      </RNView>
    );
    return <Text style={styles.statusText}>მიწოდებულია</Text>;
  };

  const grouped = useMemo(() => groupByDate(local), [local]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <FontAwesome name="chevron-left" size={16} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>ჩატი</Text>
          <RNView style={{ width: 36 }} />
        </View>
        <RNView style={styles.threadBar}>
          <RNView style={styles.threadPill}><Text style={styles.threadText}>თემა: {offerId}</Text></RNView>
          {role === 'partner' && (
            <RNView style={[styles.threadPill, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
              <Text style={[styles.threadText, { color: '#065F46' }]}>როლი: პარტნიორი</Text>
            </RNView>
          )}
          {role === 'user' && (
            <RNView style={[styles.threadPill, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
              <Text style={[styles.threadText, { color: '#111827' }]}>როლი: მომხმარებელი</Text>
            </RNView>
          )}
        </RNView>

        {offer && (
          <View style={styles.offerCard}>
            <RNView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.offerTitle}>{offer.providerName}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{offer.distanceKm ?? '-'}კმ</Text></View>
            </RNView>
            <RNView style={styles.pillRow}>
              <RNView style={styles.pill}>
                <FontAwesome name="tag" size={12} color="#111827" />
                <Text style={styles.pillText}>₾{offer.priceGEL}</Text>
              </RNView>
              <RNView style={styles.pill}>
                <FontAwesome name="clock-o" size={12} color="#111827" />
                <Text style={styles.pillText}>{offer.etaMin}წთ</Text>
              </RNView>
              <RNView style={styles.pill}>
                <FontAwesome name="map-marker" size={12} color="#111827" />
                <Text style={styles.pillText}>{offer.distanceKm ?? '-'}კმ</Text>
              </RNView>
            </RNView>
          </View>
        )}

        {summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>შეკვეთის შეჯამება</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          onScroll={onScroll}
          onContentSizeChange={onContentSizeChange}
          onLayout={onLayout}
          scrollEventThrottle={16}
        >
          {grouped.map((group) => (
            <RNView key={group.dateKey}>
              <RNView style={styles.dayDivider}><Text style={styles.dayDividerText}>{group.label}</Text></RNView>
              {group.items.map((m, idx) => {
                const prev = group.items[idx - 1];
                const next = group.items[idx + 1];
                const isFirst = !prev || prev.author !== m.author;
                const isLast = !next || next.author !== m.author;
                return (
                  <RNView key={m.id} style={[styles.msgRow, m.author === 'user' ? styles.rowLeft : styles.rowRight]}>
                    {m.author === 'user' && (
                      <RNView style={[styles.avatarWrap, !isFirst && { opacity: 0 }]}>
                        <RNView style={styles.avatar}><Text style={styles.avatarText}>მე</Text></RNView>
                      </RNView>
                    )}
                    <RNView style={[styles.msgWrap, m.author === 'user' ? styles.msgLeft : styles.msgRight]}>
                      <Pressable
                        android_ripple={{ color: '#00000010' }}
                        onLongPress={() => openMsgMenu(m)}
                        style={[styles.bubble, m.author === 'user' ? styles.userBubble : styles.partnerBubble, bubbleGroupRadius(isFirst, isLast, m.author)]}
                      >
                        <Text style={m.author === 'user' ? styles.userText : styles.partnerText}>{m.text}</Text>
                      </Pressable>
                      <RNView style={{ alignSelf: m.author === 'partner' ? 'flex-end' : 'flex-start', gap: 2 }}>
                        <Text style={[styles.timestamp, m.author === 'partner' && styles.timestampRight]}>{formatTime(m.createdAt)}</Text>
                        {renderStatus(m)}
                      </RNView>
                    </RNView>
                    {m.author === 'partner' && (
                      <RNView style={[styles.avatarWrap, !isFirst && { opacity: 0 }]}>
                        <RNView style={[styles.avatar, { backgroundColor: '#111827' }]}><Text style={[styles.avatarText, { color: '#FFFFFF' }]}>პ</Text></RNView>
                      </RNView>
                    )}
                  </RNView>
                );
              })}
            </RNView>
          ))}
        </ScrollView>

        {!atBottom && (
          <Pressable style={styles.scrollFab} onPress={() => { scrollRef.current?.scrollToEnd({ animated: true }); setAtBottom(true); }}>
            <FontAwesome name="arrow-down" size={14} color="#FFFFFF" />
          </Pressable>
        )}

        {replyTo && (
          <RNView style={styles.replyBar}>
            <RNView style={{ flex: 1 }}>
              <Text style={styles.replyLabel}>პასუხობ {replyTo.author === 'partner' ? 'პარტნიორს' : 'მომხმარებელს'}</Text>
              <Text style={styles.replyText} numberOfLines={1}>{replyTo.text}</Text>
            </RNView>
            <Pressable onPress={() => setReplyTo(null)} style={styles.replyClose}><FontAwesome name="times" size={12} color="#6B7280" /></Pressable>
          </RNView>
        )}

        <RNView style={styles.footerRow}>
          <Pressable style={styles.iconBtn} onPress={() => {}}>
            <FontAwesome name="paperclip" size={14} color="#6B7280" />
          </Pressable>
          <TextInput value={input} onChangeText={setInput} placeholder="მესიჯი..." placeholderTextColor="#9CA3AF" style={[styles.input, { maxHeight: 90 }]} multiline />
          <Pressable style={[styles.sendBtn, (!input.trim() || isSending) && { opacity: 0.6 }]} onPress={send} disabled={!input.trim() || isSending}>
            <FontAwesome name="send" size={14} color="#FFFFFF" />
          </Pressable>
        </RNView>

        {role === 'user' && (
          <RNView style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
            <Pressable
              style={styles.orderBtn}
              onPress={() => router.push({ pathname: '/parts-order', params: { offer: JSON.stringify(offer), summary } })}
            >
              <Text style={styles.orderBtnText}>შეკვეთის დადასტურება</Text>
            </Pressable>
          </RNView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function mergeServerMessages(prev: ChatMessage[], server: ChatMessage[]): ChatMessage[] {
  const byId: Record<string, ChatMessage> = {};
  for (const m of prev) byId[m.id] = m;
  for (const s of server) byId[s.id] = { ...(byId[s.id] ?? s), ...s, status: 'sent', temp: false };
  // preserve optimistic messages not yet saved
  const unsaved = prev.filter((m) => m.temp && !server.find((s) => s.text === m.text));
  const merged = [...Object.values(byId), ...unsaved];
  return merged.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function bubbleGroupRadius(isFirst: boolean, isLast: boolean, author: 'user' | 'partner') {
  const base = { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 } as any;
  if (author === 'user') {
    if (!isFirst) base.borderTopLeftRadius = 6;
    if (!isLast) base.borderBottomLeftRadius = 6;
  } else {
    if (!isFirst) base.borderTopRightRadius = 6;
    if (!isLast) base.borderBottomRightRadius = 6;
  }
  return base;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  headerTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 16 },
  threadBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 8 },
  threadPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  threadText: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#6B7280' },
  offerCard: { margin: 14, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F7', padding: 12, gap: 10 },
  offerTitle: { color: '#111827', fontFamily: 'NotoSans_700Bold', fontSize: 14 },
  offerMeta: { color: '#6B7280', fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  badgeText: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#111827' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB' },
  pillText: { color: '#111827', fontFamily: 'NotoSans_600SemiBold', fontSize: 12 },
  summaryCard: { marginHorizontal: 14, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F7', padding: 12 },
  summaryTitle: { fontFamily: 'NotoSans_700Bold', fontSize: 13, color: '#111827', marginBottom: 6 },
  summaryText: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#6B7280' },
  list: { padding: 14, gap: 10 },
  msgWrap: { gap: 4 },
  msgLeft: { alignItems: 'flex-start' },
  msgRight: { alignItems: 'flex-end' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatarWrap: { width: 28, alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  avatarText: { fontFamily: 'NotoSans_700Bold', fontSize: 10, color: '#111827' },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  userBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderColor: '#EEF2F7' },
  partnerBubble: { alignSelf: 'flex-end', backgroundColor: '#111827', borderColor: '#111827' },
  userText: { color: '#111827', fontFamily: 'NotoSans_500Medium', fontSize: 13 },
  partnerText: { color: '#FFFFFF', fontFamily: 'NotoSans_500Medium', fontSize: 13 },
  timestamp: { color: '#9CA3AF', fontFamily: 'NotoSans_500Medium', fontSize: 10, alignSelf: 'flex-start' },
  timestampRight: { alignSelf: 'flex-end' },
  statusText: { color: '#9CA3AF', fontFamily: 'NotoSans_500Medium', fontSize: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  retryBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  retryText: { color: '#991B1B', fontFamily: 'NotoSans_700Bold', fontSize: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderTopWidth: 1, borderTopColor: '#EEF2F7' },
  input: { flex: 1, height: 44, borderRadius: 14, paddingHorizontal: 14, color: '#111827', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7', fontFamily: 'NotoSans_400Regular' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF2F7' },
  sendBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  orderBtn: { marginTop: 4, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  orderBtnText: { color: '#FFFFFF', fontFamily: 'NotoSans_700Bold', fontSize: 13 },
  dayDivider: { alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', marginVertical: 4 },
  dayDividerText: { color: '#6B7280', fontFamily: 'NotoSans_600SemiBold', fontSize: 11 },
  scrollFab: { position: 'absolute', right: 16, bottom: 100, width: 40, height: 40, borderRadius: 20, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  replyBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEF2F7', backgroundColor: '#F9FAFB' },
  replyLabel: { fontFamily: 'NotoSans_700Bold', fontSize: 11, color: '#6B7280' },
  replyText: { fontFamily: 'NotoSans_500Medium', fontSize: 12, color: '#111827' },
  replyClose: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
});


