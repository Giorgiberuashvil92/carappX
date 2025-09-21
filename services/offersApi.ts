import API_BASE_URL from '../config/api';

const GARAGE_API_URL = `${API_BASE_URL}/garage`;

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
    return this.request<RecommendationItem[]>(`/reminders/${reminderId}/offers`, {
      headers: userId ? { 'x-user-id': userId } : undefined,
    });
  }
}

export const offersApi = new OffersApiService();


