import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PhotoAccessBanner } from '@/components/PhotoAccessBanner';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="similar-photos" options={{ title: 'Similar Photos' }} />
        <Stack.Screen name="screenshots" options={{ title: 'Screenshots' }} />
        <Stack.Screen name="large-files" options={{ title: 'Large Files' }} />
        <Stack.Screen name="all-photos" options={{ title: 'All Photos' }} />
        <Stack.Screen name="old-photos" options={{ title: 'Old Photos' }} />
        <Stack.Screen name="recent-photos" options={{ title: 'Recent Photos' }} />
        <Stack.Screen name="blurry-photos" options={{ title: 'Blurry Photos' }} />
        <Stack.Screen name="duplicates" options={{ title: 'Duplicates' }} />
      </Stack>
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <PhotoAccessBanner />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}