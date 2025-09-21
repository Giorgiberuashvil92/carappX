import API_BASE_URL from '../config/api';

const GARAGE_API_URL = `${API_BASE_URL}/garage`;

export interface Car {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  imageUri?: string;
  lastService?: Date;
  nextService?: Date;
  mileage?: number;
  color?: string;
  vin?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  carId: string;
  car?: Car;
  title: string;
  description?: string;
  type: string;
  priority: string;
  reminderDate: Date;
  reminderTime?: string;
  isCompleted: boolean;
  isUrgent: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCarData {
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  imageUri?: string;
  mileage?: number;
  color?: string;
  vin?: string;
}

export interface CreateReminderData {
  carId: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  reminderDate: string;
  reminderTime?: string;
}

export interface GarageStats {
  totalCars: number;
  totalReminders: number;
  urgentReminders: number;
  upcomingReminders: number;
  completedReminders: number;
}

export interface FuelEntry {
  id: string;
  userId: string;
  carId: string;
  date: string; // ISO
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  mileage: number;
  createdAt: string | number;
  updatedAt: string | number;
}

class GarageApiService {
  private userId: string | null = null;

  setUserId(userId: string) {
    console.log('Setting user ID:', userId);
    this.userId = userId;
    
    if (userId === 'demo-user') {
      console.warn('Using demo-user ID! This should be a real user ID');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${GARAGE_API_URL}${endpoint}`;
    const userId = this.userId || 'demo-user';
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    console.log('User ID:', userId);
    console.log('This user ID:', this.userId);
    console.log('Final User ID being sent:', userId);
    
    if (!this.userId) {
      console.warn('No user ID set! Using demo-user as fallback');
    }
    
    if (userId === 'demo-user') {
      console.warn('Using demo-user ID! This should be a real user ID');
    }
    
    // Log the actual user ID being used
    console.log('=== USER ID DEBUG ===');
    console.log('this.userId:', this.userId);
    console.log('userId (final):', userId);
    console.log('====================');
    
    // Force real user ID if available
    if (this.userId && this.userId !== 'demo-user') {
      console.log('Using real user ID:', this.userId);
    } else {
      console.warn('No real user ID available, using demo-user');
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        ...options.headers,
      },
      ...options,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    console.log('Response data length:', Array.isArray(data) ? data.length : 'Not an array');
    return data;
  }

  // მანქანების API
  async getCars(): Promise<Car[]> {
    console.log('Getting cars...');
    console.log('Current user ID:', this.userId);
    return this.request<Car[]>('/cars');
  }

  async getCar(id: string): Promise<Car> {
    return this.request<Car>(`/cars/${id}`);
  }

  async createCar(carData: CreateCarData): Promise<Car> {
    console.log('Creating car:', carData);
    console.log('Current user ID:', this.userId);
    return this.request<Car>('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  }

  async updateCar(id: string, carData: Partial<CreateCarData>): Promise<Car> {
    return this.request<Car>(`/cars/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(carData),
    });
  }

  async deleteCar(id: string): Promise<void> {
    return this.request<void>(`/cars/${id}`, {
      method: 'DELETE',
    });
  }

  // შეხსენებების API
  async getReminders(): Promise<Reminder[]> {
    console.log('Getting reminders...');
    console.log('Current user ID:', this.userId);
    return this.request<Reminder[]>('/reminders');
  }

  async getRemindersByCar(carId: string): Promise<Reminder[]> {
    return this.request<Reminder[]>(`/reminders/car/${carId}`);
  }

  async getReminder(id: string): Promise<Reminder> {
    return this.request<Reminder>(`/reminders/${id}`);
  }

  async createReminder(reminderData: CreateReminderData): Promise<Reminder> {
    console.log('Creating reminder:', reminderData);
    console.log('Current user ID:', this.userId);
    return this.request<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
  }

  async updateReminder(id: string, reminderData: Partial<CreateReminderData>): Promise<Reminder> {
    return this.request<Reminder>(`/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(reminderData),
    });
  }

  async deleteReminder(id: string): Promise<void> {
    return this.request<void>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  async markReminderCompleted(id: string): Promise<Reminder> {
    return this.request<Reminder>(`/reminders/${id}/complete`, {
      method: 'PATCH',
    });
  }

  // სტატისტიკა
  async getGarageStats(): Promise<GarageStats> {
    return this.request<GarageStats>('/stats');
  }

  // საწვავი
  async getFuelEntries(): Promise<FuelEntry[]> {
    return this.request<FuelEntry[]>('/fuel');
  }

  async getFuelEntriesByCar(carId: string): Promise<FuelEntry[]> {
    return this.request<FuelEntry[]>(`/fuel/car/${carId}`);
  }

  async createFuelEntry(entry: Omit<FuelEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<FuelEntry> {
    return this.request<FuelEntry>('/fuel', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }
}

export const garageApi = new GarageApiService();
