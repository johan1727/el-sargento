/**
 * Onboarding paso 2: Define hasta 5 metas/hábitos (rediseño dark).
 */
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pendingSergeantId } from './index';
import { getCharacter } from '../../src/constants/characters';
import { ComicButton } from '../../src/components/ComicButton';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { Card } from '../../src/components/Card';
import { useDialog } from '../../src/components/Dialog';
import { DARK, FONTS, RADIUS } from '../../src/constants/theme';

export let pendingGoals: { title: string; type: 'habit' | 'project' }[] = [];

const MAX_GOAL_LEN = 80;

export default function OnboardingGoalsScreen() {
  const router = useRouter();
  const { show } = useDialog();
  const character = getCharacter(pendingSergeantId);
  const accent = character.theme.accent;
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
    const filled = goals.map((g) => g.trim().slice(0, MAX_GOAL_LEN)).filter(Boolean);
    if (!filled.length) {
      show({
        icon: character.emoji,
        title: '¡Recluta!',
        message: `${character.name} dice: Necesitas al menos UNA meta. ¿Para qué estás aquí?`,
        accent,
        buttons: [{ text: 'Entendido' }],
      });
      return;
    }
    pendingGoals = filled.map((title) => ({ title, type: 'habit' as const }));
    router.push('/onboarding/schedule');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <SergeantAvatar sergeantId={pendingSergeantId} size={58} />
          <Card alt elevation={1} style={{ flex: 1, padding: 12 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text, lineHeight: 20 }}>
              "Muy bien, recluta. Dime tus objetivos. ¿Qué vamos a conquistar?"
            </Text>
          </Card>
        </View>

        <Text style={{ fontFamily: FONTS.display, fontSize: 28, color: DARK.text, letterSpacing: 1, marginBottom: 4 }}>
          TUS METAS (máx. 5)
        </Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: DARK.textDim, marginBottom: 18 }}>
          Hábitos o proyectos que quieres cumplir cada día.
        </Text>

        {goals.map((goal, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONTS.display, fontSize: 17, color: '#0B0E13' }}>{idx + 1}</Text>
            </View>
            <TextInput
              ref={(r) => { inputRefs.current[idx] = r; }}
              value={goal}
              onChangeText={(t) => updateGoal(idx, t)}
              placeholder={idx === 0 ? 'ej. Ejercicio 30 min' : 'ej. Leer 20 páginas'}
              placeholderTextColor={DARK.textMuted}
              returnKeyType={idx < 4 ? 'next' : 'done'}
              maxLength={MAX_GOAL_LEN}
              onSubmitEditing={() => {
                if (idx < goals.length - 1) inputRefs.current[idx + 1]?.focus();
                else if (goals.length < 5) addGoal();
                else Keyboard.dismiss();
              }}
              style={{
                flex: 1,
                backgroundColor: DARK.surfaceAlt,
                borderWidth: 1,
                borderColor: DARK.hairline,
                borderRadius: RADIUS.md,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontFamily: FONTS.bodyBold,
                fontSize: 16,
                color: DARK.text,
              }}
            />
            {goals.length > 1 ? (
              <Pressable onPress={() => removeGoal(idx)} hitSlop={10}>
                <Text style={{ fontSize: 20, color: '#FF5A65' }}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        {goals.length < 5 ? (
          <Pressable onPress={addGoal} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 24 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, color: accent, lineHeight: 24 }}>+</Text>
            </View>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: accent }}>Agregar otra meta</Text>
          </Pressable>
        ) : null}

        <View style={{ marginTop: 12, gap: 12 }}>
          <ComicButton label="SIGUIENTE → HORARIO" color={accent} textColor="#0B0E13" fullWidth size="lg" onPress={handleNext} />
          <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textMuted }}>← Cambiar sargento</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
