import API_BASE_URL from '../config/api';

export interface CarwashService {
  id: string;
  name: string;
  price: number;
  duration: number; // წუთებში
  description?: string;
}

export interface CarwashLocation {
  id: string;
  name: string;
  phone: string;
  category: string;
  location: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  services: string;
  detailedServices?: CarwashService[]; // ახალი დეტალური სერვისები
  features?: string;
  workingHours: string;
  images?: string[];
  description: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCarwashLocationRequest {
  name: string;
  phone: string;
  category: string;
  location: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  services: string;
  features?: string;
  workingHours: string;
  images?: string[];
  description: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  ownerId: string;
}

export interface UpdateCarwashLocationRequest {
  name?: string;
  phone?: string;
  category?: string;
  location?: string;
  address?: string;
  price?: number;
  rating?: number;
  reviews?: number;
  services?: string;
  features?: string;
  workingHours?: string;
  images?: string[];
  description?: string;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
}

class CarwashLocationApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/carwash${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createLocation(locationData: CreateCarwashLocationRequest): Promise<CarwashLocation> {
    return this.request<CarwashLocation>('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getAllLocations(): Promise<CarwashLocation[]> {
    return this.request<CarwashLocation[]>('/locations');
  }

  async getLocationById(id: string): Promise<CarwashLocation> {
    return this.request<CarwashLocation>(`/locations/${id}`);
  }

  async getLocationsByOwner(ownerId: string): Promise<CarwashLocation[]> {
    return this.request<CarwashLocation[]>(`/locations/owner/${ownerId}`);
  }

  async updateLocation(id: string, locationData: UpdateCarwashLocationRequest): Promise<CarwashLocation> {
    return this.request<CarwashLocation>(`/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(locationData),
    });
  }

  async deleteLocation(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/locations/${id}`, {
      method: 'DELETE',
    });
  }
}

export const carwashLocationApi = new CarwashLocationApiService();
