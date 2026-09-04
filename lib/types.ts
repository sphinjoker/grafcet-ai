export type StepType = 'initial' | 'normal';

export interface Action {
  id: string;
  description: string;
  qualifier?: 'N' | 'S' | 'R' | 'L' | 'D';
}

export interface Step {
  id: string;
  label: string;
  type: StepType;
  actions: Action[];
  /** Identifiant du GRAFCET auquel appartient cette étape quand le programme
   * comporte plusieurs séquences indépendantes (ex: "G1", "G2"...).
   * Optionnel : absent = séquence unique / séquence principale. */
  chartId?: string;
  /** Titre lisible de la séquence (ex: "Tapis d'évacuation"), affiché
   * au-dessus de l'étape initiale correspondante dans le rendu. */
  chartTitle?: string;
}

export interface Transition {
  id: string;
  fromSteps: string[];
  toSteps: string[];
  receptivity: string;
}

export interface GrafcetData {
  title: string;
  description?: string;
  variables?: Variable[];
  steps: Step[];
  transitions: Transition[];
  ambiguities?: string[];
}

export interface Variable {
  name: string;
  type: 'input' | 'output' | 'timer' | 'internal';
  description: string;
}