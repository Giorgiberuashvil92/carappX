import { API_BASE_URL } from '../config/api';

export interface CarFAXRequest {
  vin: string;
}

export interface CarFAXResponse {
  success: boolean;
  data?: {
    vin: string;
    make: string;
    model: string;
    year: number;
    mileage?: number;
    accidents: number;
    owners: number;
    serviceRecords: number;
    titleStatus: string;
    lastServiceDate?: string;
    reportId: string;
    reportData?: any;
  };
  error?: string;
  message?: string;
}

export interface CarFAXReport {
  _id: string;
  userId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  accidents: number;
  owners: number;
  serviceRecords: number;
  titleStatus: string;
  lastServiceDate?: string;
  reportId: string;
  reportData?: any;
  createdAt: string;
  updatedAt: string;
}

class CarFAXApi {
  private baseUrl = `${API_BASE_URL}/carfax`;

  async getCarFAXReport(vin: string): Promise<CarFAXResponse> {
    try {
      console.log('🔍 CarFAX მოხსენების მოთხოვნა VIN:', vin);
      
      const response = await fetch(`${this.baseUrl}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user', // TODO: რეალური user ID-სთან შეცვლა
        },
        body: JSON.stringify({ vin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ CarFAX API შეცდომა:', errorData);
        throw new Error(errorData.message || 'CarFAX მოხსენების მიღებისას მოხდა შეცდომა');
      }

      const data = await response.json();
      console.log('✅ CarFAX მოხსენება მიღებულია:', data);
      
      return data;
    } catch (error) {
      console.error('❌ CarFAX API-სთან დაკავშირების შეცდომა:', error);
      throw error;
    }
  }

  async getUserCarFAXReports(): Promise<CarFAXReport[]> {
    try {
      console.log('📋 მომხმარებლის CarFAX მოხსენებების მოთხოვნა');
      
      const response = await fetch(`${this.baseUrl}/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user', // TODO: რეალური user ID-სთან შეცვლა
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ CarFAX reports API შეცდომა:', errorData);
        throw new Error(errorData.message || 'CarFAX მოხსენებების მიღებისას მოხდა შეცდომა');
      }

      const data = await response.json();
      console.log('✅ CarFAX მოხსენებები მიღებულია:', data);
      
      return data;
    } catch (error) {
      console.error('❌ CarFAX reports API-სთან დაკავშირების შეცდომა:', error);
      throw error;
    }
  }

  async getCarFAXReportById(reportId: string): Promise<CarFAXReport> {
    try {
      console.log('🔍 CarFAX მოხსენების მოთხოვნა ID:', reportId);
      
      const response = await fetch(`${this.baseUrl}/report/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user', // TODO: რეალური user ID-სთან შეცვლა
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ CarFAX report API შეცდომა:', errorData);
        throw new Error(errorData.message || 'CarFAX მოხსენების მიღებისას მოხდა შეცდომა');
      }

      const data = await response.json();
      console.log('✅ CarFAX მოხსენება მიღებულია:', data);
      
      return data;
    } catch (error) {
      console.error('❌ CarFAX report API-სთან დაკავშირების შეცდომა:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; service: string; timestamp: string; message: string }> {
    try {
      console.log('🏥 CarFAX სერვისის health check');
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('CarFAX სერვისი ხელმისაწვდომი არ არის');
      }

      const data = await response.json();
      console.log('✅ CarFAX სერვისი მუშაობს:', data);
      
      return data;
    } catch (error) {
      console.error('❌ CarFAX health check შეცდომა:', error);
      throw error;
    }
  }
}

export const carfaxApi = new CarFAXApi();
