import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

type OtpRecord = {
  id: string;
  phone: string;
  code: string;
  intent: 'login' | 'register';
  createdAt: number;
  expiresAt: number;
};

type UserRecord = {
  id: string;
  phone: string;
  createdAt: number;
  firstName?: string;
  role?: 'user' | 'partner' | 'customer' | 'owner' | 'manager' | 'employee';
  ownedCarwashes?: string[];
};

@Injectable()
export class AuthService {
  constructor(private readonly firebase: FirebaseService) {}

  private otpsCol() {
    return this.firebase.db.collection('otps');
  }

  private usersCol() {
    return this.firebase.db.collection('users');
  }

  normalizeGePhone(input: string): string {
    const digits = (input || '').replace(/\D/g, '');
    // strip leading 995 if present, keep last 9 digits
    const local = digits.startsWith('995') ? digits.slice(3) : digits;
    if (local.length !== 9) throw new BadRequestException('invalid_phone');
    return `+995${local}`;
  }

  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async start(phoneRaw: string) {
    const phone = this.normalizeGePhone(phoneRaw);
    // check if user exists
    const existing = await this.usersCol()
      .where('phone', '==', phone)
      .limit(1)
      .get();
    const hasUser = !existing.empty;
    const intent: 'login' | 'register' = hasUser ? 'login' : 'register';

    const code = this.generateCode();
    const now = Date.now();
    const rec: OtpRecord = {
      id: `otp_${now}`,
      phone,
      code,
      intent,
      createdAt: now,
      expiresAt: now + 2 * 60 * 1000, // 2 minutes
    };
    await this.otpsCol().doc(rec.id).set(rec);

    // TODO: integrate real SMS provider later
    return { id: rec.id, intent, mockCode: code };
  }

  async verify(otpId: string, code: string) {
    if (!otpId || !code) throw new BadRequestException('invalid_payload');
    const doc = await this.otpsCol().doc(otpId).get();
    if (!doc.exists) throw new BadRequestException('otp_not_found');
    const data = doc.data() as OtpRecord;
    if (Date.now() > data.expiresAt) {
      throw new BadRequestException('otp_expired');
    }
    if (data.code !== code) throw new BadRequestException('otp_invalid');

    // upsert user
    let user: UserRecord | null = null;
    const existing = await this.usersCol()
      .where('phone', '==', data.phone)
      .limit(1)
      .get();
    if (existing.empty) {
      const id = `usr_${Date.now()}`;
      user = { id, phone: data.phone, createdAt: Date.now() };
      await this.usersCol().doc(id).set(user);
    } else {
      user = existing.docs[0].data() as UserRecord;
    }

    // delete used OTP
    await this.otpsCol().doc(otpId).delete();

    return { user, intent: data.intent };
  }

  async complete(
    userId: string,
    payload: { firstName?: string; role?: 'user' | 'partner' },
  ) {
    if (!userId) throw new BadRequestException('invalid_user');
    const docRef = this.usersCol().doc(userId);
    const doc = await docRef.get();
    if (!doc.exists) throw new BadRequestException('user_not_found');
    const updates: Partial<UserRecord> = {};
    if (payload?.firstName && payload.firstName.trim().length > 0) {
      updates.firstName = payload.firstName.trim();
    }
    if (payload?.role === 'user' || payload?.role === 'partner') {
      updates.role = payload.role;
    }
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('no_updates');
    }
    await docRef.update(updates);
    const merged = { ...(doc.data() as UserRecord), ...updates } as UserRecord;
    return { user: merged };
  }

  async updateRole(
    userId: string,
    role: 'customer' | 'owner' | 'manager' | 'employee' | 'user',
  ) {
    if (!userId) throw new BadRequestException('invalid_user');
    if (!role) throw new BadRequestException('invalid_role');

    const docRef = this.usersCol().doc(userId);
    const doc = await docRef.get();
    if (!doc.exists) throw new BadRequestException('user_not_found');

    await docRef.update({ role });
    const updated = { ...(doc.data() as UserRecord), role } as UserRecord;

    console.log(`✅ [AUTH_SERVICE] User ${userId} role updated to: ${role}`);
    return {
      success: true,
      message: 'User role updated successfully',
      user: updated,
    };
  }

  async updateOwnedCarwashes(
    userId: string,
    carwashId: string,
    action: 'add' | 'remove',
  ) {
    if (!userId) throw new BadRequestException('invalid_user');
    if (!carwashId) throw new BadRequestException('invalid_carwash_id');
    if (!action) throw new BadRequestException('invalid_action');

    const docRef = this.usersCol().doc(userId);
    const doc = await docRef.get();
    if (!doc.exists) throw new BadRequestException('user_not_found');

    const userData = doc.data() as UserRecord;
    const currentOwnedCarwashes = userData.ownedCarwashes || [];

    let updatedOwnedCarwashes: string[];

    if (action === 'add') {
      if (currentOwnedCarwashes.includes(carwashId)) {
        throw new BadRequestException('carwash_already_owned');
      }
      updatedOwnedCarwashes = [...currentOwnedCarwashes, carwashId];
    } else {
      updatedOwnedCarwashes = currentOwnedCarwashes.filter(
        (id) => id !== carwashId,
      );
    }

    await docRef.update({ ownedCarwashes: updatedOwnedCarwashes });
    const updated = {
      ...userData,
      ownedCarwashes: updatedOwnedCarwashes,
    } as UserRecord;

    console.log(
      `✅ [AUTH_SERVICE] User ${userId} ownedCarwashes ${action}ed: ${carwashId}`,
    );
    console.log(
      `✅ [AUTH_SERVICE] Updated ownedCarwashes:`,
      updatedOwnedCarwashes,
    );

    return {
      success: true,
      message: `Carwash ${action}ed successfully`,
      user: updated,
    };
  }
}
