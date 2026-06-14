/**
 * Pantalla de celebración de ascenso de rango — estilo cómic ¡POW!
 * Recibe el nuevo rango como parámetro de ruta (?rank=sargento).
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { getRank, type RankId } from '../src/constants/ranks';
import { useSession } from '../src/store/session';
import { getCharacter } from '../src/constants/characters';
import { ComicButton } from '../src/components/ComicButton';
import { SergeantAvatar } from '../src/components/SergeantAvatar';
import { COMIC, comicBorder, comicShadow } from '../src/constants/theme';

const DECORATIONS = ['💥', '⚡', '🌟', '💫', '✨'];

export default function CelebrationScreen() {
  const router = useRouter();
  const { rank } = useLocalSearchParams<{ rank: string }>();
  const { profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.yellow }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Watermark: badge del rango gigante como fondo */}
        <Text
          style={{
            position: 'absolute',
            fontSize: 260,
            opacity: 0.07,
            top: '15%',
          }}
          aria-hidden="true"
        >
          {r.badge}
        </Text>

        {/* Rayas negras diagonales como speed lines de cómic */}
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 3,
              height: 600,
              backgroundColor: COMIC.ink,
              opacity: 0.04,
              transform: [{ rotate: `${i * 30}deg` }],
            }}
          />
        ))}

        {/* Efectos decorativos */}
        {DECORATIONS.map((e, i) => (
          <Text key={i} style={{
            position: 'absolute',
            fontSize: 36,
            top: `${15 + i * 14}%` as any,
            left: i % 2 === 0 ? (`${8 + i * 5}%` as any) : undefined,
            right: i % 2 !== 0 ? (`${8 + i * 4}%` as any) : undefined,
            transform: [{ rotate: `${i * 25 - 30}deg` }],
          }}>{e}</Text>
        ))}

        {/* Etiqueta ¡POW! */}
        <View style={[comicBorder, comicShadow(8), {
          backgroundColor: '#E01E37',
          borderRadius: 24,
          paddingHorizontal: 28,
          paddingVertical: 12,
          marginBottom: 24,
          transform: [{ rotate: '-3deg' }],
        }]}>
          <Text style={{ fontFamily: 'Bangers', fontSize: 42, color: '#FFF', letterSpacing: 3 }}>¡POW!</Text>
        </View>

        <Text style={{ fontFamily: 'Bangers', fontSize: 26, color: COMIC.ink, letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>
          ¡ASCENDIDO A...!
        </Text>

        {/* Badge animada */}
        <Animated.View style={{ transform: [{ scale: popAnim }, { translateY: bounceAnim }], marginBottom: 20 }}>
          <View style={[comicBorder, comicShadow(8, r.color), {
            width: 130, height: 130, borderRadius: 65,
            backgroundColor: r.color,
            alignItems: 'center', justifyContent: 'center',
          }]}>
            <Text style={{ fontSize: 60 }}>{r.badge}</Text>
          </View>
        </Animated.View>

        <Text style={{ fontFamily: 'Bangers', fontSize: 46, color: COMIC.ink, letterSpacing: 3, marginBottom: 8, textAlign: 'center' }}>
          {r.label.toUpperCase()}
        </Text>

        {/* Avatar + felicitación */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginVertical: 20 }}>
          <SergeantAvatar sergeantId={character.id} size={72} />
          <View style={[comicBorder, comicShadow(4), { backgroundColor: '#FFF', borderRadius: 16, padding: 14, maxWidth: 220 }]}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: COMIC.ink }}>
              ¡ASÍ SE HACE, RECLUTA!{'\n'}¡Eres {r.label}! {r.badge}
            </Text>
            <View style={{ position: 'absolute', bottom: 14, left: -11, width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 12, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: COMIC.ink }} />
            <View style={{ position: 'absolute', bottom: 16, left: -7, width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#FFF' }} />
          </View>
        </View>

        <ComicButton
          label="¡A SEGUIR AVANZANDO!"
          color={character.theme.primary}
          size="lg"
          fullWidth
          onPress={() => router.replace('/(app)')}
        />
      </View>
    </SafeAreaView>
  );
}
