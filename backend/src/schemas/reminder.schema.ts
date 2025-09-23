import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReminderDocument = Reminder & Document;

@Schema({ timestamps: true })
export class Reminder {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  carId: string;

  @Prop({ required: true })
  type: string; // oil_change, tire_rotation, etc.

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  dueDate: number;

  @Prop({ required: true, default: false })
  isCompleted: boolean;

  @Prop()
  completedAt?: number;

  @Prop()
  mileage?: number;

  @Prop()
  notes?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);

// Indexes for better performance
ReminderSchema.index({ userId: 1 });
ReminderSchema.index({ carId: 1 });
ReminderSchema.index({ dueDate: 1 });
ReminderSchema.index({ isCompleted: 1 });
ReminderSchema.index({ isActive: 1 });
ReminderSchema.index({ createdAt: -1 });
