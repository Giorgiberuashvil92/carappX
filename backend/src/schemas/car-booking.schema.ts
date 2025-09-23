/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CarBookingDocument = CarBooking & Document;

@Schema({ timestamps: true })
export class CarBooking {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  locationId: string;

  @Prop({ required: true })
  bookingDate: number;

  @Prop({ required: true })
  timeSlot: string;

  @Prop({ required: true })
  services: string[];

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true, default: 'pending' })
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  carInfo?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const CarBookingSchema = SchemaFactory.createForClass(CarBooking);

// Indexes for better performance
CarBookingSchema.index({ userId: 1 });
CarBookingSchema.index({ locationId: 1 });
CarBookingSchema.index({ bookingDate: 1 });
CarBookingSchema.index({ status: 1 });
CarBookingSchema.index({ createdAt: -1 });
