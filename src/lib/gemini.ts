/**
 * Cerebro de los sargentos — Gemini.
 *
 * generateSergeantReply() construye el prompt (system prompt del personaje +
 * reglas base + contexto del recluta) y llama a la REST API de Gemini.
 *
 * SEGURIDAD: en dev llamamos directo con EXPO_PUBLIC_GEMINI_API_KEY. Para
 * producción, mover esta llamada a una Supabase Edge Function para no exponer
 * la key. Ver TODO abajo.
 *
 * Si no hay API key (o falla la red), caemos a una respuesta canned EN PERSONAJE
 * para que la app siga siendo usable.
 */
import * as FileSystem from 'expo-file-system';
import { BASE_RULES, getCharacter, type SergeantId, type Character } from '../constants/characters';
import { ENV, HAS_GEMINI, HAS_SUPABASE, GEMINI_VIA_EDGE } from './env';
import { supabase } from './supabase';

// gemini-1.5-flash según el spec. Swappable a gemini-2.0-flash / 2.5-flash.
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

export interface ChatTurn {
  role: 'user' | 'sergeant';
  content: string;
}

export interface SergeantContext {
  displayName?: string | null;
  rank: string;
  streak: number;
  /** metas de hoy con su estado */
  goalsToday: { title: string; completed: boolean }[];
}

