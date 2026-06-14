/**
 * Pantalla de rangos — Brutalist.
 * Racha y rango actual en Bangers grande dominando el layout.
 * Camino de rangos como lista vertical con línea de progreso.
 */
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../../src/store/session';
import { getCharacter } from '../../src/constants/characters';
import { RANKS, rankIndex, getRank, nextRankProgress } from '../../src/constants/ranks';
import { SergeantHeader } from '../../src/components/SergeantHeader';
import { ActionBurst } from '../../src/components/ActionBurst';
import { COMIC, comicBorder, comicShadow, comicWash } from '../../src/constants/theme';

export default function RanksScreen() {
  const { profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const streak = profile?.current_streak ?? 0;
  const currentRank = getRank(profile?.rank);
  const { next, daysToNext } = nextRankProgress(streak);
  const currentIdx = rankIndex(currentRank.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paperWarm }} edges={['top']}>
      <SergeantHeader character={character} rank={profile?.rank} streak={streak} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Rango actual — racha dominante en Bangers grande */}
        <View
          style={[
            comicBorder,
            comicShadow(7, character.theme.primary),
            {
              backgroundColor: character.theme.dark,
              margin: 16,
              borderRadius: 20,
              padding: 22,
              overflow: 'visible',
            },
          ]}
        >
          <ActionBurst
            text="¡RANGO!"
            color={character.theme.accent}
            size="sm"
            rotate={-6}
            position="absolute"
            top={-14}
            left={18}
          />

          <Text style={{ fontFamily: 'Bangers', fontSize: 18, color: '#AAAAAA', letterSpacing: 1, marginBottom: 4 }}>
            RANGO ACTUAL
          </Text>

          {/* Insignia grande */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <View
              style={[
                comicBorder,
                comicShadow(5, currentRank.color),
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: currentRank.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: COMIC.yellow,
                  borderWidth: 4,
                },
              ]}
            >
              <Text style={{ fontSize: 40 }}>{currentRank.badge}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Bangers', fontSize: 42, color: COMIC.yellow, letterSpacing: 2, lineHeight: 44 }}>
                {currentRank.label.toUpperCase()}
              </Text>
              {/* Racha en grande */}
              <Text style={{ fontFamily: 'Bangers', fontSize: 52, color: '#FFFFFF', lineHeight: 50, letterSpacing: -1 }}>
                🔥 {streak}
              </Text>
              <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: '#888' }}>
                días de racha · Récord: {profile?.longest_streak ?? 0}
              </Text>
            </View>
          </View>

          {/* Barra de progreso al siguiente rango */}
          {next && (
            <View style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#AAA' }}>
                  → {next.label} {next.badge}
                </Text>
                <Text style={{ fontFamily: 'Bangers', fontSize: 16, color: COMIC.yellow }}>
                  {daysToNext} día{daysToNext === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={{ height: 12, backgroundColor: '#333', borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: '#555' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (streak / next.minStreak) * 100)}%`,
                    backgroundColor: next.color,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Camino de rangos */}
        <Text style={{ fontFamily: 'Bangers', fontSize: 24, color: COMIC.ink, letterSpacing: 1, marginHorizontal: 16, marginBottom: 12 }}>
          CAMINO AL GENERALATO
        </Text>

        <View style={{ paddingHorizontal: 16, gap: 0 }}>
          {[...RANKS].reverse().map((rank, i) => {
            const rankIdx = RANKS.length - 1 - i;
            const isReached = rankIdx <= currentIdx;
            const isCurrent = rank.id === currentRank.id;
            const isLast = i === RANKS.length - 1;

            return (
              <View key={rank.id} style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                {/* Línea vertical + badge */}
                <View style={{ width: 56, alignItems: 'center' }}>
                  <View
                    style={[
                      comicBorder,
                      isCurrent && comicShadow(5, rank.color),
                      {
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: isReached ? rank.color : '#E0E0E0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: isCurrent ? COMIC.yellow : COMIC.ink,
                        borderWidth: isCurrent ? 4 : 3,
                        zIndex: 2,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: isReached ? 24 : 20, opacity: isReached ? 1 : 0.35 }}>
                      {isReached ? rank.badge : '🔒'}
                    </Text>
                  </View>
                  {!isLast && (
                    <View
                      style={{
                        width: 4,
                        flex: 1,
                        minHeight: 20,
                        backgroundColor: isReached ? rank.color : '#DDD',
                        marginVertical: 2,
                        zIndex: 1,
                      }}
                    />
                  )}
                </View>

                {/* Info del rango */}
                <View
                  style={[
                    comicBorder,
                    isCurrent && { borderColor: COMIC.yellow, borderWidth: 3 },
                    {
                      flex: 1,
                      backgroundColor: isCurrent
                        ? comicWash(rank.color, 0.18)
                        : isReached
                        ? '#FFFFFF'
                        : '#F5F5F5',
                      borderRadius: 14,
                      padding: 12,
                      marginLeft: 8,
                      marginBottom: 10,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontFamily: 'Bangers',
                        fontSize: isCurrent ? 24 : 20,
                        color: isReached ? COMIC.ink : '#BBB',
                        letterSpacing: 1,
                      }}
                    >
                      {rank.label.toUpperCase()}
                      {isCurrent ? ' ◀ AQUÍ' : ''}
                    </Text>
                    <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#999' }}>
                      {rank.minStreak}d
                    </Text>
                  </View>
                  {isCurrent && (
                    <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#666', marginTop: 2 }}>
                      Racha mínima: {rank.minStreak} días
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={[comicBorder, { backgroundColor: '#FFF3CD', borderRadius: 12, padding: 14, margin: 16 }]}>
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: COMIC.ink }}>
            ⚠️ 3 días fallidos seguidos = bajas un rango. Sin excusas.
          </Text>
        </View>

        <View style={[comicBorder, { backgroundColor: '#F0F0F0', borderRadius: 12, padding: 14, marginHorizontal: 16 }]}>
          <Text style={{ fontFamily: 'Bangers', fontSize: 18, color: '#AAA', letterSpacing: 1 }}>
            🏆 RANKING vs. AMIGOS — PRÓXIMAMENTE
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
