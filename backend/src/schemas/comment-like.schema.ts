import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommentLikeDocument = CommentLike & Document;

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  commentId: string;

  @Prop({ required: true })
  createdAt: number;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

// Indexes for better performance
CommentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });
CommentLikeSchema.index({ commentId: 1 });
CommentLikeSchema.index({ createdAt: -1 });
