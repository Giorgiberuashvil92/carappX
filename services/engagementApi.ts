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

  // Dismantler Engagement
  async getDismantlerStats(dismantlerId: string): Promise<EngagementStats> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dismantlers/${dismantlerId}/stats`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch dismantler stats');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    } catch (error) {
      console.error('Error fetching dismantler stats:', error);
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    }
  }

  async getDismantlerEngagement(dismantlerId: string): Promise<EngagementData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dismantlers/${dismantlerId}/engagement`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch dismantler engagement');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return { likes: [], views: [], calls: [] };
    } catch (error) {
      console.error('Error fetching dismantler engagement:', error);
      return { likes: [], views: [], calls: [] };
    }
  }

  async toggleDismantlerLike(dismantlerId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dismantlers/${dismantlerId}/like`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to toggle dismantler like');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error toggling dismantler like:', error);
      throw error;
    }
  }

  async likeDismantler(dismantlerId: string, userId: string): Promise<boolean> {
    try {
      await this.toggleDismantlerLike(dismantlerId, userId);
      return true;
    } catch (error) {
      console.error('Error liking dismantler:', error);
      return false;
    }
  }

  async getDismantlersLikes(dismantlerIds: string[], userId?: string): Promise<Record<string, { likesCount: number; isLiked: boolean }>> {
    try {
      const dismantlerIdsParam = dismantlerIds.join(',');
      const url = userId 
        ? `${API_BASE_URL}/dismantlers/likes/bulk?dismantlerIds=${dismantlerIdsParam}&userId=${userId}`
        : `${API_BASE_URL}/dismantlers/likes/bulk?dismantlerIds=${dismantlerIdsParam}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch dismantlers likes');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return {};
    } catch (error) {
      console.error('Error fetching dismantlers likes:', error);
      return {};
    }
  }

  async trackDismantlerView(dismantlerId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dismantlers/${dismantlerId}/view`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to track dismantler view');
      }
      return true;
    } catch (error) {
      console.error('Error tracking dismantler view:', error);
      return false;
    }
  }

  async trackDismantlerCall(dismantlerId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dismantlers/${dismantlerId}/call`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to track dismantler call');
      }
      return true;
    } catch (error) {
      console.error('Error tracking dismantler call:', error);
      return false;
    }
  }

  // Part Engagement
  async togglePartLike(partId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/parts/${partId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to toggle part like');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error toggling part like:', error);
      throw error;
    }
  }

  async getPartStats(partId: string): Promise<EngagementStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/parts/${partId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch part stats');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    } catch (error) {
      console.error('Error fetching part stats:', error);
      return { likesCount: 0, viewsCount: 0, callsCount: 0 };
    }
  }

  async getPartsLikes(partIds: string[], userId?: string): Promise<Record<string, { likesCount: number; isLiked: boolean }>> {
    try {
      const partIdsParam = partIds.join(',');
      const url = userId 
        ? `${API_BASE_URL}/parts/likes/bulk?partIds=${partIdsParam}&userId=${userId}`
        : `${API_BASE_URL}/parts/likes/bulk?partIds=${partIdsParam}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch parts likes');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return {};
    } catch (error) {
      console.error('Error fetching parts likes:', error);
      return {};
    }
  }
}

export const engagementApi = new EngagementApi();

