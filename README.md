# El Sargento 🎖️

Coach de productividad con personalidad de sargento militar. Voz real, estilo cómic, 4 personajes distintos. iOS + Android vía Expo.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Expo SDK 53 + Expo Router + TypeScript |
| Estilos | NativeWind (Tailwind para React Native) |
| Backend | Supabase (Postgres + Auth + RLS) |
| IA | Gemini 1.5 Flash (chat) + Gemini TTS (voz) |
| Audio | expo-av (reproducción) + expo-speech (fallback) |
| Suscripción | RevenueCat $149 MXN/mes |
| Notificaciones | expo-notifications |

---

## Requisitos previos

- Node 20+ y npm
- Cuenta en [Supabase](https://supabase.com) con proyecto creado
- API Key de [Google AI Studio](https://aistudio.google.com/app/apikey) (Gemini)
- Cuenta de [RevenueCat](https://revenuecat.com) con productos configurados
- Para iOS: macOS + Xcode 16+ + cuenta Apple Developer
- Para Android: Android Studio + JDK 17+

---

## Setup local

```bash
# 1. Clonar e instalar
cd "d:/TODO/sargento militar"
npm install

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales

# 3. Ejecutar la migración de Supabase
# Opción A — vía Dashboard de Supabase:
#   Abrir SQL Editor y pegar el contenido de supabase/migrations/001_init.sql
# Opción B — vía CLI de Supabase (si tienes el CLI instalado):
#   supabase login
#   supabase db push  (con SUPABASE_DB_URL configurada)

# 4. Iniciar en modo desarrollo (web o Expo Go)
npm start
# Escanear QR con Expo Go en iOS/Android
```

---

## Estructura de carpetas

```
el-sargento/
├── app/                        # Rutas (Expo Router)
│   ├── _layout.tsx             # Root layout: fuentes + providers + guards
│   ├── onboarding/             # Flujo de bienvenida (4 pasos)
│   │   ├── index.tsx           # Selección de sargento
│   │   ├── goals.tsx           # Definir metas
│   │   ├── schedule.tsx        # Hora de check-in
│   │   └── signup.tsx          # Crear cuenta
│   ├── (app)/                  # App principal (tabs)
│   │   ├── _layout.tsx         # Tab navigator
│   │   ├── index.tsx           # Home / El Cuartel
│   │   ├── chat.tsx            # Chat con el sargento
│   │   ├── goals.tsx           # Gestión de metas
│   │   └── ranks.tsx           # Rangos y racha
│   ├── celebration.tsx         # Pantalla de ascenso ¡POW!
│   └── paywall.tsx             # Pantalla de suscripción
├── src/
│   ├── components/             # UI reutilizable
│   │   ├── ComicBubble.tsx     # Viñeta de diálogo
│   │   ├── ComicButton.tsx     # Botón con sombra dura
│   │   ├── ComicCard.tsx       # Panel de cómic
│   │   ├── ComicCheckbox.tsx   # Checkbox explosivo
│   │   ├── RankBadge.tsx       # Insignia de rango + racha
│   │   └── SergeantAvatar.tsx  # Avatar (placeholder → PNG real)
│   ├── constants/
│   │   ├── characters.ts       # Los 4 sargentos: prompts + temas + voces
│   │   ├── ranks.ts            # Sistema de rangos
│   │   └── theme.ts            # Tokens visuales cómic
│   ├── lib/
│   │   ├── base64.ts           # Utils base64 + PCM→WAV
│   │   ├── db.ts               # Capa de acceso a Supabase
│   │   ├── env.ts              # Lectura segura de variables de entorno
│   │   ├── gemini.ts           # generateSergeantReply (chat IA)
│   │   ├── notifications.ts    # scheduleCheckinNotification
│   │   ├── streak.ts           # Lógica de racha, rangos y trial
│   │   ├── supabase.ts         # Cliente Supabase para RN
│   │   └── tts.ts              # generateSpeech + playSpeech (Gemini TTS)
│   ├── store/
│   │   └── session.tsx         # SessionProvider (auth + profile)
│   └── types/
│       └── database.ts         # Tipos de las tablas de Supabase
├── supabase/
│   └── migrations/
│       └── 001_init.sql        # Esquema completo + RLS + trigger de signup
├── assets/                     # Íconos y splash (placeholders — reemplazar)
├── global.css                  # Tailwind base/components/utilities
└── .env.example                # Plantilla de variables de entorno
```

---

## Los 4 Sargentos

| ID | Nombre | Personalidad | Voz TTS |
|---|---|---|---|
| `gomez` | Sargento Gómez 🇲🇽 | Grave, pausado, con honor | Charon |
| `rex` | Sergeant Rex 🇺🇸 | Explosivo, spanglish, **LADRA** ante excusas | Fenrir |
| `valentina` | Capitana Valentina 💅 | Fría, elegante, decepción venenosa | Kore |
| `fabianski` | Sargento Fabianski 🌈 | Disciplina + drama de telenovela | Puck |

Ajusta las voces TTS en `src/constants/characters.ts` → campo `ttsVoice` si Gemini actualiza el catálogo.

---

## Sistema de Rangos

| Rango | Racha mínima |
|---|---|
| Recluta 🪖 | 0 días |
| Cabo 🎗️ | 3 días |
| Sargento 🎖️ | 7 días |
| Teniente ⭐ | 15 días |
| Capitán 🏅 | 30 días |
| General 👑 | 60 días |

- Racha +1 por cada día con **al menos una meta** completada.
- 3 días fallidos seguidos → baja un rango.

---

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY  # solo backend
EXPO_PUBLIC_GEMINI_API_KEY=TU_GEMINI_KEY
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=TU_RC_IOS
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=TU_RC_ANDROID
```

> ⚠️ **Producción**: mueve las llamadas a Gemini a una Supabase Edge Function para no exponer la API key en el cliente. Ver `TODO` en `src/lib/gemini.ts`.

---

## Build para producción

```bash
# Prerequisito: cuenta en https://expo.dev
npx eas login

# Configurar proyecto
npx eas build:configure

# Build iOS (requiere macOS o EAS Build en nube)
npx eas build --platform ios

# Build Android
npx eas build --platform android

# Submit a las tiendas
npx eas submit --platform ios
npx eas submit --platform android
```

---

## TODOs pendientes (Jhonatan)

### Antes de lanzar
- [ ] **Avatares**: generar los 4 sargentos con IA en estilo cómic consistente → `assets/sargentos/<id>.png`. Descomentar en `src/components/SergeantAvatar.tsx`.
- [ ] **RevenueCat**: `npm install react-native-purchases` → configurar producto "El Sargento Premium" $149 MXN/mes en App Store Connect y Google Play Console → reemplazar el placeholder en `app/paywall.tsx`.
- [ ] **Voces Gemini TTS**: verificar que `Charon`, `Fenrir`, `Kore`, `Puck` estén disponibles en el dashboard de Gemini. Si no, mapear en `src/constants/characters.ts`.
- [ ] **Mover Gemini a Edge Function** (producción): `supabase/functions/sergeant-reply/index.ts` recibe `{ sergeantId, history, userMessage, ctx }` y usa `GEMINI_API_KEY` del entorno del servidor.
- [ ] **STT real (voz del usuario)**: en `app/(app)/chat.tsx` → reemplazar el `Alert` placeholder por transcripción real. Opciones: enviar el audio grabado a Gemini como `inlineData` base64, o usar `@react-native-voice/voice`.
- [ ] **Transcripción Gemini (multimodal)**: Gemini 1.5 Flash acepta audio en el mensaje. Ver doc: `inlineData.mimeType = 'audio/m4a'`.

### Contenido / Marketing
- [ ] Grabar clips de Rex ladrando y Valentina humillando → TikTok / IG desde día 1.
- [ ] Disclaimer legal en perfil: "Entretenimiento motivacional, no terapia ni consejo profesional."
- [ ] Agregar `eas.json` con perfiles de build staging/production.

---

## Arquitectura de seguridad (RLS)

Todas las tablas tienen RLS activo. Cada usuario solo puede leer/escribir sus propios datos (`auth.uid() = user_id`). El trigger `handle_new_user()` corre con `SECURITY DEFINER` para crear el perfil al registrarse sin bypass del cliente.

---

*Generado con Claude Code — Anthropic*
