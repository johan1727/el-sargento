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
import { BASE_RULES, getCharacter, type SergeantId } from '../constants/characters';
import { ENV, HAS_GEMINI } from './env';

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
export async function generateSergeantReply(
  sergeantId: SergeantId,
  history: ChatTurn[],
  userMessage: string,
  ctx: SergeantContext,
): Promise<ReplyResult> {
  const character = getCharacter(sergeantId);

  if (!HAS_GEMINI) {
    return { text: fallbackReply(sergeantId, userMessage, ctx), fromAI: false };
  }

  const systemInstruction = {
    parts: [
      {
        text: `${character.systemPrompt}\n\n${BASE_RULES}\n\n${buildContextBlock(ctx)}`,
      },
    ],
  };

  const body = {
    systemInstruction,
    contents: toGeminiContents(history.slice(-10), userMessage),
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: 200,
    },
    safetySettings: SAFETY_SETTINGS,
  };

  try {
    const res = await fetch(GEMINI_URL(GEMINI_MODEL, ENV.GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (__DEV__) console.warn('[gemini] HTTP', res.status, await res.text());
      return { text: fallbackReply(sergeantId, userMessage, ctx), fromAI: false };
    }

    const json = await res.json();
    const text: string | undefined =
      json?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('')
        .trim();

    if (!text) {
      return { text: fallbackReply(sergeantId, userMessage, ctx), fromAI: false };
    }
    return { text, fromAI: true };
  } catch (err) {
    if (__DEV__) console.warn('[gemini] error', err);
    return { text: fallbackReply(sergeantId, userMessage, ctx), fromAI: false };
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
