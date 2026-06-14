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
      // En web no hay deep-link de OAuth; en native tampoco lo usamos (email).
      detectSessionInUrl: false,
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
