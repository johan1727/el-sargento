/** Metas sugeridas para agregar rápido (onboarding y pantalla de Metas). */
export interface GoalSuggestion {
  emoji: string;
  label: string;
}

export const GOAL_SUGGESTIONS: GoalSuggestion[] = [
  { emoji: '🏋️', label: 'Ejercicio 30 min' },
  { emoji: '📖', label: 'Leer 20 páginas' },
  { emoji: '💧', label: 'Tomar 2L de agua' },
  { emoji: '🧘', label: 'Meditar 10 min' },
  { emoji: '😴', label: 'Dormir 8 horas' },
  { emoji: '📵', label: 'Sin redes en la mañana' },
  { emoji: '🚶', label: 'Caminar 8,000 pasos' },
  { emoji: '📝', label: 'Escribir mi diario' },
  { emoji: '🥗', label: 'Comer saludable' },
  { emoji: '📚', label: 'Estudiar 1 hora' },
  { emoji: '🙏', label: 'Agradecer 3 cosas' },
  { emoji: '🛏️', label: 'Tender mi cama' },
];

/** Texto final de la meta tal cual se guarda (con emoji). */
export function suggestionText(s: GoalSuggestion): string {
  return `${s.emoji} ${s.label}`;
}
