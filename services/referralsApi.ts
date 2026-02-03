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
    // გამოვიყენოთ /history/all endpoint რომ მივიღოთ ყველა რეფერალი
    const url = `${this.baseUrl}/history/all`;
    console.log('🌐 [API] Referral Leaderboard Request (using /history/all):', {
      url,
      userId,
      limit,
      offset,
      baseUrl: this.baseUrl,
      timestamp: new Date().toISOString(),
    });
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const requestDuration = Date.now() - startTime;
    
    console.log('📡 [API] HTTP Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      duration: `${requestDuration}ms`,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ [API] Referral Leaderboard Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error('Failed to fetch referral leaderboard');
    }
    
    const historyData = await response.json();
    console.log('📜 [API] History/All Response:', {
      summary: historyData?.summary,
      historyCount: historyData?.history?.length || 0,
      requestDuration: `${requestDuration}ms`,
    });

    // ავაშენოთ leaderboard history-დან
    // ვითვლით რამდენი რეფერალი აქვს თითოეულ inviter-ს
    const inviterStats = new Map<string, {
      inviterId: string;
      inviterName: string;
      inviterReferralCode: string;
      referrals: number;
      points: number; // ვითვლით rewardsGranted რეფერალებს (თითოეული = 100 ქულა)
      createdAt: number; // პირველი რეფერალის დრო
    }>();

    // ვითვლით რეფერალებს და ქულებს
    historyData.history.forEach((ref: any) => {
      const inviterId = ref.inviterId;
      if (!inviterStats.has(inviterId)) {
        inviterStats.set(inviterId, {
          inviterId,
          inviterName: ref.inviterName,
          inviterReferralCode: ref.inviterReferralCode,
          referrals: 0,
          points: 0,
          createdAt: ref.appliedAt,
        });
      }
      const stats = inviterStats.get(inviterId)!;
      stats.referrals += 1;
      if (ref.rewardsGranted) {
        stats.points += 100; // თითოეული rewardsGranted რეფერალი = 100 ქულა
      }
      // ვინახავთ ყველაზე ადრინდელ რეფერალს
      if (ref.appliedAt < stats.createdAt) {
        stats.createdAt = ref.appliedAt;
      }
    });

    // გადავაქციოთ Map-ი Array-ად და დავასორტიროთ
    const leaderboardArray = Array.from(inviterStats.values())
      .map((stats) => ({
        userId: stats.inviterId,
        name: stats.inviterName,
        points: stats.points,
        referrals: stats.referrals,
        createdAt: stats.createdAt,
        isCurrentUser: stats.inviterId === userId,
      }))
      .sort((a, b) => {
        // სორტირება: ჯერ ქულებით (desc), შემდეგ რეფერალებით (desc), შემდეგ createdAt-ით (asc - ძველი პირველი)
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        if (b.referrals !== a.referrals) {
          return b.referrals - a.referrals;
        }
        return a.createdAt - b.createdAt;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    // პაგინაცია
    const total = leaderboardArray.length;
    const paginatedLeaderboard = leaderboardArray.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    console.log('✅ [API] Referral Leaderboard Built from History:', {
      total,
      offset,
      limit,
      hasMore,
      leaderboardLength: paginatedLeaderboard.length,
      top5: paginatedLeaderboard.slice(0, 5).map((u) => ({
        rank: u.rank,
        userId: u.userId,
        name: u.name,
        points: u.points,
        referrals: u.referrals,
        isCurrentUser: u.isCurrentUser,
      })),
      currentUserEntry: paginatedLeaderboard.find((u) => u.isCurrentUser),
      requestDuration: `${requestDuration}ms`,
    });

    return {
      leaderboard: paginatedLeaderboard,
      total,
      hasMore,
    };
  }

  async getReferralCodeUsers(referralCode: string): Promise<{
    inviterId: string;
    inviterName: string;
    users: Array<{
      userId: string;
      name: string;
      appliedAt: number;
      subscriptionEnabled: boolean;
      rewardsGranted: boolean;
      firstBookingAt?: number;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/code/${encodeURIComponent(referralCode)}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch referral code users' }));
      throw new Error(error.message || 'Failed to fetch referral code users');
    }
    return response.json();
  }

  /**
   * Get all referrals for a specific user (by userId)
   * Returns list of all users who used this user's referral code
   */
  async getUserReferrals(userId: string): Promise<{
    inviterId: string;
    inviterName: string;
    referralCode: string;
    users: Array<{
      userId: string;
      name: string;
      appliedAt: number;
      subscriptionEnabled: boolean;
      rewardsGranted: boolean;
      firstBookingAt?: number;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/user/${encodeURIComponent(userId)}/referrals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch user referrals' }));
      throw new Error(error.message || 'Failed to fetch user referrals');
    }
    return response.json();
  }

  /**
   * Get detailed referral usage history for a specific user
   * Returns detailed history with timestamps and formatted dates
   */
  async getUserReferralHistory(userId: string): Promise<{
    inviterId: string;
    inviterName: string;
    referralCode: string;
    totalReferrals: number;
    history: Array<{
      referralId: string;
      inviteeId: string;
      inviteeName: string;
      appliedAt: number;
      appliedAtFormatted: string;
      subscriptionEnabled: boolean;
      rewardsGranted: boolean;
      firstBookingAt?: number;
      firstBookingAtFormatted?: string;
      createdAt: Date;
      updatedAt: Date;
      daysSinceApplied: number;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/user/${encodeURIComponent(userId)}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch user referral history' }));
      throw new Error(error.message || 'Failed to fetch user referral history');
    }
    return response.json();
  }
}

export const referralsApi = new ReferralsApi();
