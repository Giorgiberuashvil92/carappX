import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestDocument = Request & Document;

@Schema({ timestamps: true })
export class Request {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  location?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  budget?: number;

  @Prop({ type: [String] })
  images?: string[];

  @Prop({ required: true, default: 'open' })
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';

  @Prop()
  assignedTo?: string;

  @Prop()
  completedAt?: number;

  @Prop({ required: true, default: 0 })
  offersCount: number;

  @Prop({ required: true, default: 0 })
  viewsCount: number;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const RequestSchema = SchemaFactory.createForClass(Request);

// Indexes for better performance
RequestSchema.index({ userId: 1 });
RequestSchema.index({ category: 1 });
RequestSchema.index({ status: 1 });
RequestSchema.index({ latitude: 1, longitude: 1 });
RequestSchema.index({ createdAt: -1 });
