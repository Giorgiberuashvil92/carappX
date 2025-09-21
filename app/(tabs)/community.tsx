import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { communityApi, CommunityPost, CreatePostData } from '../../services/communityApi';
import { communityRealtime } from '../../services/communityRealtime';
import { useRouter } from 'expo-router';

// Helper function to format time
const formatTime = (dateString: string): string => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return 'ახლახან';
  } else if (diffInHours < 24) {
    return `${diffInHours} საათის წინ`;
  } else if (diffInDays < 7) {
    return `${diffInDays} დღის წინ`;
  } else {
    return postDate.toLocaleDateString('ka-GE');
  }
};

export default function CommunityScreen() {
  const { user } = useUser();
  const { success, error, info } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [realtimeSubscriptions, setRealtimeSubscriptions] = useState<Map<string, () => void>>(new Map());

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Reload posts when screen comes into focus (e.g., returning from comments)
  // Note: useFocusEffect is from @react-navigation/native, but we're using Expo Router
  // For now, we'll rely on the useEffect and manual refresh

  // Cleanup real-time subscriptions on unmount
  useEffect(() => {
    return () => {
      realtimeSubscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await communityApi.getPosts(user?.id);
      setPosts(fetchedPosts);
      
      // Set up real-time listeners for each post
      setupRealtimeListeners(fetchedPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
      error('შეცდომა', 'პოსტების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = (posts: CommunityPost[]) => {
    // Clean up existing subscriptions
    realtimeSubscriptions.forEach((unsubscribe) => unsubscribe());
    
    const newSubscriptions = new Map<string, () => void>();
    
    posts.forEach((post) => {
      const unsubscribe = communityRealtime.subscribeToPost(post.id, (data) => {
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? {
                  ...p,
                  likesCount: data.likesCount,
                  commentsCount: data.commentsCount,
                }
              : p
          )
        );
      });
      
      newSubscriptions.set(post.id, unsubscribe);
    });
    
    setRealtimeSubscriptions(newSubscriptions);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedPosts = await communityApi.getPosts(user?.id);
      setPosts(fetchedPosts);
      success('განახლდა!', 'კომუნიტის პოსტები განახლდა');
    } catch (err) {
      console.error('Error refreshing posts:', err);
      error('შეცდომა', 'პოსტების განახლება ვერ მოხერხდა');
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, success, error]);

  const toggleLike = async (postId: string) => {
    if (!user?.id) {
      error('შეცდომა', 'მომხმარებლის იდენტიფიკაცია საჭიროა');
      return;
    }

    try {
      const result = await communityApi.toggleLike(postId, user.id);
      
      // Update Firebase real-time data
      if (result.isLiked) {
        await communityRealtime.incrementLikes(postId);
      } else {
        await communityRealtime.decrementLikes(postId);
      }
      
      // Update local state immediately for better UX
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: result.isLiked,
                likesCount: result.likesCount,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      error('შეცდომა', 'ლაიქის დამატება ვერ მოხერხდა');
    }
  };

  const createPost = async () => {
    if (!user?.id || !newPostText.trim()) {
      error('შეცდომა', 'პოსტის ტექსტი აუცილებელია');
      return;
    }

    try {
      setIsCreatingPost(true);
      const postData: CreatePostData = {
        userId: user.id,
        userName: user.name || 'უცნობი მომხმარებელი',
        userInitial: user.name ? user.name.charAt(0).toUpperCase() : '?',
        postText: newPostText.trim(),
      };

      const newPost = await communityApi.createPost(postData);
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setNewPostText('');
      success('წარმატება!', 'პოსტი გამოქვეყნდა');
    } catch (err) {
      console.error('Error creating post:', err);
      error('შეცდომა', 'პოსტის გამოქვეყნება ვერ მოხერხდა');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const deletePost = async (postId: string) => {
    Alert.alert(
      'პოსტის წაშლა',
      'დარწმუნებული ხართ რომ გსურთ პოსტის წაშლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityApi.deletePost(postId);
              setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              success('წარმატება!', 'პოსტი წაიშალა');
            } catch (err) {
              console.error('Error deleting post:', err);
              error('შეცდომა', 'პოსტის წაშლა ვერ მოხერხდა');
            }
          },
        },
      ]
    );
  };

  const showPostOptions = (postId: string) => {
    Alert.alert(
      'პოსტის ოფციები',
      'რა გსურთ გააკეთოთ?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: () => deletePost(postId),
        },
      ]
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
            <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => showPostOptions(post.id)}>
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
            {post.likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push({
            pathname: '/comments',
            params: {
              postId: post.id,
              postText: post.postText,
              userName: post.userName,
              commentsCount: post.commentsCount,
            }
          })}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
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
              style={[styles.createPostButton, styles.publishButton, (!newPostText.trim() || isCreatingPost) && styles.disabledButton]}
              disabled={!newPostText.trim() || isCreatingPost}
              onPress={createPost}
            >
              {isCreatingPost ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.publishButtonText}>გამოქვეყნება</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts */}
        <View style={styles.postsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#111827" />
              <Text style={styles.loadingText}>პოსტები იტვირთება...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>პოსტები არ არის</Text>
              <Text style={styles.emptySubtitle}>იყავი პირველი, ვინც გამოაქვეყნებს პოსტს!</Text>
            </View>
          ) : (
            posts.map(renderPost)
          )}
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
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
