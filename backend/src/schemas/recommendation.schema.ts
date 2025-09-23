import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecommendationDocument = Recommendation & Document;

@Schema({ timestamps: true })
export class Recommendation {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  type: string; // service, product, tip, etc.

  @Prop({ required: true })
  providerName: string;

  @Prop({ required: true })
  priceGEL: number;

  @Prop()
  etaMin?: number;

  @Prop()
  distanceKm?: number;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop()
  partnerId?: string;

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
  linkUrl?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop()
  priority?: number;

  @Prop()
  validFrom?: number;

  @Prop()
  validUntil?: number;

  @Prop({ required: true })
  createdAt: number;
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);

// Indexes for better performance
RecommendationSchema.index({ type: 1 });
RecommendationSchema.index({ isActive: 1 });
RecommendationSchema.index({ priority: -1 });
RecommendationSchema.index({ 'targeting.serviceTypes': 1 });
RecommendationSchema.index({ 'targeting.city': 1 });
RecommendationSchema.index({ createdAt: -1 });
