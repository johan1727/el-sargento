/**
 * Cliente de Supabase para React Native.
 *
 * Usa AsyncStorage para persistir la sesión y react-native-url-polyfill para
 * que fetch/URL funcionen en RN. autoRefreshToken mantiene la sesión viva.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { ENV, HAS_SUPABASE } from './env';

export const supabase = createClient(
  ENV.SUPABASE_URL || 'https://placeholder.supabase.co',
  ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // En web Supabase procesa el `?code=` al recargar; en native lo cerramos a
      // mano (WebBrowser → exchangeCodeForSession) en store/session.tsx.
      detectSessionInUrl: Platform.OS === 'web',
      // PKCE: el redirect de OAuth devuelve `?code=` (query param), que es lo que
      // intercambia signInWithGoogle. Sin esto, el flujo implicit pone los tokens
      // en el fragmento `#` y no los podríamos leer en React Native.
      flowType: 'pkce',
    },
  },
);

// Refrescar el token solo mientras la app está en primer plano (recomendación
// oficial de Supabase para RN). No aplica en web.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export { HAS_SUPABASE };
