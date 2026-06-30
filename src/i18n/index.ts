/**
 * i18n — español (default) + inglés, con detección del idioma del dispositivo.
 *
 * Uso: `import { t } from '../i18n';` → `t('onboarding.choose')`.
 * El idioma se fija al arrancar según el celular: inglés si el dispositivo está
 * en inglés, español en cualquier otro caso.
 *
 * Para los sargentos (IA), `appLocale()` devuelve 'es'|'en' y se inyecta en el
 * prompt para que respondan en el idioma del usuario.
 */
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { es } from './es';
import { en } from './en';

export const i18n = new I18n({ es, en });
i18n.enableFallback = true;
i18n.defaultLocale = 'es';

// Idioma inicial = el del dispositivo (lo puede sobreescribir la preferencia guardada).
const deviceLang = getLocales()[0]?.languageCode ?? 'es';
i18n.locale = deviceLang === 'en' ? 'en' : 'es';

export type AppLocale = 'es' | 'en';
const LOCALE_KEY = 'app-locale';

/** Idioma activo normalizado. */
export function appLocale(): AppLocale {
  return i18n.locale.startsWith('en') ? 'en' : 'es';
}

// Pub/sub para que la UI se vuelva a montar cuando cambia el idioma (t() no es reactivo).
const listeners = new Set<() => void>();
export function subscribeLocale(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Cambia el idioma en runtime (toggle en ajustes), lo persiste y avisa a la UI. */
export function setAppLocale(l: AppLocale) {
  if (appLocale() === l) return;
  i18n.locale = l;
  AsyncStorage.setItem(LOCALE_KEY, l).catch(() => {});
  listeners.forEach((cb) => cb());
}

/**
 * Carga la preferencia guardada (si la hay) al arrancar, ANTES del primer pintado.
 * No notifica a los listeners (aún no hay suscriptores en este punto del arranque);
 * el caller (root layout) decide si re-renderizar tras el await.
 */
export async function loadSavedLocale(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LOCALE_KEY);
    if (saved === 'es' || saved === 'en') i18n.locale = saved;
  } catch {
    // sin preferencia guardada: se queda con el idioma del dispositivo
  }
}

/** Traduce una clave. `t('a.b', { name })` admite interpolación. */
export function t(key: string, params?: Record<string, unknown>): string {
  return i18n.t(key, params);
}
