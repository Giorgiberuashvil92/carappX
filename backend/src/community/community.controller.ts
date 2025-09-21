import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Posts
  @Post('posts')
  async createPost(@Body() createPostDto: CreateCommunityPostDto) {
    console.log('[API] POST /community/posts body =', createPostDto);

    if (!createPostDto.userId || !createPostDto.postText?.trim()) {
      throw new BadRequestException('userId and postText are required');
    }

    try {
      const post = await this.communityService.createPost({
        ...createPostDto,
        postText: createPostDto.postText.trim(),
      });
      return post;
    } catch (err) {
      console.log('[API] /community/posts error:', err);
      throw err;
    }
  }

  @Get('posts')
  async getPosts(@Query('userId') userId?: string) {
    console.log('[API] GET /community/posts userId =', userId);

    if (userId) {
      return await this.communityService.getPostsWithUserLikes(userId);
    }
    return await this.communityService.findAllPosts();
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string) {
    console.log('[API] GET /community/posts/:id id =', id);
    return await this.communityService.findPostById(id);
  }

  @Patch('posts/:id')
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdateCommunityPostDto,
  ) {
    console.log(
      '[API] PATCH /community/posts/:id id =',
      id,
      'body =',
      updatePostDto,
    );

    if (
      updatePostDto.postText !== undefined &&
      !updatePostDto.postText.trim()
    ) {
      throw new BadRequestException('postText cannot be empty');
    }

    try {
      const post = await this.communityService.updatePost(id, {
        ...updatePostDto,
        postText: updatePostDto.postText?.trim(),
      });

      if (!post) {
        throw new BadRequestException('Post not found');
      }

      return post;
    } catch (err) {
      console.log('[API] /community/posts/:id error:', err);
      throw err;
    }
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    console.log('[API] DELETE /community/posts/:id id =', id);

    try {
      const deleted = await this.communityService.deletePost(id);
      if (!deleted) {
        throw new BadRequestException('Post not found');
      }
      return { success: true };
    } catch (err) {
      console.log('[API] /community/posts/:id error:', err);
      throw err;
    }
  }

  // Likes
  @Post('posts/:postId/like')
  async toggleLike(
    @Param('postId') postId: string,
    @Body() body: { userId: string },
  ) {
    console.log(
      '[API] POST /community/posts/:postId/like postId =',
      postId,
      'userId =',
      body.userId,
    );

    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }

    try {
      const result = await this.communityService.toggleLike(
        postId,
        body.userId,
      );
      return result;
    } catch (err) {
      console.log('[API] /community/posts/:postId/like error:', err);
      throw err;
    }
  }

  // Comments
  @Post('posts/:postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommunityCommentDto,
  ) {
    console.log(
      '[API] POST /community/posts/:postId/comments postId =',
      postId,
      'body =',
      createCommentDto,
    );

    if (!createCommentDto.userId || !createCommentDto.commentText?.trim()) {
      throw new BadRequestException('userId and commentText are required');
    }

    try {
      const comment = await this.communityService.createComment({
        ...createCommentDto,
        postId,
        commentText: createCommentDto.commentText.trim(),
      });
      return comment;
    } catch (err) {
      console.log('[API] /community/posts/:postId/comments error:', err);
      throw err;
    }
  }

  @Get('posts/:postId/comments')
  async getPostComments(
    @Param('postId') postId: string,
    @Query('userId') userId?: string,
  ) {
    console.log(
      '[API] GET /community/posts/:postId/comments postId =',
      postId,
      'userId =',
      userId,
    );
    return await this.communityService.getPostComments(postId, userId);
  }

  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string) {
    console.log(
      '[API] DELETE /community/comments/:commentId commentId =',
      commentId,
    );

    try {
      const deleted = await this.communityService.deleteComment(commentId);
      if (!deleted) {
        throw new BadRequestException('Comment not found');
      }
      return { success: true };
    } catch (err) {
      console.log('[API] /community/comments/:commentId error:', err);
      throw err;
    }
  }

  // Comment Likes
  @Post('comments/:commentId/like')
  async toggleCommentLike(
    @Param('commentId') commentId: string,
    @Body() body: { userId: string },
  ) {
    console.log(
      '[API] POST /community/comments/:commentId/like commentId =',
      commentId,
      'userId =',
      body.userId,
    );

    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }

    try {
      const result = await this.communityService.toggleCommentLike(
        commentId,
        body.userId,
      );
      return result;
    } catch (err) {
      console.log('[API] /community/comments/:commentId/like error:', err);
      throw err;
    }
  }

  @Get('comments/:commentId/likes')
  async getCommentLikes(@Param('commentId') commentId: string) {
    console.log(
      '[API] GET /community/comments/:commentId/likes commentId =',
      commentId,
    );
    return await this.communityService.getCommentLikes(commentId);
  }
}
