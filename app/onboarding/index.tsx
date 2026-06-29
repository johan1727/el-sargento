/**
 * Onboarding paso 1: Bienvenida + selección de sargento (rediseño dark).
 * Cards oscuras con el acento de cada sargento + botón "Escuchar" (TTS sample).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CHARACTER_LIST, charTagline, type SergeantId } from '../../src/constants/characters';
import { t } from '../../src/i18n';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { ComicButton } from '../../src/components/ComicButton';
import { DARK, FONTS, RADIUS, accentGlow, tint } from '../../src/constants/theme';
import { playSampleVoice, stopSpeech } from '../../src/lib/tts';

// Guardamos la elección en módulo para que el paso siguiente la lea.
export let pendingSergeantId: SergeantId = 'gomez';

export default function OnboardingSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<SergeantId>('gomez');
  const [playing, setPlaying] = useState<SergeantId | null>(null);

  const handleListen = async (id: SergeantId) => {
    if (playing === id) {
      await stopSpeech();
      setPlaying(null);
      return;
    }
    setPlaying(id);
    // Asset empaquetado → 0 API. No esperamos al final del clip; el botón vuelve
    // a su estado y "stopSpeech" lo corta si lo tocan de nuevo.
    await playSampleVoice(id);
    setPlaying(null);
  };

  const handleNext = () => {
    pendingSergeantId = selected;
    router.push('/onboarding/goals');
  };

  const selectedChar = CHARACTER_LIST.find((c) => c.id === selected);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Encabezado + paso */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.display, fontSize: 56, color: DARK.text, letterSpacing: 2, lineHeight: 58 }}>
              EL SARGENTO
            </Text>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: DARK.textDim, marginTop: 4 }}>
              {t('onboarding.subtitle')}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: DARK.surfaceAlt,
              borderWidth: 1,
              borderColor: DARK.hairline,
              borderRadius: RADIUS.sm,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginTop: 4,
            }}
          >
            <Text style={{ fontFamily: FONTS.display, fontSize: 18, color: DARK.textDim, letterSpacing: 1 }}>{t('onboarding.step', { n: 1 })}</Text>
          </View>
        </View>

        <Text style={{ fontFamily: FONTS.display, fontSize: 28, color: DARK.text, letterSpacing: 1, marginBottom: 16 }}>
          {t('onboarding.chooseTitle')}
        </Text>

        {CHARACTER_LIST.map((c) => {
          const isSelected = selected === c.id;
          const accent = c.theme.accent;
          return (
            <Pressable key={c.id} onPress={() => setSelected(c.id)} style={{ marginBottom: 14 }}>
              <View
                style={[
                  {
                    backgroundColor: isSelected ? tint(accent, 0.12) : DARK.surface,
                    borderRadius: RADIUS.lg,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected ? accent : DARK.hairline,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                  },
                  isSelected ? accentGlow(accent, 1) : null,
                ]}
              >
                <SergeantAvatar sergeantId={c.id} size={64} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: DARK.text, letterSpacing: 0.8 }}>{c.name}</Text>
                    <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: DARK.textDim, lineHeight: 18 }}>{charTagline(c)}</Text>
                  <Pressable
                    onPress={() => handleListen(c.id)}
                    style={{
                      marginTop: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      alignSelf: 'flex-start',
                      paddingVertical: 5,
                      paddingHorizontal: 12,
                      borderRadius: RADIUS.pill,
                      borderWidth: 1,
                      borderColor: playing === c.id ? accent : DARK.hairlineStrong,
                      backgroundColor: playing === c.id ? tint(accent, 0.18) : 'transparent',
                    }}
                  >
                    {playing === c.id ? (
                      <ActivityIndicator size="small" color={accent} />
                    ) : (
                      <Text style={{ fontSize: 14 }}>🔊</Text>
                    )}
                    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: playing === c.id ? accent : DARK.textDim }}>
                      {t('onboarding.listen')}
                    </Text>
                  </Pressable>
                </View>

                {isSelected ? (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                      top: 12,
                      right: 12,
                    }}
                  >
                    <Text style={{ fontSize: 15, color: '#0B0E13', fontWeight: '900' }}>✓</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        <View style={{ marginTop: 10 }}>
          <ComicButton
            label={t('onboarding.trainWith', { name: selectedChar?.name.toUpperCase() ?? '' })}
            color={selectedChar?.theme.accent ?? '#FFFFFF'}
            textColor="#0B0E13"
            size="lg"
            fullWidth
            onPress={handleNext}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
