/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirebaseService } from '../firebase/firebase.service';
import { Recommendation, RecommendationDocument } from '../schemas/recommendation.schema';

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
  constructor(
    private readonly firebase: FirebaseService,
    @InjectModel(Recommendation.name)
    private recommendationModel: Model<RecommendationDocument>,
  ) {}

  async create(payload: Omit<RecommendationEntity, 'id' | 'createdAt'>) {
    const id = `rec_${Date.now()}`;
    const entity: RecommendationEntity = {
      id,
      createdAt: Date.now(),
      ...payload,
    };
    
    // MongoDB-ში შექმნა
    const createdRecommendation = new this.recommendationModel(entity);
    await createdRecommendation.save();
    return createdRecommendation.toObject();
  }

  async byServiceType(serviceType: string, city?: string) {
    const query: any = {
      'targeting.serviceTypes': { $in: [(serviceType || '').toLowerCase()] }
    };
    
    if (city) {
      query['targeting.city'] = city;
    }
    
    return await this.recommendationModel.find(query).exec();
  }
}


