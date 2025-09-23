import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommunityPostDocument = CommunityPost & Document;

@Schema({ timestamps: true })
export class CommunityPost {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String] })
  images?: string[];

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ required: true, default: 0 })
  likesCount: number;

  @Prop({ required: true, default: 0 })
  commentsCount: number;

  @Prop({ required: true, default: 0 })
  viewsCount: number;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop()
  category?: string;

  @Prop()
  location?: string;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const CommunityPostSchema = SchemaFactory.createForClass(CommunityPost);

// Indexes for better performance
CommunityPostSchema.index({ userId: 1 });
CommunityPostSchema.index({ isActive: 1 });
CommunityPostSchema.index({ category: 1 });
CommunityPostSchema.index({ likesCount: -1 });
CommunityPostSchema.index({ createdAt: -1 });
