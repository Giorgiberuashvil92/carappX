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
import { ToastProvider } from '../contexts/ToastContext';
import { ModalProvider } from '../contexts/ModalContext';
import { registerPushToken } from '../utils/notifications';
import API_BASE_URL from '../config/api';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
    // Alias so we can use fontFamily: 'Inter'
    Inter: Inter_400Regular,
  });
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && interLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, interLoaded]);

  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maybeUserId = (global as any)?.currentUserId || 'anonymous';
        await registerPushToken({ backendUrl: API_BASE_URL, userId: maybeUserId });
      } catch (e) {
        // ignore
      }
    })();
  }, []);

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

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, dismiss keyboard
        Keyboard.dismiss();
      }
      appState.current = nextAppState;
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Android back handler
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
      <CarProvider>
        <MarketplaceProvider>
          <ToastProvider>
            <ModalProvider>
            <ThemeProvider value={customTheme}>
              {(() => {
                // Set global default font to Inter
                // Note: RNText/RNTextInput allow setting defaultProps safely here
                // This makes all Text/TextInput use Inter without per-component styles
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              <Stack.Screen name="service-form" options={{ headerShown: false }} />
              <Stack.Screen name="fuel-stations" options={{ headerShown: false }} />
              <Stack.Screen name="mechanics" options={{ headerShown: false }} />
              <Stack.Screen name="comments" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="financing-request" options={{ headerShown: false }} />
              <Stack.Screen name="financing-info" options={{ headerShown: false }} />
              </Stack>
            </ThemeProvider>
            </ModalProvider>
          </ToastProvider>
        </MarketplaceProvider>
      </CarProvider>
    </UserProvider>
  );
}
