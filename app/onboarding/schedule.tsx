/**
 * Onboarding paso 3: Hora del check-in diario (rediseño dark).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pendingSergeantId } from './index';
import { getCharacter } from '../../src/constants/characters';
import { ComicButton } from '../../src/components/ComicButton';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { Card } from '../../src/components/Card';
import { DARK, FONTS, RADIUS, accentGlow, tint } from '../../src/constants/theme';

export let pendingCheckinHour = 8;

const HOUR_OPTIONS = [
  { hour: 6, label: '6:00 AM', emoji: '🌅', note: 'Madrugador' },
  { hour: 7, label: '7:00 AM', emoji: '☀️', note: 'Tempranero' },
  { hour: 8, label: '8:00 AM', emoji: '🏃', note: 'Estándar (recomendado)' },
  { hour: 9, label: '9:00 AM', emoji: '☕', note: 'Con café' },
  { hour: 12, label: '12:00 PM', emoji: '🌞', note: 'Mediodía' },
  { hour: 18, label: '6:00 PM', emoji: '🌆', note: 'Al salir del trabajo' },
  { hour: 20, label: '8:00 PM', emoji: '🌙', note: 'Noctámbulo' },
  { hour: 21, label: '9:00 PM', emoji: '🌃', note: 'Noche' },
];

export default function OnboardingScheduleScreen() {
  const router = useRouter();
  const character = getCharacter(pendingSergeantId);
  const accent = character.theme.accent;
  const [hour, setHour] = useState(8);

  const handleNext = () => {
    pendingCheckinHour = hour;
    router.push('/onboarding/signup');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <SergeantAvatar sergeantId={pendingSergeantId} size={58} />
          <Card alt elevation={1} style={{ flex: 1, padding: 12 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text, lineHeight: 20 }}>
              "¿A qué hora te reportas? Te mando el check-in sin falta, recluta."
            </Text>
          </Card>
        </View>

        <Text style={{ fontFamily: FONTS.display, fontSize: 28, color: DARK.text, letterSpacing: 1, marginBottom: 4 }}>
          HORA DEL CHECK-IN
        </Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: DARK.textDim, marginBottom: 20 }}>
          Recibirás una notificación diaria a esta hora para reportar tus metas.
        </Text>

        <View style={{ gap: 10, marginBottom: 28 }}>
          {HOUR_OPTIONS.map((opt) => {
            const isSelected = hour === opt.hour;
            return (
              <Pressable key={opt.hour} onPress={() => setHour(opt.hour)}>
                <View
                  style={[
                    {
                      backgroundColor: isSelected ? tint(accent, 0.12) : DARK.surface,
                      borderRadius: RADIUS.md,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? accent : DARK.hairline,
                      paddingVertical: 14,
                      paddingHorizontal: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    },
                    isSelected ? accentGlow(accent, 1) : null,
                  ]}
                >
                  <Text style={{ fontSize: 26 }}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: DARK.text, letterSpacing: 0.8 }}>{opt.label}</Text>
                    <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: DARK.textDim }}>{opt.note}</Text>
                  </View>
                  {isSelected ? (
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, color: '#0B0E13', fontWeight: '900' }}>✓</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <ComicButton label="SIGUIENTE → CREAR CUENTA" color={accent} textColor="#0B0E13" fullWidth size="lg" onPress={handleNext} />
        <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textMuted }}>← Atrás</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
