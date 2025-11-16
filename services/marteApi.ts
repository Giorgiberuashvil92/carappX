import API_BASE_URL from '@/config/api';
import { useUser } from '@/contexts/UserContext';

export interface MarteOrder {
  _id: string;
  userId: string;
  carId: string;
  carInfo: {
    make: string;
    model: string;
    year: number;
    plate: string;
  };
  assistantLevel: {
    id: string;
    title: string;
    price: number;
  };
  problemDescription: string;
  contactInfo: {
    location: string;
    phone: string;
    notes?: string;
  };
  status: 'pending' | 'searching' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedAssistant?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    specialties: string[];
  };
  estimatedTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  totalCost?: number;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarteOrderData {
  carId: string;
  carInfo: {
    make: string;
    model: string;
    year: number;
    plate: string;
  };
  assistantLevel: {
    id: string;
    title: string;
    price: number;
  };
  problemDescription: string;
  contactInfo: {
    location: string;
    phone: string;
    notes?: string;
  };
}

export interface AssistantLevel {
  id: string;
  title: string;
  price: number;
  description: string;
  features: string[];
}

class MarteApiService {
  private baseUrl = `${API_BASE_URL}/marte`;
  private userId: string | null = null;

  setUserId(userId: string) {
    console.log('Setting MARTE user ID:', userId);
    this.userId = userId;
  }

  private getAuthHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }

    return headers;
  }

  async createOrder(orderData: CreateMarteOrderData): Promise<MarteOrder> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(), 
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating MARTE order:', error);
      throw error;
    }
  }

  async getUserOrders(): Promise<MarteOrder[]> {
    try {
      console.log('🔍 [marteApi] getUserOrders - baseUrl:', this.baseUrl);
      console.log('🔍 [marteApi] getUserOrders - headers:', this.getAuthHeaders());
      
      const response = await fetch(`${this.baseUrl}/orders/my`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('📡 [marteApi] getUserOrders - response status:', response.status);
      console.log('📡 [marteApi] getUserOrders - response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [marteApi] getUserOrders - error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [marteApi] getUserOrders - success:', data);
      return data;
    } catch (error) {
      console.error('❌ [marteApi] getUserOrders - error:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<MarteOrder> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<MarteOrder> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  async completeOrder(orderId: string, rating?: number, review?: string): Promise<MarteOrder> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rating, review }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  }

  async getAssistantLevels(): Promise<AssistantLevel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/assistant-levels`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assistant levels:', error);
      throw error;
    }
  }

  async getHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking MARTE health:', error);
      throw error;
    }
  }
}

export const marteApi = new MarteApiService();
