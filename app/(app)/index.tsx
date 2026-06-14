/**
 * Home / "El Cuartel" — rediseño Brutalist.
 *
 * Diferenciadores visuales:
 * - Racha en Bangers 88px como elemento compositivo principal (domina sobre el fold)
 * - SergeantHeader full-bleed con color del sargento
 * - Color wash del sargento en cada tarjeta de meta
 * - ActionBurst decorativo en el header de progreso
 * - Metas en panel cómic con borde izquierdo grueso en color accent
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
} from '../../src/lib/db';
import {
  streakAfterCompletion,
  checkDemotion,
  rankDelta,
  localDateString,
} from '../../src/lib/streak';
import { generateSergeantReply } from '../../src/lib/gemini';
import { rankForStreak } from '../../src/constants/ranks';
import type { GoalWithToday } from '../../src/types/database';
import { SergeantHeader } from '../../src/components/SergeantHeader';
import { ComicBubble } from '../../src/components/ComicBubble';
import { ComicButton } from '../../src/components/ComicButton';
import { ComicCheckbox } from '../../src/components/ComicCheckbox';
import { ActionBurst } from '../../src/components/ActionBurst';
import { COMIC, comicBorder, comicShadow, comicWash, greetingForHour } from '../../src/constants/theme';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile, patchProfile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const [goals, setGoals] = useState<GoalWithToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [reaction, setReaction] = useState<string | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    const data = await getGoalsWithToday(user.id);
    setGoals(data);
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
  const streak = profile?.current_streak ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: character.theme.dark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={character.theme.accent} />
        <Text style={{ fontFamily: 'Bangers', fontSize: 22, color: '#FFF', marginTop: 14, letterSpacing: 1 }}>
          CARGANDO, RECLUTA...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paperWarm }} edges={['top']}>
      {/* Header full-bleed del sargento */}
      {profile && (
        <SergeantHeader
          character={character}
          rank={profile.rank}
          streak={streak}
        />
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={character.theme.primary}
          />
        }
      >
        {/* ── RACHA DOMINANTE — diferenciador Brutalist ── */}
        <View
          style={[
            comicBorder,
            comicShadow(6, character.theme.primary),
            {
              backgroundColor: COMIC.yellow,
              borderTopWidth: 0,
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 20,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              overflow: 'visible',
            },
          ]}
        >
          {/* Número de racha a 88px — domina el layout */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Bangers',
                fontSize: 88,
                color: COMIC.ink,
                lineHeight: 84,
                letterSpacing: -2,
                includeFontPadding: false,
              }}
            >
              {streak}
            </Text>
            <Text
              style={{
                fontFamily: 'Bangers',
                fontSize: 22,
                color: character.theme.dark,
                letterSpacing: 1,
                marginTop: -4,
              }}
            >
              🔥 DÍA{streak === 1 ? '' : 'S'} DE RACHA
            </Text>
            {profile?.longest_streak && profile.longest_streak > 0 && (
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#555', marginTop: 4 }}>
                Récord: {profile.longest_streak} días
              </Text>
            )}
          </View>

          {/* Progreso del día */}
          <View
            style={[
              comicBorder,
              {
                backgroundColor: allDone ? character.theme.primary : '#FFFFFF',
                borderRadius: 16,
                width: 90,
                height: 90,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              },
            ]}
          >
            <Text style={{ fontFamily: 'Bangers', fontSize: 36, color: allDone ? '#FFF' : COMIC.ink, lineHeight: 38 }}>
              {completedCount}/{goals.length}
            </Text>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 11, color: allDone ? '#DDD' : '#888', textAlign: 'center' }}>
              HOY
            </Text>
          </View>

          {/* Burst decorativo */}
          <ActionBurst
            text={allDone ? '¡BOOM!' : '¡ZAS!'}
            color={allDone ? character.theme.accent : '#FF6B6B'}
            size="sm"
            rotate={12}
            position="absolute"
            top={-14}
            right={16}
          />
        </View>

        {/* ── SALUDO DEL SARGENTO ── */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: 16, marginTop: 18 }}>
          <SergeantAvatar sergeantId={character.id} size={42} shadow={3} />
          <View style={{ flex: 1 }}>
            {reactionLoading ? (
              <View
                style={[
                  comicBorder,
                  comicShadow(4),
                  { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14 },
                ]}
              >
                <ActivityIndicator color={character.theme.primary} />
              </View>
            ) : (
              <ComicBubble
                from="sergeant"
                text={reaction ?? greeting ?? '¡A cumplir, recluta!'}
                color="#FFFFFF"
              />
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
            marginTop: 22,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontFamily: 'Bangers', fontSize: 28, color: COMIC.ink, letterSpacing: 1 }}>
            METAS DE HOY
          </Text>
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#777' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {goals.length === 0 ? (
            <View
              style={[
                comicBorder,
                comicShadow(5),
                { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center' },
              ]}
            >
              <Text style={{ fontFamily: 'Bangers', fontSize: 22, color: '#AAA', letterSpacing: 1, textAlign: 'center' }}>
                SIN METAS ACTIVAS
              </Text>
              <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 14, color: '#BBB', marginTop: 4 }}>
                Ve a "Metas" para agregar.
              </Text>
            </View>
          ) : (
            goals.map((goal) => {
              const done = !!goal.todayCheckin?.completed;
              return (
                <View
                  key={goal.id}
                  style={[
                    comicBorder,
                    comicShadow(5),
                    {
                      backgroundColor: done
                        ? comicWash(character.theme.primary, 0.18)
                        : '#FFFFFF',
                      borderRadius: 16,
                      overflow: 'hidden',
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}
                >
                  {/* Franja izquierda en color del sargento — elemento compositivo */}
                  <View
                    style={{
                      width: 8,
                      alignSelf: 'stretch',
                      backgroundColor: done ? character.theme.primary : character.theme.accent,
                      opacity: done ? 1 : 0.5,
                    }}
                  />
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                    <ComicCheckbox
                      checked={done}
                      onToggle={() => handleToggle(goal)}
                      accent={character.theme.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: 'Nunito_700Bold',
                          fontSize: 17,
                          color: done ? '#666' : COMIC.ink,
                          textDecorationLine: done ? 'line-through' : 'none',
                        }}
                      >
                        {goal.title}
                      </Text>
                      <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#999', marginTop: 2 }}>
                        {goal.type === 'habit' ? 'Hábito' : 'Proyecto'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 28 }}>{done ? '✅' : '⬜'}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── TODO COMPLETADO ── */}
        {allDone && (
          <View
            style={[
              comicBorder,
              comicShadow(7),
              {
                backgroundColor: character.theme.primary,
                borderRadius: 20,
                margin: 16,
                padding: 22,
                alignItems: 'center',
              },
            ]}
          >
            <Text style={{ fontFamily: 'Bangers', fontSize: 38, color: COMIC.yellow, letterSpacing: 2, textAlign: 'center' }}>
              💥 ¡MISIÓN CUMPLIDA! 💥
            </Text>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFFFFF', marginTop: 6, textAlign: 'center' }}>
              Todas las metas del día, recluta.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB — pulgar-friendly, zona inferior */}
      <View style={{ position: 'absolute', bottom: 84, right: 16 }}>
        <Pressable
          onPress={() => router.push('/(app)/chat')}
          style={[
            comicBorder,
            comicShadow(6),
            {
              backgroundColor: character.theme.primary,
              borderRadius: 999,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            },
          ]}
        >
          <Text style={{ fontSize: 24 }}>💬</Text>
          <Text style={{ fontFamily: 'Bangers', fontSize: 20, color: '#FFF', letterSpacing: 1 }}>
            HABLAR
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
