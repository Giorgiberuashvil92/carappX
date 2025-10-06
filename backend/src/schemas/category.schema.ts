import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  icon?: string;

  @Prop()
  color?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  @Prop()
  parentId?: string;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes for better performance
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ createdAt: -1 });

