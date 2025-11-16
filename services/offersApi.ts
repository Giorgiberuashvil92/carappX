import API_BASE_URL from '../config/api';

const GARAGE_API_URL = `${API_BASE_URL}/garage`;
const OFFERS_API_URL = `${API_BASE_URL}`;

export type RecommendationItem = {
  providerName: string;
  priceGEL: number;
  etaMin?: number;
  distanceKm?: number;
  tags?: string[];
  partnerId?: string;
};

class OffersApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${GARAGE_API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    } as Record<string, string>;

    // Client-side request log
    try {
      // eslint-disable-next-line no-console
      console.log('[offersApi] →', {
        url,
        method: options.method || 'GET',
        headers,
      });
    } catch {}

    const response = await fetch(url, {
      headers: {
        ...headers,
      },
      ...options,
    });

    if (!response.ok) {
      try {
        // eslint-disable-next-line no-console
        console.log('[offersApi] ← ERROR', response.status, response.statusText);
      } catch {}
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    try {
      // eslint-disable-next-line no-console
      console.log('[offersApi] ← OK', response.status);
    } catch {}
    return response.json();
  }

  async getReminderOffers(reminderId: string, userId?: string): Promise<RecommendationItem[]> {
    // Use offers endpoint instead of non-existent reminders/offers endpoint
    const url = `${OFFERS_API_URL}/offers?reqId=${reminderId}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
    };

    console.log('[offersApi] →', { url, method: 'GET', headers });

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.log('[offersApi] ← ERROR', response.status, response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    console.log('[offersApi] ← OK', response.status);
    return response.json();
  }

  async getOffersByReminderType(reminderType: string, userId?: string): Promise<RecommendationItem[]> {
    // Get offers by reminder type (global offers for this reminder category)
    const url = `${OFFERS_API_URL}/offers?reminderType=${reminderType}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
    };

    console.log('[offersApi] → getOffersByReminderType', { url, method: 'GET', headers });

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.log('[offersApi] ← ERROR', response.status, response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    console.log('[offersApi] ← OK', response.status);
    return response.json();
  }
}

export const offersApi = new OffersApiService();


