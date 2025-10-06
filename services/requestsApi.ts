import API_BASE_URL from '@/config/api';

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  submodel?: string;
  vin?: string;
}

export interface CreateRequestDto {
  userId: string;
  vehicle: Vehicle;
  partName: string;
  brand?: string;
  budgetGEL?: number;
  distanceKm?: number;
  description?: string;
  urgency?: 'low' | 'medium' | 'high';
  service?: 'parts' | 'mechanic' | 'tow' | 'rental';
  location?: string;
}

export interface Request {
  id: string;
  userId: string;
  vehicle: Vehicle;
  partName: string;
  brand?: string;
  budgetGEL?: number;
  distanceKm?: number;
  status: 'active' | 'fulfilled' | 'cancelled';
  description?: string;
  urgency: 'low' | 'medium' | 'high';
  service?: 'parts' | 'mechanic' | 'tow' | 'rental';
  location?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Offer {
  id: string;
  reqId: string;
  providerName: string;
  priceGEL: number;
  etaMin: number;
  distanceKm?: number;
  tags?: string[];
  partnerId?: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

class RequestsApiService {
  private baseUrl = `${API_BASE_URL}/requests`;
  private offersUrl = `${API_BASE_URL}/offers`;

  async createRequest(requestData: CreateRequestDto): Promise<Request> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestData.userId,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  async getRequests(userId?: string): Promise<Request[]> {
    try {
      const url = userId ? `${this.baseUrl}?userId=${userId}` : this.baseUrl;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  }

  async getRequestById(requestId: string): Promise<Request> {
    try {
      const response = await fetch(`${this.baseUrl}/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching request:', error);
      throw error;
    }
  }

  async updateRequest(requestId: string, updateData: Partial<Request>): Promise<Request> {
    try {
      const response = await fetch(`${this.baseUrl}/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  }

  async deleteRequest(requestId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  }

  // Offers API
  async createOffer(offerData: {
    reqId: string;
    providerName: string;
    priceGEL: number;
    etaMin: number;
    distanceKm?: number;
    tags?: string[];
    partnerId?: string;
    userId: string;
  }): Promise<Offer> {
    try {
      const response = await fetch(this.offersUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': offerData.userId,
        },
        body: JSON.stringify(offerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async getOffers(requestId?: string, userId?: string, partnerId?: string): Promise<Offer[]> {
    try {
      const params = new URLSearchParams();
      if (requestId) params.append('reqId', requestId);
      if (userId) params.append('userId', userId);
      if (partnerId) params.append('partnerId', partnerId);

      const url = params.toString() ? `${this.offersUrl}?${params.toString()}` : this.offersUrl;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
  }

  async getOfferById(offerId: string): Promise<Offer> {
    try {
      const response = await fetch(`${this.offersUrl}/${offerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching offer:', error);
      throw error;
    }
  }

  async updateOffer(offerId: string, updateData: Partial<Offer>): Promise<Offer> {
    try {
      const response = await fetch(`${this.offersUrl}/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
  }

  async deleteOffer(offerId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.offersUrl}/${offerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  }
}

export const requestsApi = new RequestsApiService();
