/**
 * Panel estilo cómic — borde negro 3px + sombra dura 6px.
 * Diferenciador: acepta `accentColor` para aplicar el color wash del sargento
 * sobre el fondo, haciendo que su personalidad "sangre" en el papel.
 */
import { View, type ViewProps } from 'react-native';
import { comicBorder, comicShadow, comicWash } from '../constants/theme';

interface ComicCardProps extends ViewProps {
  shadow?: number;
  shadowColor?: string;
  /** Color hex del sargento — aplica wash sutil sobre el fondo */
  accentColor?: string;
  /** Intensidad del wash (0-1, default 0.13) */
  washOpacity?: number;
}

export function ComicCard({
  shadow = 6,
  shadowColor,
  accentColor,
  washOpacity = 0.13,
  style,
  children,
  ...rest
}: ComicCardProps) {
  const washBg = accentColor ? comicWash(accentColor, washOpacity) : undefined;

  return (
    <View
      style={[
        comicBorder,
        comicShadow(shadow, shadowColor),
        washBg ? { backgroundColor: washBg } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
