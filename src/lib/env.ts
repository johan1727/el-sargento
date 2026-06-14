/**
 * Acceso centralizado a variables de entorno públicas (EXPO_PUBLIC_*).
 * Expo inyecta estas en tiempo de build. Si falta una, avisamos en consola
 * en vez de reventar para que el dev sepa qué configurar en `.env`.
 */

function read(name: string, value: string | undefined): string {
  if (!value || value.startsWith('YOUR_')) {
    if (__DEV__) {
      console.warn(
        `[env] Falta la variable ${name}. Copia .env.example a .env y rellénala.`,
      );
    }
    return '';
  }
  return value;
}

export const ENV = {
  SUPABASE_URL: read('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: read(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
  GEMINI_API_KEY: read('EXPO_PUBLIC_GEMINI_API_KEY', process.env.EXPO_PUBLIC_GEMINI_API_KEY),
  REVENUECAT_API_KEY_IOS: read(
    'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
  ),
  REVENUECAT_API_KEY_ANDROID: read(
    'EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID',
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  ),
};

/** ¿Tenemos credenciales de Supabase configuradas? */
export const HAS_SUPABASE = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);
/** ¿Tenemos API key de Gemini? */
export const HAS_GEMINI = Boolean(ENV.GEMINI_API_KEY);
