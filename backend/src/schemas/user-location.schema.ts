import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserLocationDocument = UserLocation & Document;

@Schema({ timestamps: true })
export class UserLocation {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  accuracy?: number;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  createdAt: number;
}

export const UserLocationSchema = SchemaFactory.createForClass(UserLocation);

// Indexes for better performance
UserLocationSchema.index({ userId: 1 });
UserLocationSchema.index({ latitude: 1, longitude: 1 });
UserLocationSchema.index({ timestamp: -1 });
UserLocationSchema.index({ createdAt: -1 });
