/**
 * Capa de acceso a datos sobre Supabase.
 * Todas las funciones asumen que RLS filtra por auth.uid(); igual pasamos
 * user_id explícito en inserts.
 */
import { supabase } from './supabase';
import { localDateString } from './streak';
import type {
  Checkin,
  Goal,
  GoalType,
  GoalWithToday,
  Message,
  MessageRole,
  Profile,
} from '../types/database';
import type { SergeantId } from '../constants/characters';

// ── Profile ────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('sg_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('sg_profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ── Goals ──────────────────────────────────────────────────────
export async function getActiveGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('sg_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function addGoal(
  userId: string,
  title: string,
  type: GoalType = 'habit',
): Promise<Goal> {
  const { data, error } = await supabase
    .from('sg_goals')
    .insert({ user_id: userId, title, type })
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

/** Inserta varias metas (usado al final del onboarding). */
export async function addGoals(
  userId: string,
  goals: { title: string; type: GoalType }[],
): Promise<void> {
  if (!goals.length) return;
  const rows = goals.map((g) => ({ user_id: userId, title: g.title, type: g.type }));
  const { error } = await supabase.from('sg_goals').insert(rows);
  if (error) throw error;
}

export async function updateGoal(id: string, patch: Partial<Goal>): Promise<void> {
  const { error } = await supabase.from('sg_goals').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deactivateGoal(id: string): Promise<void> {
  await updateGoal(id, { is_active: false });
}

// ── Checkins ───────────────────────────────────────────────────
/** Metas activas + su checkin de hoy. */
export async function getGoalsWithToday(
  userId: string,
  date: string = localDateString(),
): Promise<GoalWithToday[]> {
  const goals = await getActiveGoals(userId);
  if (!goals.length) return [];

  const { data, error } = await supabase
    .from('sg_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw error;

  const byGoal = new Map<string, Checkin>();
  for (const c of (data ?? []) as Checkin[]) byGoal.set(c.goal_id, c);

  return goals.map((g) => ({ ...g, todayCheckin: byGoal.get(g.id) ?? null }));
}

/** Marca/desmarca una meta para una fecha (upsert por (goal_id, date)). */
export async function setCheckin(
  userId: string,
  goalId: string,
  completed: boolean,
  date: string = localDateString(),
): Promise<Checkin> {
  const { data, error } = await supabase
    .from('sg_checkins')
    .upsert(
      { user_id: userId, goal_id: goalId, date, completed },
      { onConflict: 'goal_id,date' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as Checkin;
}

/** Checkins de una meta en los últimos N días (para % de cumplimiento). */
export async function getCompletionRate(
  userId: string,
  goalId: string,
  days: number,
): Promise<number> {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromStr = localDateString(from);

  const { data, error } = await supabase
    .from('sg_checkins')
    .select('completed,date')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .gte('date', fromStr);
  if (error) throw error;

  const completed = (data ?? []).filter((c) => c.completed).length;
  return Math.round((completed / days) * 100);
}

/** ¿Hay al menos un checkin completado hoy? (define si la racha cuenta). */
export async function hasAnyCompletionToday(
  userId: string,
  date: string = localDateString(),
): Promise<boolean> {
  const { count, error } = await supabase
    .from('sg_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', date)
    .eq('completed', true);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// ── Messages ───────────────────────────────────────────────────
export async function getRecentMessages(
  userId: string,
  limit = 30,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('sg_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  // Devolvemos en orden cronológico ascendente para pintar el chat.
  return ((data ?? []) as Message[]).reverse();
}

export async function addMessage(
  userId: string,
  msg: {
    role: MessageRole;
    content: string;
    sergeant_id?: SergeantId | null;
    has_audio?: boolean;
  },
): Promise<Message> {
  const { data, error } = await supabase
    .from('sg_messages')
    .insert({
      user_id: userId,
      role: msg.role,
      content: msg.content,
      sergeant_id: msg.sergeant_id ?? null,
      has_audio: msg.has_audio ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

/** Cuántos mensajes 'user' mandó hoy (para el límite del plan free). */
export async function countUserMessagesToday(
  userId: string,
  date: string = localDateString(),
): Promise<number> {
  const { count, error } = await supabase
    .from('sg_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', `${date}T00:00:00`);
  if (error) throw error;
  return count ?? 0;
}
