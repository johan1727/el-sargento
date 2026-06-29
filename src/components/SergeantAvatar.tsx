/**
 * Avatar del sargento.
 *
 * TODO(jhonatan): reemplazar estos placeholders con ilustraciones reales en
 * estilo consistente. Genera los 4 con un generador de imágenes IA (mismo
 * artista/estilo/fondo) y colócalos en assets/sargentos/<id>.png; luego
 * descomenta la rama <Image> de abajo.
 */
import { Image, Text, View, type ImageStyle } from 'react-native';
import { DARK, softShadow } from '../constants/theme';
import { getCharacter, type SergeantId } from '../constants/characters';

// Cuando existan los PNG, mapéalos aquí:
// const AVATARS: Record<SergeantId, any> = {
//   gomez: require('../../assets/sargentos/gomez.png'),
//   rex: require('../../assets/sargentos/rex.png'),
//   valentina: require('../../assets/sargentos/valentina.png'),
//   fabianski: require('../../assets/sargentos/fabianski.png'),
// };
const AVATARS: Partial<Record<SergeantId, number>> = {};

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
