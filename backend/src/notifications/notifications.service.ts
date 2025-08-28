/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

type TokenRecord = {
  id: string;
  token: string;
  role: 'user' | 'partner';
  userId?: string;
  partnerId?: string;
  createdAt: number;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly firebase: FirebaseService) {}

  private tokensCol() {
    return this.firebase.db.collection('push_tokens');
  }

  async registerToken(
    token: string,
    payload: { role: 'user' | 'partner'; userId?: string; partnerId?: string },
  ) {
    const id = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rec: TokenRecord = { id, token, createdAt: Date.now(), ...payload };
    await this.tokensCol().doc(id).set(rec);
    return rec;
  }

  async listTokensForOfferContext(opts: {
    offerId: string;
    to: 'user' | 'partner';
    userId?: string;
    partnerId?: string;
  }): Promise<string[]> {
    // Simple filter by role and id
    let q = this.tokensCol().where('role', '==', opts.to);
    if (opts.to === 'user' && opts.userId)
      q = q.where('userId', '==', opts.userId);
    if (opts.to === 'partner' && opts.partnerId)
      q = q.where('partnerId', '==', opts.partnerId);
    const snap = await q.get();
    return snap.docs.map((d) => (d.data() as TokenRecord).token);
  }

  async sendExpoPush(
    tokens: string[],
    message: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    // Log request
    await this.firebase.db.collection('push_logs').add({
      ...message,
      tokens,
      createdAt: Date.now(),
    });

    const expo = new Expo();
    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
    if (validTokens.length === 0) {
      this.logger.warn('No valid Expo push tokens');
      return { success: false, count: 0 };
    }

    const chunks = expo.chunkPushNotifications(
      validTokens.map<ExpoPushMessage>((to) => ({
        to,
        sound: 'default',
        title: message.title,
        body: message.body,
        data: message.data,
        priority: 'high',
      })),
    );

    const receipts: any[] = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        receipts.push(...ticketChunk);
      } catch (error) {
        this.logger.error('Expo push send error', (error as Error)?.stack);
      }
    }

    return { success: true, count: validTokens.length, receipts };
  }
}
