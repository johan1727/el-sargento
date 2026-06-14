/**
 * Sistema de rangos basado en la racha (current_streak).
 *
 * La racha sube +1 por cada día en que el recluta complete AL MENOS una meta.
 * Si falla 3 días seguidos, baja un rango (ver src/lib/streak.ts).
 */

export type RankId =
  | 'recluta'
  | 'cabo'
  | 'sargento'
  | 'teniente'
  | 'capitan'
  | 'general';

export interface Rank {
  id: RankId;
  label: string;
  /** insignia placeholder (emoji) — TODO: reemplazar con insignia ilustrada */
  badge: string;
  /** racha mínima para alcanzar este rango */
  minStreak: number;
  /** color de la insignia (comic, saturado) */
  color: string;
}

export const RANKS: Rank[] = [
  { id: 'recluta', label: 'Recluta', badge: '🪖', minStreak: 0, color: '#9CA3AF' },
  { id: 'cabo', label: 'Cabo', badge: '🎗️', minStreak: 3, color: '#A16207' },
  { id: 'sargento', label: 'Sargento', badge: '🎖️', minStreak: 7, color: '#2E5E3A' },
  { id: 'teniente', label: 'Teniente', badge: '⭐', minStreak: 15, color: '#1E3A8A' },
  { id: 'capitan', label: 'Capitán', badge: '🏅', minStreak: 30, color: '#D6219B' },
  { id: 'general', label: 'General', badge: '👑', minStreak: 60, color: '#E3B23C' },
];

/** Devuelve el rango que corresponde a una racha dada. */
export function rankForStreak(streak: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (streak >= rank.minStreak) current = rank;
    else break;
  }
  return current;
}

export function getRank(id: string | null | undefined): Rank {
  return RANKS.find((r) => r.id === id) ?? RANKS[0];
}

/** Índice del rango (0 = recluta). Útil para detectar ascensos/descensos. */
export function rankIndex(id: RankId): number {
  return RANKS.findIndex((r) => r.id === id);
}

/** Siguiente rango y cuántos días de racha faltan para alcanzarlo (null si general). */
export function nextRankProgress(streak: number): {
  next: Rank | null;
  daysToNext: number;
} {
  const current = rankForStreak(streak);
  const idx = rankIndex(current.id);
  const next = RANKS[idx + 1] ?? null;
  return {
    next,
    daysToNext: next ? next.minStreak - streak : 0,
  };
}
