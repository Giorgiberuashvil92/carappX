import API_BASE_URL from '@/config/api';

export interface MechanicDTO {
  id: string;
  name: string;
  specialty: string;
  rating?: number;
  reviews?: number;
  experience?: string;
  location?: string;
  distanceKm?: number;
  priceGEL?: number;
  avatar?: string;
  isAvailable?: boolean;
  services?: string[];
  description?: string;
}

class MechanicsApiService {
  private baseUrl = `${API_BASE_URL}/mechanics`;

  async getMechanics(params?: { q?: string; specialty?: string; location?: string }): Promise<MechanicDTO[]> {
    try {
      const url = new URL(this.baseUrl);
      if (params?.q) url.searchParams.append('q', params.q);
      if (params?.specialty) url.searchParams.append('specialty', params.specialty);
      if (params?.location) url.searchParams.append('location', params.location);

      console.log('🔧 [MECHANICS_API] Fetching mechanics from:', url.toString());
      console.log('🔧 [MECHANICS_API] Params:', params);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('🔧 [MECHANICS_API] Response status:', response.status);
      
      if (!response.ok) {
        console.error('🔧 [MECHANICS_API] Error response:', response.status, response.statusText);
        throw new Error(`Failed to fetch mechanics: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔧 [MECHANICS_API] Raw response data:', data);
      
      const result = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      console.log('🔧 [MECHANICS_API] Processed result:', result);
      
      return result;
    } catch (error) {
      console.error('🔧 [MECHANICS_API] Error fetching mechanics:', error);
      return [];
    }
  }

  async createMechanic(payload: any): Promise<MechanicDTO | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to create mechanic: ${response.status}`);
      const data = await response.json();
      return data as MechanicDTO;
    } catch (error) {
      console.error('Error creating mechanic:', error);
      return null;
    }
  }
}

export const mechanicsApi = new MechanicsApiService();


