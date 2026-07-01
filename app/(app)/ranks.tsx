/**
 * Pantalla de rangos — rediseño dark.
 * Rango actual destacado en una tarjeta + camino de rangos como timeline vertical.
 */
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../../src/store/session';
import { getCharacter } from '../../src/constants/characters';
import { RANKS, rankIndex, getRank, nextRankProgress, rankLabel } from '../../src/constants/ranks';
import { t } from '../../src/i18n';
import { SergeantHeader } from '../../src/components/SergeantHeader';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { RankIcon } from '../../src/components/RankIcon';
import { DARK, FONTS, RADIUS, accentGlow, softShadow, tint } from '../../src/constants/theme';

export default function RanksScreen() {
  const { profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;
  const streak = profile?.current_streak ?? 0;
  const currentRank = getRank(profile?.rank);
  const { next, daysToNext } = nextRankProgress(streak);
  const currentIdx = rankIndex(currentRank.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      <SergeantHeader character={character} rank={profile?.rank} streak={streak} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Rango actual */}
        <Card accentColor={accent} tintOpacity={0.08} elevation={2} style={{ margin: 16, padding: 22 }}>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, letterSpacing: 1.5, marginBottom: 10 }}>
            {t('ranks.currentRank')}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <RankIcon
              id={currentRank.id}
              emoji={currentRank.badge}
              size={76}
              color={currentRank.color}
              style={[{ borderWidth: 2, borderColor: accent }, accentGlow(accent, 1)]}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.display, fontSize: 36, color: DARK.text, letterSpacing: 1, lineHeight: 38 }}>
                {rankLabel(currentRank).toUpperCase()}
              </Text>
              <Text style={{ fontFamily: FONTS.display, fontSize: 40, color: accent, lineHeight: 42, letterSpacing: -0.5 }}>
                🔥 {streak}
              </Text>
              <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textMuted }}>
                {t('ranks.streakRecord', { n: profile?.longest_streak ?? 0 })}
              </Text>
            </View>
          </View>

          {next ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: DARK.textDim }}>
                  → {rankLabel(next)} {next.badge}
                </Text>
                <Text style={{ fontFamily: FONTS.display, fontSize: 16, color: accent, letterSpacing: 0.5 }}>
                  {t('ranks.daysShort', { n: daysToNext })}
                </Text>
              </View>
              <ProgressBar value={(streak / next.minStreak) * 100} color={accent} height={10} />
            </View>
          ) : null}
        </Card>

        {/* Camino de rangos */}
        <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: DARK.text, letterSpacing: 1, marginHorizontal: 16, marginBottom: 12 }}>
          {t('ranks.path')}
        </Text>

        <View style={{ paddingHorizontal: 16 }}>
          {[...RANKS].reverse().map((rank, i) => {
            const rankIdx = RANKS.length - 1 - i;
            const isReached = rankIdx <= currentIdx;
            const isCurrent = rank.id === currentRank.id;
            const isLast = i === RANKS.length - 1;

            return (
              <View key={rank.id} style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                {/* Timeline: badge + línea */}
                <View style={{ width: 56, alignItems: 'center' }}>
                  {isReached ? (
                    <RankIcon
                      id={rank.id}
                      emoji={rank.badge}
                      size={50}
                      color={rank.color}
                      style={[
                        { borderWidth: isCurrent ? 2 : 1, borderColor: isCurrent ? accent : DARK.hairlineStrong, zIndex: 2 },
                        isCurrent ? accentGlow(accent, 1) : softShadow(1),
                      ]}
                    />
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: DARK.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: DARK.hairlineStrong,
                        zIndex: 2,
                      }}
                    >
                      <Text style={{ fontSize: 18, opacity: 0.4 }}>🔒</Text>
                    </View>
                  )}
                  {!isLast ? (
                    <View
                      style={{
                        width: 3,
                        flex: 1,
                        minHeight: 18,
                        backgroundColor: isReached ? tint(rank.color, 0.6) : DARK.hairline,
                        marginVertical: 2,
                      }}
                    />
                  ) : null}
                </View>

                {/* Info del rango */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: isCurrent ? tint(accent, 0.1) : DARK.surface,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: isCurrent ? tint(accent, 0.5) : DARK.hairline,
                    padding: 12,
                    marginLeft: 8,
                    marginBottom: 10,
                    opacity: isReached ? 1 : 0.6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontFamily: FONTS.display,
                        fontSize: isCurrent ? 23 : 19,
                        color: isReached ? DARK.text : DARK.textMuted,
                        letterSpacing: 0.8,
                      }}
                    >
                      {rankLabel(rank).toUpperCase()}
                      {isCurrent ? t('ranks.here') : ''}
                    </Text>
                    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textMuted }}>
                      {rank.minStreak}d
                    </Text>
                  </View>
                  {isCurrent ? (
                    <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textDim, marginTop: 2 }}>
                      {t('ranks.minStreak', { n: rank.minStreak })}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <Card alt elevation={0} style={{ padding: 14, margin: 16, borderColor: tint('#F5B843', 0.4) }}>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: '#F5B843' }}>
            {t('ranks.demotionWarning')}
          </Text>
        </Card>

        <Card elevation={0} style={{ padding: 14, marginHorizontal: 16 }}>
          <Text style={{ fontFamily: FONTS.display, fontSize: 18, color: DARK.textMuted, letterSpacing: 1 }}>
            {t('ranks.rankingSoon')}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
