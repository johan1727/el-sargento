/**
 * Avatar del sargento.
 *
 * TODO(jhonatan): reemplazar estos placeholders con ilustraciones reales en
 * estilo cómic consistente. Genera los 4 con un generador de imágenes IA
 * (mismo artista/estilo/fondo) y colócalos en assets/sargentos/<id>.png; luego
 * descomenta la rama <Image> de abajo.
 */
import { Image, Text, View } from 'react-native';
import { comicBorder, comicShadow } from '../constants/theme';
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

export function SergeantAvatar({ sergeantId, size = 72, shadow = 4 }: Props) {
  const character = getCharacter(sergeantId);
  const realAvatar = AVATARS[sergeantId];

  if (realAvatar) {
    return (
      <Image
        source={realAvatar}
        style={[
          comicBorder,
          comicShadow(shadow),
          { width: size, height: size, borderRadius: size / 2, backgroundColor: character.theme.primary },
        ]}
      />
    );
  }

  // Placeholder: círculo con color del sargento + emoji + inicial.
  return (
    <View
      style={[
        comicBorder,
        comicShadow(shadow),
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: character.theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.42 }}>{character.emoji}</Text>
      <View
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: size * 0.17,
          backgroundColor: character.theme.accent,
          borderWidth: 2,
          borderColor: '#0A0A0A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.16 }}>{character.flag}</Text>
      </View>
    </View>
  );
}
