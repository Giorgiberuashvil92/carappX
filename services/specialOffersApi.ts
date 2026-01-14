import API_BASE_URL from '../config/api';

export interface SpecialOffer {
  id: string;
  storeId: string;
  discount: string;
  oldPrice: string;
  newPrice: string;
  title?: string;
  description?: string;
  image?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  priority: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecialOfferWithStore extends SpecialOffer {
  store?: {
    id: string;
    name: string;
    location: string;
    phone?: string;
    images?: string[];
    photos?: string[];
  };
}

class SpecialOffersApi {
  async getSpecialOffers(activeOnly = true): Promise<SpecialOffer[]> {
    try {
      const url = `${API_BASE_URL}/special-offers?activeOnly=${activeOnly}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch special offers');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching special offers:', error);
      return [];
    }
  }

  async getSpecialOffersByStore(storeId: string, activeOnly = true): Promise<SpecialOffer[]> {
    try {
      const url = `${API_BASE_URL}/special-offers/store/${storeId}?activeOnly=${activeOnly}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch special offers for store');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching special offers for store:', error);
      return [];
    }
  }

  async getSpecialOffer(id: string): Promise<SpecialOffer | null> {
    try {
      const url = `${API_BASE_URL}/special-offers/${id}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch special offer');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching special offer:', error);
      return null;
    }
  }

  async createSpecialOffer(payload: {
    storeId: string;
    discount: string;
    oldPrice: string;
    newPrice: string;
    title?: string;
    description?: string;
    image?: string;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    priority?: number;
  }): Promise<SpecialOffer | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/special-offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to create special offer');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error creating special offer:', error);
      return null;
    }
  }

  async updateSpecialOffer(
    id: string,
    updates: Partial<SpecialOffer>,
  ): Promise<SpecialOffer | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/special-offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update special offer');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error updating special offer:', error);
      return null;
    }
  }

  async deleteSpecialOffer(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/special-offers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete special offer');
      }
      return true;
    } catch (error) {
      console.error('Error deleting special offer:', error);
      return false;
    }
  }

  async toggleActive(id: string): Promise<SpecialOffer | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/special-offers/${id}/toggle-active`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to toggle special offer');
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error toggling special offer:', error);
      return null;
    }
  }
}

export const specialOffersApi = new SpecialOffersApi();

