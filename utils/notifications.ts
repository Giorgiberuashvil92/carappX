import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    // Prefer native device token for production-grade FCM/APNs
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token = (deviceToken as any)?.data || (deviceToken as any)?.token || null;
    return typeof token === 'string' ? token : null;
  } catch {
    return null;
  }
}

export async function registerPushToken(params: {
  backendUrl: string;
  userId: string;
  platform?: string;
}) {
  const token = await getPushToken();
  if (!token) return null;
  try {
    const res = await fetch(`${params.backendUrl}/notifications/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        token,
        platform: params.platform || (Device.osName || 'unknown'),
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


