import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../contexts/UserContext';

interface CommunityPost {
  id: string;
  userName: string;
  userInitial: string;
  postTime: string;
  postText: string;
  postImage?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: '1',
    userName: 'გიორგი',
    userInitial: 'გ',
    postTime: '2 საათის წინ',
    postText: 'ვინმემ იცის სად შეიძლება BMW-სთვის ხარისხიანი ზეთი იყიდოს? ფასი მნიშვნელოვანი არ არის, მთავარია ხარისხი იყოს! 🚗',
    postImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
    likes: 12,
    comments: 5,
    isLiked: false,
  },
  {
    id: '2',
    userName: 'ნინო',
    userInitial: 'ნ',
    postTime: '5 საათის წინ',
    postText: 'დღეს ჩემი მანქანა სამრეცხაოში ვიყავი, ძალიან კმაყოფილი ვარ! რეკომენდაცია: CAR WASH CENTER - სწრაფი და ხარისხიანი! ✨',
    likes: 8,
    comments: 3,
    isLiked: true,
  },
  {
    id: '3',
    userName: 'ლევანი',
    userInitial: 'ლ',
    postTime: '1 დღის წინ',
    postText: 'ვინმეს ჰქონია Mercedes-ისთვის ტექდათვალიერება? რამდენი ღირს და სად ჯობს წავიდეს? 🤔',
    postImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&auto=format&fit=crop',
    likes: 15,
    comments: 7,
    isLiked: false,
  },
  {
    id: '4',
    userName: 'ანა',
    userInitial: 'ა',
    postTime: '2 დღის წინ',
    postText: 'ჩემი Toyota-სთვის ახალი საბურავები მჭირდება. ვინმემ იცის სად ჯობს იყიდოს? ზამთრის საბურავები მინდა! ❄️',
    likes: 6,
    comments: 4,
    isLiked: false,
  },
  {
    id: '5',
    userName: 'დავითი',
    userInitial: 'დ',
    postTime: '3 დღის წინ',
    postText: 'დღეს ჩემი მანქანა ტექდათვალიერებაზე ვიყავი. ყველაფერი კარგადაა, მაგრამ ზეთის გამოცვლა მჭირდება. რეკომენდაცია გჭირდებათ? 🔧',
    postImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400&auto=format&fit=crop',
    likes: 9,
    comments: 6,
    isLiked: true,
  },
];

export default function CommunityScreen() {
  const { user } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>(COMMUNITY_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostText, setNewPostText] = useState('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const toggleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const renderPost = (post: CommunityPost) => (
    <View key={post.id} style={styles.post}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.userInitial}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.postTime}>{post.postTime}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postText}>{post.postText}</Text>
      
      {post.postImage && (
        <View style={styles.postImageContainer}>
          <Image 
            source={{ uri: post.postImage }} 
            style={styles.postImage} 
          />
        </View>
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => toggleLike(post.id)}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={18} 
            color={post.isLiked ? "#EF4444" : "#6B7280"} 
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {post.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={18} color="#6B7280" />
          <Text style={styles.actionText}>გაზიარება</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>კომუნიტი</Text>
            <Text style={styles.headerSubtitle}>
              მანქანების მოყვარულთა საზოგადოება
            </Text>
          </View>
          <TouchableOpacity style={styles.createPostButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#111827']}
          />
        }
      >
        {/* Create Post Section */}
        <View style={styles.createPostContainer}>
          <View style={styles.createPostHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <TextInput
              style={styles.createPostInput}
              placeholder="რა გაქვს გონებაში?"
              placeholderTextColor="#9CA3AF"
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
            />
          </View>
          <View style={styles.createPostActions}>
            <TouchableOpacity style={styles.createPostAction}>
              <Ionicons name="image-outline" size={20} color="#6B7280" />
              <Text style={styles.createPostActionText}>ფოტო</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createPostAction}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.createPostActionText}>ლოკაცია</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createPostButton, styles.publishButton]}
              disabled={!newPostText.trim()}
            >
              <Text style={styles.publishButtonText}>გამოქვეყნება</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts */}
        <View style={styles.postsContainer}>
          {posts.map(renderPost)}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  createPostButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  createPostContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createPostInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  createPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createPostAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createPostActionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111827',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  postsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  post: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  postText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImageContainer: {
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  likedText: {
    color: '#EF4444',
  },
});
