/** Placeholder de carga con pulso suave. Reemplaza spinners por bloques. */
import { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';
import { DARK, RADIUS } from '../constants/theme';

export function Skeleton({
  width,
  height,
  radius = RADIUS.md,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width: width ?? '100%', height, borderRadius: radius, backgroundColor: DARK.surfaceAlt, opacity: pulse },
        style,
      ]}
    />
  );
}
