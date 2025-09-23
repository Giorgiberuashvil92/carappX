import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PushTokenDocument = PushToken & Document;

@Schema({ timestamps: true })
export class PushToken {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  platform: string; // ios, android, web

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop()
  lastUsedAt?: number;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const PushTokenSchema = SchemaFactory.createForClass(PushToken);

// Indexes for better performance
PushTokenSchema.index({ userId: 1 });
PushTokenSchema.index({ token: 1 });
PushTokenSchema.index({ platform: 1 });
PushTokenSchema.index({ isActive: 1 });
PushTokenSchema.index({ createdAt: -1 });
