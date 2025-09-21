import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Category, CategoryStats } from './entities/category.entity';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class CategoriesService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.db.collection('categories');
  }

  async findAll(): Promise<Category[]> {
    const snap = await this.col().get();
    return snap.docs.map((d) => d.data() as Category);
  }

  async findPopular(limit: number = 6): Promise<Category[]> {
    const snap = await this.col().limit(limit).get();
    return snap.docs.map((d) => d.data() as Category);
  }

  async findById(id: string): Promise<Category | null> {
    const doc = await this.col().doc(id).get();
    return doc.exists ? (doc.data() as Category) : null;
  }

  async incrementViewCount(id: string): Promise<void> {
    const docRef = this.col().doc(id);
    await docRef.update({
      viewCount: FieldValue.increment(1),
      updatedAt: Date.now(),
    });
  }

  async incrementClickCount(id: string): Promise<void> {
    const docRef = this.col().doc(id);
    await docRef.update({
      clickCount: FieldValue.increment(1),
      updatedAt: Date.now(),
    });
  }

  async updatePopularity(id: string): Promise<void> {
    const category = await this.findById(id);
    if (!category) return;

    // Calculate popularity based on views, clicks, and recency
    const now = Date.now();
    const daysSinceCreated = (now - category.createdAt) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceCreated / 365); // Decay over 1 year

    const popularity =
      category.viewCount * 0.3 + category.clickCount * 0.7 + recencyScore * 100;

    await this.col()
      .doc(id)
      .update({
        popularity: Math.round(popularity),
        updatedAt: Date.now(),
      });
  }

  async getCategoryStats(id: string): Promise<CategoryStats> {
    // This would typically aggregate data from other collections
    // For now, return mock data
    return {
      totalServices: Math.floor(Math.random() * 100) + 10,
      averageRating: 4.0 + Math.random() * 1.0,
      totalBookings: Math.floor(Math.random() * 1000) + 50,
      lastUpdated: Date.now(),
    };
  }

  async create(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Category> {
    const id = `cat_${Date.now()}`;
    const newCategory: Category = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      popularity: 0,
      viewCount: 0,
      clickCount: 0,
      ...category,
    };

    await this.col().doc(id).set(newCategory);
    return newCategory;
  }

  async update(id: string, updates: Partial<Category>): Promise<void> {
    await this.col()
      .doc(id)
      .update({
        ...updates,
        updatedAt: Date.now(),
      });
  }

  async delete(id: string): Promise<void> {
    await this.col().doc(id).update({
      isActive: false,
      updatedAt: Date.now(),
    });
  }
}
