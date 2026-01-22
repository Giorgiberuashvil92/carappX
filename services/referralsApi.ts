import API_BASE_URL from '../config/api';

class ReferralsApi {
  private baseUrl = `${API_BASE_URL}/referrals`;

  async getReferralCode(userId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/code`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch referral code');
    }
    const data = await response.json();
    return data.code;
  }

  async generateReferralCode(userId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to generate referral code');
    }
    const data = await response.json();
    return data.code;
  }

  async applyReferralCode(inviteeUserId: string, referralCode: string): Promise<{
    success: boolean;
    inviterId?: string;
    pointsAwarded?: number;
  }> {
    const response = await fetch(`${this.baseUrl}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteeUserId,
        referralCode: referralCode.trim().toUpperCase(),
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to apply referral code' }));
      throw new Error(error.message || 'Failed to apply referral code');
    }
    return response.json();
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string;
  }> {
    const response = await fetch(`${this.baseUrl}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch referral stats');
    }
    return response.json();
  }

  async getReferralLeaderboard(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    leaderboard: Array<{
      userId: string;
      name: string;
      points: number;
      rank: number;
      referrals: number;
      isCurrentUser: boolean;
      createdAt: number;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const response = await fetch(
      `${this.baseUrl}/leaderboard?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch referral leaderboard');
    }
    return response.json();
  }
}

export const referralsApi = new ReferralsApi();
