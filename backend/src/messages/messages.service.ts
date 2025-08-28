import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { FirebaseService } from '../firebase/firebase.service';

export type MessageCreateDto = {
  offerId: string;
  author: 'user' | 'partner';
  text: string;
};
export type MessageEntity = MessageCreateDto & {
  id: string;
  createdAt: number;
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly notifications: NotificationsService,
  ) {}

  private col() {
    return this.firebase.db.collection('messages');
  }

  async create(dto: MessageCreateDto): Promise<MessageEntity> {
    const id = `msg_${Date.now()}`;
    const m: MessageEntity = { id, createdAt: Date.now(), ...dto };
    await this.col().doc(id).set(m);
    // Fire-and-forget push to the counterparty
    this.dispatchPushForMessage(m).catch(() => void 0);
    return m;
  }

  private async dispatchPushForMessage(m: MessageEntity) {
    // Determine target role and ids based on offer context
    // We need offer to know userId/partnerId; if not present in messages, fetch offer doc
    type OfferDoc = {
      id?: string;
      userId?: string;
      requestUserId?: string;
      partnerId?: string;
    };
    const offerDoc = await this.firebase.db
      .collection('offers')
      .doc(m.offerId)
      .get();
    const offer: OfferDoc | null = offerDoc.exists
      ? (offerDoc.data() as OfferDoc)
      : null;
    if (!offer) return;
    const userId: string | undefined = offer.userId || offer.requestUserId;
    const partnerId: string | undefined = offer.partnerId;
    const to: 'user' | 'partner' = m.author === 'user' ? 'partner' : 'user';
    const tokens = await this.notifications.listTokensForOfferContext({
      offerId: m.offerId,
      to,
      userId,
      partnerId,
    });
    if (tokens.length === 0) return;
    await this.notifications.sendExpoPush(tokens, {
      title:
        to === 'partner'
          ? 'ახალი მესიჯი მომხმარებლისგან'
          : 'ახალი მესიჯი მაღაზიიდან',
      body: m.text.slice(0, 140),
      data: { offerId: m.offerId, type: 'chat_message' },
    });
  }

  async listByOffer(offerId: string): Promise<MessageEntity[]> {
    // Avoid requiring Firestore composite index by removing orderBy in query
    // and sorting in memory instead
    const snap = await this.col().where('offerId', '==', offerId).get();
    return snap.docs
      .map((d) => d.data() as MessageEntity)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }
}
