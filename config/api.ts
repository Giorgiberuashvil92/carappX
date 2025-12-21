import Constants from 'expo-constants';

const getLanIpFromHost = (): string | undefined => {
  // მოიძიე Expo hostUri-დან (საიმედოა dev-ში)
  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri ||
    '';
  // ფორმატი: "192.168.1.23:8081" → გვინდა მხოლოდ IP
  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    return ip && ip !== 'localhost' ? ip : undefined;
  }
  return undefined;
};

const getApiUrl = () => {
  // Environment variable override (highest priority)
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) {
    return override;
  }

  // Production build - always use production URL
  if (!__DEV__) {
    return 'https://marte-backend-production.up.railway.app';
  }

  // Development mode - use local backend
  const ip = getLanIpFromHost();
  console.log('🌐 IP:', ip);
  if (ip) {
    console.log('🌐 Using local IP:', ip);
    return `http://${ip}:3000`;
  }
  console.log('🌐 Using localhost fallback');
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiUrl();

export { API_BASE_URL };
export default API_BASE_URL;
