import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PushLogDocument = PushLog & Document;

@Schema({ timestamps: true })
export class PushLog {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Object })
  data?: any;

  @Prop({ required: true })
  status: 'sent' | 'delivered' | 'failed';

  @Prop()
  errorMessage?: string;

  @Prop()
  sentAt?: number;

  @Prop()
  deliveredAt?: number;

  @Prop({ required: true })
  createdAt: number;
}

export const PushLogSchema = SchemaFactory.createForClass(PushLog);

// Indexes for better performance
PushLogSchema.index({ userId: 1 });
PushLogSchema.index({ status: 1 });
PushLogSchema.index({ createdAt: -1 });
