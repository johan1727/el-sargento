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

import { es } from './es';
import { en } from './en';

export const i18n = new I18n({ es, en });
i18n.enableFallback = true;
i18n.defaultLocale = 'es';

const deviceLang = getLocales()[0]?.languageCode ?? 'es';
i18n.locale = deviceLang === 'en' ? 'en' : 'es';

export type AppLocale = 'es' | 'en';

/** Idioma activo normalizado. */
export function appLocale(): AppLocale {
  return i18n.locale.startsWith('en') ? 'en' : 'es';
}

/** Cambia el idioma en runtime (p. ej. toggle en ajustes). */
export function setAppLocale(l: AppLocale) {
  i18n.locale = l;
}

/** Traduce una clave. `t('a.b', { name })` admite interpolación. */
export function t(key: string, params?: Record<string, unknown>): string {
  return i18n.t(key, params);
}
