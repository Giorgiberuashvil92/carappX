import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  receiverId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String] })
  attachments?: string[];

  @Prop({ required: true, default: 'text' })
  type: 'text' | 'image' | 'file' | 'offer';

  @Prop()
  offerId?: string;

  @Prop({ required: true, default: false })
  isRead: boolean;

  @Prop()
  readAt?: number;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: number;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for better performance
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });
MessageSchema.index({ offerId: 1 });
MessageSchema.index({ createdAt: -1 });
