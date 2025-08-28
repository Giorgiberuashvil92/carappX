import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

export type PartnerTokenDto = { partnerId: string; expoPushToken: string };

@Injectable()
export class PartnersService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.db.collection('partner_tokens');
  }

  async saveToken(dto: PartnerTokenDto) {
    await this.col()
      .doc(dto.partnerId)
      .set({ partnerId: dto.partnerId, expoPushToken: dto.expoPushToken });
    return { ok: true };
  }

  async getToken(partnerId: string) {
    const doc = await this.col().doc(partnerId).get();
    const data = doc.exists
      ? (doc.data() as { partnerId: string; expoPushToken: string })
      : null;
    const token = data ? data.expoPushToken : null;
    return { partnerId, expoPushToken: token };
  }

  async list() {
    const snap = await this.col().get();
    return snap.docs.map(
      (d) => d.data() as { partnerId: string; expoPushToken: string },
    );
  }
}