/** Texto de contexto que se inyecta al prompt en cada llamada. */
function buildContextBlock(ctx: SergeantContext): string {
  const done = ctx.goalsToday.filter((g) => g.completed).map((g) => g.title);
  const pending = ctx.goalsToday.filter((g) => !g.completed).map((g) => g.title);
  const name = ctx.displayName ? ctx.displayName : 'el recluta';

  return [
    `CONTEXTO DEL RECLUTA (úsalo, no lo recites literal):`,
    `- Nombre: ${name}`,
    `- Rango actual: ${ctx.rank}`,
    `- Racha: ${ctx.streak} día(s) seguidos cumpliendo`,
    ctx.goalsToday.length
      ? `- Metas de hoy CUMPLIDAS: ${done.length ? done.join(', ') : 'ninguna todavía'}`
      : `- Aún no tiene metas definidas`,
    ctx.goalsToday.length
      ? `- Metas de hoy PENDIENTES: ${pending.length ? pending.join(', ') : 'ninguna, ¡todo cumplido!'}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Mapea el historial a los `contents` de Gemini (role user|model). */
function toGeminiContents(history: ChatTurn[], userMessage: string) {
  const contents = history.map((t) => ({
    role: t.role === 'user' ? 'user' : 'model',
    parts: [{ text: t.content }],
  }));
  contents.push({ role: 'user', parts: [{ text: userMessage }] });
  return contents;
}

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

export interface ReplyResult {
  text: string;
  /** true si vino de Gemini, false si fue fallback canned */
  fromAI: boolean;
}

/**
 * Genera la respuesta del sargento en personaje.
 * @param sergeantId qué sargento responde
 * @param history últimos turnos (idealmente <= 10)
 * @param userMessage mensaje nuevo del usuario
 * @param ctx contexto del recluta (metas, racha, rango)
 */
/** Arma el cuerpo de generateContent de Gemini (sin la API key). */
function buildPayload(character: Character, history: ChatTurn[], userMessage: string, ctx: SergeantContext) {
  return {
    systemInstruction: {
      parts: [{ text: `${character.systemPrompt}\n\n${BASE_RULES}\n\n${buildContextBlock(ctx)}` }],
    },
    contents: toGeminiContents(history.slice(-10), userMessage),
    generationConfig: { temperature: 1.0, topP: 0.95, maxOutputTokens: 200 },
    safetySettings: SAFETY_SETTINGS,
  };
}

function extractText(json: any): string {
  return (
    json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim() ?? ''
  );
}

/** ¿Hay alguna ruta para llamar a Gemini (Edge Function o key directa)? */
export function geminiAvailable(): boolean {
  return (GEMINI_VIA_EDGE && HAS_SUPABASE) || HAS_GEMINI;
}

/**
 * Llama a Gemini con un payload arbitrario de generateContent.
 * Prefiere la Edge Function (key en el servidor); si no, usa la key directa (dev).
 * Lanza en caso de error de red/HTTP.
 */
async function callGemini(payload: object): Promise<string> {
  if (GEMINI_VIA_EDGE && HAS_SUPABASE) {
    const { data, error } = await supabase.functions.invoke('sergeant-reply', {
      body: { model: GEMINI_MODEL, payload },
    });
    if (error) throw error;
    return (data as { text?: string })?.text ?? '';
  }
  const res = await fetch(GEMINI_URL(GEMINI_MODEL, ENV.GEMINI_API_KEY), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`gemini ${res.status} ${detail}`);
  }
  return extractText(await res.json());
}

export async function generateSergeantReply(
  sergeantId: SergeantId,
  history: ChatTurn[],
  userMessage: string,
  ctx: SergeantContext,
): Promise<ReplyResult> {
  const character = getCharacter(sergeantId);
  const canned = (): ReplyResult => ({ text: fallbackReply(sergeantId, userMessage, ctx), fromAI: false });

  if (!geminiAvailable()) return canned();

  const payload = buildPayload(character, history, userMessage, ctx);

  try {
    const text = await callGemini(payload);
    if (!text) return canned();
    return { text, fromAI: true };
  } catch (err) {
    if (__DEV__) console.warn('[gemini] error', err);
    return canned();
  }
}

/**
 * Transcribe un archivo de audio a texto usando Gemini multimodal.
 * Devuelve null si no hay ruta a Gemini o si falla (el caller decide el fallback).
 *
 * NOTA: el preset HIGH_QUALITY de expo-av produce m4a/aac. Si Gemini rechaza el
 * mimeType, ajusta a 'audio/aac' o cambia el formato de grabación.
 */
export async function transcribeAudio(uri: string): Promise<string | null> {
  if (!geminiAvailable()) return null;
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Transcribe este audio a texto en español de México. Devuelve SOLO la transcripción, sin comillas ni explicaciones.',
            },
            { inlineData: { mimeType: 'audio/mp4', data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 256 },
    };
    const text = await callGemini(payload);
    return text || null;
  } catch (err) {
    if (__DEV__) console.warn('[gemini] transcribeAudio', err);
    return null;
  }
}

// ── Fallback en personaje (sin Gemini) ─────────────────────────
// No es inteligente, pero mantiene el tono y la app usable offline / sin key.
const FALLBACKS: Record<SergeantId, string[]> = {
  gomez: [
    'Te escucho, recluta. Pero las palabras no cumplen metas: los actos sí. A trabajar.',
    'El que madruga, Dios lo ayuda. Deja de darle vueltas y cumple, recluta.',
    'Bien. Anótalo y hazlo. Tu palabra vale más que cualquier excusa.',
  ],
  rex: [
    '¿Excusas, soldado?! *WOOF!* ¡NO las quiero! ¡Quiero RESULTADOS! LET\'S GO!',
    'OORAH! ¡Esa actitud me gusta, soldado! ¡Ahora a EJECUTAR!',
    '¡MOVE IT! El fracaso NO es una opción. ¿Me copias?! *GUAU!*',
  ],
  valentina: [
    '¿Eso es todo, corazón? Qué… tierno. Demuéstrame que me equivoco.',
    'Ay, mijito. Menos charla y más acción. Te espero… aunque dudo.',
    'Casi me impresionas. Casi. Ahora hazlo en serio, tesoro.',
  ],
  fabianski: [
    'Mija, ese mensaje me ROMPIÓ el corazón. *suspiro dramático* Ahora: a cumplir. YA.',
    '¡AY! ¿Cómo me haces esto? Respira, enfócate y dame esas metas, mijo.',
    'Drama aparte… te quiero ganador. 20 lagartijas mentales y arranca.',
  ],
};

export function fallbackReply(
  sergeantId: SergeantId,
  _userMessage: string,
  ctx: SergeantContext,
): string {
  const pool = FALLBACKS[sergeantId] ?? FALLBACKS.gomez;
  const base = pool[Math.floor(Math.random() * pool.length)];
  // Pequeño toque de contexto si hay pendientes.
  const pending = ctx.goalsToday.filter((g) => !g.completed);
  if (pending.length) {
    return `${base} Te falta: ${pending[0].title}.`;
  }
  return base;
}

/*
 * TODO (producción): mover a Supabase Edge Function.
 *   supabase/functions/sergeant-reply/index.ts recibe { sergeantId, history,
 *   userMessage, ctx }, usa GEMINI_API_KEY del entorno del servidor, y devuelve
 *   el texto. Así la API key nunca llega al cliente.
 */
