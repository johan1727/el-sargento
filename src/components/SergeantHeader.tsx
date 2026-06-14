/**
 * Header full-bleed del sargento — ocupa todo el ancho, color oscuro del personaje.
 * El color del sargento domina visualmente la parte superior de cada pantalla.
 * Brutalist: sin gradientes, color plano puro, sombra dura en el borde inferior.
 */
import { Text, View, type ViewStyle } from 'react-native';
import { SergeantAvatar } from './SergeantAvatar';
import { RankBadge } from './RankBadge';
import { COMIC } from '../constants/theme';
import type { Character } from '../constants/characters';
import type { RankId } from '../constants/ranks';

interface Props {
  character: Character;
  rank?: RankId;
  streak?: number;
  subtitle?: string;
  style?: ViewStyle;
}

export function SergeantHeader({ character, rank, streak, subtitle, style }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: character.theme.dark,
          borderBottomWidth: 4,
          borderBottomColor: COMIC.ink,
          shadowColor: COMIC.ink,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 12,
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Watermark: bandera/emoji del sargento en el fondo */}
      <Text
        style={{
          position: 'absolute',
          right: 54,
          top: -10,
          fontSize: 96,
          opacity: 0.09,
        }}
        aria-hidden="true"
      >
        {character.flag}
      </Text>

      {/* Avatar con borde en color accent del sargento */}
      <View style={{ borderWidth: 3, borderColor: character.theme.accent, borderRadius: 999 }}>
        <SergeantAvatar sergeantId={character.id} size={62} shadow={0} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Bangers',
            fontSize: 26,
            color: '#FFFFFF',
            letterSpacing: 1.5,
            lineHeight: 28,
          }}
          numberOfLines={1}
        >
          {character.name} {character.flag}
        </Text>

        {rank && (
          <RankBadge rank={rank} streak={streak} compact />
        )}

        {subtitle ? (
          <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 12, color: character.theme.accent, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Triángulo accent principal — esquina superior derecha */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderTopWidth: 64,
          borderLeftWidth: 64,
          borderTopColor: character.theme.accent,
          borderLeftColor: 'transparent',
          opacity: 0.65,
        }}
      />
      {/* Triángulo interior blanco — destaca el corner */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderTopWidth: 26,
          borderLeftWidth: 26,
          borderTopColor: '#FFFFFF',
          borderLeftColor: 'transparent',
          opacity: 0.18,
        }}
      />
    </View>
  );
}
