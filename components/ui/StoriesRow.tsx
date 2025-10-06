import React from 'react';
import { View, FlatList, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  stories: Array<{ id: string; author: { avatar?: string; name: string }; seen?: boolean }>;
  onOpen: (index: number) => void;
  onCreate?: () => void;
  title?: string;
};

export default function StoriesRow({ stories, onOpen, onCreate, title = 'ისტორიები' }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {onCreate ? (
          <TouchableOpacity onPress={onCreate} activeOpacity={0.8}>
            <View style={styles.addBtn}><Text style={styles.addText}>+</Text></View>
          </TouchableOpacity>
        ) : null}
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onOpen(stories.findIndex((s) => s.id === item.id))} activeOpacity={0.85}>
            {item.seen ? (
              <View style={styles.storyBubbleSeen}>
                <Image source={{ uri: item.author.avatar || 'https://i.pravatar.cc/100' }} style={styles.storyAvatar} />
              </View>
            ) : (
              <LinearGradient colors={["#F59E0B", "#EF4444", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.storyBubble}>
                <View style={styles.storyInner}> 
                  <Image source={{ uri: item.author.avatar || 'https://i.pravatar.cc/100' }} style={styles.storyAvatar} />
                </View>
              </LinearGradient>
            )}
            <Text numberOfLines={1} style={styles.storyName}>{item.author.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: '#111827', fontWeight: '700', fontSize: 16 },
  addBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 18, marginTop: -2 },
  storyBubble: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  storyInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#0B0B0E', alignItems: 'center', justifyContent: 'center' },
  storyBubbleSeen: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(17,24,39,0.2)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  storyAvatar: { width: 58, height: 58, borderRadius: 29 },
  storyName: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 6, width: 64 },
});


