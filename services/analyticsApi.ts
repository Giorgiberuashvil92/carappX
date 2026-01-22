import API_BASE_URL from '../config/api';

export interface AnalyticsDashboardData {
  screenViews: Array<{
    screenName: string;
    views: number;
    uniqueUsers: number;
  }>;
  buttonClicks: Array<{
    buttonName: string;
    screen: string;
    clicks: number;
  }>;
  userEngagement: {
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    newUsers: number;
  };
  navigationFlows: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  popularFeatures: Array<{
    name: string;
    usage: number;
    trend: string;
  }>;
}

export interface UserEvent {
  id: string;
  eventType: string;
  eventName: string;
  screen: string;
  params: Record<string, any>;
  paramsFormatted?: string | null;
  timestamp: number;
  date: string;
  dateFormatted?: string;
}

export interface UserInfo {
  phone: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  isVerified: boolean;
  createdAt?: number | null;
}

export interface UserEventsResponse {
  userId: string;
  userInfo: UserInfo | null;
  events: UserEvent[];
  totalEvents: number;
  firstEvent: string | null;
  lastEvent: string | null;
}

export interface UserEventsData {
  userId: string;
  userInfo: UserInfo | null;
  eventsCount: number;
  events: UserEvent[];
  lastActivity: number;
  lastActivityFormatted?: string | null;
}

export const analyticsApi = {
  async getDashboard(period: 'today' | 'week' | 'month' = 'week'): Promise<AnalyticsDashboardData> {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard?period=${period}`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics dashboard');
    }
    return response.json();
  },

  async getUserEvents(
    userId: string,
    period: 'today' | 'week' | 'month' = 'week',
    limit: number = 100,
  ): Promise<UserEventsResponse> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/user-events?userId=${userId}&period=${period}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch user events');
    }
    return response.json();
  },

  async getAllUsersEvents(
    period: 'today' | 'week' | 'month' = 'week',
    limit: number = 500,
  ): Promise<UserEventsData[]> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/all-users-events?period=${period}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch all users events');
    }
    return response.json();
  },

  async trackEvent(
    eventType: string,
    eventName: string,
    userId?: string,
    screen?: string,
    params?: Record<string, any>,
  ) {
    try {
      await fetch(`${API_BASE_URL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          eventName,
          userId,
          screen,
          params,
        }),
      });
    } catch (error) {
      // Silently fail - analytics should never block the app
      console.error('Analytics tracking error:', error);
    }
  },
};
