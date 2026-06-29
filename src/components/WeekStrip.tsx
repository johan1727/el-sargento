/**
 * Tira de actividad de los últimos 7 días (estilo app fitness).
 * Cada día: inicial del día de la semana + punto. Punto relleno (acento) si ese
 * día hubo al menos un check-in completado. Hoy se resalta con un aro.
 */
import { Text, View } from 'react-native';
import { DARK, FONTS } from '../constants/theme';
import { localDateString } from '../lib/streak';

interface Props {
  /** set de fechas YYYY-MM-DD con actividad */
  activeDays: Set<string>;
  accent: string;
}

const WEEKDAY = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function WeekStrip({ activeDays, accent }: Props) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {days.map((d, i) => {
        const key = localDateString(d);
        const active = activeDays.has(key);
        const isToday = i === 6;
        return (
          <View key={key} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 11, color: isToday ? accent : DARK.textMuted }}>
              {WEEKDAY[d.getDay()]}
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: active ? accent : DARK.surfaceHigh,
                borderWidth: isToday && !active ? 1.5 : 0,
                borderColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {active ? <Text style={{ fontSize: 11, color: '#0B0E13', fontWeight: '900' }}>✓</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
