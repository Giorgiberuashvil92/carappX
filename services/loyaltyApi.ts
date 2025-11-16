import API_BASE_URL from '../config/api';

export type LoyaltySummary = {
  points: number;
  tier: string;
  nextTierPoints: number;
  streakDays: number;
};

export type LoyaltyTransaction = {
  id: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  description: string;
  date: string;
  service?: string;
  icon: string;
};

export type LoyaltyReward = {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  icon: string;
  category: 'discount' | 'freebie' | 'upgrade' | 'bonus';
  isAvailable: boolean;
  discount?: number;
  expiryDate?: string;
};

export type LoyaltyLeaderboardUser = {
  id: string;
  name: string;
  points: number;
  rank: number;
  isCurrentUser?: boolean;
};

export type LoyaltyFriend = {
  id: string;
  name: string;
  points: number;
  isOnline: boolean;
  lastActive: string;
};

export type LoyaltyAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  pointsReward: number;
  progress?: number;
  maxProgress?: number;
};

export type LoyaltyMission = {
  id: string;
  title: string;
  icon: string;
  progress: number;
  target: number;
  reward: number;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json?.data ?? json) as T;
}

export const loyaltyApi = {
  async getSummary(userId: string): Promise<LoyaltySummary> {
    return getJson<LoyaltySummary>(`${API_BASE_URL}/loyalty/summary?userId=${encodeURIComponent(userId)}`);
  },
  async getTransactions(userId: string, limit = 20): Promise<LoyaltyTransaction[]> {
    return getJson<LoyaltyTransaction[]>(`${API_BASE_URL}/loyalty/transactions?userId=${encodeURIComponent(userId)}&limit=${limit}`);
  },
  async getRewards(userId: string): Promise<LoyaltyReward[]> {
    return getJson<LoyaltyReward>(`${API_BASE_URL}/loyalty/rewards?userId=${encodeURIComponent(userId)}` as any) as unknown as LoyaltyReward[];
  },
  async getLeaderboard(userId: string): Promise<LoyaltyLeaderboardUser[]> {
    return getJson<LoyaltyLeaderboardUser[]>(`${API_BASE_URL}/loyalty/leaderboard?userId=${encodeURIComponent(userId)}`);
  },
  async getFriends(userId: string): Promise<LoyaltyFriend[]> {
    return getJson<LoyaltyFriend[]>(`${API_BASE_URL}/loyalty/friends?userId=${encodeURIComponent(userId)}`);
  },
  async getAchievements(userId: string): Promise<LoyaltyAchievement[]> {
    return getJson<LoyaltyAchievement[]>(`${API_BASE_URL}/loyalty/achievements?userId=${encodeURIComponent(userId)}`);
  },
  async getMissions(userId: string): Promise<LoyaltyMission[]> {
    return getJson<LoyaltyMission[]>(`${API_BASE_URL}/loyalty/missions?userId=${encodeURIComponent(userId)}`);
  },
  async claimMission(userId: string, missionId: string): Promise<{ ok: boolean; missionId: string; newSummary: LoyaltySummary }> {
    const res = await fetch(`${API_BASE_URL}/loyalty/missions/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, missionId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json?.data ?? json) as any;
  },
  async redeem(userId: string, rewardId: string): Promise<{ ok: boolean; summary: LoyaltySummary } | any> {
    const res = await fetch(`${API_BASE_URL}/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, rewardId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json?.data ?? json;
  },
};


