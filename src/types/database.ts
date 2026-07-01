/**
 * Tipos de la base de datos (Supabase).
 * Espejo manual de supabase/migrations/001_init.sql, verificado columna por columna
 * contra `supabase gen types typescript` (sin drift al 2026-06-30). Los tipos aquí
 * son deliberadamente más estrictos que el esquema real (non-null, unions estrechas
 * como SergeantId/RankId) porque triggers/defaults en la BD garantizan esos valores
 * en la práctica. Si agregas una columna nueva, actualiza esta interfaz a mano.
 */

import type { SergeantId } from '../constants/characters';
import type { RankId } from '../constants/ranks';

export type GoalType = 'habit' | 'project';
export type MessageRole = 'user' | 'sergeant';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  chosen_sergeant: SergeantId;
  rank: RankId;
  current_streak: number;
  longest_streak: number;
  is_premium: boolean;
  trial_ends_at: string; // ISO timestamptz
  checkin_hour: number;
  last_checkin_date: string | null; // ISO date
  missed_days: number;
  onboarding_done: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  type: GoalType;
  is_active: boolean;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  goal_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  completed: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  sergeant_id: SergeantId | null;
  has_audio: boolean;
  created_at: string;
}

/** Goal + su checkin de hoy (vista compuesta usada en Home). */
export interface GoalWithToday extends Goal {
  todayCheckin: Checkin | null;
}
