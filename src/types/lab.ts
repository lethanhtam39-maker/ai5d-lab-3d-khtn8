export type ReagentId = 'zn' | 'hcl' | 'bacl2' | 'cuso4' | 'naoh';

export interface Reagent {
  id: ReagentId;
  name: string;
  formula: string;
  state: 'solid' | 'solution';
  concentration?: string;
  color: string;
  description: string;
  containerType: 'jar' | 'bottle' | 'dropper';
  targetTube: number; // 1, 2, or 3
}

export interface TubeContents {
  reagents: ReagentId[];
  liquidVolume: number; // 0 to 100 percent
  liquidColor: string; // hex or rgb
  liquidOpacity: number;
  hasZn: boolean;
  znRemainingPercent: number; // 100 -> shrinks as reaction progresses
  isReacting: boolean;
  reactionType: 'none' | 'effervescence' | 'no_reaction' | 'precipitate';
  precipitateAmount: number; // 0 to 1
  precipitateColor: string;
  bubblesCount: number;
  stageName: string;
  scientificNote: string;
}

export interface ExperimentStep {
  id: number;
  title: string;
  targetTube: number;
  expectedReagents: ReagentId[];
  stepDescription: string[];
  phenomenonSummary: string;
  equation: string;
}

export interface ActionLogItem {
  id: string;
  timestamp: string;
  action: string;
  type: 'success' | 'warning' | 'error' | 'info';
  tubeNumber?: number;
}

export interface WorksheetData {
  studentName: string;
  studentClass: string;
  q1_prediction: string;
  q2_tube1_phenomenon: string;
  q3_tube2_phenomenon: string;
  q4_tube3_phenomenon: string;
  q5_reaction_identification: string;
  q6_chemical_equations: string;
  q7_ai_critique: string;
  isSubmitted: boolean;
  submittedAt: string | null;
}
