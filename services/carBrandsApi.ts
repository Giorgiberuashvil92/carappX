import API_BASE_URL from '@/config/api';

export interface CarBrand {
  _id?: string;
  id?: string;
  name: string;
  country?: string;
  logo?: string;
  models: string[];
  isActive?: boolean;
  order?: number;
}

export interface BrandList {
  name: string;
  models: string[];
}

class CarBrandsApi {
  private baseUrl = `${API_BASE_URL}/car-brands`;

  private normalizeBrand(brand: any): CarBrand {
    // Filter out null/undefined/empty values from models
    const models = (brand.models || []).filter((m: any) => m != null && m !== '' && typeof m === 'string');
    
    return {
      id: brand._id || brand.id,
      name: brand.name,
      country: brand.country,
      logo: brand.logo,
      models: models,
      isActive: brand.isActive !== undefined ? brand.isActive : true,
      order: brand.order || 0,
    };
  }

  async getBrands(activeOnly: boolean = true): Promise<CarBrand[]> {
    const response = await fetch(
      `${this.baseUrl}?activeOnly=${activeOnly}`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch car brands');
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(b => this.normalizeBrand(b)) : [];
  }

  async getBrandsList(): Promise<BrandList[]> {
    const response = await fetch(`${this.baseUrl}/list`);
    if (!response.ok) {
      throw new Error('Failed to fetch brands list');
    }
    return response.json();
  }

  async getModelsByBrand(brandName: string): Promise<string[]> {
    const response = await fetch(
      `${this.baseUrl}/models/${encodeURIComponent(brandName)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch models for brand: ${brandName}`);
    }
    return response.json();
  }

  async getBrandById(id: string): Promise<CarBrand> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch brand: ${id}`);
    }
    const data = await response.json();
    return this.normalizeBrand(data);
  }

  async createBrand(brand: Omit<CarBrand, '_id' | 'id'>): Promise<CarBrand> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brand),
    });
    if (!response.ok) {
      throw new Error('Failed to create brand');
    }
    const data = await response.json();
    return this.normalizeBrand(data);
  }

  async updateBrand(
    id: string,
    updates: Partial<CarBrand>,
  ): Promise<CarBrand> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update brand');
    }
    const data = await response.json();
    return this.normalizeBrand(data);
  }

  async deleteBrand(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete brand');
    }
  }

  async addModel(brandId: string, modelName: string): Promise<CarBrand> {
    const response = await fetch(`${this.baseUrl}/${brandId}/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelName }),
    });
    if (!response.ok) {
      throw new Error('Failed to add model');
    }
    const data = await response.json();
    return this.normalizeBrand(data);
  }

  async removeModel(brandId: string, modelName: string): Promise<CarBrand> {
    const response = await fetch(
      `${this.baseUrl}/${brandId}/models/${encodeURIComponent(modelName)}`,
      {
        method: 'DELETE',
      },
    );
    if (!response.ok) {
      throw new Error('Failed to remove model');
    }
    const data = await response.json();
    return this.normalizeBrand(data);
  }
}

export const carBrandsApi = new CarBrandsApi();
