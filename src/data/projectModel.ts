import type { Phase, ProjectData, ScenarioCard, TimelinePath, BarSegment, Scenario, SavedSimulation } from '../types';

/** Phase bar colors matching the reference design */
const PHASE_COLORS: Record<string, string> = {
  'design-transfer': '#6b7280',  // grey (default, overridden per scenario card)
  'type-testing': '#3b82f6',     // blue
  'submission-approval': '#f59e0b', // amber
  'labelling-release': '#0d9488',   // teal
};

/** Alternate DT colors per card index */
const DT_CARD_COLORS = ['#6b7280', '#7c3aed', '#3b82f6', '#0d9488', '#f59e0b'];

const PHASE_DEFINITIONS: Pick<Phase, 'id' | 'name' | 'shortName' | 'color'>[] = [
  { id: 'design-transfer', name: 'Pre-Day 0 Design Transfer', shortName: 'Design Transfer', color: '#6b7280' },
  { id: 'type-testing', name: 'Type Testing', shortName: 'Type Testing', color: '#3b82f6' },
  { id: 'submission-approval', name: 'Submission and Approval', shortName: 'Submission & Approval', color: '#f59e0b' },
  { id: 'labelling-release', name: 'Labelling Release Ready for Shipment', shortName: 'Labelling & Release', color: '#0d9488' },
];

export function createDefaultProject(): ProjectData {
  return {
    phases: PHASE_DEFINITIONS.map((def) => ({
      ...def,
      scenarios: [],
    })),
  };
}

export function createScenarioId(): string {
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const STORAGE_KEY = 'localization-simulator-data';

export function saveProject(data: ProjectData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

export function loadProject(): ProjectData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'phases' in (parsed as Record<string, unknown>)) {
      return parsed as ProjectData;
    }
    return null;
  } catch {
    return null;
  }
}

export function getMaxDuration(phase: Phase): number {
  if (phase.scenarios.length === 0) return 0;
  return Math.max(...phase.scenarios.map((s) => s.turnoverTimeMonths + (s.extensionMonths ?? 0)));
}

