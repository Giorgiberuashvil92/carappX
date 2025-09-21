import API_BASE_URL from '../config/api';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userInitial: string;
  postText: string;
  postImage?: string;
  postLocation?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userInitial: string;
  commentText: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  userId: string;
  userName: string;
  userInitial: string;
  postText: string;
  postImage?: string;
  postLocation?: string;
}

export interface CreateCommentData {
  postId: string;
  userId: string;
  userName: string;
  userInitial: string;
  commentText: string;
}

export interface LikeResponse {
  isLiked: boolean;
  likesCount: number;
}

class CommunityApiService {
  private baseUrl = `${API_BASE_URL}/community`;

  // Posts
  async getPosts(userId?: string): Promise<CommunityPost[]> {
    try {
      const url = userId ? `${this.baseUrl}/posts?userId=${userId}` : `${this.baseUrl}/posts`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<CommunityPost | null> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  async createPost(postData: CreatePostData): Promise<CommunityPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePost(postId: string, postData: Partial<CreatePostData>): Promise<CommunityPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Likes
  async toggleLike(postId: string, userId: string): Promise<LikeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Comments
  async getPostComments(postId: string, userId?: string): Promise<CommunityComment[]> {
    try {
      const url = userId ? `${this.baseUrl}/posts/${postId}/comments?userId=${userId}` : `${this.baseUrl}/posts/${postId}/comments`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  async createComment(commentData: CreateCommentData): Promise<CommunityComment> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${commentData.postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Comment Likes
  async toggleCommentLike(commentId: string, userId: string): Promise<LikeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  async getCommentLikes(commentId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}/likes`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching comment likes:', error);
      throw error;
    }
  }
}

export const communityApi = new CommunityApiService();
