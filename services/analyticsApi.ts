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

export const analyticsApi = {
  async getDashboard(period: 'today' | 'week' | 'month' = 'week'): Promise<AnalyticsDashboardData> {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard?period=${period}`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics dashboard');
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
