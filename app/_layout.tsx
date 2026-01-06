import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { BackHandler, Keyboard, Platform, AppState, AppStateStatus, Text as RNText, TextInput as RNTextInput } from 'react-native';
import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CarProvider } from '../contexts/CarContext';
import { MarketplaceProvider } from '../contexts/MarketplaceContext';
import { UserProvider } from '../contexts/UserContext';

if (__DEV__) {
  import('../utils/reactotron');
}
import { ToastProvider } from '../contexts/ToastContext';
import { ModalProvider } from '../contexts/ModalContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import API_BASE_URL from '../config/api';
import  {requestPermission, getToken, AuthorizationStatus } from '@react-native-firebase/messaging';
import messaging from '@react-native-firebase/messaging';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { analyticsService } from '../services/analytics';


export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
    Inter: Inter_400Regular,
  });
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && interLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, interLoaded]);


  if (!fontsLoaded || !interLoaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);


  const customTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    const requestUserPermission = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        console.log(enabled, 'ინეიბლი')
        const token = await messaging().getToken();
        console.log('Token:', token);
      }
    };

    // Request App Tracking Transparency permission (iOS only)
    const requestTrackingPermission = async () => {
      if (Platform.OS === 'ios') {
        try {
          // Small delay to ensure app is fully initialized
          setTimeout(async () => {
            const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
            if (status === 'granted') {
              console.log('✅ User granted tracking permission');
            } else {
              console.log('❌ User denied or restricted tracking permission');
            }
          }, 500);
        } catch (error) {
          console.log('Error requesting tracking permission:', error);
        }
      }
    };

    requestUserPermission();
    requestTrackingPermission();
    
    // Initialize Firebase Analytics (fire-and-forget)
    analyticsService.initialize().catch(() => {
      // Silently fail - analytics should never block app startup
    });
    const onMessageReceived = (message: any) => {
      console.log('Message:', message);
    };
    messaging().onMessage(onMessageReceived);


    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        Keyboard.dismiss();
      }
      appState.current = nextAppState;
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    const onBackPress = () => {
      if (keyboardVisible) {
        Keyboard.dismiss();
        return true;
      }
      return false;
    };

    const backSub = Platform.OS === 'android' 
      ? BackHandler.addEventListener('hardwareBackPress', onBackPress)
      : null;

    return () => {
      showSub.remove();
      hideSub.remove();
      appStateSub?.remove();
      backSub?.remove();
    };
  }, [keyboardVisible]);

  return (
    <UserProvider>
      <SubscriptionProvider>
        <CarProvider>
          <MarketplaceProvider>
            <ToastProvider>
              <ModalProvider>
            <ThemeProvider value={customTheme}>
              {(() => {
                
                (RNText as any).defaultProps = (RNText as any).defaultProps || {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (RNText as any).defaultProps.style = [
                  (RNText as any).defaultProps.style,
                  { fontFamily: 'Inter' },
                ];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (RNTextInput as any).defaultProps = (RNTextInput as any).defaultProps || {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (RNTextInput as any).defaultProps.style = [
                  (RNTextInput as any).defaultProps.style,
                  { fontFamily: 'Inter' },
                ];
                return null;
              })()}
              <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="booking" options={{ headerShown: false }} />
              <Stack.Screen name="map" options={{ headerShown: false }} />
              <Stack.Screen name="bookings" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ headerShown: false }} />
              <Stack.Screen name="details" options={{ headerShown: false }} />
              <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
              <Stack.Screen name="chat/[offerId]" options={{ headerShown: false }} />
              <Stack.Screen name="offers" options={{ headerShown: false }} />
              <Stack.Screen name="all-requests" options={{ headerShown: false }} />
              <Stack.Screen name="partner-dashboard" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="partner" options={{ headerShown: false }} />
              <Stack.Screen name="parts-order" options={{ headerShown: false }} />
              <Stack.Screen name="parts" options={{ headerShown: false }} />
              <Stack.Screen name="stores" options={{ headerShown: false }} />
              <Stack.Screen name="detailing" options={{ headerShown: false }} />
              <Stack.Screen name="service-form" options={{ headerShown: false }} />
              <Stack.Screen name="fuel-stations" options={{ headerShown: false }} />
              <Stack.Screen name="fuel-price-details" options={{ headerShown: false }} />
              <Stack.Screen name="mechanics" options={{ headerShown: false }} />
              <Stack.Screen name="towing" options={{ headerShown: false }} />
              <Stack.Screen name="comments" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="financing-request" options={{ headerShown: false }} />
              <Stack.Screen name="financing-info" options={{ headerShown: false }} />
              <Stack.Screen name="caru-service" options={{ headerShown: false }} />
              <Stack.Screen name="caru-orders" options={{ headerShown: false }} />
              <Stack.Screen name="caru-order" options={{ headerShown: false }} />
              <Stack.Screen name="carfax" options={{headerShown: false}} />
              <Stack.Screen name="payment-card" options={{headerShown: false}} />
              <Stack.Screen name="payment-success" options={{headerShown: false}} />
              <Stack.Screen name="carfax-simulation" options={{headerShown: false}} />
              <Stack.Screen name="carfax-view" options={{headerShown: false}} />
              <Stack.Screen name="all-services" options={{headerShown: false}} />
              <Stack.Screen name="all-community" options={{headerShown: false}} />
              <Stack.Screen name="category" options={{headerShown: false}} />
              <Stack.Screen name="register" options={{headerShown: false}} />
              <Stack.Screen name="chats" options={{headerShown: false}} />
              <Stack.Screen name="chat/[chatId]" options={{headerShown: false}} />
              <Stack.Screen name="partner-chats" options={{headerShown: false}} />
              <Stack.Screen name="partner-chat/[requestId]" options={{headerShown: false}} />
              <Stack.Screen name="offers/[requestId]" options={{headerShown: false}} />
              <Stack.Screen name="mechanic/[id]" options={{headerShown: false}} />
              <Stack.Screen name="mechanic-detail" options={{headerShown: false}} />
              <Stack.Screen name="booking-details" options={{headerShown: false}} />
              <Stack.Screen name="bookings/[carwashId]" options={{headerShown: false}} />
              <Stack.Screen name="settings/[carwashId]" options={{headerShown: false}} />
              <Stack.Screen name="analytics/[carwashId]" options={{headerShown: false}} />
              <Stack.Screen name="partner-dashboard-old" options={{headerShown: false}} />
              <Stack.Screen name="partner-dashboard-simple" options={{headerShown: false}} />
              <Stack.Screen name="partner-stack" options={{headerShown: false}} />
              <Stack.Screen name="personal-info" options={{headerShown: false}} />
              <Stack.Screen name="payment" options={{headerShown: false}} />
              <Stack.Screen name="fuel" options={{headerShown: false}} />
              <Stack.Screen name="racing" options={{headerShown: false}} />
              <Stack.Screen name="stories" options={{headerShown: false}} />
              <Stack.Screen name="bog-test" options={{headerShown: false}} />
              <Stack.Screen name="car-rental/[id]" options={{headerShown: false}} />
              <Stack.Screen name="car-rental-list" options={{headerShown: false}} />
              </Stack>
            </ThemeProvider>
              </ModalProvider>
            </ToastProvider>
          </MarketplaceProvider>
        </CarProvider>
      </SubscriptionProvider>
    </UserProvider>
  );
}
