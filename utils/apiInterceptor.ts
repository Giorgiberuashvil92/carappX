import Constants from 'expo-constants';
import API_BASE_URL from '../config/api';

/**
 * იღებს მიმდინარე app version-ს
 */
const getAppVersion = (): string => {
  const version = Constants.expoConfig?.version || 
    (Constants.manifest as any)?.version || 
    '1.0.0';
  return version;
};

/**
 * Wrapper function რომელიც ავტომატურად დაამატებს app version header-ს
 */
export const fetchWithVersion = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const appVersion = getAppVersion();
  
  const headers = {
    ...options.headers,
    'x-app-version': appVersion,
  } as HeadersInit;

  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * Wrapper function JSON response-ისთვის
 */
export const fetchJsonWithVersion = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetchWithVersion(url, options);
  
  if (!response.ok) {
    // თუ response არის UPGRADE_REQUIRED, გადავაგდოთ სპეციალური error
    if (response.status === 426) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify({
        type: 'UPGRADE_REQUIRED',
        ...errorData,
      }));
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

