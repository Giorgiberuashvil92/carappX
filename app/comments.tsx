import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { communityApi, CommunityComment, CreateCommentData } from '../services/communityApi';
import { communityRealtime } from '../services/communityRealtime';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CommentsScreen() {
  const { user } = useUser();
  const { success, error } = useToast();
  const router = useRouter();
  const { postId, postText, userName, commentsCount } = useLocalSearchParams<{
    postId: string;
    postText: string;
    userName: string;
    commentsCount: string;
  }>();
  
  const [comments, setComments] = useState<(CommunityComment & { likesCount: number; isLiked: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await communityApi.getPostComments(postId, user?.id);
      // Backend now returns comments with likes data
      setComments(fetchedComments as (CommunityComment & { likesCount: number; isLiked: boolean })[]);
    } catch (err) {
      console.error('Error loading comments:', err);
      error('შეცდომა', 'კომენტარების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const fetchedComments = await communityApi.getPostComments(postId, user?.id);
      // Backend now returns comments with likes data
      setComments(fetchedComments as (CommunityComment & { likesCount: number; isLiked: boolean })[]);
    } catch (err) {
      console.error('Error refreshing comments:', err);
      error('შეცდომა', 'კომენტარების განახლება ვერ მოხერხდა');
    } finally {
      setRefreshing(false);
    }
  };

  const submitComment = async () => {
    if (!user?.id || !newComment.trim()) {
      error('შეცდომა', 'კომენტარის ტექსტი აუცილებელია');
      return;
    }

    try {
      setIsSubmitting(true);
      const commentData: CreateCommentData = {
        postId,
        userId: user.id,
        userName: user.name || 'უცნობი მომხმარებელი',
        userInitial: user.name ? user.name.charAt(0).toUpperCase() : '?',
        commentText: newComment.trim(),
      };

      const newCommentResponse = await communityApi.createComment(commentData);
      // Add likes data to new comment
      const newCommentWithLikes = {
        ...newCommentResponse,
        likesCount: 0,
        isLiked: false,
      };
      setComments(prevComments => [...prevComments, newCommentWithLikes]);
      setNewComment('');
      success('წარმატება!', 'კომენტარი დაემატა');
      
      // Update Firebase real-time data
      await communityRealtime.incrementComments(postId);
    } catch (err) {
      console.error('Error creating comment:', err);
      error('შეცდომა', 'კომენტარის დამატება ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    Alert.alert(
      'კომენტარის წაშლა',
      'დარწმუნებული ხართ რომ გსურთ კომენტარის წაშლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityApi.deleteComment(commentId);
              setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
              await communityRealtime.decrementComments(postId);
              success('წარმატება!', 'კომენტარი წაიშალა');
            } catch (err) {
              console.error('Error deleting comment:', err);
              error('შეცდომა', 'კომენტარის წაშლა ვერ მოხერხდა');
            }
          },
        },
      ]
    );
  };

  const showCommentOptions = (commentId: string) => {
    Alert.alert(
      'კომენტარის ოფციები',
      'რა გსურთ გააკეთოთ?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: () => deleteComment(commentId),
        },
      ]
    );
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user?.id) {
      error('შეცდომა', 'მომხმარებლის იდენტიფიკაცია საჭიროა');
      return;
    }

    try {
      const result = await communityApi.toggleCommentLike(commentId, user.id);
      
      // Update local state immediately for better UX
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: result.isLiked,
                likesCount: result.likesCount,
              }
            : comment
        )
      );
    } catch (err) {
      console.error('Error toggling comment like:', err);
      error('შეცდომა', 'ლაიქის დამატება ვერ მოხერხდა');
    }
  };

  const formatTime = (dateString: string): string => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMs = now.getTime() - commentDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'ახლახან';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} წუთის წინ`;
    } else if (diffInHours < 24) {
      return `${diffInHours} საათის წინ`;
    } else if (diffInDays < 7) {
      return `${diffInDays} დღის წინ`;
    } else {
      return commentDate.toLocaleDateString('ka-GE');
    }
  };

  const renderComment = (comment: CommunityComment & { likesCount: number; isLiked: boolean }) => (
    <View key={comment.id} style={styles.comment}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>{comment.userInitial}</Text>
          </View>
          <View>
            <Text style={styles.commentUserName}>{comment.userName}</Text>
            <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => showCommentOptions(comment.id)}>
          <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.commentText}>{comment.commentText}</Text>
      
      {/* Comment Actions */}
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.commentActionButton}
          onPress={() => toggleCommentLike(comment.id)}
        >
          <Ionicons 
            name={comment.isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={comment.isLiked ? "#EF4444" : "#9CA3AF"} 
          />
          <Text style={[styles.commentActionText, comment.isLiked && styles.likedText]}>
            {comment.likesCount || 0}
          </Text>
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>კომენტარები</Text>
            <Text style={styles.headerSubtitle}>
              {commentsCount || '0'} კომენტარი
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity>
              <Ionicons name="share-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Post Preview */}
      <View style={styles.postPreview}>
        <View style={styles.postPreviewHeader}>
          <View style={styles.postPreviewAvatar}>
            <Text style={styles.postPreviewAvatarText}>
              {userName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.postPreviewUserName}>{userName || 'უცნობი'}</Text>
            <Text style={styles.postPreviewTime}>პოსტი</Text>
          </View>
        </View>
        <Text style={styles.postPreviewText} numberOfLines={3}>
          {postText || ''}
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Comments List */}
        <ScrollView 
          style={styles.commentsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#111827']}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#111827" />
              <Text style={styles.loadingText}>კომენტარები იტვირთება...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>კომენტარები არ არის</Text>
              <Text style={styles.emptySubtitle}>იყავი პირველი, ვინც დაწერს კომენტარს!</Text>
            </View>
          ) : (
            comments.map(renderComment)
          )}
          
          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="დაწერე კომენტარი..."
              placeholderTextColor="#9CA3AF"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!newComment.trim() || isSubmitting) && styles.disabledButton
              ]}
              disabled={!newComment.trim() || isSubmitting}
              onPress={submitComment}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  postPreview: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  postPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postPreviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postPreviewAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  postPreviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  postPreviewTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  postPreviewText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  comment: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentActionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  likedText: {
    color: '#EF4444',
  },
  commentInputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
