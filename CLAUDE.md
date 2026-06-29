# El Sargento — guía para agentes

Coach de productividad con personalidad militar. 4 sargentos con voz e IA que te
felicitan o regañan según cumplas tus metas diarias. App móvil (iOS/Android) +
web de pruebas.

## Stack

- **Expo SDK 53** + **Expo Router v5** (file-based routing en `app/`)
- **TypeScript**, **React 19 / React Native 0.79**
- **NativeWind v4** disponible, pero la UI usa **estilos inline** con tokens de
  `src/constants/theme.ts` (no clases Tailwind en los componentes actuales)
- **Supabase** (auth email + Postgres) — proyecto `mrabsfuwprxisgxfqnuy`,
  COMPARTIDO con otra app ("MY EX"). **Todas nuestras tablas usan prefijo `sg_`.**
- **Gemini 2.0 Flash** (REST) para el chat; **Gemini TTS** para voz
- **RevenueCat** (pendiente) para la suscripción premium — NO Stripe (las compras
  in-app de iOS/Android van por Apple IAP + Google Play Billing)

## Comandos

```bash
npm run web        # expo start --web (probar en el navegador)
npm run ios        # expo start --ios
npm run android    # expo start --android
npx tsc --noEmit   # typecheck — CORRER SIEMPRE tras editar .ts/.tsx
```

No hay suite de tests aún. El typecheck es la verificación mínima antes de dar
algo por terminado.

## Arquitectura

```
app/                      # rutas (Expo Router)
  _layout.tsx             # carga fuentes + SessionProvider + NavigationGuard
  onboarding/             # 4 pasos: sargento → metas → horario → signup
  (app)/                  # tabs autenticados: index(Cuartel)/chat/goals/ranks
  paywall.tsx             # tras expirar el trial de 7 días
  celebration.tsx         # ascenso de rango
src/
  constants/theme.ts      # SISTEMA DE DISEÑO (ver abajo)
  constants/characters.ts # los 4 sargentos: paleta, voz, systemPrompt de Gemini
  constants/ranks.ts      # rangos derivados de la racha
  components/             # Card, ProgressBar, SergeantHeader, ComicButton, etc.
  lib/                    # db, supabase, gemini, tts, streak, notifications, env
  store/session.tsx       # SessionProvider: auth + profile (fuente de verdad)
```

`NavigationGuard` (en `app/_layout.tsx`) enruta: sin sesión → onboarding;
onboarding incompleto → onboarding; sin acceso pleno → paywall; ok → `(app)`.

## Sistema de diseño — "Fitia oscuro + alma sargento"

Estética: estructura moderna mobile-first **oscura** (estilo apps fitness como
Fitia/Whoop) PERO conservando el alma militar-cómic. Tokens en
`src/constants/theme.ts`:

- **`DARK`** — superficies (`bg #0B0E13`, `surface`, `surfaceAlt`, `surfaceHigh`),
  hairlines sutiles (`rgba(255,255,255,0.07)`), texto (`text/textDim/textMuted`),
  `track` para barras.
- **`RADIUS`** (sm 12 … xl 28 … pill) · **`SPACING`** · **`FONTS`**.
- **Tipografía híbrida:** `Bangers` (display) SOLO para números heroicos, títulos
  y nombre del sargento — es el "alma". `Nunito` para todo el cuerpo.
- **Color por sargento:** cada uno conserva su paleta (`character.theme`). En dark
  el **acento** (`theme.accent`) es el color que POP-ea: tiñe métricas, botones,
  anillos, aros de avatar, barras. La app cambia de acento según el sargento activo.
- **Helpers:** `softShadow(1|2|3)` (profundidad sutil), `accentGlow(hex)` (halo de
  color para CTA/destacados), `tint(hex, opacity)` (rgba), `cardStyle()`.
- **`Card`** y **`ProgressBar`** son los building blocks. Úsalos en pantallas nuevas.

Tokens `COMIC` + `comicShadow/comicBorder/comicWash` siguen exportados SOLO por
compatibilidad legacy. **No los uses en código nuevo.** `ComicCard.tsx` y
`ActionBurst.tsx` son componentes del estilo viejo (brutalista) ya no usados.

Reglas de contenido: nada de datos inventados ni copy de relleno. Texto en
**español mexicano**, en personaje cuando habla un sargento.

## Datos y seguridad (IMPORTANTE)

RLS verificado: las 4 tablas `sg_` tienen policy `auth.uid() = user_id`. ✅

Estado de seguridad:

1. **`GEMINI_API_KEY` fuera del cliente** — ✅ Edge Function `sergeant-reply`
   **DESPLEGADA** (proxy que usa el secret `GEMINI_API_KEY` ya configurado en el
   proyecto). El cliente la usa cuando `EXPO_PUBLIC_GEMINI_VIA_EDGE=true`. **Para
   producción:** pon `EXPO_PUBLIC_GEMINI_VIA_EDGE=true` y QUITA
   `EXPO_PUBLIC_GEMINI_API_KEY` del build. En dev (flag off) llama directo con la key.
