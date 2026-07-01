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
- **Modo invitado** (`signInAsGuest` = auth anónima de Supabase). Botón "Probar sin
  cuenta" en signup. Es **solo para VER la app y anotar metas** — las funciones de IA
  (chat, voz, y el Live futuro) están **bloqueadas para invitados** e incitan a crear
  cuenta. Detalle:
  - El guard NO manda al invitado al paywall (rueda libre para que la pruebe).
  - Chat: pantalla bloqueada con CTA "CREAR MI CUENTA" (no llega al input).
  - Cuartel: saludo y reacciones usan `fallbackReply` (0 tokens) si `isGuest`; banner
    de nudge "Estás de invitado → Crear cuenta".
  - En Ajustes convierte la cuenta a email+password (`upgradeAccount` = updateUser,
    mismo user_id → migración automática sin perder datos). `isGuest` en el contexto.
- **Config pendiente en dashboards (tú):**
  - Supabase → Auth → Providers → Google: ON, con los Client IDs de Google Cloud.
  - Supabase → Auth → Sign In / Providers → **Anonymous sign-ins: ON** (para el modo invitado).
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
envía como mensaje. Prueba `mimeType: 'audio/mp4'` primero y si falla o devuelve
vacío reintenta automáticamente con `'audio/aac'` (el preset HIGH_QUALITY de
expo-av produce m4a/aac y no se pudo validar en dispositivo real cuál acepta
Gemini, así que el código soporta ambos).

## Compras (RevenueCat)

- ✅ Webhook `sg-revenuecat-webhook` **desplegado** (pone `is_premium` con service role,
  pasa el trigger). Falta darle el secret y configurarlo en el dashboard de RC (arriba).
- Cliente: `src/lib/purchases.ts` es un **scaffold** (el SDK nativo no está instalado).
  Pasos para activar dentro del archivo. El cliente debe `Purchases.logIn(supabaseUserId)`
  para que `app_user_id` == id de Supabase.

## Avatares e insignias (ilustrados, generados con Canva)

- **Avatares de los 4 sargentos**: `assets/sargentos/<id>.png`, activados en
  `SergeantAvatar.tsx` (`AVATARS` map + `<Image resizeMode="cover">`, círculo vía
  `borderRadius`). Fallback a emoji si algún sargento nuevo no tiene PNG.
- **Insignias de los 6 rangos**: `assets/ranks/<id>.png`, vía componente
  `RankIcon` (imagen con fallback a emoji) usado en `RankBadge.tsx`, `ranks.tsx`
  (rango actual + timeline, solo si `isReached`) y `celebration.tsx` (badge grande
  animada). El emoji (`rank.badge`) sigue viviendo en `ranks.ts` para contextos de
  texto plano (celebración de fondo, strings interpolados) donde no cabe una imagen.
- Prompts de referencia para regenerar cualquiera: `assets/sargentos/PROMPTS.md`.

## Build (EAS)

`eas.json` con perfiles `development` (dev client, key directa), `preview` y
`production` (ambos con `EXPO_PUBLIC_GEMINI_VIA_EDGE=true`). Falta: cuenta de EAS
vinculada (`eas login` / `eas build:configure`) — el archivo de config ya existe
pero no se ha corrido ningún build real.

## Manejo de errores

- **`ErrorBoundary`** (`src/components/ErrorBoundary.tsx`) envuelve todo el árbol en
  el root layout — un crash de render muestra pantalla en personaje con reintentar,
  en vez de blanco total.
- **Errores de red**: Cuartel y Metas tenían un bug real — si `loadGoals`/`getActiveGoals`
  fallaba, `setLoading(false)` nunca corría y la skeleton se quedaba para siempre. Ambas
  pantallas ahora capturan el error y muestran `NetworkError` (retry). `handleToggle`/
  `handleAdd`/`handleRemove` también capturan fallos de red con diálogo + revert del
  optimistic update donde aplica.

## TODOs de producto restantes

- Activar RevenueCat real (instalar SDK + productos en las tiendas) — ver `purchases.ts`.
- Vincular cuenta de EAS y correr un build real (development client) para probar en
  dispositivo físico — STT y voces en vivo no se han probado fuera de web.
- `npm audit` reporta 15 vulnerabilidades (14 moderate, 1 high) todas resueltas solo
  saltando Expo SDK 53→57 (4 versiones mayores) — deliberadamente NO se tocó; es un
  cambio grande que necesita su propio ciclo de testing, no forma parte de limpieza.

## i18n (español / inglés)

`src/i18n/` (i18n-js + expo-localization). **Detecta el idioma del dispositivo** al
arrancar: inglés si el cel está en inglés, español si no. Uso: `import { t } from
'../i18n'` → `t('seccion.clave', { var })`. Diccionarios en `src/i18n/es.ts` y `en.ts`
(mismas claves). `appLocale()` devuelve `'es'|'en'`.

- **Contenido localizado vía helpers/campos:** `charTagline()` (characters), `rankLabel()`
  (ranks), `suggestionLabel()` (goalSuggestions), `sampleLineEn`/`taglineEn`/`labelEn`.
- **Sargentos en inglés:** `gemini.ts` inyecta una directiva de idioma en el prompt
  (`langLine`) → Gemini responde en el idioma del usuario; `fallbackReply` tiene
  `FALLBACKS_EN`. Voces de muestra del onboarding: `assets/voices/<id>_en.wav` (0 API).
- **Legal:** `privacy.tsx`/`terms.tsx` tienen objetos `ES`/`EN` y eligen por `appLocale()`.
- Al agregar texto nuevo: añade la clave a AMBOS diccionarios y usa `t()`. No hardcodees
  español en JSX. Hay toggle manual en Ajustes → Idioma (`setAppLocale`, persiste en
  AsyncStorage, fuerza remount vía `subscribeLocale` porque `t()` no es reactivo).

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
