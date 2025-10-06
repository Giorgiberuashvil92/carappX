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
  if (__DEV__) {
    const ip = getLanIpFromHost();
    // backend-v2 default port
    if (ip) {
      console.log('🌐 Using IP:', ip);
      return `http://${ip}:4000`;
    }
    console.log('🌐 Using localhost');
    return 'http://localhost:4000';
  }
  return 'https://carappx.onrender.com';
};

const API_BASE_URL = getApiUrl();

export default API_BASE_URL;