2. **`is_premium` / `trial_ends_at` no deben escribirse desde el cliente.** La RLS
   actual permite `ALL` sobre la fila propia. ✅ **Trigger `sg_protect_premium`
   APLICADO** (`supabase/migrations/20260628120000_sg_protect_premium.sql`): rechaza
   cambios a `is_premium`/`trial_ends_at` salvo `service_role`. Además el cliente
   filtra esos campos en `updateProfile` (`src/lib/db.ts`).

   El webhook de RevenueCat (service role) será quien ponga `is_premium = true`.
   `devGrantPremium()` ya NO funciona (el trigger lo bloquea, es lo correcto); para
   probar premium en dev, actívalo desde el dashboard.

3. **Borrado de cuenta completo** — ✅ Edge Function `delete-account` **DESPLEGADA**
   (borra `auth.users` + datos `sg_` con service role; identifica al usuario por su
   propio JWT). El cliente la invoca desde Ajustes → Borrar cuenta, con fallback a
   borrar solo los datos si fallara.
   El botón "Simular compra (dev)" usa `devGrantPremium()` y dejará de funcionar en
   prod cuando el trigger exista (correcto: es un atajo solo de desarrollo).

Defaults de `sg_profiles` (los pone el trigger `sg_handle_new_user`):
`chosen_sergeant='gomez'`, `rank='recluta'`, `is_premium=false`,
`trial_ends_at = now() + 7 days`, `checkin_hour=8`.

## Lógica de negocio

- **Racha** (`src/lib/streak.ts`): +1 por día en que se cumpla ≥1 meta; idempotente
  por día. 3 días fallidos seguidos = baja un rango (`checkDemotion`).
- **Rangos** (`src/constants/ranks.ts`): recluta→cabo→sargento→teniente→capitán→general,
  por umbrales de racha.
- **Acceso:** `hasFullAccess` = `is_premium || trial vigente`. Sin acceso → paywall.
  Free tier de chat (3 msg/día) está implementado pero hoy es inalcanzable porque el
  guard manda al paywall tras el trial. **Decisión de producto pendiente:** ¿freemium
  (dejar entrar con límites) o paywall duro tras el trial? Hoy es paywall duro.

## Auth

- Email/contraseña + **Google** (`signInWithGoogle` en `store/session.tsx`, usa
  `expo-web-browser`; botón en `app/onboarding/signup.tsx`). El signup detecta si
  email-confirmation está ON (`needsConfirmation`) y pide confirmar el correo en vez
  de fallar en silencio. Reset de contraseña en el login.
- **Config pendiente en dashboards (tú):**
  - Supabase → Auth → Providers → Google: ON, con los Client IDs de Google Cloud.
  - Supabase → Auth → URL Configuration → Redirect URLs: añade `elsargento://` (scheme
    nativo) y la URL web si aplica.
  - RevenueCat → Webhooks: URL `.../functions/v1/sg-revenuecat-webhook` + header
    Authorization = `REVENUECAT_WEBHOOK_SECRET` (`supabase secrets set ...`).

## Páginas legales

`app/legal/privacy.tsx` y `app/legal/terms.tsx` (componente `LegalScreen`). Links en
signup y en Ajustes → Legal. El `NavigationGuard` exime `segments[0]==='legal'` para
que sean accesibles sin sesión (requisito de tiendas). Revisa/ajusta el contenido y
pon un contacto/empresa reales antes de publicar.

## Voz (STT)

`transcribeAudio(uri)` en `src/lib/gemini.ts` manda el audio grabado a Gemini
multimodal (vía el mismo proxy `sergeant-reply`) y devuelve el texto, que el chat
envía como mensaje. Caveat: el preset HIGH_QUALITY produce m4a/aac; si Gemini rechaza
el `mimeType 'audio/mp4'`, prueba `'audio/aac'`.

## Compras (RevenueCat)

- ✅ Webhook `sg-revenuecat-webhook` **desplegado** (pone `is_premium` con service role,
  pasa el trigger). Falta darle el secret y configurarlo en el dashboard de RC (arriba).
- Cliente: `src/lib/purchases.ts` es un **scaffold** (el SDK nativo no está instalado).
  Pasos para activar dentro del archivo. El cliente debe `Purchases.logIn(supabaseUserId)`
  para que `app_user_id` == id de Supabase.

## TODOs de producto restantes

- Avatares reales de los 4 sargentos: PNG en `assets/sargentos/<id>.png`, luego
  descomentar la rama `<Image>` en `src/components/SergeantAvatar.tsx`.
- Activar RevenueCat real (instalar SDK + productos en las tiendas) — ver `purchases.ts`.
- Poner `EXPO_PUBLIC_GEMINI_VIA_EDGE=true` y quitar la key del bundle en el build de prod.

## Convenciones

- **NO uses `Alert.alert` nativo** (rompe el diseño dark). Usa el diálogo propio:
  `const { show } = useDialog();` → `show({ icon?, title, message?, accent?, buttons? })`
  (`src/components/Dialog.tsx`, montado en el root layout). Mismo shape de botones que
  Alert (`{ text, style?: 'cancel'|'destructive', onPress? }`).
- Toda llamada a libs nativas (TTS, haptics, notifications, Audio) va con guarda
  `Platform.OS !== 'web'` o equivalente — la app corre también en web para pruebas.
- Inputs del usuario con tope de longitud (chat 1000, metas 80, nombre 40).
- `.env` NO se commitea (solo `.env.example`).
- Mensajes de commit en inglés con `Co-Authored-By: Claude`.
