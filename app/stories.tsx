import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import API_BASE_URL from '../config/api';
import StoryViewer from '../components/ui/StoryViewer';
import type { Story } from '../types/story';

export default function StoriesScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stories?highlight=true`);
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (!active) return;
        const mapped: Story[] = data.map((s: any) => ({
          id: String(s.id || s._id),
          author: { id: String(s.authorId || 'svc'), name: s.authorName || 'Story', avatar: s.authorAvatar },
          createdAt: Number(s.createdAt || Date.now()),
          items: Array.isArray(s.items) ? s.items.map((it: any) => ({ id: String(it.id || Math.random()), type: it.type || 'image', uri: it.uri, durationMs: it.durationMs, caption: it.caption, poll: it.poll })) : [],
          highlight: !!s.highlight,
          category: s.category,
          internalImage: s.internalImage || undefined,
        }));
        setStories(mapped);
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const onOpen = (idx: number) => setOpenIndex(idx);
  const onClose = () => setOpenIndex(null);
  const onNext = () => {
    if (openIndex === null) return;
    if (openIndex < stories.length - 1) setOpenIndex(openIndex + 1);
    else setOpenIndex(null);
  };
  const onPrev = () => {
    if (openIndex === null) return;
    if (openIndex > 0) setOpenIndex(openIndex - 1);
    else setOpenIndex(null);
  };

  useEffect(() => {
    (async () => {
      try {
        if (openIndex === null) return;
        const s = stories[openIndex];
        // This screen doesn't have user context; optionally pass a demo user or skip
        await fetch(`${API_BASE_URL}/stories/${encodeURIComponent(String(s.id))}/seen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'guest' }),
        }).catch(() => {});
      } catch {}
    })();
  }, [openIndex, stories]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0E', paddingTop: 60 }}>
      <Text style={styles.title}>Stories</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => onOpen(index)} activeOpacity={0.8}>
            <View style={styles.storyBubble}>
              <Image source={{ uri: item.internalImage || item.author.avatar || 'https://i.pravatar.cc/100' }} style={styles.storyAvatar} />
            </View>
            <Text numberOfLines={1} style={styles.storyName}>{item.author.name}</Text>
          </TouchableOpacity>
        )}
      />

      {openIndex !== null && (
        <View style={StyleSheet.absoluteFill}>
          <StoryViewer
            story={stories[openIndex]}
            onClose={onClose}
            onNext={onNext}
            onPrev={onPrev}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 16, marginBottom: 12 },
  storyBubble: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#6366F1', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  storyAvatar: { width: 62, height: 62, borderRadius: 31 },
  storyName: { color: '#E5E7EB', fontSize: 12, textAlign: 'center', marginTop: 6, width: 68 },
});


