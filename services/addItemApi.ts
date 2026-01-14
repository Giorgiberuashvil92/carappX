import API_BASE_URL from '../config/api';

export interface DismantlerData {
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  photos?: string[];
  description: string;
  location: string;
  phone: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface PartData {
  title: string;
  description: string;
  category: string;
  condition: 'ახალი' | 'ძალიან კარგი' | 'კარგი' | 'დამაკმაყოფილებელი';
  price: string;
  images?: string[];
  seller: string;
  location: string;
  phone: string;
  name: string;
  // Car details - now required
  brand: string;
  model: string;
  year: number;
  // Optional fields
  partNumber?: string;
  warranty?: string;
  isNegotiable?: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface StoreData {
  title: string;
  description: string;
  type: 'ავტონაწილები' | 'სამართ-დასახურებელი' | 'რემონტი' | 'სხვა';
  images?: string[];
  location: string;
  address: string;
  phone: string;
  name: string;
  ownerId: string; // Required field for backend-v2
  // Optional fields
  email?: string;
  website?: string;
  workingHours?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
  specializations?: string[];
  ownerName?: string;
  managerName?: string;
  alternativePhone?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  yearEstablished?: number;
  employeeCount?: number;
  license?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class AddItemApiService {
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
    userId?: string
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add user ID header if provided
      if (userId) {
        headers['x-user-id'] = userId;
      }
      
      const config: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
      console.log('Request config:', config);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Response error data:', errorData);
        throw new Error(errorData.message || 'Network error occurred');
      }

      const result = await response.json();
      console.log('Response data:', result);
      return result;
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Dismantlers API
  async createDismantler(data: DismantlerData, userId?: string): Promise<ApiResponse<any>> {
    return this.makeRequest('/dismantlers', 'POST', data, userId);
  }

  async getDismantlers(filters?: {
    brand?: string;
    model?: string;
    yearFrom?: number;
    yearTo?: number;
    location?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/dismantlers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, 'GET');
  }

  // Parts API
  async createPart(data: PartData): Promise<ApiResponse<any>> {
    return this.makeRequest('/parts', 'POST', data);
  }

  async getParts(filters?: {
    category?: string;
    condition?: string;
    brand?: string;
    model?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/parts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, 'GET');
  }

  // Stores API
  async createStore(data: StoreData): Promise<ApiResponse<any>> {
    return this.makeRequest('/stores', 'POST', data);
  }

  async getStores(filters?: {
    type?: string;
    location?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/stores${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, 'GET');
  }

  async getDetailingStores(filters?: {
    ownerId?: string;
    location?: string;
    includeAll?: boolean;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/detailing${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, 'GET');
  }

  async getInteriorStores(filters?: {
    ownerId?: string;
    location?: string;
    includeAll?: boolean;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/interior${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, 'GET');
  }

  async getInteriorLocations(): Promise<ApiResponse<string[]>> {
    return this.makeRequest('/interior/locations', 'GET');
  }

  async getStoreLocations(): Promise<ApiResponse<string[]>> {
    return this.makeRequest('/stores/locations', 'GET');
  }

  async getDetailingLocations(): Promise<ApiResponse<string[]>> {
    return this.makeRequest('/detailing/locations', 'GET');
  }

  async getStoreById(storeId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/stores/${storeId}`, 'GET');
  }

  async updateStore(storeId: string, data: Partial<StoreData>): Promise<ApiResponse<any>> {
    return this.makeRequest(`/stores/${storeId}`, 'PATCH', data);
  }

  async getPartsLocations(): Promise<ApiResponse<string[]>> {
    return this.makeRequest('/parts/locations', 'GET');
  }

  // Search APIs
  async searchDismantlers(keyword: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/dismantlers/search?q=${encodeURIComponent(keyword)}`, 'GET');
  }

  async searchParts(keyword: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/parts/search?q=${encodeURIComponent(keyword)}`, 'GET');
  }

  async searchStores(keyword: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/stores/search?q=${encodeURIComponent(keyword)}`, 'GET');
  }
}

export const addItemApi = new AddItemApiService();
