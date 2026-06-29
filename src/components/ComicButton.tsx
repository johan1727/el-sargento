/**
 * Botón principal — sólido, redondeado, con glow del color de acento.
 * Pulgar-friendly: mínimo 52px. Etiqueta en Bangers (alma militar) sobre
 * estructura moderna. Hunde sutilmente al presionar (scale + glow off).
 *
 * Mantiene el nombre `ComicButton` y su API para no romper las pantallas.
 */
import { Pressable, Text, View, Platform, type PressableProps } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { DARK, FONTS, RADIUS, accentGlow } from '../constants/theme';

interface ComicButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  color?: string;
  textColor?: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  /** botón secundario: contorno sobre superficie oscura, sin relleno */
  variant?: 'solid' | 'ghost';
}

const SIZES = {
  sm: { padV: 11, padH: 16, font: 16, radius: RADIUS.md },
  md: { padV: 15, padH: 22, font: 20, radius: RADIUS.md },
  lg: { padV: 18, padH: 28, font: 26, radius: RADIUS.lg },
};

export function ComicButton({
  label,
  color = '#FFFFFF',
  textColor = '#FFFFFF',
  icon,
  size = 'md',
  fullWidth,
  disabled,
  variant = 'solid',
  onPress,
  ...rest
}: ComicButtonProps) {
  const [pressed, setPressed] = useState(false);
  const s = SIZES[size];
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={(e) => {
        if (disabled) return;
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
        onPress?.(e);
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={{
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        transform: [{ scale: pressed ? 0.97 : 1 }],
        opacity: disabled ? 0.4 : 1,
      }}
      {...rest}
    >
      <View
        style={[
          {
            backgroundColor: isGhost ? 'transparent' : color,
            borderWidth: isGhost ? 1.5 : 0,
            borderColor: isGhost ? color : 'transparent',
            paddingVertical: s.padV,
            paddingHorizontal: s.padH,
            borderRadius: s.radius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            minHeight: 52,
          },
          !isGhost && !disabled ? accentGlow(color, 1) : null,
        ]}
      >
        {icon ? <Text style={{ fontSize: s.font }}>{icon}</Text> : null}
        <Text
          style={{
            fontFamily: FONTS.display,
            fontSize: s.font,
            color: isGhost ? color : textColor,
            letterSpacing: 1.2,
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
