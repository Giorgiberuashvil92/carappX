import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Image, Text, TouchableWithoutFeedback, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Story } from '../../types/story';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
};

export default function StoryOverlay({ visible, stories, initialIndex, onClose }: Props) {
  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const currentStory = stories[storyIndex];
  const currentItem = currentStory?.items[itemIndex];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hadError, setHadError] = useState(false);
  const minHeight = height * 0.65;
  const maxHeight = height * 0.85;
  // 0 => expanded (85%), range => collapsed (65%)
  const sheetOffset = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const itemProgress = useRef(new Animated.Value(0)).current;
  const range = maxHeight - minHeight;
  const gestureStartY = useRef(0);
  const isVerticalDrag = useRef(false);
  const startOffset = useRef(0);
  // Drag enabled anywhere on the sheet (no restricted zone)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, g) => {
        gestureStartY.current = g.y0;
        isVerticalDrag.current = false;
        // ვუშვებთ დრეგს მთლიანი მოდალიდან
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
        // capture starting offset for relative movement
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
              {currentItem?.type === 'image' ? (
                <>
                  <Image 
                    source={{ uri: currentItem.uri }} 
                    style={styles.media} 
                    resizeMode="cover"
                    onLoad={() => setHadError(false)}
                    onError={() => { setHadError(true); console.warn('Story image load error:', currentItem.uri); }}
                  />
                  {hadError && (
                    <>
                      <Image 
                        source={require('../../assets/images/car-bg.png')}
                        style={styles.media}
                        resizeMode="cover"
                      />
                      <View style={styles.fallback}> 
                        <Ionicons name="image" size={28} color="#9CA3AF" />
                        <Text style={styles.fallbackText}>ვერ იტვირთა სურათი</Text>
                      </View>
                    </>
                  )}
                </>
              ) : null}

              {/* caption */}
              {currentItem?.caption ? (
                <View style={styles.captionWrap}>
                  <Text style={styles.caption}>{currentItem.caption}</Text>
                </View>
              ) : null}
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
});


