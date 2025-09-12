const API_BASE_URL = 'http://localhost:4000/carwash';

export interface CarwashBooking {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  bookingDate: number;
  bookingTime: string;
  carInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    color?: string;
  };
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  estimatedDuration?: number;
  specialRequests?: string[];
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface CreateBookingRequest {
  userId: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  bookingDate: number;
  bookingTime: string;
  carInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    color?: string;
  };
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  estimatedDuration?: number;
  specialRequests?: string[];
}

export interface UpdateBookingRequest {
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  bookingDate?: number;
  bookingTime?: string;
  notes?: string;
  specialRequests?: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  rating?: number;
  review?: string;
}

class CarwashApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createBooking(bookingData: CreateBookingRequest): Promise<CarwashBooking> {
    return this.request<CarwashBooking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getAllBookings(userId?: string): Promise<CarwashBooking[]> {
    const endpoint = userId ? `/bookings?userId=${userId}` : '/bookings';
    return this.request<CarwashBooking[]>(endpoint);
  }

  async getBookingById(id: string): Promise<CarwashBooking> {
    return this.request<CarwashBooking>(`/bookings/${id}`);
  }

  async updateBooking(id: string, updateData: UpdateBookingRequest): Promise<CarwashBooking> {
    return this.request<CarwashBooking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async cancelBooking(id: string): Promise<CarwashBooking> {
    return this.request<CarwashBooking>(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  async confirmBooking(id: string): Promise<CarwashBooking> {
    return this.request<CarwashBooking>(`/bookings/${id}/confirm`, {
      method: 'PATCH',
    });
  }

  async startBooking(id: string): Promise<CarwashBooking> {
    return this.request<CarwashBooking>(`/bookings/${id}/start`, {
      method: 'PATCH',
    });
  }

  async completeBooking(id: string): Promise<CarwashBooking> {
    return this.request<CarwashBooking>(`/bookings/${id}/complete`, {
      method: 'PATCH',
    });
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.request<boolean>(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  async getBookingsByLocation(locationId: string): Promise<CarwashBooking[]> {
    return this.request<CarwashBooking[]>(`/locations/${locationId}/bookings`);
  }

  async getBookingsByDate(date: string): Promise<CarwashBooking[]> {
    return this.request<CarwashBooking[]>(`/bookings/date/${date}`);
  }
}

export const carwashApi = new CarwashApiService();
