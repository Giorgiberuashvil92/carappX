import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { BackHandler, Keyboard, Platform, AppState, AppStateStatus } from 'react-native';
import {
  useFonts as usePoppinsFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  useFonts as useManropeFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  useFonts as useNotoSansFonts,
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CarProvider } from '../contexts/CarContext';
import { MarketplaceProvider } from '../contexts/MarketplaceContext';
import { UserProvider } from '../contexts/UserContext';

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
  });

  const [poppinsLoaded] = usePoppinsFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [manropeLoaded] = useManropeFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [notoLoaded] = useNotoSansFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && poppinsLoaded && manropeLoaded && notoLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, poppinsLoaded, manropeLoaded, notoLoaded]);

  if (!fontsLoaded || !poppinsLoaded || !manropeLoaded || !notoLoaded) {
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
          <ThemeProvider value={customTheme}>
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
            <Stack.Screen name="partner" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="parts-order" options={{ headerShown: false }} />
            <Stack.Screen name="parts" options={{ headerShown: false }} />
            <Stack.Screen name="fuel-stations" options={{ headerShown: false }} />
            <Stack.Screen name="mechanics" options={{ headerShown: false }} />
            </Stack>
          </ThemeProvider>
        </MarketplaceProvider>
      </CarProvider>
    </UserProvider>
  );
}
