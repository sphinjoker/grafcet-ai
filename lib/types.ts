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