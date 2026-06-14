/**
 * Elemento decorativo "¡POW! / ¡ZAS!" estilo cómic.
 * Se usa como elemento estructural de layout (no solo en celebraciones).
 * Diferenciador visible: texto Bangers rotado sobre fondo accent del sargento.
 */
import { Text, View } from 'react-native';
import { COMIC, comicBorder } from '../constants/theme';

interface Props {
  text?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  rotate?: number;
  position?: 'absolute' | 'relative';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

const SIZES = {
  sm: { padding: 5, paddingH: 9, font: 16 },
  md: { padding: 7, paddingH: 14, font: 22 },
  lg: { padding: 10, paddingH: 20, font: 30 },
};

export function ActionBurst({
  text = '¡POW!',
  color = '#FFD23F',
  size = 'md',
  rotate = -8,
  position = 'absolute',
  top,
  right,
  bottom,
  left,
}: Props) {
  const s = SIZES[size];
  return (
    <View
      style={[
        comicBorder,
        {
          position,
          top,
          right,
          bottom,
          left,
          backgroundColor: color,
          paddingVertical: s.padding,
          paddingHorizontal: s.paddingH,
          borderRadius: 8,
          transform: [{ rotate: `${rotate}deg` }],
          // Hard shadow off-axis
          shadowColor: COMIC.ink,
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 6,
          zIndex: 10,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: 'Bangers',
          fontSize: s.font,
          color: COMIC.ink,
          letterSpacing: 1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
