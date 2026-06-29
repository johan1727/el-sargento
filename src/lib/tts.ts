/**
 * Voz de los sargentos — Gemini TTS con fallback a expo-speech.
 *
 * generateSpeech(text, sergeantId):
 *   1. Revisa cache en disco (hash de texto+voz).
 *   2. Si no está, llama a Gemini TTS → PCM base64 → WAV → archivo en cache.
 *   3. Devuelve { uri } para reproducir con expo-av.
 *   4. Si no hay key / falla / plataforma no soporta → { fallback: 'speech' }
 *      y el caller usa speakFallback() (expo-speech, voz on-device).
 *
 * NOTA: Gemini TTS es preview y puede cambiar. Si no convence una voz para
 * Valentina o Fabianski, ajustar el `ttsVoice` en characters.ts. Si la API
 * de TTS falla del todo, expo-speech mantiene la app con voz (TODO mejorar).
 */
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

import { appLocale } from '../i18n';
import { getCharacter, type SergeantId } from '../constants/characters';
import {
  base64ToBytes,
  bytesToBase64,
  pcm16ToWav,
  sampleRateFromMime,
} from './base64';
import { ENV, HAS_GEMINI } from './env';

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const TTS_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${key}`;

const CACHE_DIR = FileSystem.cacheDirectory + 'tts/';

export type SpeechResult =
  | { kind: 'file'; uri: string }
  | { kind: 'fallback'; text: string; sergeantId: SergeantId };

async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function cacheKey(text: string, voice: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${voice}::${text}`,
  );
  return hash.slice(0, 32);
}

/**
 * Genera (o recupera de cache) el audio del texto en la voz del sargento.
 * No reproduce — usa playSpeech() para eso.
 */
export async function generateSpeech(
  text: string,
  sergeantId: SergeantId,
): Promise<SpeechResult> {
  const character = getCharacter(sergeantId);

  // Web: expo-av no reproduce nuestro WAV generado de forma fiable y
  // expo-speech usa Web Speech API → mejor fallback directo.
  if (Platform.OS === 'web' || !HAS_GEMINI) {
    return { kind: 'fallback', text, sergeantId };
  }

  try {
    await ensureCacheDir();
    const key = await cacheKey(text, character.ttsVoice);
    const uri = `${CACHE_DIR}${key}.wav`;

    const cached = await FileSystem.getInfoAsync(uri);
    if (cached.exists) return { kind: 'file', uri };

    const body = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: character.ttsVoice },
          },
        },
      },
    };

    const res = await fetch(TTS_URL(ENV.GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (__DEV__) console.warn('[tts] HTTP', res.status, await res.text());
      return { kind: 'fallback', text, sergeantId };
    }

    const json = await res.json();
    const part = json?.candidates?.[0]?.content?.parts?.[0];
    const b64: string | undefined = part?.inlineData?.data;
    const mime: string | undefined = part?.inlineData?.mimeType;

    if (!b64) return { kind: 'fallback', text, sergeantId };

    const pcm = base64ToBytes(b64);
    const wav = pcm16ToWav(pcm, sampleRateFromMime(mime), 1);
    const wavB64 = bytesToBase64(wav);

    await FileSystem.writeAsStringAsync(uri, wavB64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { kind: 'file', uri };
  } catch (err) {
    if (__DEV__) console.warn('[tts] error', err);
    return { kind: 'fallback', text, sergeantId };
  }
}

// ── Reproducción ───────────────────────────────────────────────
let currentSound: Audio.Sound | null = null;

/** Detiene cualquier audio en curso (archivo o expo-speech). */
export async function stopSpeech() {
  Speech.stop();
  if (currentSound) {
    try {
      await currentSound.unloadAsync();
    } catch {
      // ignore
    }
    currentSound = null;
  }
}

/** Reproduce un SpeechResult (archivo WAV o fallback expo-speech). */
export async function playSpeech(result: SpeechResult): Promise<void> {
  await stopSpeech();

  if (result.kind === 'fallback') {
    speakFallback(result.text, result.sergeantId);
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: result.uri },
      { shouldPlay: true },
    );
    currentSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (currentSound === sound) currentSound = null;
      }
    });
  } catch (err) {
    if (__DEV__) console.warn('[tts] playback error', err);
  }
}

/** Voz on-device (sin Gemini). Funciona en iOS/Android/web. */
export function speakFallback(text: string, sergeantId: SergeantId) {
  const character = getCharacter(sergeantId);
  // Ajustes de pitch/rate para diferenciar un poco a los personajes.
  const tuning: Record<SergeantId, { pitch: number; rate: number }> = {
    gomez: { pitch: 0.7, rate: 0.9 },
    rex: { pitch: 0.9, rate: 1.15 },
    valentina: { pitch: 1.2, rate: 0.95 },
    fabianski: { pitch: 1.05, rate: 1.05 },
  };
  const t = tuning[character.id];
  // Limpiamos marcas tipo *WOOF* para que no se lean raras.
  const clean = text.replace(/\*/g, '');
  Speech.speak(clean, {
    language: appLocale() === 'en' ? 'en-US' : 'es-MX',
    pitch: t.pitch,
    rate: t.rate,
  });
}

/** Conveniencia: generar + reproducir en un paso. */
export async function speak(text: string, sergeantId: SergeantId): Promise<void> {
  const result = await generateSpeech(text, sergeantId);
  await playSpeech(result);
}

// ── Voces de muestra PRE-DESCARGADAS ───────────────────────────
// Clips fijos del onboarding ("Escuchar"), generados una vez y empaquetados.
// Reproducirlos NO gasta API (a diferencia de speak()). Ver assets/voices/.
const SAMPLE_VOICES_ES: Record<SergeantId, number> = {
  gomez: require('../../assets/voices/gomez.wav'),
  rex: require('../../assets/voices/rex.wav'),
  valentina: require('../../assets/voices/valentina.wav'),
  fabianski: require('../../assets/voices/fabianski.wav'),
};
const SAMPLE_VOICES_EN: Record<SergeantId, number> = {
  gomez: require('../../assets/voices/gomez_en.wav'),
  rex: require('../../assets/voices/rex_en.wav'),
  valentina: require('../../assets/voices/valentina_en.wav'),
  fabianski: require('../../assets/voices/fabianski_en.wav'),
};

/**
 * Reproduce la muestra de voz del sargento desde el asset empaquetado (0 API),
 * en el idioma del dispositivo. En web cae a la voz on-device (expo-speech).
 */
export async function playSampleVoice(sergeantId: SergeantId): Promise<void> {
  await stopSpeech();
  const character = getCharacter(sergeantId);
  const en = appLocale() === 'en';

  if (Platform.OS === 'web') {
    speakFallback(en ? character.sampleLineEn : character.sampleLine, sergeantId);
    return;
  }

  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    const asset = (en ? SAMPLE_VOICES_EN : SAMPLE_VOICES_ES)[sergeantId];
    const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true });
    currentSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (currentSound === sound) currentSound = null;
      }
    });
  } catch (err) {
    if (__DEV__) console.warn('[tts] sample playback error', err);
    speakFallback(en ? character.sampleLineEn : character.sampleLine, sergeantId);
  }
}
