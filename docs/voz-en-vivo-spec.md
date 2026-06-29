# Spec — Voz en tiempo real (Live) · FUTURO

Conversación de voz en vivo: el recluta habla y el sargento le **responde con voz en
tiempo real** para motivarlo. Premium + login (NO invitados).

## Tecnología
**Gemini Live API** (`gemini-2.0-flash-live`) — sesión bidireccional por WebSocket que
recibe audio del micrófono en streaming y devuelve audio del modelo en streaming, con
interrupción natural (barge-in). Voz por sargento vía `speechConfig.voiceConfig`
(Charon/Fenrir/Kore/Puck, igual que el TTS actual).

## Arquitectura
1. **Cliente** captura audio del micro en chunks PCM 16kHz (expo-av o
   `expo-audio` con grabación en streaming) y reproduce el audio entrante 24kHz.
2. **Proxy** la conexión Live **no debe** llevar la API key al cliente. Dos opciones:
   - (a) **Ephemeral token**: una Edge Function emite un token efímero de Gemini Live
     y el cliente abre el WebSocket directo (menos latencia). *Preferido.*
   - (b) Relay por WebSocket en un servidor propio (más control, más infra).
3. **System prompt** = el `systemPrompt` del sargento + contexto del recluta (metas,
   racha, rango), igual que `buildPayload` en `src/lib/gemini.ts`.

## Gating
- Solo logueado (`!isGuest`) y con `hasFullAccess` (premium/trial).
- Botón "Hablar en vivo" en el chat → nueva pantalla `app/(app)/live.tsx` (full-screen,
  anillo de audio reactivo con el acento del sargento, botón de colgar).
- Invitado / sin premium → reusar el patrón de bloqueo del chat (CTA a crear cuenta /
  paywall).

## Pasos de implementación
1. Edge Function `live-token` (emite ephemeral token; service-side key).
2. `src/lib/live.ts`: abrir sesión, enviar chunks de micro, reproducir audio entrante,
   manejar interrupciones y cierre.
3. Pantalla `live.tsx` con visualización de audio + estados (escuchando/hablando).
4. Permisos de micrófono (ya pedidos en el chat) y manejo de `Platform.OS !== 'web'`.
5. Medir costo/tokens: la voz en vivo consume más; considerar límite por sesión.

## Riesgos
- Latencia de red y eco (usar cancelación de eco del SO).
- Costo: sesiones largas gastan mucho; poner tope de minutos por día/plan.
- La Live API es preview: la firma puede cambiar.
