import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface CommunitySectionProps {
  posts?: CommunityPost[];
}

const CommunitySection: React.FC<CommunitySectionProps> = ({
  posts = [
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
  ]
}) => {
  const [localPosts, setLocalPosts] = useState<CommunityPost[]>(posts);

  const toggleLike = (postId: string) => {
    setLocalPosts(prevPosts =>
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
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.communityTitleContainer}>
          <Ionicons name="people" size={20} color="#111827" />
          <Text style={styles.sectionTitle}>კომუნიტი</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.sectionAction}>ყველა</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityContent}>
        {localPosts.map((post) => (
          <View key={post.id} style={styles.communityPost}>
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
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  communityTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  sectionAction: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'NotoSans_600SemiBold',
  },
  communityContent: {
    gap: 16,
    paddingRight: 20,
  },
  communityPost: {
    width: 280,
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
    height: 120,
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

export default CommunitySection;
