/**
 * Sistema de diseño — "Fitia oscuro + alma sargento".
 *
 * Estructura moderna mobile-first (superficies oscuras, tarjetas redondeadas,
 * hairlines sutiles, sombras suaves de profundidad) PERO cada sargento conserva
 * su paleta: el color de acento del personaje activo tiñe métricas, botones,
 * anillos y bordes vivos.
 *
 * Tipografía híbrida: Bangers para los números/títulos heroicos (el "alma"
 * militar-cómic) y Nunito para todo el cuerpo (lo limpio y legible).
 *
 * Los tokens COMIC + helpers comicShadow/comicBorder/comicWash se conservan
 * para compatibilidad mientras se migran las pantallas.
 */
import { Platform, type ViewStyle } from 'react-native';

// ──────────────────────────────────────────────────────────────
// DARK — superficies y texto del nuevo sistema
// ──────────────────────────────────────────────────────────────
export const DARK = {
  /** fondo de la app (casi negro azulado) */
  bg: '#0B0E13',
  /** fondo elevado para headers/sheets */
  bgElevated: '#10141B',
  /** tarjeta estándar */
  surface: '#161A22',
  /** tarjeta/inputs un paso más claros */
  surfaceAlt: '#1D222C',
  /** superficie destacada (chips activos, etc.) */
  surfaceHigh: '#262C38',

  /** borde sutil (1px) sobre superficies */
  hairline: 'rgba(255,255,255,0.07)',
  /** borde un poco más marcado */
  hairlineStrong: 'rgba(255,255,255,0.13)',

  /** texto principal */
  text: '#F4F6FB',
  /** texto secundario */
  textDim: '#99A2B2',
  /** texto apagado / placeholders */
  textMuted: '#5C6473',

  /** track de barras/anillos de progreso */
  track: 'rgba(255,255,255,0.09)',
} as const;

/** Escala de radios. */
export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Escala de espaciado base. */
export const SPACING = {
  screen: 16,
  gap: 12,
} as const;

/** Familias tipográficas (deben coincidir con app/_layout useFonts). */
export const FONTS = {
  display: 'Bangers',
  body: 'Nunito_400Regular',
  bodyBold: 'Nunito_700Bold',
  bodyBlack: 'Nunito_800ExtraBold',
} as const;

/**
 * Sombra suave de profundidad para tarjetas oscuras.
 * En web usa boxShadow; en native, shadow + elevation.
 */
export function softShadow(elev: 1 | 2 | 3 = 2): ViewStyle {
  const map = {
    1: { y: 4, blur: 12, opacity: 0.35, elevation: 4 },
    2: { y: 8, blur: 20, opacity: 0.45, elevation: 8 },
    3: { y: 16, blur: 32, opacity: 0.55, elevation: 16 },
  } as const;
  const s = map[elev];
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${s.y}px ${s.blur}px rgba(0,0,0,${s.opacity})` } as ViewStyle;
  }
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: s.y },
    shadowOpacity: s.opacity,
    shadowRadius: s.blur / 2,
    elevation: s.elevation,
  };
}

/**
 * Halo de color (glow del acento del sargento) para elementos destacados:
 * CTA principal, anillo de racha, avatar activo.
 */
export function accentGlow(hex: string, elev: 1 | 2 = 2): ViewStyle {
  const blur = elev === 1 ? 14 : 22;
  const y = elev === 1 ? 4 : 8;
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${y}px ${blur}px ${tint(hex, 0.45)}` } as ViewStyle;
  }
  return {
    shadowColor: hex,
    shadowOffset: { width: 0, height: y },
    shadowOpacity: 0.55,
    shadowRadius: blur / 2,
    elevation: elev === 1 ? 6 : 10,
  };
}

/**
 * Convierte un hex (#RRGGBB) en rgba con opacidad.
 * (Antes `comicWash`; se mantiene el alias más abajo.)
 */
export function tint(hex: string, opacity = 0.13): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/** Estilo base de tarjeta oscura: superficie + hairline + radio. */
export function cardStyle(radius: number = RADIUS.lg): ViewStyle {
  return {
    backgroundColor: DARK.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: DARK.hairline,
  };
}

// ──────────────────────────────────────────────────────────────
// COMIC (legacy) — se conserva para componentes aún sin migrar
// ──────────────────────────────────────────────────────────────
export const COMIC = {
  ink: '#0A0A0A',
  paper: '#FDF6E3',
  paperWarm: '#FFF8E7',
  yellow: '#FFD23F',
  borderWidth: 3,
  shadowSize: 6,
};

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

export const comicBorder: ViewStyle = {
  borderWidth: COMIC.borderWidth,
  borderColor: COMIC.ink,
};

/** Alias legacy de `tint`. */
export function comicWash(hex: string, opacity = 0.13): string {
  return tint(hex, opacity);
}

// ──────────────────────────────────────────────────────────────
// Utilidades de contenido
// ──────────────────────────────────────────────────────────────
/** Saludo según la hora del día. */
export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return 'mañana';
  if (hour < 19) return 'tarde';
  return 'noche';
}

/** Texto de efecto cómic aleatorio (uso decorativo puntual). */
const BURSTS = ['¡POW!', '¡ZAS!', '¡BOOM!', '¡BUM!', '¡CRASH!'];
export function randomBurst(): string {
  return BURSTS[Math.floor(Math.random() * BURSTS.length)];
}
