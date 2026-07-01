/**
 * Gestión de metas — rediseño dark.
 * Tarjetas oscuras con porcentaje de 7 días en Bangers + barra de progreso de acento.
 */
import { useCallback, useEffect, useState } from 'react';
import {
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
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { useDialog } from '../../src/components/Dialog';
import { GoalSuggestions } from '../../src/components/GoalSuggestions';
import { Skeleton } from '../../src/components/Skeleton';
import { NetworkError } from '../../src/components/NetworkError';
import { t } from '../../src/i18n';
import { DARK, FONTS, RADIUS } from '../../src/constants/theme';

interface GoalWithRate extends Goal { rate7: number }

/** Tope de longitud del título de meta. */
const MAX_GOAL_LEN = 80;

function rateColor(rate: number) {
  if (rate >= 70) return '#3DDC97';
  if (rate >= 40) return '#F5B843';
  return '#FF5A65';
}

function sergeantComment(rate: number, title: string) {
  if (rate >= 80) return t('goals.comment80', { title });
  if (rate >= 50) return t('goals.comment50', { title });
  if (rate === 0) return t('goals.comment0', { title });
  return t('goals.commentLow', { title });
}

export default function GoalsScreen() {
  const { user, profile } = useSession();
  const { show } = useDialog();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;
  const [goals, setGoals] = useState<GoalWithRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadError(false);
    try {
      const raw = await getActiveGoals(user.id);
      const withRates = await Promise.all(
        raw.map(async (g) => ({ ...g, rate7: await getCompletionRate(user.id, g.id, 7, g.created_at) })),
      );
      setGoals(withRates);
      setLoading(false);
    } catch (err) {
      if (__DEV__) console.warn('[goals] load error', err);
      setLoading(false);
      setLoadError(true);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!user || !newTitle.trim()) return;
    if (goals.length >= 5) {
      show({ icon: character.emoji, title: t('goals.limitTitle'), message: t('goals.limitMsg', { name: character.name }), accent });
      return;
    }
    setAdding(true);
    try {
      const g = await addGoal(user.id, newTitle.trim().slice(0, MAX_GOAL_LEN), 'habit');
      setGoals((prev) => [...prev, { ...g, rate7: 0 }]);
      setNewTitle('');
    } catch (err) {
      if (__DEV__) console.warn('[goals] add error', err);
      show({ icon: '📡', title: t('errors.networkTitle'), message: t('errors.networkBody'), accent });
    }
    setAdding(false);
  };

  // Agrega una meta sugerida directo (sin escribir).
  const addSuggestion = async (text: string) => {
    if (!user || adding || goals.length >= 5) return;
    if (goals.some((g) => g.title === text)) return;
    setAdding(true);
    try {
      const g = await addGoal(user.id, text.slice(0, MAX_GOAL_LEN), 'habit');
      setGoals((prev) => [...prev, { ...g, rate7: 0 }]);
    } catch (err) {
      if (__DEV__) console.warn('[goals] addSuggestion error', err);
      show({ icon: '📡', title: t('errors.networkTitle'), message: t('errors.networkBody'), accent });
    }
    setAdding(false);
  };

  const handleRemove = (goal: GoalWithRate) => {
    show({
      title: t('goals.removeTitle'),
      message: t('goals.removeMsg', { title: goal.title }),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('goals.deactivate'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateGoal(goal.id);
            } catch (err) {
              if (__DEV__) console.warn('[goals] remove error', err);
              show({ icon: '📡', title: t('errors.networkTitle'), message: t('errors.networkBody'), accent });
              return;
            }
            setGoals((prev) => prev.filter((g) => g.id !== goal.id));
          },
        },
      ],
    });
  };

  if (loadError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
        <SergeantHeader character={character} subtitle={t('goals.subtitle')} />
        <NetworkError accent={accent} onRetry={() => { setLoading(true); load(); }} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
        <SergeantHeader character={character} subtitle={t('goals.subtitle')} />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="55%" height={32} radius={RADIUS.sm} style={{ marginBottom: 8 }} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={140} radius={RADIUS.lg} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      <SergeantHeader character={character} subtitle={t('goals.subtitle')} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={goals}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={{ fontFamily: FONTS.display, fontSize: 30, color: DARK.text, letterSpacing: 1, marginBottom: 4 }}>
              {t('goals.header')}
            </Text>
          }
          renderItem={({ item }) => {
            const rc = rateColor(item.rate7);
            return (
              <Card elevation={1} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 17, color: DARK.text }}>{item.title}</Text>
                    <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textMuted, marginTop: 2 }}>
                      {item.type === 'habit' ? t('goals.habit') : t('goals.project')} · {t('goals.last7')}
                    </Text>
                  </View>

                  {/* Porcentaje en Bangers */}
                  <View
                    style={{
                      minWidth: 64,
                      height: 64,
                      paddingHorizontal: 8,
                      borderRadius: RADIUS.md,
                      backgroundColor: DARK.surfaceAlt,
                      borderWidth: 1.5,
                      borderColor: rc,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.display, fontSize: 26, color: rc, lineHeight: 28 }}>{item.rate7}</Text>
                    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 10, color: DARK.textDim }}>%</Text>
                  </View>
                </View>

                <ProgressBar value={item.rate7} color={rc} height={8} style={{ marginBottom: 12 }} />

                <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: DARK.textDim, fontStyle: 'italic', marginBottom: 12 }}>
                  {character.emoji} {sergeantComment(item.rate7, item.title)}
                </Text>

                <Pressable
                  onPress={() => handleRemove(item)}
                  style={{
                    alignSelf: 'flex-end',
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    borderRadius: RADIUS.sm,
                    borderWidth: 1,
                    borderColor: '#FF5A65',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: '#FF5A65' }}>{t('goals.deactivate')}</Text>
                </Pressable>
              </Card>
            );
          }}
          ListFooterComponent={
            goals.length < 5 ? (
              <Card elevation={1} style={{ padding: 16, marginTop: 4 }}>
                <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: DARK.text, letterSpacing: 1, marginBottom: 12 }}>
                  {t('goals.addTitle')}
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder={t('goals.addPlaceholder')}
                  placeholderTextColor={DARK.textMuted}
                  returnKeyType="done"
                  maxLength={MAX_GOAL_LEN}
                  onSubmitEditing={handleAdd}
                  style={{
                    backgroundColor: DARK.surfaceAlt,
                    borderWidth: 1,
                    borderColor: DARK.hairline,
                    borderRadius: RADIUS.md,
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    fontFamily: FONTS.bodyBold,
                    fontSize: 15,
                    color: DARK.text,
                    marginBottom: 12,
                  }}
                />
                <ComicButton
                  label={adding ? t('goals.addingBtn') : t('goals.addBtn')}
                  color={accent}
                  textColor="#0B0E13"
                  fullWidth
                  disabled={!newTitle.trim() || adding}
                  onPress={handleAdd}
                />

                <View style={{ marginTop: 16 }}>
                  <GoalSuggestions accent={accent} onPick={addSuggestion} used={goals.map((g) => g.title)} />
                </View>
              </Card>
            ) : (
              <Card alt elevation={0} style={{ padding: 14, marginTop: 8 }}>
                <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim, textAlign: 'center' }}>
                  {t('goals.maxReached')}
                </Text>
              </Card>
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
