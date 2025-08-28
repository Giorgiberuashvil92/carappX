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
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData?.data ?? null;
    return token;
  } catch {
    return null;
  }
}

export async function registerPushToken(params: {
  backendUrl: string;
  role: 'user' | 'partner';
  userId?: string;
  partnerId?: string;
}) {
  const token = await getPushToken();
  if (!token) return null;
  try {
    const res = await fetch(`${params.backendUrl}/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        role: params.role,
        userId: params.userId,
        partnerId: params.partnerId,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


