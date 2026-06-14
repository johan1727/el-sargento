/**
 * Tokens visuales del estilo cómic compartidos por componentes.
 * Bordes negros gruesos + sombras duras offset (no difuminadas).
 */
import { Platform, type ViewStyle } from 'react-native';

export const COMIC = {
  ink: '#0A0A0A',
  paper: '#FDF6E3',
  paperWarm: '#FFF8E7',
  yellow: '#FFD23F',
  borderWidth: 3,
  shadowSize: 6,
};

/**
 * Sombra dura brutalist (offset sólido, sin blur).
 * Default 6px — más impacto que 4px.
 */
export function comicShadow(offset = 6, color = COMIC.ink): ViewStyle {
  if (Platform.OS === 'web') {
    return { boxShadow: `${offset}px ${offset}px 0 0 ${color}` } as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: Math.min(offset * 2, 24),
  };
}

/** Borde negro grueso estándar. */
export const comicBorder: ViewStyle = {
  borderWidth: COMIC.borderWidth,
  borderColor: COMIC.ink,
};

/**
 * Color wash — el sargento "sangra" sobre el fondo de las tarjetas.
 * Toma un hex (#RRGGBB) y devuelve rgba con opacidad.
 */
export function comicWash(hex: string, opacity = 0.13): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/** Saludo según la hora del día. */
export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return 'mañana';
  if (hour < 19) return 'tarde';
  return 'noche';
}

/** Texto de efecto cómic aleatorio. */
const BURSTS = ['¡POW!', '¡ZAS!', '¡BOOM!', '¡BUM!', '¡CRASH!'];
export function randomBurst(): string {
  return BURSTS[Math.floor(Math.random() * BURSTS.length)];
}
