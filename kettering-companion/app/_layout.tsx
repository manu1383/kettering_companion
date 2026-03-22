import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthContext, AuthProvider } from '@/context/AuthProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useContext } from 'react';

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // or splash screen
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      {!user ? (
        <Stack.Screen name="login" />
      ) : (
        <Stack.Screen name=" " />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}