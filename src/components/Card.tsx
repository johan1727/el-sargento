/**
 * Tarjeta oscura del sistema "Fitia oscuro".
 * Superficie elevada + hairline sutil + radio grande + sombra suave opcional.
 * `accentColor` tiñe ligeramente el fondo con el color del sargento.
 */
import { View, type ViewProps } from 'react-native';
import { DARK, RADIUS, cardStyle, softShadow, tint } from '../constants/theme';

interface CardProps extends ViewProps {
  /** radio del borde (default RADIUS.lg) */
  radius?: number;
  /** nivel de sombra suave (0 = sin sombra) */
  elevation?: 0 | 1 | 2 | 3;
  /** color hex del sargento — tiñe el fondo sutilmente */
  accentColor?: string;
  /** intensidad del tinte (default 0.06) */
  tintOpacity?: number;
  /** usa la superficie un paso más clara */
  alt?: boolean;
}

export function Card({
  radius = RADIUS.lg,
  elevation = 1,
  accentColor,
  tintOpacity = 0.06,
  alt,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        cardStyle(radius),
        alt ? { backgroundColor: DARK.surfaceAlt } : null,
        accentColor ? { backgroundColor: tint(accentColor, tintOpacity) } : null,
        elevation > 0 ? softShadow(elevation as 1 | 2 | 3) : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
