/**
 * Onboarding paso 1: Bienvenida + selección de sargento.
 * Muestra las 4 cards ilustradas con botón "Escuchar" (TTS sample).
 */
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CHARACTER_LIST, type SergeantId } from '../../src/constants/characters';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { ComicButton } from '../../src/components/ComicButton';
import { ComicCard } from '../../src/components/ComicCard';
import { COMIC, comicBorder, comicShadow } from '../../src/constants/theme';
import { speak, stopSpeech } from '../../src/lib/tts';

// Guardamos la elección en módulo para que el paso siguiente la lea.
export let pendingSergeantId: SergeantId = 'gomez';

export default function OnboardingSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<SergeantId>('gomez');
  const [playing, setPlaying] = useState<SergeantId | null>(null);

  const handleListen = async (id: SergeantId, sample: string) => {
    if (playing === id) {
      await stopSpeech();
      setPlaying(null);
      return;
    }
    setPlaying(id);
    await speak(sample, id);
    setPlaying(null);
  };

  const handleNext = () => {
    pendingSergeantId = selected;
    router.push('/onboarding/goals');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paperWarm }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Indicador de paso — esquina superior derecha */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text
              style={{
                fontFamily: 'Bangers',
                fontSize: 62,
                color: COMIC.ink,
                letterSpacing: 3,
                lineHeight: 64,
              }}
            >
              EL SARGENTO
            </Text>
            <View
              style={[
                comicBorder,
                {
                  backgroundColor: COMIC.yellow,
                  paddingHorizontal: 12,
                  paddingVertical: 3,
                  borderRadius: 6,
                  alignSelf: 'flex-start',
                },
              ]}
            >
              <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: COMIC.ink }}>
                Coach militar de productividad
              </Text>
            </View>
          </View>

          {/* Paso N/4 en Bangers como elemento estructural */}
          <View style={[comicBorder, comicShadow(3), { backgroundColor: COMIC.ink, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 }]}>
            <Text style={{ fontFamily: 'Bangers', fontSize: 18, color: COMIC.yellow, letterSpacing: 1 }}>
              1 / 4
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: 'Bangers',
            fontSize: 28,
            color: COMIC.ink,
            letterSpacing: 1,
            marginBottom: 16,
          }}
        >
          ELIGE TU SARGENTO:
        </Text>

        {CHARACTER_LIST.map((c) => {
          const isSelected = selected === c.id;
          return (
            <Pressable key={c.id} onPress={() => setSelected(c.id)} style={{ marginBottom: 14 }}>
              <ComicCard
                style={{
                  backgroundColor: isSelected ? c.theme.primary : '#FFFFFF',
                  borderRadius: 18,
                  padding: 16,
                  borderColor: isSelected ? c.theme.accent : COMIC.ink,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  ...comicShadow(isSelected ? 6 : 4),
                }}
              >
                <SergeantAvatar sergeantId={c.id} size={68} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontFamily: 'Bangers', fontSize: 22, color: isSelected ? '#FFFFFF' : COMIC.ink, letterSpacing: 1 }}>
                      {c.name}
                    </Text>
                    <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: isSelected ? '#E8E8E8' : '#555', lineHeight: 18 }}>
                    {c.tagline}
                  </Text>
                  <Pressable
                    onPress={() => handleListen(c.id, c.sampleLine)}
                    style={{
                      marginTop: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      alignSelf: 'flex-start',
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: isSelected ? '#FFFFFF' : COMIC.ink,
                      backgroundColor: playing === c.id ? '#FFD23F' : 'transparent',
                    }}
                  >
                    {playing === c.id ? (
                      <ActivityIndicator size="small" color={COMIC.ink} />
                    ) : (
                      <Text style={{ fontSize: 16 }}>🔊</Text>
                    )}
                    <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: isSelected ? '#FFFFFF' : COMIC.ink }}>
                      Escuchar
                    </Text>
                  </Pressable>
                </View>

                {isSelected && (
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: c.theme.accent,
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                      top: 10,
                      right: 10,
                    }}
                  >
                    <Text style={{ fontSize: 16, color: '#FFFFFF' }}>✓</Text>
                  </View>
                )}
              </ComicCard>
            </Pressable>
          );
        })}

        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <ComicButton
            label={`¡A ENTRENAR CON ${CHARACTER_LIST.find(c => c.id === selected)?.name.toUpperCase()}!`}
            color={CHARACTER_LIST.find(c => c.id === selected)?.theme.primary ?? COMIC.ink}
            size="lg"
            fullWidth
            onPress={handleNext}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