/* ---- Calendar helpers ---- */

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function parseKickoffDate(s: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(s);
  if (!match) return null;
  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function addMonths(year: number, month: number, count: number): { year: number; month: number } {
  const total = (year * 12) + (month - 1) + count;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function formatFullMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Relative axis label: M-18 … Day 0 … M+6 */
export function formatRelativeMonth(absoluteMonth: number, day0Month: number): string {
  const rel = absoluteMonth - day0Month;
  if (rel === 0) return 'Day 0';
  return rel > 0 ? `M+${rel}` : `M${rel}`;
}

/** Calendar axis label: Jan'25, Apr'25, ... */
export function formatCalendarAxisMonth(
  absoluteMonth: number,
  kickoffYear: number,
  kickoffMonth: number,
): string {
  const d = addMonths(kickoffYear, kickoffMonth, absoluteMonth);
  return `${MONTH_ABBR[d.month - 1]}'${String(d.year).slice(-2)}`;
}

/**
 * Build ScenarioCards: one card per Design Transfer scenario.
 * Each card contains paths = cartesian product of downstream phase scenarios.
 * Each path = one row of chained bars (DT → TT → S&A → L&R).
 */
export function buildScenarioCards(project: ProjectData): ScenarioCard[] {
  const [dtPhase, ttPhase, saPhase, lrPhase] = project.phases;
  if (!dtPhase || !ttPhase || !saPhase || !lrPhase) return [];

  const dtScenarios = dtPhase.scenarios.length > 0 ? dtPhase.scenarios : [{ id: '_empty_dt', description: 'No DT', turnoverTimeMonths: 0 } as Scenario];
  const ttScenarios = ttPhase.scenarios.length > 0 ? ttPhase.scenarios : [{ id: '_empty_tt', description: 'No TT', turnoverTimeMonths: 0 } as Scenario];
  const saScenarios = saPhase.scenarios.length > 0 ? saPhase.scenarios : [{ id: '_empty_sa', description: 'No S&A', turnoverTimeMonths: 0 } as Scenario];
  const lrScenarios = lrPhase.scenarios.length > 0 ? lrPhase.scenarios : [{ id: '_empty_lr', description: 'No L&R', turnoverTimeMonths: 0 } as Scenario];

  const cards: ScenarioCard[] = [];

  dtScenarios.forEach((dtSc, dtIdx) => {
    const dtDuration = dtSc.turnoverTimeMonths;
    const dtColor = DT_CARD_COLORS[dtIdx % DT_CARD_COLORS.length]!;
    const day0Month = dtDuration;

    // Parse per-scenario kickoff date
    const kickoff = dtSc.kickoffDate ? parseKickoffDate(dtSc.kickoffDate) : null;

    // Cartesian product of downstream phases
    const paths: TimelinePath[] = [];
    let pathIdx = 0;

    for (const ttSc of ttScenarios) {
      for (const saSc of saScenarios) {
        for (const lrSc of lrScenarios) {
          pathIdx++;
          const segments: BarSegment[] = [];
          let cursor = 0;

          // DT bar
          if (dtDuration > 0) {
            segments.push({
              phaseShortName: dtPhase.shortName,
              color: dtColor,
              startMonth: cursor,
              widthMonths: dtDuration,
              label: `${dtSc.description || dtPhase.shortName} ${dtDuration}mo`,
            });
            cursor += dtDuration;
          }

          // TT bar
          const ttDur = ttSc.turnoverTimeMonths;
          if (ttDur > 0) {
            segments.push({
              phaseShortName: ttPhase.shortName,
              color: PHASE_COLORS['type-testing']!,
              startMonth: cursor,
              widthMonths: ttDur,
              label: `${ttPhase.shortName} ${ttDur}mo`,
            });
            cursor += ttDur;
          }

          // S&A bar (with optional extension)
          const saDur = saSc.turnoverTimeMonths;
          const saExt = saSc.extensionMonths ?? 0;
          if (saDur > 0) {
            segments.push({
              phaseShortName: saPhase.shortName,
              color: PHASE_COLORS['submission-approval']!,
              startMonth: cursor,
              widthMonths: saDur,
              label: saExt > 0
                ? `${saSc.description || 'S&A'} ${saDur}mo (Best)`
                : `${saSc.description || 'S&A'} ${saDur}mo`,
              isExtension: false,
            });
            cursor += saDur;
          }
          if (saExt > 0) {
            segments.push({
              phaseShortName: saPhase.shortName,
              color: PHASE_COLORS['submission-approval']!,
              startMonth: cursor,
              widthMonths: saExt,
              label: `+${saExt}mo (Base)`,
              isExtension: true,
            });
            cursor += saExt;
          }

          // L&R bar
          const lrDur = lrSc.turnoverTimeMonths;
          if (lrDur > 0) {
            segments.push({
              phaseShortName: lrPhase.shortName,
              color: PHASE_COLORS['labelling-release']!,
              startMonth: cursor,
              widthMonths: lrDur,
              label: `${lrPhase.shortName} ${lrDur}mo`,
            });
            cursor += lrDur;
          }

          const totalMonths = cursor;
          const relEnd = totalMonths - day0Month;
          const hasExtension = saExt > 0;

          // Build path label from descriptions
          const descParts = [ttSc, saSc, lrSc]
            .filter((s) => s.description)
            .map((s) => s.description);
          const pathLabel = descParts.length > 0
            ? `Path ${String.fromCharCode(65 + pathIdx - 1)} — ${descParts.join(' + ')}`
            : `Path ${String.fromCharCode(65 + pathIdx - 1)}`;

          // Calendar end label if kickoff is set
          let endCalendarLabel: string | undefined;
          if (kickoff) {
            const endDate = addMonths(kickoff.year, kickoff.month, totalMonths);
            endCalendarLabel = `${MONTH_ABBR[endDate.month - 1]} ${endDate.year}`;
          }

          paths.push({
            label: pathLabel,
            subLabel: `Total ≈ ${totalMonths} months`,
            segments,
            totalMonths,
            endTagLabel: relEnd > 0
              ? `✓ M+${relEnd}${hasExtension ? ' (Base)' : ''}`
              : `✓ M0`,
            endTagColor: hasExtension ? 'amber' : 'green',
            endCalendarLabel,
          });
        }
      }
    }

    // Find the max total months across all paths for this card
    const cardTotalMonths = Math.max(...paths.map((p) => p.totalMonths), day0Month + 1);

    // Compute card-level calendar properties
    let kickoffCalendarLabel: string | undefined;
    let day0CalendarLabel: string | undefined;
    let completionRange: string | undefined;

    if (kickoff) {
      kickoffCalendarLabel = formatFullMonth(kickoff.year, kickoff.month);
      const d0 = addMonths(kickoff.year, kickoff.month, dtDuration);
      day0CalendarLabel = formatFullMonth(d0.year, d0.month);

      const endMonthsList = paths.map((p) => p.totalMonths);
      const minEnd = Math.min(...endMonthsList);
      const maxEnd = Math.max(...endMonthsList);
      const minDate = addMonths(kickoff.year, kickoff.month, minEnd);
      const maxDate = addMonths(kickoff.year, kickoff.month, maxEnd);
      completionRange = minEnd === maxEnd
        ? formatFullMonth(minDate.year, minDate.month)
        : `${formatFullMonth(minDate.year, minDate.month)} – ${formatFullMonth(maxDate.year, maxDate.month)}`;
    }

    cards.push({
      badgeIndex: dtIdx + 1,
      title: `Scenario ${dtIdx + 1} — ${dtSc.description || 'Design Transfer'} (${dtDuration} months pre-Day 0)`,
      subTitle: dtDuration > 0
        ? `Kicks off first. ${dtSc.description || 'Design Transfer'} takes ${dtDuration} months before GMP compliance sample release.`
        : 'No Design Transfer phase configured.',
      day0Month,
      totalMonths: cardTotalMonths,
      paths,
      kickoffDate: dtSc.kickoffDate,
      kickoffCalendarLabel,
      day0CalendarLabel,
      completionRange,
    });
  });

  return cards;
}

export function getTotalDuration(project: ProjectData): number {
  return project.phases.reduce((sum, phase) => sum + getMaxDuration(phase), 0);
}

export function getTotalScenarios(project: ProjectData): number {
  return project.phases.reduce((sum, phase) => sum + phase.scenarios.length, 0);
}

export function formatDuration(months: number): string {
  if (months === 1) return '1 month';
  return `${months} months`;
}

/**
 * Day 0 = the cumulative month where phase 1 (Design Transfer) ends.
 * Everything before Day 0 is "pre-Day 0"; everything after is "post-Day 0".
 */
export function getDay0Month(project: ProjectData): number {
  return getMaxDuration(project.phases[0]!);
}

/**
 * Legacy axis formatter — kept for backward compatibility with existing tests.
 * For new code, use formatRelativeMonth / formatCalendarAxisMonth.
 */
export function formatAxisMonth(
  absoluteMonth: number,
  day0Month: number,
  kickOffYear?: number,
  kickOffMonth?: number,
): string {
  if (kickOffYear && kickOffMonth) {
    const totalMonths = (kickOffYear * 12 + (kickOffMonth - 1)) + absoluteMonth;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return `${MONTH_ABBR[m]} ${y}`;
  }
  // Relative to Day 0
  const rel = absoluteMonth - day0Month;
  if (rel === 0) return 'Day 0';
  return rel > 0 ? `M+${rel}` : `M${rel}`;
}

/* ---- Simulation History ---- */

const HISTORY_KEY = 'localization-simulator-history';

export function loadHistory(): SavedSimulation[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as SavedSimulation[];
    return [];
  } catch {
    return [];
  }
}

function persistHistory(history: SavedSimulation[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // silent fail
  }
}

export function saveSimulation(project: ProjectData): SavedSimulation {
  const history = loadHistory();
  const name = project.projectName?.trim()
    ? `${project.projectName} — ${new Date().toLocaleString()}`
    : `Simulation — ${new Date().toLocaleString()}`;
  const sim: SavedSimulation = {
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    savedAt: new Date().toISOString(),
    projectData: structuredClone(project),
  };
  history.unshift(sim); // newest first
  persistHistory(history);
  return sim;
}

export function deleteSimulation(id: string): void {
  const history = loadHistory().filter((s) => s.id !== id);
  persistHistory(history);
}

export function clearHistory(): void {
  persistHistory([]);
}
