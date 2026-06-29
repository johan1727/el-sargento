// Edge Function: proxy a Gemini para que la API key viva en el servidor, no en
// el bundle del cliente.
//
// Deploy:
//   supabase functions deploy sergeant-reply
//   supabase secrets set GEMINI_API_KEY=tu_key   (NO la EXPO_PUBLIC_)
//
// El cliente la invoca con supabase.functions.invoke('sergeant-reply', { body })
// pasando { model, payload } donde payload es el cuerpo de generateContent
// (systemInstruction, contents, generationConfig, safetySettings).
//
// El prompt no es secreto; lo único que protegemos aquí es GEMINI_API_KEY.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY no configurada' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { model = 'gemini-2.0-flash', payload } = await req.json();
    if (!payload) {
      return new Response(JSON.stringify({ error: 'falta payload' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(JSON.stringify({ error: 'gemini_error', status: res.status, detail }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    const text: string =
      json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim() ?? '';

    return new Response(JSON.stringify({ text }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
