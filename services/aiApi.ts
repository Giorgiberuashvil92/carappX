import API_BASE_URL from '../config/api';

export interface AIRecommendation {
  id: string;
  type: 'store' | 'dismantler' | 'part';
  name: string;
  description: string;
  location: string;
  phone: string;
  distance?: number;
  confidence: number;
  matchReasons: string[];
  price?: string;
  images?: string[];
}

export interface PartsRequest {
  vehicle: {
    make: string;
    model: string;
    year?: string;
    submodel?: string;
  };
  partName: string;
  partDetails?: string;
  location?: string;
  maxDistance?: number;
}

export interface AIRecommendationsResponse {
  success: boolean;
  message: string;
  data: {
    request: PartsRequest;
    recommendations: AIRecommendation[];
    explanation: string;
    totalFound: number;
    breakdown: {
      parts: number;
      stores: number;
      dismantlers: number;
    };
  };
}

class AIApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getPartsRecommendations(request: PartsRequest): Promise<AIRecommendationsResponse> {
    return this.request<AIRecommendationsResponse>('/ai/recommendations/parts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPartsRecommendationsGet(params: {
    make: string;
    model: string;
    partName: string;
    year?: string;
    submodel?: string;
    partDetails?: string;
    location?: string;
    maxDistance?: number;
  }): Promise<AIRecommendationsResponse> {
    const searchParams = new URLSearchParams();
    
    searchParams.append('make', params.make);
    searchParams.append('model', params.model);
    searchParams.append('partName', params.partName);
    
    if (params.year) searchParams.append('year', params.year);
    if (params.submodel) searchParams.append('submodel', params.submodel);
    if (params.partDetails) searchParams.append('partDetails', params.partDetails);
    if (params.location) searchParams.append('location', params.location);
    if (params.maxDistance) searchParams.append('maxDistance', params.maxDistance.toString());

    return this.request<AIRecommendationsResponse>(`/ai/recommendations/parts?${searchParams.toString()}`, {
      method: 'GET',
    });
  }

  async getAIStats(): Promise<{
    success: boolean;
    message: string;
    data: {
      totalRecommendations: number;
      averageConfidence: number;
      mostRequestedParts: string[];
      mostActiveRegions: string[];
    };
  }> {
    return this.request('/ai/stats', {
      method: 'GET',
    });
  }

  async getSellerStatus(params: {
    userId: string;
    phone?: string;
    make?: string;
    model?: string;
    year?: string;
  }): Promise<{
    success: boolean;
    data: {
      showSellerPanel: boolean;
      counts: { stores: number; parts: number; dismantlers: number };
      matchingRequests: any[];
      ownedStores: Array<{
        id: string;
        title: string;
        type: string;
        phone: string;
        location: string;
        address: string;
        images: string[];
      }>;
      ownedParts: Array<{
        id: string;
        title: string;
        brand?: string;
        model?: string;
        year?: number;
        price: string;
        location: string;
        phone: string;
        images: string[];
      }>;
      ownedDismantlers: Array<{
        id: string;
        brand: string;
        model: string;
        yearFrom: number;
        yearTo: number;
        phone: string;
        location: string;
        photos: string[];
      }>;
    };
  }> {
    const searchParams = new URLSearchParams();
    searchParams.append('userId', params.userId);
    if (params.phone) searchParams.append('phone', params.phone);
    if (params.make) searchParams.append('make', params.make);
    if (params.model) searchParams.append('model', params.model);
    if (params.year) searchParams.append('year', params.year);

    return this.request(`/ai/seller-status?${searchParams.toString()}`, {
      method: 'GET',
    });
  }
}

export const aiApi = new AIApiService();
