import API_BASE_URL from '../config/api';

export interface EngagementStats {
  likesCount: number;
  viewsCount: number;
  callsCount: number;
}

export interface EngagementData {
  likes: Array<{
    userId: string;
    userName?: string;
    userPhone?: string;
    userEmail?: string;
    timestamp: string;
  }>;
  views: Array<{
    userId: string;
    userName?: string;
    userPhone?: string;
    userEmail?: string;
    timestamp: string;
  }>;
  calls: Array<{
    userId: string;
    userName?: string;
    userPhone?: string;
    userEmail?: string;
    timestamp: string;
  }>;
}

class EngagementApi {
  // Store Engagement
  async getStoreStats(storeId: string): Promise<EngagementStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch store stats');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      // Fallback to empty stats
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    } catch (error) {
      console.error('Error fetching store stats:', error);
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    }
  }

  async getStoreEngagement(storeId: string): Promise<EngagementData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/stores/${storeId}/engagement`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch store engagement');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return { likes: [], views: [], calls: [] };
    } catch (error) {
      console.error('Error fetching store engagement:', error);
      return { likes: [], views: [], calls: [] };
    }
  }

  async likeStore(storeId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to like store');
      }
      return true;
    } catch (error) {
      console.error('Error liking store:', error);
      return false;
    }
  }

  async trackStoreView(storeId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to track store view');
      }
      return true;
    } catch (error) {
      console.error('Error tracking store view:', error);
      return false;
    }
  }

  async trackStoreCall(storeId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to track store call');
      }
      return true;
    } catch (error) {
      console.error('Error tracking store call:', error);
      return false;
    }
  }

  // Mechanic Engagement
  async getMechanicStats(mechanicId: string): Promise<EngagementStats> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/mechanics/${mechanicId}/stats`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch mechanic stats');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    } catch (error) {
      console.error('Error fetching mechanic stats:', error);
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    }
  }

  async getMechanicEngagement(mechanicId: string): Promise<EngagementData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/mechanics/${mechanicId}/engagement`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch mechanic engagement');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return { likes: [], views: [], calls: [] };
    } catch (error) {
      console.error('Error fetching mechanic engagement:', error);
      return { likes: [], views: [], calls: [] };
    }
  }

  async likeMechanic(mechanicId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/mechanics/${mechanicId}/like`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to like mechanic');
      }
      return true;
    } catch (error) {
      console.error('Error liking mechanic:', error);
      return false;
    }
  }

  async trackMechanicView(mechanicId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/mechanics/${mechanicId}/view`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to track mechanic view');
      }
      return true;
    } catch (error) {
      console.error('Error tracking mechanic view:', error);
      return false;
    }
  }

  async trackMechanicCall(mechanicId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/mechanics/${mechanicId}/call`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to track mechanic call');
      }
      return true;
    } catch (error) {
      console.error('Error tracking mechanic call:', error);
      return false;
    }
  }
}

export const engagementApi = new EngagementApi();

