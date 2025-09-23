import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreDocument = Store & Document;

@Schema({ _id: false })
export class WorkingHours {
  @Prop()
  monday?: string;

  @Prop()
  tuesday?: string;

  @Prop()
  wednesday?: string;

  @Prop()
  thursday?: string;

  @Prop()
  friday?: string;

  @Prop()
  saturday?: string;

  @Prop()
  sunday?: string;
}

@Schema({ _id: false })
export class Coordinates {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

@Schema({ _id: false })
export class ContactInfo {
  @Prop()
  ownerName?: string;

  @Prop()
  managerName?: string;

  @Prop()
  alternativePhone?: string;
}

@Schema({ _id: false })
export class SocialMedia {
  @Prop()
  facebook?: string;

  @Prop()
  instagram?: string;

  @Prop()
  youtube?: string;
}

@Schema({ _id: false })
export class BusinessInfo {
  @Prop()
  yearEstablished?: number;

  @Prop()
  employeeCount?: number;

  @Prop()
  license?: string;
}

@Schema({ timestamps: true })
export class Store {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    required: true,
    enum: ['ავტონაწილები', 'სამართ-დასახურებელი', 'რემონტი', 'სხვა']
  })
  type: 'ავტონაწილები' | 'სამართ-დასახურებელი' | 'რემონტი' | 'სხვა';

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  email?: string;

  @Prop()
  website?: string;

  @Prop({ type: WorkingHours, required: true })
  workingHours: WorkingHours;

  @Prop({ type: Coordinates })
  coordinates?: Coordinates;

  @Prop({ type: [String], required: true })
  services: string[];

  @Prop({ type: [String], required: true })
  specializations: string[];

  @Prop({ type: ContactInfo, required: true })
  contactInfo: ContactInfo;

  @Prop({ type: SocialMedia })
  socialMedia?: SocialMedia;

  @Prop({ type: BusinessInfo, required: true })
  businessInfo: BusinessInfo;

  @Prop({ 
    required: true,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  })
  status: 'active' | 'inactive' | 'pending' | 'suspended';

  @Prop({ required: true, default: false })
  isVerified: boolean;

  @Prop({ required: true, default: false })
  isFeatured: boolean;

  @Prop({ required: true, default: 0 })
  views: number;

  @Prop({ default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  reviewCount?: number;

  // MongoDB timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

// Indexes for better performance
StoreSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
StoreSchema.index({ status: 1 });
StoreSchema.index({ type: 1 });
StoreSchema.index({ rating: -1 });
StoreSchema.index({ isFeatured: 1 });
