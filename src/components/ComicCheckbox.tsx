/**
 * Checkbox grande estilo cómic que "explota" al marcarse (pop + estrella).
 * Pensado para la lista de metas del Home.
 */
import { Pressable, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { comicBorder, comicShadow, COMIC } from '../constants/theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  accent?: string;
  size?: number;
}

export function ComicCheckbox({
  checked,
  onToggle,
  accent = '#2E5E3A',
  size = 44,
}: Props) {
  const pop = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      friction: 4,
      tension: 140,
    }).start();
  }, [checked, pop]);

  const handle = () => {
    if (!checked) {
      // "explosión" cómic al marcar
      burst.setValue(0);
      Animated.timing(burst, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      }
    }
    onToggle();
  };

  return (
    <Pressable onPress={handle} hitSlop={8}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* estrella de explosión */}
        <Animated.Text
          style={{
            position: 'absolute',
            fontSize: size * 0.9,
            opacity: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
            transform: [
              { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.8] }) },
              { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '40deg'] }) },
            ],
          }}
        >
          💥
        </Animated.Text>

        <View
          style={[
            comicBorder,
            comicShadow(3),
            {
              width: size,
              height: size,
              borderRadius: 12,
              backgroundColor: checked ? accent : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Animated.Text
            style={{
              fontSize: size * 0.55,
              color: '#FFFFFF',
              transform: [{ scale: pop }],
            }}
          >
            ✓
          </Animated.Text>
        </View>
      </View>
    </Pressable>
  );
}
