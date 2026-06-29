/**
 * Home / "El Cuartel" — rediseño dark (Fitia oscuro + alma sargento).
 *
 * - Tarjeta héroe con la racha en Bangers grande + anillo de progreso del día.
 * - Saludo del sargento en burbuja moderna.
 * - Metas del día como tarjetas oscuras con check de acento.
 * - FAB para hablar con el sargento.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../../src/store/session';
import { getCharacter } from '../../src/constants/characters';
import {
  getGoalsWithToday,
  setCheckin,
  hasAnyCompletionToday,
  updateProfile,
  getActiveDays,
} from '../../src/lib/db';
import {
  streakAfterCompletion,
  checkDemotion,
  rankDelta,
} from '../../src/lib/streak';
import { generateSergeantReply } from '../../src/lib/gemini';
import { rankForStreak } from '../../src/constants/ranks';
import type { GoalWithToday } from '../../src/types/database';
import { SergeantHeader } from '../../src/components/SergeantHeader';
import { ComicBubble } from '../../src/components/ComicBubble';
import { ComicCheckbox } from '../../src/components/ComicCheckbox';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { WeekStrip } from '../../src/components/WeekStrip';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { DARK, FONTS, RADIUS, accentGlow, greetingForHour, tint } from '../../src/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, patchProfile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;
  const [goals, setGoals] = useState<GoalWithToday[]>([]);
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [reaction, setReaction] = useState<string | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    const [data, active] = await Promise.all([
      getGoalsWithToday(user.id),
      getActiveDays(user.id, 7),
    ]);
    setGoals(data);
    setActiveDays(active);
  }, [user]);

  const didInit = useRef(false);
  useEffect(() => {
    if (!user || !profile || didInit.current) return;
    didInit.current = true;

    (async () => {
      const demotion = checkDemotion(profile);
      if (demotion.update) {
        const updated = await updateProfile(user.id, demotion.update);
        patchProfile(updated);
      }
      await loadGoals();
      setLoading(false);

      const hour = new Date().getHours();
      setReactionLoading(true);
      const ctx = {
        displayName: profile.display_name,
        rank: profile.rank,
        streak: profile.current_streak,
        goalsToday: [],
      };
      const reply = await generateSergeantReply(
        profile.chosen_sergeant,
        [],
        `Saluda al recluta: buenos ${greetingForHour(hour)}. Muy breve, 1 frase, en personaje. Menciona su rango o racha.`,
        ctx,
      );
      setGreeting(reply.text);
      setReactionLoading(false);
    })();
  }, [user, profile, loadGoals, patchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const handleToggle = async (goal: GoalWithToday) => {
    if (!user || !profile) return;
    const wasCompleted = !!goal.todayCheckin?.completed;
    const nowCompleted = !wasCompleted;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, todayCheckin: { ...g.todayCheckin!, completed: nowCompleted } }
          : g,
      ),
    );

    await setCheckin(user.id, goal.id, nowCompleted);

    if (nowCompleted) {
      const anyDone = await hasAnyCompletionToday(user.id);
      if (anyDone) {
        const streakUpdate = streakAfterCompletion(profile);
        const oldRank = profile.rank;
        const newRank = rankForStreak(streakUpdate.current_streak).id;
        if (streakUpdate.last_checkin_date !== profile.last_checkin_date) {
          const updated = await updateProfile(user.id, streakUpdate);
          patchProfile(updated);
          if (rankDelta(oldRank, newRank) === 'up') {
            router.push({ pathname: '/celebration', params: { rank: newRank } } as any);
          }
        }
      }
    }

    setReactionLoading(true);
    const prompt = nowCompleted
      ? `El recluta cumplió: "${goal.title}". Reacciona celebrando, 1 frase.`
      : `El recluta desmarcó: "${goal.title}". Reacciona brevemente, 1 frase.`;

    const ctx = {
      displayName: profile.display_name,
      rank: profile.rank,
      streak: profile.current_streak,
      goalsToday: goals.map((g) => ({
        title: g.title,
        completed: g.id === goal.id ? nowCompleted : !!g.todayCheckin?.completed,
      })),
    };
    const reply = await generateSergeantReply(profile.chosen_sergeant, [], prompt, ctx);
    setReaction(reply.text);
    setReactionLoading(false);
  };

  const completedCount = goals.filter((g) => g.todayCheckin?.completed).length;
  const allDone = goals.length > 0 && completedCount === goals.length;
  const dayPct = goals.length ? (completedCount / goals.length) * 100 : 0;
  const streak = profile?.current_streak ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: DARK.text, marginTop: 14, letterSpacing: 1 }}>
          CARGANDO, RECLUTA...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      {profile && (
        <SergeantHeader
          character={character}
          rank={profile.rank}
          streak={streak}
          onPressSettings={() => router.push('/settings')}
        />
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        {/* ── TARJETA HÉROE: RACHA + PROGRESO DEL DÍA ── */}
        <Card accentColor={accent} tintOpacity={0.07} elevation={2} style={{ margin: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, letterSpacing: 1.5 }}>
                RACHA ACTUAL
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <Text
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 76,
                    color: accent,
                    lineHeight: 76,
                    letterSpacing: -1,
                    includeFontPadding: false,
                  }}
                >
                  {streak}
                </Text>
                <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: DARK.text, marginBottom: 12, letterSpacing: 1 }}>
                  🔥 DÍA{streak === 1 ? '' : 'S'}
                </Text>
              </View>
              {profile?.longest_streak && profile.longest_streak > 0 ? (
                <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: DARK.textMuted }}>
                  Récord: {profile.longest_streak} días
                </Text>
              ) : null}
            </View>

            {/* Anillo del día (badge cuadrado moderno) */}
            <View
              style={[
                {
                  backgroundColor: allDone ? accent : DARK.surfaceAlt,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: allDone ? accent : DARK.hairline,
                  width: 84,
                  height: 84,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                allDone ? accentGlow(accent, 1) : null,
              ]}
            >
              <Text style={{ fontFamily: FONTS.display, fontSize: 32, color: allDone ? '#0B0E13' : DARK.text, lineHeight: 34 }}>
                {completedCount}/{goals.length}
              </Text>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 10, color: allDone ? '#0B0E13' : DARK.textDim, letterSpacing: 1 }}>
                HOY
              </Text>
            </View>
          </View>

          {/* Barra de progreso del día */}
          {goals.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <ProgressBar value={dayPct} color={accent} height={8} />
            </View>
          ) : null}
        </Card>

        {/* ── TIRA DE ACTIVIDAD SEMANAL ── */}
        <Card elevation={1} style={{ marginHorizontal: 16, marginBottom: 4, padding: 16 }}>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, letterSpacing: 1.5, marginBottom: 12 }}>
            ÚLTIMOS 7 DÍAS
          </Text>
          <WeekStrip activeDays={activeDays} accent={accent} />
        </Card>

        {/* ── SALUDO DEL SARGENTO ── */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: 16, marginTop: 4 }}>
          <SergeantAvatar sergeantId={character.id} size={40} shadow={1} />
          <View style={{ flex: 1 }}>
            {reactionLoading ? (
              <Card alt elevation={0} style={{ padding: 14, alignSelf: 'flex-start' }}>
                <ActivityIndicator color={accent} />
              </Card>
            ) : (
              <ComicBubble from="sergeant" accent={accent} text={reaction ?? greeting ?? '¡A cumplir, recluta!'} />
            )}
          </View>
        </View>

        {/* ── METAS DEL DÍA ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: 16,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontFamily: FONTS.display, fontSize: 26, color: DARK.text, letterSpacing: 1 }}>
            METAS DE HOY
          </Text>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {goals.length === 0 ? (
            <Card elevation={1} style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: DARK.textDim, letterSpacing: 1, textAlign: 'center' }}>
                SIN METAS ACTIVAS
              </Text>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: DARK.textMuted, marginTop: 4 }}>
                Ve a "Metas" para agregar.
              </Text>
            </Card>
          ) : (
            goals.map((goal) => {
              const done = !!goal.todayCheckin?.completed;
              return (
                <Pressable
                  key={goal.id}
                  onPress={() => handleToggle(goal)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
                >
                  <Card
                    accentColor={done ? accent : undefined}
                    tintOpacity={0.1}
                    elevation={1}
                    style={{ flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}
                  >
                    {/* Franja de acento */}
                    <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: done ? accent : tint(accent, 0.35) }} />
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                      <View pointerEvents="none">
                        <ComicCheckbox checked={done} onToggle={() => handleToggle(goal)} accent={accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: FONTS.bodyBold,
                            fontSize: 16,
                            color: done ? DARK.textDim : DARK.text,
                            textDecorationLine: done ? 'line-through' : 'none',
                          }}
                        >
                          {goal.title}
                        </Text>
                        <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textMuted, marginTop: 2 }}>
                          {goal.type === 'habit' ? 'Hábito' : 'Proyecto'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>

        {/* ── TODO COMPLETADO ── */}
        {allDone ? (
          <Card accentColor={accent} tintOpacity={0.14} elevation={2} style={{ margin: 16, padding: 22, alignItems: 'center', borderColor: tint(accent, 0.5) }}>
            <Text style={{ fontFamily: FONTS.display, fontSize: 34, color: accent, letterSpacing: 1.5, textAlign: 'center' }}>
              ¡MISIÓN CUMPLIDA!
            </Text>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.text, marginTop: 4, textAlign: 'center' }}>
              Todas las metas del día, recluta.
            </Text>
          </Card>
        ) : null}
      </ScrollView>

      {/* FAB — hablar con el sargento */}
      <View style={{ position: 'absolute', bottom: 88, right: 16 }}>
        <Pressable
          onPress={() => router.push('/(app)/chat')}
          style={[
            {
              backgroundColor: accent,
              borderRadius: RADIUS.pill,
              paddingVertical: 15,
              paddingHorizontal: 22,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            },
            accentGlow(accent, 2),
          ]}
        >
          <Text style={{ fontSize: 22 }}>💬</Text>
          <Text style={{ fontFamily: FONTS.display, fontSize: 20, color: '#0B0E13', letterSpacing: 1 }}>HABLAR</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
