import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  createdAt: number;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Indexes for better performance
LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
LikeSchema.index({ postId: 1 });
LikeSchema.index({ createdAt: -1 });
