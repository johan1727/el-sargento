/**
 * Insignia de rango ilustrada (círculo con imagen), con fallback a emoji si el
 * rango no tiene PNG. Mismo patrón que SergeantAvatar.
 */
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { RankId } from '../constants/ranks';

const RANK_IMAGES: Partial<Record<RankId, number>> = {
  recluta: require('../../assets/ranks/recluta.png'),
  cabo: require('../../assets/ranks/cabo.png'),
  sargento: require('../../assets/ranks/sargento.png'),
  teniente: require('../../assets/ranks/teniente.png'),
  capitan: require('../../assets/ranks/capitan.png'),
  general: require('../../assets/ranks/general.png'),
};

interface Props {
  id: RankId;
  emoji: string;
  size: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

export function RankIcon({ id, emoji, size, color, style }: Props) {
  const image = RANK_IMAGES[id];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {image ? (
        <Image source={image} resizeMode="cover" style={{ width: size, height: size }} />
      ) : (
        <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
      )}
    </View>
  );
}
