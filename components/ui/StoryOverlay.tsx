import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Image, Text, TouchableWithoutFeedback, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../config/api';
import type { Story } from '../../types/story';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  viewerUserId?: string; // to mark seen per user
};

export default function StoryOverlay({ visible, stories, initialIndex, onClose, viewerUserId }: Props) {
  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const currentStory = stories[storyIndex];
  const currentItem = currentStory?.items[itemIndex];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hadError, setHadError] = useState(false);

  // Debug: log current item when it changes
  useEffect(() => {
    console.log('🔍 StoryOverlay Debug:', {
      visible,
      storyIndex,
      itemIndex,
      currentStory: currentStory ? {
        id: currentStory.id,
        author: currentStory.author?.name,
        itemsCount: currentStory.items?.length,
        items: currentStory.items?.map((it: any) => ({
          id: it.id,
          type: it.type,
          uri: it.uri,
          hasUri: !!it.uri,
        })),
      } : null,
      currentItem: currentItem ? {
        id: currentItem.id,
        type: currentItem.type,
        uri: currentItem.uri,
        hasUri: !!currentItem.uri,
        caption: currentItem.caption,
      } : null,
    });
  }, [visible, storyIndex, itemIndex, currentItem?.id, currentStory?.id]);
  // Always open at 80% height
  const minHeight = height * 0.8;
  const maxHeight = height * 0.8;
  // 0 => expanded (85%), range => collapsed (65%)
  const sheetOffset = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const itemProgress = useRef(new Animated.Value(0)).current;
  const range = maxHeight - minHeight;
  const gestureStartY = useRef(0);
  const isVerticalDrag = useRef(false);
  const startOffset = useRef(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [recentViewers, setRecentViewers] = useState<Array<{ userId: string; viewedAt: number }>>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [showViewers, setShowViewers] = useState(false);
  const viewersSheet = useRef(new Animated.Value(1)).current; // 1 => hidden, 0 => visible
  const viewersHiddenOffset = Math.round(height * 0.6); 
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, g) => {
        gestureStartY.current = g.y0;
        isVerticalDrag.current = false;
        return true;
      },
      onMoveShouldSetPanResponder: (_, g) => {
        const vertical = Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5;
        isVerticalDrag.current = vertical;
        return vertical;
      },
      onPanResponderMove: (_, g) => {
        if (!isVerticalDrag.current) return;
        const next = Math.max(0, Math.min(range, startOffset.current + g.dy));
        sheetOffset.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        if (!isVerticalDrag.current) return;
        const pulledDown = g.dy > 120 && g.vy > 0.25;
        if (pulledDown) {
          Animated.parallel([
            Animated.timing(sheetOffset, { toValue: range + 40, duration: 220, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => onClose());
          return;
        }
        const mid = range / 2;
        const current = startOffset.current + g.dy;
        const target = current <= mid ? 0 : range;
        Animated.spring(sheetOffset, { toValue: target, useNativeDriver: true, bounciness: 6 }).start();
      },
      onPanResponderGrant: () => {
        startOffset.current = (sheetOffset as any)._value ?? 0;
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) return;
    setStoryIndex(initialIndex);
    setItemIndex(0);
    setHadError(false);
    // animate sheet in: start a bit lower then snap to min position
    sheetOffset.setValue(range + 40);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(sheetOffset, { toValue: range, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!visible || !currentItem) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const duration = currentItem.durationMs ?? 5000;
    timerRef.current = setTimeout(() => handleNext(), duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, storyIndex, itemIndex, currentItem?.id]);

  // Prefetch image to detect failures earlier
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!visible || !currentItem || currentItem.type !== 'image') return;
      try {
        setHadError(false);
        const ok = await Image.prefetch(currentItem.uri);
        if (!ok && !cancelled) setHadError(true);
      } catch {
        if (!cancelled) setHadError(true);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [visible, storyIndex, itemIndex, currentItem?.id]);

  // header progress animation per item
  useEffect(() => {
    if (!visible || !currentItem) return;
    itemProgress.stopAnimation();
    itemProgress.setValue(0);
    const duration = currentItem.durationMs ?? 5000;
    Animated.timing(itemProgress, { toValue: 1, duration, useNativeDriver: false }).start();
  }, [visible, storyIndex, itemIndex, currentItem?.id]);

  const handleNext = () => {
    if (!currentStory) return;
    if (itemIndex < currentStory.items.length - 1) {
      setItemIndex(itemIndex + 1);
    } else if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setItemIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!currentStory) return;
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
    } else if (storyIndex > 0) {
      const prevStory = stories[storyIndex - 1];
      setStoryIndex(storyIndex - 1);
      setItemIndex(Math.max(0, prevStory.items.length - 1));
    } else {
      onClose();
    }
  };

  const onTap = (x: number) => {
    if (x < width / 2) handlePrev();
    else handleNext();
  };

  const total = currentStory?.items.length ?? 0;

  // Fetch views meta for current story
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!visible || !currentStory?.id) return;
        const res = await fetch(`${API_BASE_URL}/stories/${encodeURIComponent(String(currentStory.id))}/views?limit=10`);
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        setViewsCount(Number(json?.viewsCount || 0));
        const list = Array.isArray(json?.data) ? json.data : [];
        setRecentViewers(list as Array<{ userId: string; viewedAt: number }>);
      } catch {}
    })();
    return () => { active = false; };
  }, [visible, currentStory?.id]);

  // Mark seen whenever story changes while overlay is open
  useEffect(() => {
    (async () => {
      try {
        if (!visible || !currentStory?.id || !viewerUserId) return;
        await fetch(`${API_BASE_URL}/stories/${encodeURIComponent(String(currentStory.id))}/seen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: viewerUserId }),
        }).catch(() => {});
      } catch {}
    })();
  }, [visible, currentStory?.id, viewerUserId]);

  // animate viewers sheet
  useEffect(() => {
    Animated.timing(viewersSheet, {
      toValue: showViewers ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [showViewers]);

  // resolve viewer names
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ids = Array.from(new Set(recentViewers.map((v) => v.userId))).filter(Boolean);
        if (ids.length === 0) { if (!cancelled) setUserNames({}); return; }
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}`);
              const json = await res.json().catch(() => ({}));
              const u = (json && json.data) ? json.data : json;
              const display = u?.firstName || u?.name || u?.phone || id;
              return [id, String(display)] as const;
            } catch {
              return [id, id] as const;
            }
          })
        );
        if (!cancelled) setUserNames(Object.fromEntries(results));
      } catch {
        if (!cancelled) setUserNames({});
      }
    })();
    return () => { cancelled = true; };
  }, [recentViewers]);

  return (
    <Modal visible={visible} animationType="fade" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={styles.overlayRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { height: maxHeight, transform: [{ translateY: sheetOffset }] }]} {...panResponder.panHandlers}>
          <TouchableWithoutFeedback onPress={(e) => onTap(e.nativeEvent.locationX)}>
            <View style={styles.card}>
              <View style={styles.dragHandle}>
                <View style={styles.dragBar} />
              </View>
              <View style={styles.headerOverlay}>
                <View style={styles.headerBar}>
                  <View style={styles.headerLeft}>
                    <View style={styles.headerAvatar} />
                    <Text style={styles.headerTitle}>{currentStory?.author.name ?? ''}</Text>
                  </View>
                  <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.headerClose}><Ionicons name="close" size={20} color="#fff" /></View>
                  </TouchableWithoutFeedback>
                </View>
                <View style={styles.headerProgressTrack}>
                  <Animated.View style={[styles.headerProgressFill, { width: itemProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                </View>
              </View>

              {/* media */}
              {!currentStory?.items || currentStory.items.length === 0 ? (
                <View style={styles.fallback}> 
                  <Ionicons name="images-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.fallbackText}>სთორს არ აქვს კონტენტი</Text>
                  <Text style={[styles.fallbackText, { fontSize: 12, marginTop: 8, opacity: 0.7 }]}>
                    სთორი ცარიელია
                  </Text>
                </View>
              ) : currentItem?.type === 'image' && currentItem?.uri ? (
                <>
                  <Image 
                    source={{ uri: currentItem.uri }} 
                    style={styles.media} 
                    resizeMode="contain"
                    onLoad={() => {
                      setHadError(false);
                      console.log('✅ Story image loaded successfully:', currentItem.uri);
                    }}
                    onError={(error) => { 
                      setHadError(true); 
                      console.warn('❌ Story image load error:', currentItem.uri, error);
                    }}
                  />
                  {hadError && (
                    <View style={styles.fallback}> 
                      <Image 
                        source={require('../../assets/images/car-bg.png')}
                        style={styles.media}
                        resizeMode="cover"
                      />
                      <View style={[styles.fallback, { backgroundColor: 'rgba(0,0,0,0.5)' }]}> 
                        <Ionicons name="image" size={28} color="#9CA3AF" />
                        <Text style={styles.fallbackText}>ვერ იტვირთა სურათი</Text>
                      </View>
                    </View>
                  )}
                </>
              ) : currentItem?.type === 'image' && !currentItem?.uri ? (
                <View style={styles.fallback}> 
                  <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.fallbackText}>სურათი არ მოიძებნა</Text>
                </View>
              ) : null}

              {/* caption */}
              {currentItem?.caption ? (
                <View style={styles.captionWrap}>
                  <Text style={styles.caption}>{currentItem.caption}</Text>
                </View>
              ) : null}

              {/* views badge */}
              <TouchableWithoutFeedback onPress={() => setShowViewers(true)}>
                <View style={styles.viewsBadge}>
                  <Ionicons name="eye-outline" size={14} color="#fff" />
                  <Text style={styles.viewsText}>{viewsCount}</Text>
                </View>
              </TouchableWithoutFeedback>

              {/* viewers bottom sheet */}
              <Animated.View
                pointerEvents={showViewers ? 'auto' : 'none'}
                style={[
                  styles.viewersSheet,
                  { height: viewersHiddenOffset },
                  { transform: [{ translateY: viewersSheet.interpolate({ inputRange: [0,1], outputRange: [0, viewersHiddenOffset] }) }] },
                ]}
              >
                <View style={styles.viewersHeader}>
                  <View style={styles.viewersHandle} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.viewersTitle}>Viewed by</Text>
                    <TouchableWithoutFeedback onPress={() => setShowViewers(false)}>
                      <View style={styles.viewersClose}><Ionicons name="close" size={18} color="#fff" /></View>
                    </TouchableWithoutFeedback>
                  </View>
                </View>
                <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
                  {recentViewers.length === 0 ? (
                    <Text style={styles.viewerRowText}>No views yet</Text>
                  ) : (
                    recentViewers.map((v) => (
                      <View key={`${v.userId}-${v.viewedAt}`} style={styles.viewerRow}>
                        <View style={styles.viewerAvatar} />
                        <Text style={styles.viewerRowText}>{userNames[v.userId] || v.userId}</Text>
                        <Text style={styles.viewerTime}>{new Date(v.viewedAt).toLocaleTimeString()}</Text>
                      </View>
                    ))
                  )}
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject as any, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { width: '100%', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  card: { flex: 1 },
  dragHandle: { position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  dragBar: { width: 46, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.35)' },
  headerBar: { marginTop: 22, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerOverlay: { position: 'absolute', top: 12, left: 0, right: 0, zIndex: 5 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)' },
  headerTitle: { color: '#fff', fontWeight: '700' },
  headerClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerProgressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 10, marginHorizontal: 14, borderRadius: 2 },
  headerProgressFill: { height: 3, backgroundColor: '#fff', borderRadius: 2 },
  media: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  captionWrap: { position: 'absolute', left: 16, right: 16, bottom: 110 },
  caption: { color: '#fff', fontSize: 14, lineHeight: 20 },
  fallback: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0E' },
  fallbackText: { color: '#9CA3AF', marginTop: 8 },
  viewsBadge: { position: 'absolute', right: 12, bottom: 20, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewsText: { color: '#fff', fontWeight: '600' },
  viewersPanel: { position: 'absolute', right: 12, bottom: 60, width: 220, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 10, gap: 8 },
  viewersTitle: { color: '#fff', fontWeight: '700', marginBottom: 4 },
  viewerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewerAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.35)' },
  viewerRowText: { color: '#fff', flex: 1, marginLeft: 8 },
  viewerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  viewersSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 10 },
  viewersHeader: { paddingHorizontal: 12, paddingBottom: 8 },
  viewersHandle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', marginBottom: 8 },
  viewersClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});


