import { Injectable } from '@nestjs/common';
import { CreateDismantlerDto } from './dto/create-dismantler.dto';
import { UpdateDismantlerDto } from './dto/update-dismantler.dto';
import { Dismantler } from './entities/dismantler.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class DismantlersService {
  private dismantlers: Dismantler[] = [];
  private readonly collectionName = 'dismantlers';

  constructor(private readonly firebaseService: FirebaseService) {}

  async create(createDismantlerDto: CreateDismantlerDto): Promise<Dismantler> {
    // Validate year range
    if (createDismantlerDto.yearFrom > createDismantlerDto.yearTo) {
      throw new Error('წლიდან არ შეიძლება იყოს უფრო დიდი ვიდრე წლამდე');
    }

    const newDismantler: Dismantler = {
      id: Math.random().toString(36).substr(2, 9),
      brand: createDismantlerDto.brand,
      model: createDismantlerDto.model,
      yearFrom: createDismantlerDto.yearFrom,
      yearTo: createDismantlerDto.yearTo,
      photos: createDismantlerDto.photos || [],
      description: createDismantlerDto.description,
      location: createDismantlerDto.location,
      phone: createDismantlerDto.phone,
      name: createDismantlerDto.name,
      contactInfo: {
        name: createDismantlerDto.contactName || createDismantlerDto.name,
        email: createDismantlerDto.contactEmail || '',
      },
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
        .doc(newDismantler.id)
        .set(newDismantler);

      // Also keep in memory for fast access
      this.dismantlers.push(newDismantler);
      return newDismantler;
    } catch (error) {
      console.error('Error creating dismantler:', error);
      throw new Error('დაშლილების განცხადების შენახვისას მოხდა შეცდომა');
    }
  }

  async findAll(filters?: {
    brand?: string;
    model?: string;
    yearFrom?: number;
    yearTo?: number;
    location?: string;
    status?: string;
  }): Promise<Dismantler[]> {
    try {
      // Load from Firebase if memory is empty
      if (this.dismantlers.length === 0) {
        await this.loadFromFirebase();
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }

    let filtered = this.dismantlers;

    if (filters) {
      if (filters.brand) {
        filtered = filtered.filter((d) =>
          d.brand.toLowerCase().includes(filters.brand!.toLowerCase()),
        );
      }
      if (filters.model) {
        filtered = filtered.filter((d) =>
          d.model.toLowerCase().includes(filters.model!.toLowerCase()),
        );
      }
      if (filters.yearFrom) {
        filtered = filtered.filter((d) => d.yearTo >= filters.yearFrom!);
      }
      if (filters.yearTo) {
        filtered = filtered.filter((d) => d.yearFrom <= filters.yearTo!);
      }
      if (filters.location) {
        filtered = filtered.filter((d) =>
          d.location.toLowerCase().includes(filters.location!.toLowerCase()),
        );
      }
      if (filters.status) {
        filtered = filtered.filter((d) => d.status === filters.status);
      }
    }

    // Sort by featured first, then by creation date
    return filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  findOne(id: string): Dismantler {
    const dismantler = this.dismantlers.find((d) => d.id === id);
    if (!dismantler) {
      throw new Error('დაშლილების განცხადება ვერ მოიძებნა');
    }

    // Increment views
    dismantler.views++;
    dismantler.updatedAt = new Date();

    return dismantler;
  }

  update(id: string, updateDismantlerDto: UpdateDismantlerDto): Dismantler {
    const dismantlerIndex = this.dismantlers.findIndex((d) => d.id === id);
    if (dismantlerIndex === -1) {
      throw new Error('დაშლილების განცხადება ვერ მოიძებნა');
    }

    // Validate year range if updating years
    if (updateDismantlerDto.yearFrom && updateDismantlerDto.yearTo) {
      if (updateDismantlerDto.yearFrom > updateDismantlerDto.yearTo) {
        throw new Error('წლიდან არ შეიძლება იყოს უფრო დიდი ვიდრე წლამდე');
      }
    }

    const updatedDismantler = {
      ...this.dismantlers[dismantlerIndex],
      ...updateDismantlerDto,
      updatedAt: new Date(),
    };

    // Update contact info
    if (updateDismantlerDto.contactName || updateDismantlerDto.contactEmail) {
      updatedDismantler.contactInfo = {
        ...updatedDismantler.contactInfo,
        name:
          updateDismantlerDto.contactName || updatedDismantler.contactInfo.name,
        email:
          updateDismantlerDto.contactEmail ||
          updatedDismantler.contactInfo.email,
      };
    }

    this.dismantlers[dismantlerIndex] = updatedDismantler;
    return updatedDismantler;
  }

  remove(id: string): void {
    const dismantlerIndex = this.dismantlers.findIndex((d) => d.id === id);
    if (dismantlerIndex === -1) {
      throw new Error('დაშლილების განცხადება ვერ მოიძებნა');
    }
    this.dismantlers.splice(dismantlerIndex, 1);
  }

  // Additional utility methods
  getFeatured(): Dismantler[] {
    return this.dismantlers
      .filter((d) => d.isFeatured && d.status === 'active')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  getByBrand(brand: string): Dismantler[] {
    return this.dismantlers
      .filter(
        (d) =>
          d.brand.toLowerCase() === brand.toLowerCase() &&
          d.status === 'active',
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  searchByKeyword(keyword: string): Dismantler[] {
    const searchTerm = keyword.toLowerCase();
    return this.dismantlers.filter(
      (d) =>
        d.status === 'active' &&
        (d.brand.toLowerCase().includes(searchTerm) ||
          d.model.toLowerCase().includes(searchTerm) ||
          d.description.toLowerCase().includes(searchTerm) ||
          d.location.toLowerCase().includes(searchTerm)),
    );
  }

  private async loadFromFirebase(): Promise<void> {
    try {
      const snapshot = await this.firebaseService.db
        .collection(this.collectionName)
        .get();

      this.dismantlers = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Dismantler;
        this.dismantlers.push({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      });
    } catch (error) {
      console.error('Error loading dismantlers from Firebase:', error);
    }
  }
}
