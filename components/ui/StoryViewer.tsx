import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Text, TouchableWithoutFeedback, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Story, StoryItem } from '../../types/story';

const { width, height } = Dimensions.get('window');

type Props = {
  story: Story;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export default function StoryViewer({ story, onClose, onNext, onPrev }: Props) {
  const [index, setIndex] = useState(0);
  const item = story.items[index];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const duration = item?.durationMs ?? 5000;

  useEffect(() => {
    if (!item) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNext();
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, item?.id, duration]);

  const handleNext = () => {
    if (index < story.items.length - 1) {
      setIndex(index + 1);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
    } else {
      onPrev();
    }
  };

  const onTap = (x: number) => {
    if (x < width / 2) handlePrev();
    else handleNext();
  };

  const total = story.items.length;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={(e) => onTap(e.nativeEvent.locationX)}>
        <View style={{ flex: 1 }}>
          {/* progress */}
          <View style={styles.progressRow}>
            {new Array(total).fill(0).map((_, i) => (
              <View key={i} style={[styles.progressBar, i <= index && styles.progressBarActive]} />
            ))}
          </View>

          {/* header */}
          <View style={styles.header}>
            <View style={styles.authorRow}>
              <View style={styles.avatar} />
              <Text style={styles.authorName}>{story.author.name}</Text>
            </View>
            <TouchableWithoutFeedback onPress={onClose}>
              <View style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* media */}
          {item?.type === 'image' ? (
            <Image source={{ uri: item.uri }} style={styles.media} resizeMode="cover" />
          ) : null}

          {/* caption */}
          {item?.caption ? (
            <View style={styles.captionWrap}>
              <Text style={styles.caption}>{item.caption}</Text>
            </View>
          ) : null}

          {/* poll */}
          {item?.poll ? (
            <View style={styles.pollWrap}>
              <Text style={styles.pollQ}>{item.poll.question}</Text>
              <View style={{ gap: 8 }}>
                {item.poll.options.map((opt) => (
                  <TouchableWithoutFeedback key={opt.id} onPress={() => { /* local vote only for now */ }}>
                    <View style={styles.pollOpt}>
                      <Text style={styles.pollOptText}>{opt.label}</Text>
                      <Text style={styles.pollOptVotes}>{opt.votes}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  progressRow: { flexDirection: 'row', gap: 6, padding: 8 },
  progressBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2 },
  progressBarActive: { backgroundColor: '#fff' },
  header: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)' },
  authorName: { color: '#fff', fontWeight: '600' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  media: { position: 'absolute', top: 0, left: 0, width, height },
  captionWrap: { position: 'absolute', left: 16, right: 16, bottom: 110 },
  caption: { color: '#fff', fontSize: 14, lineHeight: 20 },
  pollWrap: { position: 'absolute', left: 16, right: 16, bottom: 32, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, padding: 12, gap: 10 },
  pollQ: { color: '#fff', fontWeight: '700' },
  pollOpt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 10 },
  pollOptText: { color: '#fff' },
  pollOptVotes: { color: 'rgba(255,255,255,0.7)' },
});


