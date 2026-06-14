/**
 * Gestión de metas — Brutalist.
 * Cards con franja izquierda en color del sargento + porcentaje en Bangers grande.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../../src/store/session';
import { getCharacter } from '../../src/constants/characters';
import { getActiveGoals, addGoal, deactivateGoal, getCompletionRate } from '../../src/lib/db';
import type { Goal } from '../../src/types/database';
import { SergeantHeader } from '../../src/components/SergeantHeader';
import { ComicButton } from '../../src/components/ComicButton';
import { ActionBurst } from '../../src/components/ActionBurst';
import { COMIC, comicBorder, comicShadow, comicWash } from '../../src/constants/theme';

interface GoalWithRate extends Goal { rate7: number }

function rateColor(rate: number) {
  if (rate >= 70) return '#2E5E3A';
  if (rate >= 40) return '#E3B23C';
  return '#E01E37';
}

function sergeantComment(rate: number, title: string) {
  if (rate >= 80) return `"${title}" va muy bien. Sigue.`;
  if (rate >= 50) return `"${title}" a medias. Puedes más.`;
  if (rate === 0) return `"${title}" está abandonada. ¿Por qué?`;
  return `"${title}" necesita atención. Hoy no falles.`;
}

export default function GoalsScreen() {
  const { user, profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const [goals, setGoals] = useState<GoalWithRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const raw = await getActiveGoals(user.id);
    const withRates = await Promise.all(
      raw.map(async (g) => ({ ...g, rate7: await getCompletionRate(user.id, g.id, 7) })),
    );
    setGoals(withRates);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!user || !newTitle.trim()) return;
    if (goals.length >= 5) {
      Alert.alert('Límite', `${character.name} dice: 5 metas máximo. Enfócate.`);
      return;
    }
    setAdding(true);
    const g = await addGoal(user.id, newTitle.trim(), 'habit');
    setGoals((prev) => [...prev, { ...g, rate7: 0 }]);
    setNewTitle('');
    setAdding(false);
  };

  const handleRemove = (goal: GoalWithRate) => {
    Alert.alert(
      '¿Desactivar meta?',
      `"${goal.title}" dejará de aparecer en tu check-in.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            await deactivateGoal(goal.id);
            setGoals((prev) => prev.filter((g) => g.id !== goal.id));
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: character.theme.dark, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={character.theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paperWarm }} edges={['top']}>
      <SergeantHeader character={character} subtitle="Seguimiento 7 días" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={goals}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={{ fontFamily: 'Bangers', fontSize: 32, color: COMIC.ink, letterSpacing: 2, marginBottom: 4 }}>
              TUS METAS 🎯
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                comicBorder,
                comicShadow(5),
                {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  overflow: 'hidden',
                  flexDirection: 'row',
                },
              ]}
            >
              {/* Franja izquierda */}
              <View style={{ width: 8, backgroundColor: rateColor(item.rate7) }} />

              <View style={{ flex: 1, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 17, color: COMIC.ink }}>{item.title}</Text>
                    <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#888', marginTop: 2 }}>
                      {item.type === 'habit' ? 'Hábito' : 'Proyecto'} · 7 días
                    </Text>
                  </View>

                  {/* Porcentaje en Bangers dominante */}
                  <View
                    style={[
                      comicBorder,
                      comicShadow(3),
                      {
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        backgroundColor: rateColor(item.rate7),
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={{ fontFamily: 'Bangers', fontSize: 26, color: '#FFF', lineHeight: 28 }}>{item.rate7}</Text>
                    <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 11, color: '#EEE' }}>%</Text>
                  </View>
                </View>

                {/* Barra de progreso */}
                <View style={{ height: 10, backgroundColor: '#EEE', borderRadius: 5, overflow: 'hidden', borderWidth: 1.5, borderColor: COMIC.ink, marginBottom: 10 }}>
                  <View style={{ height: '100%', width: `${item.rate7}%`, backgroundColor: rateColor(item.rate7) }} />
                </View>

                {/* Comentario del sargento */}
                <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 10 }}>
                  {character.emoji} {sergeantComment(item.rate7, item.title)}
                </Text>

                <Pressable
                  onPress={() => handleRemove(item)}
                  style={{ alignSelf: 'flex-end', paddingVertical: 5, paddingHorizontal: 14, borderRadius: 8, borderWidth: 2, borderColor: '#E01E37' }}
                >
                  <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#E01E37' }}>Desactivar</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListFooterComponent={
            goals.length < 5 ? (
              <View style={[comicBorder, comicShadow(5), { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 4 }]}>
                <Text style={{ fontFamily: 'Bangers', fontSize: 22, color: COMIC.ink, letterSpacing: 1, marginBottom: 12 }}>
                  + AGREGAR META
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="ej. Leer 20 páginas"
                  placeholderTextColor="#BBB"
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                  style={[
                    comicBorder,
                    {
                      backgroundColor: '#FAFAFA',
                      borderRadius: 12,
                      paddingVertical: 13,
                      paddingHorizontal: 14,
                      fontFamily: 'Nunito_700Bold',
                      fontSize: 15,
                      color: COMIC.ink,
                      marginBottom: 12,
                    },
                  ]}
                />
                <ComicButton
                  label={adding ? 'AGREGANDO...' : 'AGREGAR META'}
                  color={character.theme.primary}
                  fullWidth
                  disabled={!newTitle.trim() || adding}
                  onPress={handleAdd}
                />
              </View>
            ) : (
              <View style={[comicBorder, { backgroundColor: '#FFE9A8', borderRadius: 12, padding: 14, marginTop: 8 }]}>
                <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: COMIC.ink, textAlign: 'center' }}>
                  5 metas al máximo. Desactiva una para agregar.
                </Text>
              </View>
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
