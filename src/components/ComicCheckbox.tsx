/**
 * Checkbox redondeado moderno. Vacío: superficie + hairline. Marcado: relleno
 * de acento con check que hace "pop". Haptic de éxito al marcar.
 */
import { Pressable, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DARK, RADIUS, accentGlow } from '../constants/theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  accent?: string;
  size?: number;
}

export function ComicCheckbox({ checked, onToggle, accent = '#3DDC97', size = 30 }: Props) {
  const pop = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 160,
    }).start();
  }, [checked, pop]);

  const handle = () => {
    if (!checked && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    onToggle();
  };

  return (
    <Pressable onPress={handle} hitSlop={10}>
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: RADIUS.sm,
            backgroundColor: checked ? accent : DARK.surfaceAlt,
            borderWidth: checked ? 0 : 1.5,
            borderColor: DARK.hairlineStrong,
            alignItems: 'center',
            justifyContent: 'center',
          },
          checked ? accentGlow(accent, 1) : null,
        ]}
      >
        <Animated.Text
          style={{
            fontSize: size * 0.6,
            lineHeight: size * 0.72,
            color: '#0B0E13',
            fontWeight: '900',
            transform: [{ scale: pop }],
          }}
        >
          ✓
        </Animated.Text>
      </View>
    </Pressable>
  );
}
