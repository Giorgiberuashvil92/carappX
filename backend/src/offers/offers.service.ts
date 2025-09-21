import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

type OfferEntity = CreateOfferDto & {
  id: string;
  createdAt: number;
  status: 'sent' | 'accepted' | 'declined';
};

export type RecommendationItem = {
  providerName: string;
  priceGEL: number;
  etaMin?: number;
  distanceKm?: number;
  tags?: string[];
  partnerId?: string;
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

  // Recommendation generator based on Firestore targeting
  async recommendForReminder(reminder: {
    type: string; // e.g. 'oil_change'
    carMake?: string;
    carModel?: string;
    city?: string;
  }): Promise<RecommendationItem[]> {
    const typeKey = (reminder.type || '').toLowerCase();
    console.log('[OffersService] recommendForReminder.query', reminder);

    let q: FirebaseFirestore.Query = this.col().where(
      'targeting.serviceTypes',
      'array-contains',
      typeKey,
    );
    if (reminder.city) q = q.where('targeting.city', '==', reminder.city);

    // Note: car make/model filtering can be done client-side if arrays are long; do a basic filter after fetch
    const snap = await q.limit(25).get();
    const offers = snap.docs.map((d) => d.data() as OfferEntity);

    const filtered = offers.filter((o) => {
      const t =
        (
          o as unknown as {
            targeting?: {
              serviceTypes?: string[];
              carMakes?: string[];
              carModels?: string[];
              city?: string;
            };
          }
        ).targeting || {};
      const makeOk =
        !reminder.carMake ||
        !t.carMakes ||
        t.carMakes.includes(reminder.carMake);
      const modelOk =
        !reminder.carModel ||
        !t.carModels ||
        t.carModels.includes(reminder.carModel);
      return makeOk && modelOk;
    });

    const recs: RecommendationItem[] = filtered.map((o) => {
      const o2 = o as unknown as OfferEntity & {
        distanceKm?: number;
        tags?: string[];
      };
      return {
        providerName: o2.providerName,
        priceGEL: o2.priceGEL,
        etaMin: o2.etaMin,
        distanceKm: o2.distanceKm,
        tags: o2.tags,
        partnerId: o2.partnerId,
      };
    });

    // Sort by price ascending as default heuristic
    return recs
      .sort((a, b) => (a.priceGEL || 0) - (b.priceGEL || 0))
      .slice(0, 10);
  }
}
