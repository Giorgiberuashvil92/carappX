// Firebase ამოღებულია ფრონტიდან — დროებითი no-op რეალტაიმის სერვისი

export interface CommunityRealtimeData {
  postId: string;
  likesCount: number;
  commentsCount: number;
  lastUpdated: number;
}

class CommunityRealtimeService {
  private listeners: Map<string, () => void> = new Map();

  // Listen no-op: backend-ზე გადავიტანთ რეალტაიმს მოგვიანებით (e.g. WebSocket)
  subscribeToPost(postId: string, callback: (data: CommunityRealtimeData) => void) {
    const unsubscribe = () => {};
    this.listeners.set(postId, unsubscribe);
    return unsubscribe;
  }

  // Update post stats in real-time
  async updatePostStats(postId: string, updates: Partial<CommunityRealtimeData>) {
    // no-op დროებით
  }

  // Increment likes count
  async incrementLikes(postId: string) {
    // no-op დროებით
  }

  // Decrement likes count
  async decrementLikes(postId: string) {
    // no-op დროებით
  }

  // Increment comments count
  async incrementComments(postId: string) {
    // no-op დროებით
  }

  // Decrement comments count
  async decrementComments(postId: string) {
    // no-op დროებით
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
