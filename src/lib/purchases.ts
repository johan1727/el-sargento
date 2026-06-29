/**
 * Integración de RevenueCat (compras in-app) — SCAFFOLD.
 *
 * El módulo nativo `react-native-purchases` aún NO está instalado (requiere
 * config nativa + productos en App Store Connect / Google Play). Este archivo
 * deja la forma de la integración lista para activar sin tocar las pantallas.
 *
 * PASOS PARA ACTIVAR:
 * 1. npm install react-native-purchases --legacy-peer-deps
 * 2. Crea el producto/suscripción "El Sargento Premium" ($149 MXN/mes) en App
 *    Store Connect y Google Play, y enlázalos en el dashboard de RevenueCat.
 * 3. Pon las API keys en .env:
 *      EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=...
 *      EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=...
 * 4. Descomenta el bloque real de abajo y borra los stubs.
 * 5. En App Store Connect / Google Play configura el webhook de RevenueCat
 *    apuntando a la Edge Function `sg-revenuecat-webhook` (ya desplegada), que
 *    pone sg_profiles.is_premium con service role. Llama a `loginPurchases(userId)`
 *    tras el login para que app_user_id == el id de Supabase.
 *
 * Mientras tanto, el paywall sigue usando el camino dev (bloqueado por el trigger
 * de seguridad, que es lo correcto en producción).
 */
import { Platform } from 'react-native';
import { ENV } from './env';

export const PURCHASES_READY = false; // pásalo a true al activar el SDK

export function purchasesApiKey(): string {
  return Platform.OS === 'ios' ? ENV.REVENUECAT_API_KEY_IOS : ENV.REVENUECAT_API_KEY_ANDROID;
}

/** Inicializa el SDK (no-op hasta activar). */
export async function initPurchases(): Promise<void> {
  if (!PURCHASES_READY) return;
  // import Purchases from 'react-native-purchases';
  // Purchases.configure({ apiKey: purchasesApiKey() });
}

/** Asocia las compras al usuario de Supabase (app_user_id). */
export async function loginPurchases(_userId: string): Promise<void> {
  if (!PURCHASES_READY) return;
  // import Purchases from 'react-native-purchases';
  // await Purchases.logIn(_userId);
}

/**
 * Lanza la compra. Devuelve true si quedó activo el entitlement "premium".
 * El estado real de is_premium lo confirma el webhook server-side; aquí solo
 * disparamos la compra y refrescamos el perfil.
 */
export async function purchasePremium(): Promise<boolean> {
  if (!PURCHASES_READY) return false;
  // import Purchases from 'react-native-purchases';
  // const offerings = await Purchases.getOfferings();
  // const pkg = offerings.current?.availablePackages?.[0];
  // if (!pkg) return false;
  // const { customerInfo } = await Purchases.purchasePackage(pkg);
  // return typeof customerInfo.entitlements.active['premium'] !== 'undefined';
  return false;
}

/** Restaura compras previas (requisito de tiendas). */
export async function restorePurchases(): Promise<boolean> {
  if (!PURCHASES_READY) return false;
  // import Purchases from 'react-native-purchases';
  // const info = await Purchases.restorePurchases();
  // return typeof info.entitlements.active['premium'] !== 'undefined';
  return false;
}
