import { API_BASE_URL } from '../config/api';

export interface BOGOAuthStatus {
  isTokenValid: boolean;  
  expiresAt: number | null;
  message: string;
}

export interface BOGApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// BOG Payment Types
export interface BOGOrderRequest {
  callback_url: string;
  external_order_id?: string;
  total_amount: number;
  currency?: string;
  product_id?: string;
  description?: string;
  success_url?: string;
  fail_url?: string;
}

export interface BOGOrderResponse {
  id: string;
  redirect_url: string;
}

export interface BOGPaymentStatus {
  order_id: string;
  status: string;
  message?: string;
}

export interface BOGPaymentDetails {
  order_id: string;
  order_status: {
    key: string;
    value: string;
  };
  payment_detail?: {
    code: string;
    code_description: string;
    transaction_id?: string;
  };
  reject_reason?: string;
}

class BOGApiService {
  private baseUrl = `${API_BASE_URL}/bog`;

  /**
   * BOG OAuth token-ის სტატუსის შემოწმება
   */
  async getOAuthStatus(): Promise<BOGOAuthStatus> {
    try {
      console.log('🔍 BOG OAuth სტატუსის შემოწმება...');
      
      const response = await fetch(`${this.baseUrl}/oauth-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ BOG OAuth სტატუსი:', data);
      
      return data;
    } catch (error) {
      console.error('❌ BOG OAuth სტატუსის შემოწმების შეცდომა:', error);
      throw error;
    }
  }

  /**
   * BOG OAuth token cache-ის გასუფთავება
   */
  async clearTokenCache(): Promise<BOGApiResponse> {
    try {
      console.log('🗑️ BOG OAuth token cache-ის გასუფთავება...');
      
      const response = await fetch(`${this.baseUrl}/clear-token-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ BOG OAuth token cache გასუფთავებულია:', data);
      
      return data;
    } catch (error) {
      console.error('❌ BOG OAuth token cache-ის გასუფთავების შეცდომა:', error);
      throw error;
    }
  }

  /**
   * BOG OAuth სერვისის ტესტირება
   */
  async testOAuthService(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🧪 BOG OAuth სერვისის ტესტირება...');
      
      // 1. OAuth სტატუსის შემოწმება
      const status = await this.getOAuthStatus();
      
      // 2. Token cache-ის გასუფთავება (თუ საჭიროა)
      if (!status.isTokenValid) {
        console.log('🔄 Token არ არის ვალიდური, cache-ის გასუფთავება...');
        await this.clearTokenCache();
        
        // 3. ხელახლა სტატუსის შემოწმება
        const newStatus = await this.getOAuthStatus();
        
        return {
          success: newStatus.isTokenValid,
          message: newStatus.isTokenValid 
            ? 'BOG OAuth სერვისი მუშაობს სწორად' 
            : 'BOG OAuth სერვისი არ მუშაობს',
          details: {
            initialStatus: status,
            finalStatus: newStatus,
          },
        };
      }
      
      return {
        success: true,
        message: 'BOG OAuth სერვისი მუშაობს სწორად',
        details: {
          status,
        },
      };
    } catch (error) {
      console.error('❌ BOG OAuth სერვისის ტესტირების შეცდომა:', error);
      
      return {
        success: false,
        message: `BOG OAuth სერვისის ტესტირება ვერ მოხერხდა: ${(error as Error).message}`,
        details: { error: (error as Error).message },
      };
    }
  }

  /**
   * BOG OAuth სერვისის სტატუსის მონიტორინგი
   */
  async monitorOAuthService(): Promise<{
    isHealthy: boolean;
    tokenStatus: BOGOAuthStatus;
    timestamp: number;
  }> {
    try {
      const tokenStatus = await this.getOAuthStatus();
      const timestamp = Date.now();
      
      return {
        isHealthy: tokenStatus.isTokenValid,
        tokenStatus,
        timestamp,
      };
    } catch (error) {
      console.error('❌ BOG OAuth მონიტორინგის შეცდომა:', error);
      
      return {
        isHealthy: false,
        tokenStatus: {
          isTokenValid: false,
          expiresAt: null,
          message: `მონიტორინგის შეცდომა: ${(error as Error).message}`,
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * BOG-ში შეკვეთის შექმნა
   */
  async createOrder(orderData: BOGOrderRequest): Promise<BOGOrderResponse> {
    try {
      console.log('🔄 BOG შეკვეთის შექმნა...', orderData);
      
      const response = await fetch(`${this.baseUrl}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ BOG შეკვეთა წარმატებით შეიქმნა:', data);
      
      return data;
    } catch (error) {
      console.error('❌ BOG შეკვეთის შექმნის შეცდომა:', error);
      throw error;
    }
  }

  /**
   * BOG გადახდის დეტალების მიღება
   */
  async getPaymentDetails(orderId: string): Promise<BOGPaymentDetails> {
    try {
      console.log('🔍 BOG გადახდის დეტალების მიღება...', orderId);
      
      const response = await fetch(`${this.baseUrl}/payment-details/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ BOG გადახდის დეტალები მიღებულია:', data);
      
      return data;
    } catch (error) {
      console.error('❌ BOG გადახდის დეტალების მიღების შეცდომა:', error);
      throw error;
    }
  }

  /**
   * BOG შეკვეთის სტატუსის შემოწმება
   */
  async getOrderStatus(orderId: string): Promise<BOGPaymentStatus> {
    try {
      console.log(`🔍 BOG შეკვეთის სტატუსის შემოწმება: ${orderId}`);
      
      const response = await fetch(`${this.baseUrl}/order-status/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ BOG შეკვეთის სტატუსი:', data);
      
      return data;
    } catch (error) {
      console.error('❌ BOG შეკვეთის სტატუსის შემოწმების შეცდომა:', error);
      throw error;
    }
  }
}

// Singleton instance
export const bogApi = new BOGApiService();

// Export types
export type { 
  BOGOAuthStatus as BOGOAuthStatusType, 
  BOGApiResponse as BOGApiResponseType,
  BOGOrderRequest as BOGOrderRequestType,
  BOGOrderResponse as BOGOrderResponseType,
  BOGPaymentStatus as BOGPaymentStatusType,
  BOGPaymentDetails as BOGPaymentDetailsType
};
