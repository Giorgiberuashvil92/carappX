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
  htmlContent?: string; // HTML content for file saving
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
  private baseUrl = 'https://cai.autoimports.ge/report';
  private apiKey = '21f47811-7a21-4be4-9ade-a311f7c016c9';

  async getCarFAXReport(vin: string): Promise<CarFAXResponse> {
    try {
      const url = `${this.baseUrl}/carfax?vin=${encodeURIComponent(vin)}`;
      const headers = {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      };
      
      console.log('🔍 CarFAX მოხსენების მოთხოვნა:');
      console.log('  URL:', url);
      console.log('  API Key:', this.apiKey ? '✅ Set' : '❌ Missing');
      console.log('  Headers:', JSON.stringify(headers, null, 2));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      
      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json().catch(() => ({}));
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ CarFAX API შეცდომა:', errorMessage, errorData);
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
          data: undefined
        } as CarFAXResponse;
      }

      // Check content-type
      const contentType = response.headers.get('content-type') || '';
      console.log('📄 Response Content-Type:', contentType);
      
      // Get response as text first (can be JSON or HTML)
      const responseText = await response.text();
      
      // Try to parse as JSON first
      let data: any;
      try {
        data = JSON.parse(responseText);
        console.log('📄 CarFAX API parsed as JSON:', {
          hasData: !!data._data,
          dataType: data._data?.type,
          dataSize: data._data?.size,
          keys: Object.keys(data),
        });
        
        // Check if response contains Blob object (React Native Blob format)
        if (data._data && data._data.type === 'text/html') {
          console.log('✅ API returned HTML as Blob object, need to extract HTML content');
          console.log('📦 Blob metadata:', {
            blobId: data._data.blobId,
            size: data._data.size,
            type: data._data.type,
          });
          
          // Since we got Blob metadata in JSON, the actual HTML content must be retrieved separately
          // The API likely returns HTML when we fetch again or use different headers
          // Let's try fetching again with Accept: text/html header
          try {
            const htmlResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'api-key': this.apiKey,
                'Accept': 'text/html', // Request HTML directly
              },
            });
            
            if (htmlResponse.ok) {
              const htmlContent = await htmlResponse.text();
              
              // Check if it's actually HTML (not JSON again)
              if (htmlContent.trim().startsWith('<') || htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html')) {
                console.log('✅ HTML content fetched successfully, length:', htmlContent.length);
                
                return {
                  success: true,
                  data: {
                    vin: vin,
                    make: 'უცნობი',
                    model: 'უცნობი',
                    year: new Date().getFullYear(),
                    reportId: 'CF' + Date.now(),
                    reportData: {
                      htmlContent: htmlContent,
                      contentType: 'text/html',
                    }
                  },
                  htmlContent: htmlContent, // Store HTML for PDF generation
                } as CarFAXResponse;
              }
            }
          } catch (blobFetchError) {
            console.warn('⚠️ Failed to fetch HTML directly:', blobFetchError);
          }
          
          // If direct fetch failed, return error
          return {
            success: false,
            error: 'Blob format received but HTML content extraction failed. Please try again.',
            message: 'HTML content extraction failed',
            data: undefined
          } as CarFAXResponse;
        }
        
        // Normal JSON response (not Blob)
        // Normalize response format - handle different response structures
        if (data.success === undefined) {
          // Check if data is directly in response (not wrapped in success/data)
          if (data.vin || data.make || data.model) {
            data = {
              success: true,
              data: data
            };
          } else {
            data.success = true;
          }
        }
        
        console.log('✅ CarFAX API response parsed as JSON');
        return data as CarFAXResponse;
        
      } catch (jsonParseError) {
        // Not JSON, likely HTML
        console.log('📄 Response is not JSON, treating as HTML');
        console.log('📄 Response preview (first 200 chars):', responseText.substring(0, 200));
        
        // Check if it looks like HTML - more flexible check
        const trimmedText = responseText.trim();
        const isHtml = 
          trimmedText.startsWith('<') || 
          trimmedText.includes('<!DOCTYPE') || 
          trimmedText.includes('<!doctype') ||
          trimmedText.toLowerCase().includes('<html') ||
          trimmedText.includes('<body') ||
          trimmedText.includes('<div') ||
          trimmedText.includes('<table') ||
          contentType.includes('text/html');
        
        if (isHtml || contentType.includes('text/html')) {
          console.log('✅ CarFAX API returned HTML response directly');
          console.log('📄 HTML length:', responseText.length, 'characters');
          console.log('📄 Content-Type:', contentType || 'not specified');
          
          return {
            success: true,
            data: {
              vin: vin,
              make: 'უცნობი',
              model: 'უცნობი',
              year: new Date().getFullYear(),
              reportId: 'CF' + Date.now(),
              reportData: {
                htmlContent: responseText,
                contentType: contentType || 'text/html',
              }
            },
            htmlContent: responseText, // Store HTML for file saving
          } as CarFAXResponse;
        }
        
        // Neither JSON nor HTML - but if content-type is text/html, treat it as HTML anyway
        if (contentType.includes('text/html')) {
          console.log('✅ Content-Type is text/html, treating as HTML even if structure unclear');
          console.log('📄 HTML length:', responseText.length, 'characters');
          
          return {
            success: true,
            data: {
              vin: vin,
              make: 'უცნობი',
              model: 'უცნობი',
              year: new Date().getFullYear(),
              reportId: 'CF' + Date.now(),
              reportData: {
                htmlContent: responseText,
                contentType: contentType || 'text/html',
              }
            },
            htmlContent: responseText, // Store HTML for file saving
          } as CarFAXResponse;
        }
        
        // Neither JSON nor HTML
        const errorMsg = jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError);
        console.error('❌ CarFAX API response parsing error:', errorMsg);
        console.error('📄 Response preview (first 500 chars):', responseText.substring(0, 500));
        console.error('📄 Content-Type:', contentType || 'not specified');
        
        return {
          success: false,
          error: 'Response parsing failed - unexpected format',
          message: errorMsg,
          data: undefined
        } as CarFAXResponse;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ CarFAX API-სთან დაკავშირების შეცდომა:', errorMessage);
      
      // Return error response instead of throwing to prevent Reactotron crash
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        data: undefined
      } as CarFAXResponse;
    }
  }

  async getUserCarFAXReports(): Promise<CarFAXReport[]> {
    try {
      console.log('📋 მომხმარებლის CarFAX მოხსენებების მოთხოვნა');
      
      const response = await fetch(`${API_BASE_URL}/carfax/reports`, {
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
      
      const response = await fetch(`${API_BASE_URL}/carfax/report/${reportId}`, {
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
      
      const response = await fetch(`${API_BASE_URL}/carfax/health`, {
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
