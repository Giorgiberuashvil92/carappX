import API_BASE_URL from '../config/api';

const PETROL_API_BASE = 'https://api.petrol.com.ge';

export interface FuelType {
  name: string;
  type_alt: string;
}

export interface FuelPrice {
  name: string;
  type_alt: string;
  price: number;
  change_rate: number;
  date: string;
  last_updated: string;
}

export interface ProviderPrices {
  provider: string;
  last_updated: string;
  fuel: FuelPrice[];
}

export interface LowestPrice {
  fuel_type: string;
  price: number;
  providers: string[];
}

export interface PriceHistory {
  provider: string;
  data_labels: string[];
  fuel: Array<{
    name: string;
    data: string[];
  }>;
}

export interface PriceComparison {
  fuelType: string;
  prices: Array<{
    provider: string;
    name: string;
    price: number;
  }>;
  cheapest: {
    provider: string;
    name: string;
    price: number;
  } | null;
}

class FuelPricesApiService {
  /**
   * მიმდინარე ფასების მიღება ყველა პროვაიდერისთვის
   */
  async getCurrentPrices(): Promise<ProviderPrices[]> {
    try {
      // პირველ რიგში ვცდილობთ backend API-ს
      const response = await fetch(`${API_BASE_URL}/fuel-prices/current`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend API failed, using direct API:', error);
    }

    // Fallback to direct API
    const response = await fetch(`${PETROL_API_BASE}/current/`);
    if (!response.ok) {
      throw new Error('ფასების მიღება ვერ მოხერხდა');
    }
    return await response.json();
  }

  /**
   * ყველაზე იაფი ფასების მიღება
   */
  async getLowestPrices(): Promise<LowestPrice[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/fuel-prices/lowest`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend API failed, using direct API:', error);
    }

    const response = await fetch(`${PETROL_API_BASE}/lowest/`);
    if (!response.ok) {
      throw new Error('ყველაზე იაფი ფასების მიღება ვერ მოხერხდა');
    }
    return await response.json();
  }

  /**
   * საწვავის ტიპების მიღება
   */
  async getFuelTypes(): Promise<FuelType[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/fuel-prices/fuel-types`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend API failed, using direct API:', error);
    }

    const response = await fetch(`${PETROL_API_BASE}/utils/fuel-types`);
    if (!response.ok) {
      throw new Error('საწვავის ტიპების მიღება ვერ მოხერხდა');
    }
    return await response.json();
  }

  /**
   * კონკრეტული პროვაიდერის ისტორიული ფასები
   */
  async getPriceHistory(provider: string): Promise<PriceHistory> {
    try {
      const response = await fetch(`${API_BASE_URL}/fuel-prices/history/${provider}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend API failed, using direct API:', error);
    }

    const response = await fetch(`${PETROL_API_BASE}/price-history/${provider}`);
    if (!response.ok) {
      throw new Error(`პროვაიდერის ${provider} ისტორიული ფასების მიღება ვერ მოხერხდა`);
    }
    return await response.json();
  }

  /**
   * კონკრეტული პროვაიდერის მიმდინარე ფასები
   */
  async getProviderPrices(provider: string): Promise<ProviderPrices | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/fuel-prices/provider/${provider}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend API failed, using direct API:', error);
    }

    const allPrices = await this.getCurrentPrices();
    return allPrices.find((p) => p.provider.toLowerCase() === provider.toLowerCase()) || null;
  }

  /**
   * ფასების შედარება კონკრეტული საწვავის ტიპისთვის
   */
  async comparePricesByFuelType(fuelTypeAlt: string): Promise<PriceComparison> {
    try {
      const response = await fetch(`${API_BASE_URL}/fuel-prices/compare?fuelType=${fuelTypeAlt}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend API failed, calculating locally:', error);
    }

    // Fallback: calculate locally
    const currentPrices = await this.getCurrentPrices();
    const fuelTypes = await this.getFuelTypes();
    const fuelType = fuelTypes.find((ft) => ft.type_alt === fuelTypeAlt);

    const prices = currentPrices
      .flatMap((provider) =>
        provider.fuel
          .filter((f) => f.type_alt === fuelTypeAlt)
          .map((f) => ({
            provider: provider.provider,
            name: f.name,
            price: f.price,
          })),
      )
      .sort((a, b) => a.price - b.price);

    return {
      fuelType: fuelType?.name || fuelTypeAlt,
      prices,
      cheapest: prices[0] || null,
    };
  }

  /**
   * ყველა პროვაიდერის სია
   */
  async getProviders(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/fuel-prices/providers`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend API failed, using direct API:', error);
    }

    const currentPrices = await this.getCurrentPrices();
    return currentPrices.map((p) => p.provider);
  }

  /**
   * კონკრეტული საწვავის ტიპისთვის ყველაზე იაფი ფასი
   */
  async getBestPriceForFuelType(fuelType: string): Promise<LowestPrice | null> {
    const lowestPrices = await this.getLowestPrices();
    return lowestPrices.find((p) => p.fuel_type === fuelType) || null;
  }
}

export const fuelPricesApi = new FuelPricesApiService();

