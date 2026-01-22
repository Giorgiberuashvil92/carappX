import Constants from 'expo-constants';
import API_BASE_URL from '../config/api';

export interface VersionCheckResponse {
  minVersion: string;
  currentVersion: string;
  forceUpdate: boolean;
}

/**
 * იღებს მიმდინარე აპლიკაციის ვერსიას
 */
export const getCurrentAppVersion = (): string => {
  // expo-constants-დან ვიღებთ ვერსიას
  const version = Constants.expoConfig?.version || 
    (Constants.manifest as any)?.version || 
    '1.0.0';
  return version;
};

/**
 * შეამოწმებს არის თუ არა საჭირო force update
 */
export const checkVersionUpdate = async (): Promise<VersionCheckResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/app/version-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('⚠️ Version check failed:', response.status);
      return null;
    }

    const data: VersionCheckResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error checking version:', error);
    // თუ შეცდომა მოხდა, არ ვაბლოკებთ აპლიკაციას
    return null;
  }
};

/**
 * შეადარებს ორ ვერსიას და დააბრუნებს true-ს თუ currentVersion ნაკლებია minVersion-ზე
 */
export const compareVersions = (currentVersion: string, minVersion: string): boolean => {
  const currentParts = currentVersion.split('.').map(Number);
  const minParts = minVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const minPart = minParts[i] || 0;

    if (currentPart < minPart) {
      return true; 
    } else if (currentPart > minPart) {
      return false; 
    }
  }

  return false; // ვერსიები ტოლია
};


export const shouldForceUpdate = async (): Promise<boolean> => {
  const versionInfo = await checkVersionUpdate();
  
  if (!versionInfo) {
    return false;
  }

  const currentVersion = getCurrentAppVersion();
  const needsUpdate = compareVersions(currentVersion, versionInfo.minVersion);

  return needsUpdate;
};

