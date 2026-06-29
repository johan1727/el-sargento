// Webhook de RevenueCat para El Sargento.
// Pone sg_profiles.is_premium según el evento de suscripción, usando el service
// role (único que puede tocar is_premium por el trigger sg_protect_premium).
//
// Config en RevenueCat → Project → Integrations → Webhooks:
//   URL: https://<project>.supabase.co/functions/v1/sg-revenuecat-webhook
//   Authorization header: el mismo valor que el secret REVENUECAT_WEBHOOK_SECRET.
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<valor>
//
// IMPORTANTE: el cliente debe hacer Purchases.logIn(supabaseUserId) para que
// app_user_id == el id del usuario en Supabase.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GRANT = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
]);
// EXPIRATION = fin real del acceso. CANCELLATION solo apaga la auto-renovación
// (sigue activo hasta EXPIRATION), por eso no revoca aquí.
const REVOKE = new Set(['EXPIRATION']);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method' }), { status: 405 });
  }

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (secret && req.headers.get('Authorization') !== secret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  try {
    const body = await req.json();
    const event = body?.event ?? body;
    const appUserId: string | undefined = event?.app_user_id;
    const type: string | undefined = event?.type;

    if (!appUserId || !type) {
      return new Response(JSON.stringify({ error: 'missing app_user_id/type' }), { status: 400 });
    }

    let premium: boolean | null = null;
    if (GRANT.has(type)) premium = true;
    else if (REVOKE.has(type)) premium = false;

    if (premium !== null) {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { error } = await admin
        .from('sg_profiles')
        .update({ is_premium: premium })
        .eq('id', appUserId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ ok: true, type, applied: premium }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
