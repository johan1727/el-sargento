// Edge Function: borra por completo la cuenta del usuario autenticado.
// Usa el service role para eliminar la fila de auth.users (el cliente no puede)
// + todos sus datos sg_. Requisito de App Store / Google Play.
//
// Deploy:  supabase functions deploy delete-account
// (verify_jwt activo: identificamos al usuario por su propio JWT — solo puede
//  borrarse a sí mismo).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'no auth' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'invalid token' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const uid = user.id;

    // Borra los datos del usuario (por si no hay ON DELETE CASCADE).
    await admin.from('sg_messages').delete().eq('user_id', uid);
    await admin.from('sg_checkins').delete().eq('user_id', uid);
    await admin.from('sg_goals').delete().eq('user_id', uid);
    await admin.from('sg_profiles').delete().eq('id', uid);

    // Borra la cuenta de auth.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
