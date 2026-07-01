/**
 * Root layout: carga fuentes, monta providers y enruta entre onboarding / app / paywall.
 */
import '../global.css';
import 'react-native-url-polyfill/auto';
import { useEffect, useState } from 'react';
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
import { DialogProvider } from '../src/components/Dialog';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { hasFullAccess } from '../src/lib/streak';
import { DARK } from '../src/constants/theme';
import { loadSavedLocale, subscribeLocale } from '../src/i18n';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { loading, session, profile, isGuest } = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inPaywall = segments[0] === 'paywall';
    const inApp = segments[0] === '(app)';

    // Las páginas legales son accesibles siempre (requisito de tiendas).
    if (segments[0] === 'legal') return;

    if (!session) {
      // Sin sesión → onboarding
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (profile && !profile.onboarding_done) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // El invitado (anónimo) rueda libre por la app para que la pruebe; las
    // funciones buenas (chat IA, voz) se bloquean dentro y lo incitan a crear
    // cuenta. No lo mandamos al paywall.
    if (profile && !isGuest && !hasFullAccess(profile)) {
      if (!inPaywall) router.replace('/paywall');
      return;
    }

    if (session && profile?.onboarding_done) {
      if (inOnboarding || inPaywall) router.replace('/(app)');
    }
  }, [loading, session, profile, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: DARK.bg }} />
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

  // t() no es reactivo: cuando el usuario cambia el idioma a mano en Ajustes,
  // forzamos un remount de todo el árbol (key) para que los textos se actualicen.
  const [localeTick, setLocaleTick] = useState(0);
  useEffect(() => {
    loadSavedLocale().then(() => setLocaleTick((n) => n + 1));
    return subscribeLocale(() => setLocaleTick((n) => n + 1));
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: DARK.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} key={localeTick}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <SessionProvider>
            <DialogProvider>
              <StatusBar style="light" />
              <NavigationGuard>
                <Slot />
              </NavigationGuard>
            </DialogProvider>
          </SessionProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
