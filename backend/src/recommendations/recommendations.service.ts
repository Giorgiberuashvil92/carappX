import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

export type RecommendationEntity = {
  id: string;
  createdAt: number;
  providerName: string;
  priceGEL: number;
  etaMin?: number;
  distanceKm?: number;
  tags?: string[];
  partnerId?: string;
  targeting?: {
    serviceTypes?: string[];
    carMakes?: string[];
    carModels?: string[];
    city?: string;
  };
};

@Injectable()
export class RecommendationsService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.db.collection('recommendations');
  }

  async create(payload: Omit<RecommendationEntity, 'id' | 'createdAt'>) {
    const id = `rec_${Date.now()}`;
    const entity: RecommendationEntity = {
      id,
      createdAt: Date.now(),
      ...payload,
    };
    await this.col().doc(id).set(entity);
    return entity;
  }

  async byServiceType(serviceType: string, city?: string) {
    let q: FirebaseFirestore.Query = this.col().where(
      'targeting.serviceTypes',
      'array-contains',
      (serviceType || '').toLowerCase(),
    );
    if (city) q = q.where('targeting.city', '==', city);
    const snap = await q.get();
    return snap.docs.map((d) => d.data() as RecommendationEntity);
  }
}


