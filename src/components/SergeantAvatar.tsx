/**
 * Avatar del sargento — ilustraciones reales generadas con Canva (estilo
 * cómic/cel-shaded consistente entre los 4). Si un sargento nuevo no tiene
 * PNG todavía, cae al placeholder (círculo + emoji + banderita).
 */
import { Image, Text, View, type ImageStyle } from 'react-native';
import { DARK, softShadow } from '../constants/theme';
import { getCharacter, type SergeantId } from '../constants/characters';

const AVATARS: Partial<Record<SergeantId, number>> = {
  gomez: require('../../assets/sargentos/gomez.png'),
  rex: require('../../assets/sargentos/rex.png'),
  valentina: require('../../assets/sargentos/valentina.png'),
  fabianski: require('../../assets/sargentos/fabianski.png'),
};

interface Props {
  sergeantId: SergeantId;
  size?: number;
  shadow?: number;
}

export function SergeantAvatar({ sergeantId, size = 72, shadow = 2 }: Props) {
  const character = getCharacter(sergeantId);
  const realAvatar = AVATARS[sergeantId];
  const shadowStyle = shadow > 0 ? softShadow(1) : null;

  if (realAvatar) {
    return (
      <Image
        source={realAvatar}
        resizeMode="cover"
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: character.theme.primary },
          shadowStyle as ImageStyle,
        ]}
      />
    );
  }

  // Placeholder: círculo con color del sargento + emoji + banderita.
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: character.theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shadowStyle,
      ]}
    >
      <Text style={{ fontSize: size * 0.42 }}>{character.emoji}</Text>
      <View
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: size * 0.18,
          backgroundColor: character.theme.accent,
          borderWidth: 2,
          borderColor: DARK.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.16 }}>{character.flag}</Text>
      </View>
    </View>
  );
}
