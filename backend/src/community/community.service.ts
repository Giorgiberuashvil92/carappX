/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  CommunityPost,
  CommunityLike,
  CommunityComment,
} from './entities/community-post.entity';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class CommunityService {
  constructor(private readonly firebase: FirebaseService) {}

  // Posts
  async createPost(
    createPostDto: CreateCommunityPostDto,
  ): Promise<CommunityPost> {
    const postId = this.firebase.db.collection('posts').doc().id;
    const post: CommunityPost = {
      id: postId,
      ...createPostDto,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
      likes: [],
      comments: [],
    };

    await this.firebase.db.collection('posts').doc(postId).set(post);
    return post;
  }

  async findAllPosts(): Promise<CommunityPost[]> {
    const snapshot = await this.firebase.db.collection('posts').get();

    // Sort manually instead of using orderBy to avoid index requirement
    const posts = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as CommunityPost,
    );

    return posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findPostById(id: string): Promise<CommunityPost | null> {
    const doc = await this.firebase.db.collection('posts').doc(id).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    } as CommunityPost;
  }

  async updatePost(
    id: string,
    updatePostDto: UpdateCommunityPostDto,
  ): Promise<CommunityPost | null> {
    await this.firebase.db
      .collection('posts')
      .doc(id)
      .update({
        ...updatePostDto,
        updatedAt: new Date().toISOString(),
      });
    return await this.findPostById(id);
  }

  async deletePost(id: string): Promise<boolean> {
    // Delete related likes and comments first
    const likesSnapshot = await this.firebase.db
      .collection('likes')
      .where('postId', '==', id)
      .get();

    const commentsSnapshot = await this.firebase.db
      .collection('comments')
      .where('postId', '==', id)
      .get();

    // Delete likes
    const likeDeletePromises = likesSnapshot.docs.map((doc) =>
      doc.ref.delete(),
    );
    await Promise.all(likeDeletePromises);

    // Delete comments
    const commentDeletePromises = commentsSnapshot.docs.map((doc) =>
      doc.ref.delete(),
    );
    await Promise.all(commentDeletePromises);

    // Delete post
    await this.firebase.db.collection('posts').doc(id).delete();
    return true;
  }

  // Likes
  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    const likesRef = this.firebase.db.collection('likes');
    const existingLikeQuery = await likesRef
      .where('postId', '==', postId)
      .where('userId', '==', userId)
      .get();

    if (!existingLikeQuery.empty) {
      // Remove like
      const likeDoc = existingLikeQuery.docs[0];
      await likeDoc.ref.delete();

      // Update post likes count
      const post = await this.findPostById(postId);
      if (post) {
        post.likesCount = Math.max(0, post.likesCount - 1);
        await this.firebase.db.collection('posts').doc(postId).update({
          likesCount: post.likesCount,
          updatedAt: new Date().toISOString(),
        });
      }

      return { isLiked: false, likesCount: post?.likesCount || 0 };
    } else {
      // Add like
      const newLike: CommunityLike = {
        id: this.firebase.db.collection('likes').doc().id,
        postId,
        userId,
        createdAt: new Date().toISOString() as any,
      };

      await this.firebase.db.collection('likes').doc(newLike.id).set(newLike);

      // Update post likes count
      const post = await this.findPostById(postId);
      if (post) {
        post.likesCount += 1;
        await this.firebase.db.collection('posts').doc(postId).update({
          likesCount: post.likesCount,
          updatedAt: new Date().toISOString(),
        });
      }

      return { isLiked: true, likesCount: post?.likesCount || 0 };
    }
  }

  async getUserLikes(userId: string): Promise<string[]> {
    const likesSnapshot = await this.firebase.db
      .collection('likes')
      .where('userId', '==', userId)
      .get();

    return likesSnapshot.docs.map((doc) => doc.data().postId as string);
  }

  // Comments
  async createComment(
    createCommentDto: CreateCommunityCommentDto,
  ): Promise<CommunityComment> {
    const commentId = this.firebase.db.collection('comments').doc().id;
    const comment: CommunityComment = {
      id: commentId,
      ...createCommentDto,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    };

    await this.firebase.db.collection('comments').doc(commentId).set(comment);

    // Update post comments count
    const post = await this.findPostById(createCommentDto.postId);
    if (post) {
      post.commentsCount += 1;
      await this.firebase.db
        .collection('posts')
        .doc(createCommentDto.postId)
        .update({
          commentsCount: post.commentsCount,
          updatedAt: new Date().toISOString(),
        });
    }

    return comment;
  }

  async getPostComments(
    postId: string,
    userId?: string,
  ): Promise<CommunityComment[]> {
    const snapshot = await this.firebase.db
      .collection('comments')
      .where('postId', '==', postId)
      .get();

    // Sort manually instead of using orderBy to avoid index requirement
    const comments = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as any as CommunityComment,
    );

    // Get likes for each comment
    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        const likes = await this.getCommentLikes(comment.id);
        const isLiked = userId ? likes.includes(userId) : false;
        return {
          ...comment,
          likesCount: likes.length,
          isLiked,
        };
      }),
    );

    return commentsWithLikes.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const commentDoc = await this.firebase.db
      .collection('comments')
      .doc(commentId)
      .get();
    if (!commentDoc.exists) return false;

    const comment = commentDoc.data() as CommunityComment;
    await this.firebase.db.collection('comments').doc(commentId).delete();

    // Update post comments count
    const post = await this.findPostById(comment.postId);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await this.firebase.db.collection('posts').doc(comment.postId).update({
        commentsCount: post.commentsCount,
        updatedAt: new Date().toISOString(),
      });
    }

    return true;
  }

  // Comment Likes
  async toggleCommentLike(
    commentId: string,
    userId: string,
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    const likesRef = this.firebase.db.collection('comment_likes');
    const existingLikeQuery = await likesRef
      .where('commentId', '==', commentId)
      .where('userId', '==', userId)
      .get();

    if (!existingLikeQuery.empty) {
      // Remove like
      const likeDoc = existingLikeQuery.docs[0];
      await likeDoc.ref.delete();

      return { isLiked: false, likesCount: 0 }; // For simplicity, we'll track this separately
    } else {
      // Add like
      const newLike = {
        id: this.firebase.db.collection('comment_likes').doc().id,
        commentId,
        userId,
        createdAt: new Date().toISOString(),
      };

      await this.firebase.db
        .collection('comment_likes')
        .doc(newLike.id)
        .set(newLike);

      return { isLiked: true, likesCount: 1 }; // For simplicity, we'll track this separately
    }
  }

  async getCommentLikes(commentId: string): Promise<string[]> {
    const likesSnapshot = await this.firebase.db
      .collection('comment_likes')
      .where('commentId', '==', commentId)
      .get();

    return likesSnapshot.docs.map((doc) => doc.data().userId as string);
  }

  // Helper method to get posts with user's like status
  async getPostsWithUserLikes(userId: string): Promise<CommunityPost[]> {
    const posts = await this.findAllPosts();
    const userLikes = await this.getUserLikes(userId);

    return posts.map((post) => ({
      ...post,
      isLiked: userLikes.includes(post.id),
    }));
  }
}
