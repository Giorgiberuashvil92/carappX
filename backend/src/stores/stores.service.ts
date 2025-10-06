import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './entities/store.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class StoresService {
  private stores: Store[] = [];
  private readonly collectionName = 'stores';

  constructor(private readonly firebaseService: FirebaseService) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const businessInfo: {
      yearEstablished?: number;
      employeeCount?: number;
      license: string;
    } = {
      license: createStoreDto.license || '',
    };

    if (typeof createStoreDto.yearEstablished === 'number') {
      businessInfo.yearEstablished = createStoreDto.yearEstablished;
    }
    if (typeof createStoreDto.employeeCount === 'number') {
      businessInfo.employeeCount = createStoreDto.employeeCount;
    }

    const baseStore: Store = {
      id: Math.random().toString(36).substr(2, 9),
      title: createStoreDto.title,
      description: createStoreDto.description,
      type: createStoreDto.type,
      images: createStoreDto.images || [],
      location: createStoreDto.location,
      address: createStoreDto.address,
      phone: createStoreDto.phone,
      name: createStoreDto.name,
      email: createStoreDto.email || '',
      website: createStoreDto.website || '',
      workingHours: {
        monday: createStoreDto.workingHours || '',
        tuesday: createStoreDto.workingHours || '',
        wednesday: createStoreDto.workingHours || '',
        thursday: createStoreDto.workingHours || '',
        friday: createStoreDto.workingHours || '',
        saturday: createStoreDto.workingHours || '',
        sunday: createStoreDto.workingHours || '',
      },
      services: createStoreDto.services || [],
      specializations: createStoreDto.specializations || [],
      contactInfo: {
        ownerName: createStoreDto.ownerName || '',
        managerName: createStoreDto.managerName || '',
        alternativePhone: createStoreDto.alternativePhone || '',
      },
      socialMedia: {
        facebook: createStoreDto.facebook || '',
        instagram: createStoreDto.instagram || '',
        youtube: createStoreDto.youtube || '',
      },
      businessInfo,
      status: 'pending',
      isVerified: false,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      reviewCount: 0,
    };

    const coordinates =
      createStoreDto.latitude != null && createStoreDto.longitude != null
        ? {
            latitude: createStoreDto.latitude,
            longitude: createStoreDto.longitude,
          }
        : undefined;

    const newStore: Store = {
      ...baseStore,
      ...(coordinates ? { coordinates } : {}),
    };

    try {
      // Save to Firebase
      await this.firebaseService.db
        .collection(this.collectionName)
        .doc(newStore.id)
        .set(newStore);

      // Also keep in memory for fast access
      this.stores.push(newStore);
      return newStore;
    } catch (error) {
      console.error('Error creating store:', error);
      throw new Error('მაღაზიის შენახვისას მოხდა შეცდომა');
    }
  }

  async findAll(filters?: {
    type?: string;
    location?: string;
    status?: string;
  }): Promise<Store[]> {
    try {
      if (this.stores.length === 0) {
        await this.loadFromFirebase();
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }

    let filtered = this.stores;

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter((s) => s.type === filters.type);
      }
      if (filters.location) {
        const locationTerm = filters.location.toLowerCase();
        filtered = filtered.filter((s) =>
          s.location.toLowerCase().includes(locationTerm),
        );
      }
      if (filters.status) {
        filtered = filtered.filter((s) => s.status === filters.status);
      }
    }

    return filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  findOne(id: string): Store {
    const store = this.stores.find((s) => s.id === id);
    if (!store) {
      throw new Error('მაღაზია ვერ მოიძებნა');
    }

    store.views++;
    store.updatedAt = new Date();

    return store;
  }

  searchByKeyword(keyword: string): Store[] {
    const searchTerm = keyword.toLowerCase();
    return this.stores.filter(
      (s) =>
        s.status === 'active' &&
        (s.title.toLowerCase().includes(searchTerm) ||
          s.description.toLowerCase().includes(searchTerm) ||
          s.location.toLowerCase().includes(searchTerm) ||
          s.services.some((service) =>
            service.toLowerCase().includes(searchTerm),
          )),
    );
  }

  private async loadFromFirebase(): Promise<void> {
    try {
      const snapshot = await this.firebaseService.db
        .collection(this.collectionName)
        .get();

      this.stores = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Store;
        this.stores.push({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      });
    } catch (error) {
      console.error('Error loading stores from Firebase:', error);
    }
  }

  async update(id: string, updateStoreDto: Partial<Store>): Promise<Store> {
    try {
      if (this.stores.length === 0) {
        await this.loadFromFirebase();
      }

      const storeIndex = this.stores.findIndex((store) => store.id === id);
      if (storeIndex === -1) {
        throw new Error(`მაღაზია ID: ${id} ვერ მოიძებნა`);
      }

      const updatedStore: Store = {
        ...this.stores[storeIndex],
        ...updateStoreDto,
        updatedAt: new Date(),
      };

      // Update in Firebase
      await this.firebaseService.db
        .collection(this.collectionName)
        .doc(id)
        .set(updatedStore);

      // Update in memory
      this.stores[storeIndex] = updatedStore;

      return updatedStore;
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (this.stores.length === 0) {
        await this.loadFromFirebase();
      }

      const storeIndex = this.stores.findIndex((store) => store.id === id);
      if (storeIndex === -1) {
        throw new Error(`მაღაზია ID: ${id} ვერ მოიძებნა`);
      }

      // Delete from Firebase
      await this.firebaseService.db
        .collection(this.collectionName)
        .doc(id)
        .delete();

      // Remove from memory
      this.stores.splice(storeIndex, 1);
    } catch (error) {
      console.error('Error removing store:', error);
      throw error;
    }
  }
}
