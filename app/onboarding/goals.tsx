/**
 * Onboarding paso 2: Define hasta 5 metas/hábitos.
 */
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pendingSergeantId } from './index';
import { getCharacter } from '../../src/constants/characters';
import { ComicButton } from '../../src/components/ComicButton';
import { ComicCard } from '../../src/components/ComicCard';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { COMIC, comicBorder } from '../../src/constants/theme';

export let pendingGoals: { title: string; type: 'habit' | 'project' }[] = [];

export default function OnboardingGoalsScreen() {
  const router = useRouter();
  const character = getCharacter(pendingSergeantId);
  const [goals, setGoals] = useState<string[]>(['']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const addGoal = () => {
    if (goals.length >= 5) return;
    setGoals((prev) => [...prev, '']);
  };

  const updateGoal = (idx: number, text: string) => {
    setGoals((prev) => prev.map((g, i) => (i === idx ? text : g)));
  };

  const removeGoal = (idx: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    const filled = goals.map((g) => g.trim()).filter(Boolean);
    if (!filled.length) {
      Alert.alert(
        '¡Recluta!',
        `${character.name} dice: Necesitas al menos UNA meta. ¿Para qué estás aquí?`,
        [{ text: 'Entendido' }],
      );
      return;
    }
    pendingGoals = filled.map((title) => ({ title, type: 'habit' as const }));
    router.push('/onboarding/schedule');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paper }}>
      <View style={{ flex: 1, padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <SergeantAvatar sergeantId={pendingSergeantId} size={60} />
          <View
            style={[
              comicBorder,
              {
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 12,
              },
            ]}
          >
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: COMIC.ink, lineHeight: 20 }}>
              "Muy bien, recluta. Dime tus objetivos. ¿Qué vamos a conquistar?"
            </Text>
          </View>
        </View>

        <Text style={{ fontFamily: 'Bangers', fontSize: 28, color: COMIC.ink, letterSpacing: 1, marginBottom: 4 }}>
          TUS METAS (máx. 5)
        </Text>
        <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 14, color: '#666', marginBottom: 18 }}>
          Hábitos o proyectos que quieres cumplir cada día.
        </Text>

        {goals.map((goal, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: character.theme.primary,
                borderWidth: 2,
                borderColor: COMIC.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Bangers', fontSize: 18, color: '#FFF' }}>{idx + 1}</Text>
            </View>
            <TextInput
              ref={(r) => { inputRefs.current[idx] = r; }}
              value={goal}
              onChangeText={(t) => updateGoal(idx, t)}
              placeholder={idx === 0 ? 'ej. Ejercicio 30 min' : 'ej. Leer 20 páginas'}
              placeholderTextColor="#AAA"
              returnKeyType={idx < 4 ? 'next' : 'done'}
              onSubmitEditing={() => {
                if (idx < goals.length - 1) inputRefs.current[idx + 1]?.focus();
                else if (goals.length < 5) { addGoal(); }
                else Keyboard.dismiss();
              }}
              style={[
                comicBorder,
                {
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  fontFamily: 'Nunito_700Bold',
                  fontSize: 16,
                  color: COMIC.ink,
                },
              ]}
            />
            {goals.length > 1 && (
              <Pressable onPress={() => removeGoal(idx)} hitSlop={10}>
                <Text style={{ fontSize: 22, color: '#E01E37' }}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}

        {goals.length < 5 && (
          <Pressable onPress={addGoal} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 24 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: character.theme.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22, color: character.theme.primary, lineHeight: 28 }}>+</Text>
            </View>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: character.theme.primary }}>
              Agregar otra meta
            </Text>
          </Pressable>
        )}

        <View style={{ marginTop: 'auto', gap: 12 }}>
          <ComicButton
            label="SIGUIENTE → HORARIO"
            color={character.theme.primary}
            fullWidth
            size="lg"
            onPress={handleNext}
          />
          <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#888' }}>← Cambiar sargento</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
