import API_BASE_URL from '../config/api';

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  image: string;
  isActive: boolean;
  order: number;
  parentId?: string;
  serviceTypes: string[];
  popularity: number;
  viewCount: number;
  clickCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}

class CategoriesApiService {
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
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await this.request<CategoriesResponse>('/categories');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getPopularCategories(limit: number = 6): Promise<Category[]> {
    try {
      const response = await this.request<CategoriesResponse>(`/categories/popular?limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching popular categories:', error);
      return [];
    }
  }

  async getMainCategories(): Promise<Category[]> {
    try {
      const response = await this.request<CategoriesResponse>('/categories/main');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching main categories:', error);
      return [];
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const response = await this.request<{ success: boolean; data: Category }>(`/categories/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  async searchCategories(query: string): Promise<Category[]> {
    try {
      const response = await this.request<CategoriesResponse>(`/categories/search?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (error) {
      console.error('Error searching categories:', error);
      return [];
    }
  }
}

export const categoriesApi = new CategoriesApiService();

