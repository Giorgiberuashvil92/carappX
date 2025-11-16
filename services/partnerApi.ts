import API_BASE_URL from '@/config/api';

export interface PartnerType {
  id: string;
  type: 'store' | 'dismantler' | 'carwash' | 'mechanic';
  name: string;
  description?: string;
  location?: string;
  phone?: string;
  isActive: boolean;
}

export interface UserPartnerData {
  hasStores: boolean;
  hasDismantlers: boolean;
  hasCarwashes: boolean;
  hasMechanics: boolean;
  partnerTypes: PartnerType[];
}

class PartnerApiService {
  private baseUrl = API_BASE_URL;

  /**
   * მომხმარებლის პარტნიორის ტიპის გამოვლენა
   */
  async getUserPartnerTypes(userId: string): Promise<UserPartnerData> {
    try {
      console.log('🔍 [PARTNER_API] Getting partner types for userId:', userId);
      
      // პარალელურად ვამოწმებთ ყველა ტიპს
      const [stores, dismantlers, carwashes] = await Promise.all([
        this.getUserStores(userId),
        this.getUserDismantlers(userId),
        this.getUserCarwashes(userId),
      ]);
      
      console.log('📊 [PARTNER_API] Raw Results:', {
        stores: stores.length,
        dismantlers: dismantlers.length,
        carwashes: carwashes.length,
      });
      console.log('📦 [PARTNER_API] Dismantlers data:', dismantlers);

      const partnerTypes: PartnerType[] = [];

      // მაღაზიები
      if (stores.length > 0) {
        stores.forEach(store => {
          partnerTypes.push({
            id: store._id || store.id,
            type: 'store',
            name: store.name,
            description: store.description,
            location: store.location,
            phone: store.phone,
            isActive: true,
          });
        });
      }

      // დაშლილები (თუ ownerId არის)
      if (dismantlers.length > 0) {
        dismantlers.forEach(dismantler => {
          partnerTypes.push({
            id: dismantler._id || dismantler.id,
            type: 'dismantler',
            name: dismantler.name,
            description: dismantler.description,
            location: dismantler.location,
            phone: dismantler.phone,
            isActive: dismantler.status === 'approved',
          });
        });
      }

      // ქირაობის მაღაზიები
      if (carwashes.length > 0) {
        carwashes.forEach(carwash => {
          partnerTypes.push({
            id: carwash.id,
            type: 'carwash',
            name: carwash.name,
            description: carwash.description,
            location: carwash.location,
            phone: carwash.phone,
            isActive: carwash.isOpen,
          });
        });
      }

      return {
        hasStores: stores.length > 0,
        hasDismantlers: dismantlers.length > 0,
        hasCarwashes: carwashes.length > 0,
        hasMechanics: false, // ჯერ არ გვაქვს mechanic schema
        partnerTypes,
      };
    } catch (error) {
      console.error('Error fetching user partner types:', error);
      return {
        hasStores: false,
        hasDismantlers: false,
        hasCarwashes: false,
        hasMechanics: false,
        partnerTypes: [],
      };
    }
  }

  /**
   * მომხმარებლის მაღაზიების ჩამოტვირთვა
   */
  private async getUserStores(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stores?ownerId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch stores');
      const result = await response.json();
      return result.data || result; // API response format handling
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
  }

  /**
   * მომხმარებლის დაშლილების ჩამოტვირთვა
   */
  private async getUserDismantlers(userId: string): Promise<any[]> {
    try {
      console.log('🔍 [PARTNER_API] Fetching dismantlers for userId:', userId);
      const url = `${this.baseUrl}/dismantlers?ownerId=${userId}`;
      console.log('🌐 [PARTNER_API] Request URL:', url);
      
      // ახლა ownerId ველი დაემატა dismantler schema-ში
      const response = await fetch(url);
      console.log('📡 [PARTNER_API] Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ [PARTNER_API] Failed to fetch dismantlers:', response.status);
        return [];
      }
      const result = await response.json();
      console.log('📦 [PARTNER_API] Dismantlers result:', result);
      return result.data || result; // API response format handling
    } catch (error) {
      console.error('❌ [PARTNER_API] Error fetching dismantlers:', error);
      return [];
    }
  }

  /**
   * მომხმარებლის ქირაობის მაღაზიების ჩამოტვირთვა
   */
  private async getUserCarwashes(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/carwash?ownerId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch carwashes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching carwashes:', error);
      return [];
    }
  }

}

export const partnerApi = new PartnerApiService();
