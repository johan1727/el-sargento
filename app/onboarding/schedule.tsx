/**
 * Onboarding paso 3: Hora del check-in diario.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pendingSergeantId } from './index';
import { getCharacter } from '../../src/constants/characters';
import { ComicButton } from '../../src/components/ComicButton';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { COMIC, comicBorder, comicShadow } from '../../src/constants/theme';

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
  const [hour, setHour] = useState(8);

  const handleNext = () => {
    pendingCheckinHour = hour;
    router.push('/onboarding/signup');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paper }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <SergeantAvatar sergeantId={pendingSergeantId} size={60} />
          <View style={[comicBorder, { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 }]}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: COMIC.ink, lineHeight: 20 }}>
              "¿A qué hora te reportas? Te mando el check-in sin falta, recluta."
            </Text>
          </View>
        </View>

        <Text style={{ fontFamily: 'Bangers', fontSize: 28, color: COMIC.ink, letterSpacing: 1, marginBottom: 4 }}>
          HORA DEL CHECK-IN
        </Text>
        <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 14, color: '#666', marginBottom: 20 }}>
          Recibirás una notificación diaria a esta hora para reportar tus metas.
        </Text>

        <View style={{ gap: 10, marginBottom: 28 }}>
          {HOUR_OPTIONS.map((opt) => {
            const isSelected = hour === opt.hour;
            return (
              <Pressable key={opt.hour} onPress={() => setHour(opt.hour)}>
                <View
                  style={[
                    comicBorder,
                    comicShadow(isSelected ? 5 : 3),
                    {
                      backgroundColor: isSelected ? character.theme.primary : '#FFFFFF',
                      borderRadius: 14,
                      borderColor: isSelected ? character.theme.accent : COMIC.ink,
                      paddingVertical: 14,
                      paddingHorizontal: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 26 }}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Bangers', fontSize: 22, color: isSelected ? '#FFF' : COMIC.ink, letterSpacing: 1 }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: isSelected ? '#DDD' : '#777' }}>
                      {opt.note}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: character.theme.accent,
                      borderWidth: 2, borderColor: '#FFF',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 16 }}>✓</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <ComicButton
          label="SIGUIENTE → CREAR CUENTA"
          color={character.theme.primary}
          fullWidth
          size="lg"
          onPress={handleNext}
        />
        <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#888' }}>← Atrás</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
