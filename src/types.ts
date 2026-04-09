export interface Scenario {
  id: string;
  description: string;
  turnoverTimeMonths: number;
  extensionMonths?: number; // optional best→base extension
}

export interface Phase {
  id: string;
  name: string;
  shortName: string;
  color: string;
  scenarios: Scenario[];
}

export interface ProjectData {
  phases: Phase[];
  kickOffYear?: number;
  kickOffMonth?: number; // 1–12
}

/** One bar segment in a chained path row */
export interface BarSegment {
  phaseShortName: string;
  color: string;
  startMonth: number;
  widthMonths: number;
  label: string;
  isExtension?: boolean; // hatched style
}

/** A full end-to-end path (one row in a scenario card) */
export interface TimelinePath {
  label: string;      // e.g. "Path A — Class II"
  subLabel: string;   // e.g. "Total ≈ 23 months"
  segments: BarSegment[];
  totalMonths: number;
  endTagLabel: string; // e.g. "✓ M+5"
  endTagColor: 'green' | 'amber';
}

/** One scenario card (one Design Transfer scenario) */
export interface ScenarioCard {
  badgeIndex: number;  // S1, S2, ...
  title: string;       // e.g. "Scenario 1 — Full Mirrored O'Hara DMR (18 months)"
  subTitle: string;
  day0Month: number;   // where Day 0 falls (= DT duration)
  totalMonths: number; // total width of the chart
  paths: TimelinePath[];
}
