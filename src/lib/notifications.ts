/**
 * Notificaciones push de check-in diario.
 *
 * scheduleCheckinNotification(hour) cancela las anteriores y programa una
 * notificación recurrente (diaria) a la hora elegida por el usuario.
 *
 * Llamar desde:
 * - Fin del onboarding (primera vez).
 * - Pantalla de perfil si el usuario cambia la hora.
 *
 * NOTA: expo-notifications requiere el plugin en app.json (ya incluido) y la
 * compilación nativa (expo prebuild). En Expo Go funciona con limitaciones.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { SergeantId } from '../constants/characters';
import { CHARACTERS } from '../constants/characters';

// Handler global — mostrar notificaciones aunque la app esté en foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Pide permisos. Devuelve true si están concedidos. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  if (!canAskAgain) return false;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === 'granted';
}

/** Mensajes de check-in por sargento. */
const CHECKIN_MESSAGES: Record<SergeantId, string[]> = {
  gomez: [
    '¡Hora del reporte, recluta! ¿Cumpliste tus metas?',
    'Tu palabra es tu honor. ¿Qué hay de las metas de hoy?',
    '¡A reportar, recluta! El que cumple, avanza.',
  ],
  rex: [
    '¡MOVE IT, SOLDADO! ¡Check-in AHORA! 🐶',
    '¡¿QUÉ ES ESTO?! ¡SIN REPORTE! ¡WOOF! ¡A REPORTAR YA!',
    '¡LET\'S GO! ¡Las metas no se cumplen solas! ¡VAMOS!',
  ],
  valentina: [
    'Es hora del check-in, corazón. Espero buenas noticias… o las consecuencias.',
    '¿Cumpliste tus metas? Pronto sabremos si eres de los que hablan o de los que actúan.',
    'Check-in, tesoro. No me hagas esperar.',
  ],
  fabianski: [
    'Mija, te espero para el check-in. *suspiro dramático* ¿Cumpliste o me rompiste el corazón?',
    '¡AY! ¡Hora de reportar, mi criatura! ¡Dime todo!',
    '¿Las metas? ¿Hechas? El check-in no se puede ignorar, mijo.',
  ],
};

function randomMessage(sergeantId: SergeantId): string {
  const pool = CHECKIN_MESSAGES[sergeantId];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Cancela el check-in anterior y programa uno nuevo. */
export async function scheduleCheckinNotification(
  hour: number,
  sergeantId: SergeantId,
): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancelar anteriores del check-in.
  await cancelCheckinNotification();

  const character = CHARACTERS[sergeantId];
  const title = `${character.emoji} ${character.name}`;
  const body = randomMessage(sergeantId);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'checkin' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

const CHECKIN_ID_KEY = 'checkin-notification';

export async function cancelCheckinNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.type === 'checkin') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
