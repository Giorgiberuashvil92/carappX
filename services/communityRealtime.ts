import { db } from '../config/firebase';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

export interface CommunityRealtimeData {
  postId: string;
  likesCount: number;
  commentsCount: number;
  lastUpdated: number;
}

class CommunityRealtimeService {
  private listeners: Map<string, () => void> = new Map();

  // Listen to real-time updates for a specific post
  subscribeToPost(postId: string, callback: (data: CommunityRealtimeData) => void) {
    const postRef = doc(db, 'community_posts', postId);
    
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as CommunityRealtimeData;
        callback(data);
      }
    });

    // Store the unsubscribe function
    this.listeners.set(postId, unsubscribe);
    return unsubscribe;
  }

  // Update post stats in real-time
  async updatePostStats(postId: string, updates: Partial<CommunityRealtimeData>) {
    try {
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        ...updates,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error updating post stats:', error);
    }
  }

  // Increment likes count
  async incrementLikes(postId: string) {
    try {
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        likesCount: increment(1),
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  }

  // Decrement likes count
  async decrementLikes(postId: string) {
    try {
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        likesCount: increment(-1),
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error decrementing likes:', error);
    }
  }

  // Increment comments count
  async incrementComments(postId: string) {
    try {
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1),
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error incrementing comments:', error);
    }
  }

  // Decrement comments count
  async decrementComments(postId: string) {
    try {
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1),
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error decrementing comments:', error);
    }
  }

  // Unsubscribe from a specific post
  unsubscribeFromPost(postId: string) {
    const unsubscribe = this.listeners.get(postId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(postId);
    }
  }

  // Unsubscribe from all posts
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }
}

export const communityRealtime = new CommunityRealtimeService();
