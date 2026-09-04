import { GrafcetData } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGrafcet(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Données JSON invalides.'] };
  }

  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    errors.push('Le GRAFCET doit contenir au moins une étape.');
  } else {
    const hasInitial = data.steps.some((s: any) => s.type === 'initial');
    if (!hasInitial) {
      errors.push('Le GRAFCET doit contenir au moins une étape initiale.');
    }
  }

  if (!Array.isArray(data.transitions) || data.transitions.length === 0) {
    errors.push('Le GRAFCET doit contenir au moins une transition.');
  } else if (Array.isArray(data.steps)) {
    const stepIds = new Set(data.steps.map((s: any) => s.id));
    
    data.transitions.forEach((t: any, index: number) => {
      if (!t.fromSteps || !Array.isArray(t.fromSteps) || t.fromSteps.length === 0) {
        errors.push(`Transition #${index + 1} n'a aucune étape source.`);
      } else {
        t.fromSteps.forEach((id: string) => {
          if (!stepIds.has(id)) {
            errors.push(`Transition #${index + 1} pointe vers une étape source inexistante : ${id}`);
          }
        });
      }

      if (!t.toSteps || !Array.isArray(t.toSteps) || t.toSteps.length === 0) {
        errors.push(`Transition #${index + 1} n'a aucune étape cible.`);
      } else {
        t.toSteps.forEach((id: string) => {
          if (!stepIds.has(id)) {
            errors.push(`Transition #${index + 1} pointe vers une étape cible inexistante : ${id}`);
          }
        });
      }

      if (!t.receptivity || typeof t.receptivity !== 'string') {
        errors.push(`Transition #${index + 1} n'a pas de réceptivité valide.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}