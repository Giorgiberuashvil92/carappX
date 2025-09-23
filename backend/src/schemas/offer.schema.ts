import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  providerName: string;

  @Prop({ required: true })
  priceGEL: number;

  @Prop()
  originalPrice?: number;

  @Prop({ required: true })
  etaMin: number; // estimated time in minutes

  @Prop()
  distanceKm?: number;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ required: true })
  partnerId: string;

  @Prop({ type: Object, required: true })
  targeting: {
    serviceTypes?: string[];
    carMakes?: string[];
    carModels?: string[];
    city?: string;
  };

  @Prop()
  imageUrl?: string;

  @Prop()
  validFrom?: number;

  @Prop()
  validUntil?: number;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: 0 })
  viewCount: number;

  @Prop({ required: true, default: 0 })
  clickCount: number;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

// Indexes for better performance
OfferSchema.index({ partnerId: 1 });
OfferSchema.index({ isActive: 1 });
OfferSchema.index({ priceGEL: 1 });
OfferSchema.index({ 'targeting.serviceTypes': 1 });
OfferSchema.index({ 'targeting.city': 1 });
OfferSchema.index({ createdAt: -1 });
