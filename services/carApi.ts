// NHTSA VPIC API Service for Car Makes and Models

export interface CarMake {
  Make_ID: number;
  Make_Name: string;
}

export interface CarModel {
  Model_ID: number;
  Model_Name: string;
  Make_Name: string;
}

export interface VPICResponse<T> {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: T[];
}

class CarApiService {
  private baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles';
  private cache: Map<string, any> = new Map();

  // Get all car makes
  async getCarMakes(): Promise<CarMake[]> {
    const cacheKey = 'car_makes';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/getallmakes?format=json`);
      const data: VPICResponse<CarMake> = await response.json();
      
      // Filter and sort popular makes first
      const popularMakes = ['BMW', 'Mercedes', 'Toyota', 'Honda', 'Ford', 'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia'];
      const results = data.Results.filter(make => make.Make_Name && make.Make_Name.length > 0);
      
      // Sort: popular makes first, then alphabetically
      const sortedResults = results.sort((a, b) => {
        const aIndex = popularMakes.indexOf(a.Make_Name);
        const bIndex = popularMakes.indexOf(b.Make_Name);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex; // Both popular, sort by popularity order
        } else if (aIndex !== -1) {
          return -1; // a is popular, b is not
        } else if (bIndex !== -1) {
          return 1; // b is popular, a is not
        } else {
          return a.Make_Name.localeCompare(b.Make_Name); // Both not popular, sort alphabetically
        }
      });

      this.cache.set(cacheKey, sortedResults);
      return sortedResults;
    } catch (error) {
      console.error('Error fetching car makes:', error);
      // Fallback to our static data
      return [
        { Make_ID: 1, Make_Name: 'BMW' },
        { Make_ID: 2, Make_Name: 'Mercedes-Benz' },
        { Make_ID: 3, Make_Name: 'Toyota' },
        { Make_ID: 4, Make_Name: 'Honda' },
        { Make_ID: 5, Make_Name: 'Ford' },
        { Make_ID: 6, Make_Name: 'Audi' },
        { Make_ID: 7, Make_Name: 'Volkswagen' },
        { Make_ID: 8, Make_Name: 'Nissan' },
        { Make_ID: 9, Make_Name: 'Hyundai' },
        { Make_ID: 10, Make_Name: 'Kia' }
      ];
    }
  }

  // Get models for specific make
  async getModelsForMake(makeName: string): Promise<CarModel[]> {
    const cacheKey = `models_${makeName}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/getmodelsformake/${encodeURIComponent(makeName)}?format=json`);
      const data: VPICResponse<CarModel> = await response.json();
      
      const results = data.Results.filter(model => model.Model_Name && model.Model_Name.length > 0);
      
      // Sort models alphabetically
      const sortedResults = results.sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));

      this.cache.set(cacheKey, sortedResults);
      return sortedResults;
    } catch (error) {
      console.error(`Error fetching models for ${makeName}:`, error);
      // Fallback to our static data
      const fallbackModels: { [key: string]: CarModel[] } = {
        'BMW': [
          { Model_ID: 1, Model_Name: '3 Series', Make_Name: 'BMW' },
          { Model_ID: 2, Model_Name: '5 Series', Make_Name: 'BMW' },
          { Model_ID: 3, Model_Name: 'X3', Make_Name: 'BMW' },
          { Model_ID: 4, Model_Name: 'X5', Make_Name: 'BMW' }
        ],
        'Mercedes-Benz': [
          { Model_ID: 1, Model_Name: 'C-Class', Make_Name: 'Mercedes-Benz' },
          { Model_ID: 2, Model_Name: 'E-Class', Make_Name: 'Mercedes-Benz' },
          { Model_ID: 3, Model_Name: 'GLC', Make_Name: 'Mercedes-Benz' },
          { Model_ID: 4, Model_Name: 'GLE', Make_Name: 'Mercedes-Benz' }
        ],
        'Toyota': [
          { Model_ID: 1, Model_Name: 'Camry', Make_Name: 'Toyota' },
          { Model_ID: 2, Model_Name: 'Corolla', Make_Name: 'Toyota' },
          { Model_ID: 3, Model_Name: 'Prius', Make_Name: 'Toyota' },
          { Model_ID: 4, Model_Name: 'RAV4', Make_Name: 'Toyota' }
        ]
      };
      
      return fallbackModels[makeName] || [];
    }
  }

  // Clear cache (useful for refresh)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache size for debugging
  getCacheSize(): number {
    return this.cache.size;
  }
}

export const carApiService = new CarApiService();
