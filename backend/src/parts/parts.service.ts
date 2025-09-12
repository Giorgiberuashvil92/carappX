import { Injectable } from '@nestjs/common';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { Part } from './entities/part.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PartsService {
  private parts: Part[] = [];
  private readonly collectionName = 'parts';

  constructor(private readonly firebaseService: FirebaseService) {}

  async create(createPartDto: CreatePartDto): Promise<Part> {
    const newPart: Part = {
      id: Math.random().toString(36).substr(2, 9),
      title: createPartDto.title,
      description: createPartDto.description,
      category: createPartDto.category,
      condition: createPartDto.condition,
      price: createPartDto.price,
      images: createPartDto.images || [],
      seller: createPartDto.seller,
      location: createPartDto.location,
      phone: createPartDto.phone,
      name: createPartDto.name,
      contactInfo: {
        name: createPartDto.contactName || createPartDto.name,
        email: createPartDto.contactEmail || '',
      },
      brand: createPartDto.brand,
      model: createPartDto.model,
      year: createPartDto.year,
      partNumber: createPartDto.partNumber || '', // Convert undefined to empty string
      warranty: createPartDto.warranty || '', // Convert undefined to empty string
      isNegotiable: createPartDto.isNegotiable || false,
      status: 'pending', // Default to pending for review
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      isFeatured: false,
    };

    try {
      // Save to Firebase
      await this.firebaseService.db
        .collection(this.collectionName)
        .doc(newPart.id)
        .set(newPart);

      // Also keep in memory for fast access
      this.parts.push(newPart);
      return newPart;
    } catch (error) {
      console.error('Error creating part:', error);
      throw new Error('ნაწილის შენახვისას მოხდა შეცდომა');
    }
  }

  async findAll(filters?: {
    category?: string;
    condition?: string;
    brand?: string;
    model?: string;
    location?: string;
    priceRange?: { min: number; max: number };
    status?: string;
  }): Promise<Part[]> {
    try {
      // Load from Firebase if memory is empty
      if (this.parts.length === 0) {
        await this.loadFromFirebase();
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }

    let filtered = this.parts;

    if (filters) {
      if (filters.category) {
        filtered = filtered.filter((p) =>
          p.category.toLowerCase().includes(filters.category!.toLowerCase()),
        );
      }
      if (filters.condition) {
        filtered = filtered.filter((p) => p.condition === filters.condition);
      }
      if (filters.brand) {
        filtered = filtered.filter(
          (p) =>
            p.brand &&
            p.brand.toLowerCase().includes(filters.brand!.toLowerCase()),
        );
      }
      if (filters.model) {
        filtered = filtered.filter(
          (p) =>
            p.model &&
            p.model.toLowerCase().includes(filters.model!.toLowerCase()),
        );
      }
      if (filters.location) {
        filtered = filtered.filter((p) =>
          p.location.toLowerCase().includes(filters.location!.toLowerCase()),
        );
      }
      if (filters.priceRange) {
        filtered = filtered.filter((p) => {
          const price = parseFloat(p.price.replace(/[^\d.]/g, ''));
          return (
            price >= filters.priceRange!.min && price <= filters.priceRange!.max
          );
        });
      }
      if (filters.status) {
        filtered = filtered.filter((p) => p.status === filters.status);
      }
    }

    // Sort by featured first, then by creation date
    return filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  findOne(id: string): Part {
    const part = this.parts.find((p) => p.id === id);
    if (!part) {
      throw new Error('ნაწილი ვერ მოიძებნა');
    }

    // Increment views
    part.views++;
    part.updatedAt = new Date();

    return part;
  }

  update(id: string, updatePartDto: UpdatePartDto): Part {
    const partIndex = this.parts.findIndex((p) => p.id === id);
    if (partIndex === -1) {
      throw new Error('ნაწილი ვერ მოიძებნა');
    }

    const updatedPart = {
      ...this.parts[partIndex],
      ...updatePartDto,
      updatedAt: new Date(),
    };

    // Update contact info
    if (updatePartDto.contactName || updatePartDto.contactEmail) {
      updatedPart.contactInfo = {
        ...updatedPart.contactInfo,
        name: updatePartDto.contactName || updatedPart.contactInfo.name,
        email: updatePartDto.contactEmail || updatedPart.contactInfo.email,
      };
    }

    this.parts[partIndex] = updatedPart;
    return updatedPart;
  }

  remove(id: string): void {
    const partIndex = this.parts.findIndex((p) => p.id === id);
    if (partIndex === -1) {
      throw new Error('ნაწილი ვერ მოიძებნა');
    }
    this.parts.splice(partIndex, 1);
  }

  // Additional utility methods
  getFeatured(): Part[] {
    return this.parts
      .filter((p) => p.isFeatured && p.status === 'active')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  getByCategory(category: string): Part[] {
    return this.parts
      .filter(
        (p) =>
          p.category.toLowerCase() === category.toLowerCase() &&
          p.status === 'active',
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  getByBrand(brand: string): Part[] {
    return this.parts
      .filter(
        (p) =>
          p.brand &&
          p.brand.toLowerCase() === brand.toLowerCase() &&
          p.status === 'active',
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  searchByKeyword(keyword: string): Part[] {
    const searchTerm = keyword.toLowerCase();
    return this.parts.filter(
      (p) =>
        p.status === 'active' &&
        (p.title.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.category.toLowerCase().includes(searchTerm) ||
          (p.brand && p.brand.toLowerCase().includes(searchTerm)) ||
          (p.model && p.model.toLowerCase().includes(searchTerm)) ||
          p.location.toLowerCase().includes(searchTerm)),
    );
  }

  private async loadFromFirebase(): Promise<void> {
    try {
      const snapshot = await this.firebaseService.db
        .collection(this.collectionName)
        .get();

      this.parts = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Part;
        this.parts.push({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      });
    } catch (error) {
      console.error('Error loading parts from Firebase:', error);
    }
  }
}
