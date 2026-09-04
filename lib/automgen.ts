import { GrafcetData } from './types';

export function generateAutomgenCode(grafcet: GrafcetData): { code: string; isOfficial: boolean; note: string } {
  const note = "Note sur la compatibilité AUTOMGEN : La syntaxe ci-dessous est une représentation textuelle standardisée (type Grafcet/IL) utilisable dans AUTOMGEN. L'importation directe de fichiers binaires ou de formats propriétaires .pno/.atg non documentés publiquement ne peut pas être garantie sans le logiciel officiel.";

  let lines: string[] = [];
  lines.push(`// GRAFCET: ${grafcet.title}`);
  lines.push(`// Généré automatiquement`);
  lines.push(``);

  if (Array.isArray(grafcet.variables) && grafcet.variables.length > 0) {
    lines.push(`// DECLARATION DES VARIABLES E/S`);
    grafcet.variables.forEach(v => {
      const prefix = v.type === 'input' ? 'ENTREE' : v.type === 'output' ? 'SORTIE' : v.type === 'timer' ? 'TEMPO' : 'INTERNE';
      lines.push(`${prefix} ${v.name}; // ${v.description}`);
    });
    lines.push(``);
  }

  lines.push(`// DECLARATION DES ETAPES`);
  grafcet.steps.forEach(s => {
    const typeStr = s.type === 'initial' ? 'ETAPE_INITIALE' : 'ETAPE';
    lines.push(`${typeStr} ${s.label};`);
  });

  lines.push(``);
  lines.push(`// ACTIONS`);
  grafcet.steps.forEach(s => {
    s.actions.forEach(a => {
      lines.push(`ACTION ${s.label} : ${a.qualifier ? `[${a.qualifier}] ` : ''}${a.description};`);
    });
  });

  lines.push(``);
  lines.push(`// TRANSITIONS ET RECEPTIVITES`);
  grafcet.transitions.forEach(t => {
    const from = t.fromSteps.join(', ');
    const to = t.toSteps.join(', ');
    lines.push(`TRANSITION ${t.id} : DE (${from}) VERS (${to}) CONDITION = ${t.receptivity};`);
  });

  return {
    code: lines.join('\n'),
    isOfficial: false,
    note
  };
}