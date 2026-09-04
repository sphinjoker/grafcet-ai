import { GrafcetData, Variable } from './types';

export function extractVariables(grafcet: GrafcetData): Variable[] {
  const varsMap = new Map<string, Variable>();

  grafcet.steps.forEach(step => {
    step.actions.forEach(action => {
      const match = action.description.match(/^[A-Za-z0-9_-]+/);
      if (match) {
        const name = match[0];
        if (!varsMap.has(name)) {
          varsMap.set(name, {
            name,
            type: 'output',
            description: `Action associée à l'étape ${step.label}`
          });
        }
      }
    });
  });

  grafcet.transitions.forEach(trans => {
    const rec = trans.receptivity;
    const timerMatches = rec.match(/T\d+|(\d+\s*s)/gi);
    if (timerMatches) {
      timerMatches.forEach(t => {
        const name = t.trim();
        if (!varsMap.has(name)) {
          varsMap.set(name, {
            name,
            type: 'timer',
            description: `Temporisation dans transition ${trans.id}`
          });
        }
      });
    }

    const tokens = rec.split(/[\s+*\./()]/).filter(Boolean);
    tokens.forEach(token => {
      if (!token.match(/^\d+s?$/i) && !token.startsWith('T') && !varsMap.has(token)) {
        varsMap.set(token, {
          name: token,
          type: 'input',
          description: `Condition de réceptivité`
        });
      }
    });
  });

  return Array.from(varsMap.values());
}