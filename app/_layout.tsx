/**
 * Root layout: carga fuentes, monta providers y enruta entre onboarding / app / paywall.
 */
import '../global.css';
import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Bangers_400Regular,
} from '@expo-google-fonts/bangers';
import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import { SessionProvider, useSession } from '../src/store/session';
import { hasFullAccess } from '../src/lib/streak';
import { COMIC } from '../src/constants/theme';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { loading, session, profile } = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inPaywall = segments[0] === 'paywall';
    const inApp = segments[0] === '(app)';

    if (!session) {
      // Sin sesión → onboarding
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (profile && !profile.onboarding_done) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (profile && !hasFullAccess(profile)) {
      if (!inPaywall) router.replace('/paywall');
      return;
    }

    if (session && profile?.onboarding_done) {
      if (inOnboarding || inPaywall) router.replace('/(app)');
    }
  }, [loading, session, profile, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COMIC.ink }} />
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Bangers: Bangers_400Regular,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COMIC.ink }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style="light" />
          <NavigationGuard>
            <Slot />
          </NavigationGuard>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
