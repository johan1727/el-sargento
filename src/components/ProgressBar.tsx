/**
 * Barra de progreso redondeada estilo fitness.
 * Track oscuro + relleno en el color de acento. Anima el ancho al cambiar.
 */
import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { DARK, RADIUS } from '../constants/theme';

interface Props {
  /** 0–100 */
  value: number;
  color: string;
  /** alto de la barra (default 10) */
  height?: number;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({ value, color, height = 10, trackColor, style }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const anim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clamped, anim]);

  return (
    <View
      style={[
        {
          height,
          backgroundColor: trackColor ?? DARK.track,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          width: anim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
          backgroundColor: color,
          borderRadius: RADIUS.pill,
        }}
      />
    </View>
  );
}
