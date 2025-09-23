import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CarDocument = Car & Document;

@Schema({ timestamps: true })
export class Car {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  make: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  licensePlate: string;

  @Prop()
  color?: string;

  @Prop()
  vin?: string;

  @Prop()
  engineType?: string;

  @Prop()
  fuelType?: string;

  @Prop()
  mileage?: number;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const CarSchema = SchemaFactory.createForClass(Car);

// Indexes for better performance
CarSchema.index({ userId: 1 });
CarSchema.index({ licensePlate: 1 });
CarSchema.index({ isActive: 1 });
CarSchema.index({ createdAt: -1 });
