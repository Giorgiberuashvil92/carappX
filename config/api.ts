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
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) {
    return override;
  }

  if (__DEV__) {
    const ip = getLanIpFromHost();
    console.log('🌐 IP:', ip);
    if (ip) {
      console.log('🌐 Using IP:', ip);
      return `https://marte-backend-production.up.railway.app`;
    }
    console.log('🌐 Using localhost fallback');
    return 'https://marte-backend-production.up.railway.app';
  }

  return 'https://marte-backend-production.up.railway.app';
};

const API_BASE_URL = getApiUrl();

export { API_BASE_URL };
export default API_BASE_URL;
