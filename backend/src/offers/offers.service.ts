import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

type OfferEntity = CreateOfferDto & {
  id: string;
  createdAt: number;
  status: 'sent' | 'accepted' | 'declined';
};

@Injectable()
export class OffersService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.db.collection('offers');
  }

  async create(createOfferDto: CreateOfferDto) {
    const id = `off_${Date.now()}`;
    const entity: OfferEntity = {
      id,
      createdAt: Date.now(),
      status: 'sent',
      ...createOfferDto,
    };
    await this.col().doc(id).set(entity);
    return entity;
  }

  async findAll(requestId?: string, partnerId?: string) {
    let q = this.col() as FirebaseFirestore.Query;
    if (requestId) q = q.where('requestId', '==', requestId);
    if (partnerId) q = q.where('partnerId', '==', partnerId);
    const snap = await q.get();
    const list = snap.docs.map((d) => d.data() as OfferEntity);
    return list.sort((a, b) => a.priceGEL - b.priceGEL);
  }

  async findOne(id: string) {
    const doc = await this.col().doc(id).get();
    return doc.exists ? (doc.data() as OfferEntity) : null;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto) {
    const ref = this.col().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update(updateOfferDto as Partial<OfferEntity>);
    const base = doc.data() as OfferEntity;
    const merged: OfferEntity = { ...base, ...updateOfferDto } as OfferEntity;
    return merged;
  }

  async remove(id: string) {
    const ref = this.col().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }
}
