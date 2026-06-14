/**
 * Botón Brutalist: borde negro grueso, sombra dura 6px que se hunde al presionar.
 * Pulgar-friendly: área mínima 52px. Texto Bangers en mayúsculas como elemento compositivo.
 */
import { Pressable, Text, View, Platform, type PressableProps } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { comicBorder, comicShadow, COMIC } from '../constants/theme';

interface ComicButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  color?: string;
  textColor?: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
}

const SIZES = {
  sm: { padV: 10, padH: 16, font: 17, shadow: 4, radius: 12 },
  md: { padV: 14, padH: 22, font: 22, shadow: 5, radius: 14 },
  lg: { padV: 18, padH: 28, font: 28, shadow: 6, radius: 16 },
};

export function ComicButton({
  label,
  color = COMIC.ink,
  textColor = '#FFFFFF',
  icon,
  size = 'md',
  fullWidth,
  disabled,
  onPress,
  ...rest
}: ComicButtonProps) {
  const [pressed, setPressed] = useState(false);
  const s = SIZES[size];
  const offset = pressed ? 0 : s.shadow;

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={(e) => {
        if (disabled) return;
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }
        onPress?.(e);
      }}
      disabled={disabled}
      style={{
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        transform: [
          { translateX: pressed ? s.shadow : 0 },
          { translateY: pressed ? s.shadow : 0 },
        ],
        opacity: disabled ? 0.4 : 1,
      }}
      {...rest}
    >
      <View
        style={[
          comicBorder,
          comicShadow(offset),
          {
            backgroundColor: color,
            paddingVertical: s.padV,
            paddingHorizontal: s.padH,
            borderRadius: s.radius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            minHeight: 52,
          },
        ]}
      >
        {icon ? (
          <Text style={{ fontSize: s.font }}>{icon}</Text>
        ) : null}
        <Text
          style={{
            fontFamily: 'Bangers',
            fontSize: s.font,
            color: textColor,
            letterSpacing: 1.5,
            textAlign: 'center',
            includeFontPadding: false,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
