import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

// გლობალური state თემისთვის
let globalSetColorScheme: React.Dispatch<React.SetStateAction<NonNullable<ColorSchemeName>>> | null = null;

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const systemColorScheme = _useColorScheme();
  const [colorScheme, setColorScheme] = useState<NonNullable<ColorSchemeName>>(
    systemColorScheme || 'light' // fallback to 'light' if null
  );
  
  // შევინახოთ setColorScheme გლობალურად
  globalSetColorScheme = setColorScheme;

  useEffect(() => {
    // წავიკითხოთ შენახული თემა აპლიკაციის ჩატვირთვისას
    AsyncStorage.getItem('theme').then((storedTheme) => {
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setColorScheme(storedTheme);
      }
    });
  }, []);

  return colorScheme;
}

// თემის შეცვლის ფუნქცია
export async function toggleColorScheme() {
  const currentTheme = await AsyncStorage.getItem('theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  await AsyncStorage.setItem('theme', newTheme);
  
  // განვაახლოთ აპლიკაციის თემა
  if (globalSetColorScheme) {
    globalSetColorScheme(newTheme as NonNullable<ColorSchemeName>);
  }
  
  return newTheme;
}