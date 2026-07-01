/**
 * Pantalla de celebración de ascenso de rango — rediseño dark con glow de acento.
 * Recibe el nuevo rango como parámetro de ruta (?rank=sargento).
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { getRank, rankLabel, type RankId } from '../src/constants/ranks';
import { t } from '../src/i18n';
import { useSession } from '../src/store/session';
import { getCharacter } from '../src/constants/characters';
import { ComicButton } from '../src/components/ComicButton';
import { SergeantAvatar } from '../src/components/SergeantAvatar';
import { RankIcon } from '../src/components/RankIcon';
import { Card } from '../src/components/Card';
import { DARK, FONTS, RADIUS, accentGlow, tint } from '../src/constants/theme';

const DECORATIONS = ['💥', '⚡', '🌟', '💫', '✨'];

export default function CelebrationScreen() {
  const router = useRouter();
  const { rank } = useLocalSearchParams<{ rank: string }>();
  const { profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;
  const r = getRank(rank as RankId);

  const popAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    Animated.sequence([
      Animated.timing(popAnim, { toValue: 1.4, duration: 300, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.timing(popAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -12, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [popAnim, bounceAnim]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Badge del rango gigante de fondo, teñido del color del rango */}
        <Text style={{ position: 'absolute', fontSize: 260, opacity: 0.06, top: '14%' }} aria-hidden>
          {r.badge}
        </Text>

        {/* Destellos decorativos */}
        {DECORATIONS.map((e, i) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              fontSize: 34,
              opacity: 0.8,
              top: `${15 + i * 14}%` as any,
              left: i % 2 === 0 ? (`${8 + i * 5}%` as any) : undefined,
              right: i % 2 !== 0 ? (`${8 + i * 4}%` as any) : undefined,
              transform: [{ rotate: `${i * 25 - 30}deg` }],
            }}
          >
            {e}
          </Text>
        ))}

        {/* Etiqueta de logro */}
        <View
          style={[
            {
              backgroundColor: accent,
              borderRadius: RADIUS.lg,
              paddingHorizontal: 24,
              paddingVertical: 10,
              marginBottom: 24,
            },
            accentGlow(accent, 2),
          ]}
        >
          <Text style={{ fontFamily: FONTS.display, fontSize: 36, color: '#0B0E13', letterSpacing: 2 }}>{t('celebration.promotion')}</Text>
        </View>

        <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: DARK.textDim, letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>
          {t('celebration.promotedTo')}
        </Text>

        {/* Badge animada */}
        <Animated.View style={{ transform: [{ scale: popAnim }, { translateY: bounceAnim }], marginBottom: 18 }}>
          <RankIcon
            id={r.id}
            emoji={r.badge}
            size={130}
            color={r.color}
            style={[{ borderWidth: 3, borderColor: accent }, accentGlow(accent, 2)]}
          />
        </Animated.View>

        <Text style={{ fontFamily: FONTS.display, fontSize: 46, color: DARK.text, letterSpacing: 2, marginBottom: 8, textAlign: 'center' }}>
          {rankLabel(r).toUpperCase()}
        </Text>

        {/* Avatar + felicitación */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginVertical: 20 }}>
          <SergeantAvatar sergeantId={character.id} size={64} />
          <Card alt elevation={1} style={{ padding: 14, maxWidth: 220, borderColor: tint(accent, 0.4) }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text, lineHeight: 21 }}>
              {t('celebration.wellDone')}{'\n'}{t('celebration.youAreNow', { rank: rankLabel(r), badge: r.badge })}
            </Text>
          </Card>
        </View>

        <ComicButton
          label={t('celebration.keepGoing')}
          color={accent}
          textColor="#0B0E13"
          size="lg"
          fullWidth
          onPress={() => router.replace('/(app)')}
        />
      </View>
    </SafeAreaView>
  );
}
