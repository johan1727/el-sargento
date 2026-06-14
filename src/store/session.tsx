/**
 * SessionProvider — fuente de verdad de auth + profile.
 *
 * Expone la sesión de Supabase, el profile del usuario y acciones de auth.
 * El layout raíz (app/_layout.tsx) usa esto para enrutar entre onboarding,
 * la app, y el paywall.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import { HAS_SUPABASE } from '../lib/env';
import { getProfile } from '../lib/db';
import type { Profile } from '../types/database';

interface SessionState {
  loading: boolean;
  configured: boolean; // ¿hay credenciales de Supabase?
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<Profile | null>;
  /** Actualiza el profile en memoria sin ir a la red (optimista). */
  patchProfile: (patch: Partial<Profile>) => void;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await getProfile(userId);
      setProfile(p);
      return p;
    } catch (err) {
      if (__DEV__) console.warn('[session] loadProfile', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null;
    return loadProfile(session.user.id);
  }, [session?.user, loadProfile]);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  useEffect(() => {
    if (!HAS_SUPABASE) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      loading,
      configured: HAS_SUPABASE,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
      patchProfile,
      signUp,
      signIn,
      signOut,
    }),
    [loading, session, profile, refreshProfile, patchProfile, signUp, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}
