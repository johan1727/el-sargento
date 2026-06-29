/** Chips de metas sugeridas — tap para agregar rápido. */
import { Pressable, Text, View } from 'react-native';
import { GOAL_SUGGESTIONS, suggestionText, suggestionLabel } from '../constants/goalSuggestions';
import { t } from '../i18n';
import { DARK, FONTS, RADIUS, tint } from '../constants/theme';

export function GoalSuggestions({
  accent,
  onPick,
  used = [],
}: {
  accent: string;
  onPick: (text: string) => void;
  /** títulos ya usados (se muestran deshabilitados) */
  used?: string[];
}) {
  return (
    <View>
      <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: DARK.textDim, marginBottom: 10 }}>
        {t('onboarding.quickIdeas')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GOAL_SUGGESTIONS.map((s) => {
          const text = suggestionText(s);
          const isUsed = used.includes(text);
          return (
            <Pressable
              key={s.label}
              onPress={() => onPick(text)}
              disabled={isUsed}
              accessibilityRole="button"
              accessibilityLabel={`Agregar meta ${s.label}`}
              accessibilityState={{ disabled: isUsed }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: RADIUS.pill,
                borderWidth: 1,
                borderColor: isUsed ? DARK.hairline : tint(accent, 0.5),
                backgroundColor: isUsed ? DARK.surfaceAlt : tint(accent, 0.1),
                opacity: isUsed ? 0.45 : 1,
              }}
            >
              <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: isUsed ? DARK.textMuted : DARK.text }}>
                {suggestionLabel(s)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
