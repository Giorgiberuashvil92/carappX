import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  postId: string;

  @Prop()
  parentCommentId?: string; // for replies

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String] })
  images?: string[];

  @Prop({ required: true, default: 0 })
  likesCount: number;

  @Prop({ required: true, default: 0 })
  repliesCount: number;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes for better performance
CommentSchema.index({ postId: 1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ isActive: 1 });
CommentSchema.index({ createdAt: -1 });
