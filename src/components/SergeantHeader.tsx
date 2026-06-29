/**
 * Header del sargento — superficie oscura elevada, limpia y moderna.
 * El acento del personaje aparece en el aro del avatar y en la línea inferior.
 * Conserva el nombre en Bangers (alma militar) sobre estructura tipo app fitness.
 */
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { SergeantAvatar } from './SergeantAvatar';
import { RankBadge } from './RankBadge';
import { DARK, FONTS, RADIUS, accentGlow, tint } from '../constants/theme';
import type { Character } from '../constants/characters';
import type { RankId } from '../constants/ranks';

interface Props {
  character: Character;
  rank?: RankId;
  streak?: number;
  subtitle?: string;
  /** si se pasa, muestra un engranaje a la derecha que abre Ajustes */
  onPressSettings?: () => void;
  style?: ViewStyle;
}

export function SergeantHeader({ character, rank, streak, subtitle, onPressSettings, style }: Props) {
  const accent = character.theme.accent;

  return (
    <View
      style={[
        {
          backgroundColor: DARK.bgElevated,
          borderBottomWidth: 1,
          borderBottomColor: DARK.hairline,
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        },
        style,
      ]}
    >
      {/* Avatar con aro de acento + glow sutil */}
      <View style={[{ borderRadius: 999, borderWidth: 2, borderColor: accent }, accentGlow(accent, 1)]}>
        <SergeantAvatar sergeantId={character.id} size={52} shadow={0} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.display,
            fontSize: 24,
            color: DARK.text,
            letterSpacing: 1.2,
            lineHeight: 26,
          }}
          numberOfLines={1}
        >
          {character.name} {character.flag}
        </Text>

        {rank ? (
          <View style={{ marginTop: 2 }}>
            <RankBadge rank={rank} streak={streak} compact />
          </View>
        ) : subtitle ? (
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: accent, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Pastilla de racha (cuando hay rango visible y subtítulo) */}
      {rank && subtitle ? (
        <View
          style={{
            backgroundColor: tint(accent, 0.16),
            borderColor: tint(accent, 0.4),
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 11, color: accent }}>{subtitle}</Text>
        </View>
      ) : null}

      {/* Engranaje de ajustes */}
      {onPressSettings ? (
        <Pressable
          onPress={onPressSettings}
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            borderRadius: RADIUS.md,
            backgroundColor: DARK.surfaceAlt,
            borderWidth: 1,
            borderColor: DARK.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
