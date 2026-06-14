/**
 * Lógica de racha, rangos y acceso (trial/premium).
 *
 * Reglas (del spec):
 * - La racha sube +1 por cada día en que el recluta complete AL MENOS una meta.
 * - El rango se deriva de la racha (ver constants/ranks.ts).
 * - Si falla 3 días seguidos, baja un rango.
 */
import type { Profile } from '../types/database';
import {
  RANKS,
  rankForStreak,
  rankIndex,
  type Rank,
  type RankId,
} from '../constants/ranks';

// ── Fechas (locales, formato YYYY-MM-DD) ───────────────────────
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Días enteros entre dos fechas YYYY-MM-DD (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ── Cambios de racha al completar una meta ─────────────────────
export interface StreakUpdate {
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string;
  missed_days: number;
  rank: RankId;
}

/**
 * Estado de racha tras completar (al menos) una meta HOY.
 * Idempotente dentro del mismo día: si ya se contó hoy, no vuelve a sumar.
 */
export function streakAfterCompletion(
  profile: Pick<
    Profile,
    'current_streak' | 'longest_streak' | 'last_checkin_date'
  >,
  today: string = localDateString(),
): StreakUpdate {
  const last = profile.last_checkin_date;
  let streak = profile.current_streak;

  if (last === today) {
    // Ya contamos hoy — sin cambios en la racha.
  } else if (last && daysBetween(last, today) === 1) {
    streak += 1; // día consecutivo
  } else {
    streak = 1; // primer día o se rompió la racha
  }

  const longest = Math.max(profile.longest_streak, streak);
  return {
    current_streak: streak,
    longest_streak: longest,
    last_checkin_date: today,
    missed_days: 0,
    rank: rankForStreak(streak).id,
  };
}

// ── Descenso por días fallidos ─────────────────────────────────
export interface DemotionResult {
  demoted: boolean;
  update?: Pick<StreakUpdate, 'current_streak' | 'missed_days' | 'rank'>;
  fromRank?: Rank;
  toRank?: Rank;
}

/**
 * Revisa, al abrir la app, si el recluta falló >= 3 días seguidos.
 * Si sí, baja un rango y ajusta la racha al piso del nuevo rango.
 */
export function checkDemotion(
  profile: Pick<Profile, 'current_streak' | 'last_checkin_date' | 'rank'>,
  today: string = localDateString(),
): DemotionResult {
  const last = profile.last_checkin_date;
  if (!last) return { demoted: false };

  const gap = daysBetween(last, today); // días desde la última vez que cumplió
  const missed = Math.max(0, gap - 1); // "hoy" aún no termina, no cuenta como fallo
  if (missed < 3) return { demoted: false };

  const currentRank = rankForStreak(profile.current_streak);
  const idx = rankIndex(currentRank.id);
  if (idx <= 0) {
    // Ya es recluta: no hay más abajo, solo reseteamos la racha.
    return {
      demoted: false,
      update: { current_streak: 0, missed_days: missed, rank: 'recluta' },
    };
  }

  const toRank = RANKS[idx - 1];
  return {
    demoted: true,
    fromRank: currentRank,
    toRank,
    update: {
      current_streak: toRank.minStreak,
      missed_days: 0,
      rank: toRank.id,
    },
  };
}

/** Compara rangos para disparar celebración (ascenso) o aviso (descenso). */
export function rankDelta(from: RankId, to: RankId): 'up' | 'down' | 'same' {
  const a = rankIndex(from);
  const b = rankIndex(to);
  if (b > a) return 'up';
  if (b < a) return 'down';
  return 'same';
}

// ── Trial / Premium ────────────────────────────────────────────
export const FREE_DAILY_MESSAGE_LIMIT = 3;

export function isTrialActive(profile: Pick<Profile, 'trial_ends_at'>): boolean {
  if (!profile.trial_ends_at) return false;
  return Date.now() < new Date(profile.trial_ends_at).getTime();
}

/** Acceso completo = premium o trial vigente. */
export function hasFullAccess(
  profile: Pick<Profile, 'is_premium' | 'trial_ends_at'>,
): boolean {
  return profile.is_premium || isTrialActive(profile);
}

export function trialDaysLeft(profile: Pick<Profile, 'trial_ends_at'>): number {
  if (!profile.trial_ends_at) return 0;
  const ms = new Date(profile.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
