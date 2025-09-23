import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FuelEntryDocument = FuelEntry & Document;

@Schema({ timestamps: true })
export class FuelEntry {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  carId: string;

  @Prop({ required: true })
  date: number;

  @Prop({ required: true })
  fuelType: string;

  @Prop({ required: true })
  amount: number; // ლიტრებში

  @Prop({ required: true })
  price: number; // ლარებში

  @Prop({ required: true })
  totalCost: number;

  @Prop()
  mileage?: number;

  @Prop()
  location?: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const FuelEntrySchema = SchemaFactory.createForClass(FuelEntry);

// Indexes for better performance
FuelEntrySchema.index({ userId: 1 });
FuelEntrySchema.index({ carId: 1 });
FuelEntrySchema.index({ date: -1 });
FuelEntrySchema.index({ createdAt: -1 });
