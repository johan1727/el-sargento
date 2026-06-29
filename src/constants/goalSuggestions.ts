/** Metas sugeridas para agregar rápido (onboarding y pantalla de Metas). */
import { appLocale } from '../i18n';

export interface GoalSuggestion {
  emoji: string;
  label: string;
  labelEn: string;
}

export const GOAL_SUGGESTIONS: GoalSuggestion[] = [
  { emoji: '🏋️', label: 'Ejercicio 30 min', labelEn: 'Exercise 30 min' },
  { emoji: '📖', label: 'Leer 20 páginas', labelEn: 'Read 20 pages' },
  { emoji: '💧', label: 'Tomar 2L de agua', labelEn: 'Drink 2L of water' },
  { emoji: '🧘', label: 'Meditar 10 min', labelEn: 'Meditate 10 min' },
  { emoji: '😴', label: 'Dormir 8 horas', labelEn: 'Sleep 8 hours' },
  { emoji: '📵', label: 'Sin redes en la mañana', labelEn: 'No social media in the morning' },
  { emoji: '🚶', label: 'Caminar 8,000 pasos', labelEn: 'Walk 8,000 steps' },
  { emoji: '📝', label: 'Escribir mi diario', labelEn: 'Write in my journal' },
  { emoji: '🥗', label: 'Comer saludable', labelEn: 'Eat healthy' },
  { emoji: '📚', label: 'Estudiar 1 hora', labelEn: 'Study 1 hour' },
  { emoji: '🙏', label: 'Agradecer 3 cosas', labelEn: 'Be grateful for 3 things' },
  { emoji: '🛏️', label: 'Tender mi cama', labelEn: 'Make my bed' },
];

/** Etiqueta visible en el idioma activo. */
export function suggestionLabel(s: GoalSuggestion): string {
  return appLocale() === 'en' ? s.labelEn : s.label;
}

/** Texto final de la meta tal cual se guarda (con emoji), en el idioma activo. */
export function suggestionText(s: GoalSuggestion): string {
  return `${s.emoji} ${suggestionLabel(s)}`;
}
