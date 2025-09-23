import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PartnerTokenDocument = PartnerToken & Document;

@Schema({ timestamps: true })
export class PartnerToken {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  partnerId: string;

  @Prop({ required: true })
  token: string;

  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop()
  expiresAt?: number;

  @Prop()
  lastUsedAt?: number;

  @Prop({ required: true, default: 0 })
  usageCount: number;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const PartnerTokenSchema = SchemaFactory.createForClass(PartnerToken);

// Indexes for better performance
PartnerTokenSchema.index({ partnerId: 1 });
PartnerTokenSchema.index({ token: 1 });
PartnerTokenSchema.index({ isActive: 1 });
PartnerTokenSchema.index({ expiresAt: 1 });
PartnerTokenSchema.index({ createdAt: -1 });
