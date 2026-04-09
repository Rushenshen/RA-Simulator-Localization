import type { ProjectData, Phase, Scenario } from '../types';
import { createScenarioId } from '../data/projectModel';

interface IntakeSheetProps {
  project: ProjectData;
  onChange: (updater: (prev: ProjectData) => ProjectData) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function IntakeSheet({ project, onChange }: IntakeSheetProps) {
  const updateKickOff = (field: 'kickOffYear' | 'kickOffMonth', value: number | undefined) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  const addScenario = (phaseId: string) => {
    onChange((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              scenarios: [
                ...phase.scenarios,
                { id: createScenarioId(), description: '', turnoverTimeMonths: 0, extensionMonths: 0 },
              ],
            }
          : phase,
      ),
    }));
  };

  const removeScenario = (phaseId: string, scenarioId: string) => {
    onChange((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) =>
        phase.id === phaseId
          ? { ...phase, scenarios: phase.scenarios.filter((s) => s.id !== scenarioId) }
          : phase,
      ),
    }));
  };

  const updateScenario = (
    phaseId: string,
    scenarioId: string,
    field: keyof Pick<Scenario, 'description' | 'turnoverTimeMonths' | 'extensionMonths'>,
    value: string | number,
  ) => {
    onChange((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              scenarios: phase.scenarios.map((s) =>
                s.id === scenarioId ? { ...s, [field]: value } : s,
              ),
            }
          : phase,
      ),
    }));
  };

  return (
    <div>
      {/* Kick-off date */}
      <div className="card kickoff-card">
        <div className="card-header">
          <h2 className="card-title">🗓️ Project Kick-Off Date</h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Optional — leave blank to show relative timeline from Day 0
          </span>
        </div>
        <div className="kickoff-inputs">
          <label className="kickoff-label">
            Year
            <input
              className="kickoff-input"
              type="number"
              min={2020}
              max={2040}
              placeholder="e.g. 2026"
              value={project.kickOffYear ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                updateKickOff('kickOffYear', Number.isNaN(v) ? undefined : v);
              }}
            />
          </label>
          <label className="kickoff-label">
            Month
            <select
              className="kickoff-input"
              value={project.kickOffMonth ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                updateKickOff('kickOffMonth', Number.isNaN(v) ? undefined : v);
              }}
            >
              <option value="">—</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </label>
          {project.kickOffYear && project.kickOffMonth && (
            <span className="kickoff-preview">
              Kick-off: {MONTHS[project.kickOffMonth - 1]} {project.kickOffYear}
            </span>
          )}
        </div>
      </div>

      {project.phases.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          onAdd={() => addScenario(phase.id)}
          onRemove={(scenarioId) => removeScenario(phase.id, scenarioId)}
          onUpdate={(scenarioId, field, value) =>
            updateScenario(phase.id, scenarioId, field, value)
          }
        />
      ))}
    </div>
  );
}

interface PhaseCardProps {
  phase: Phase;
  onAdd: () => void;
  onRemove: (scenarioId: string) => void;
  onUpdate: (
    scenarioId: string,
    field: keyof Pick<Scenario, 'description' | 'turnoverTimeMonths' | 'extensionMonths'>,
    value: string | number,
  ) => void;
}

function PhaseCard({ phase, onAdd, onRemove, onUpdate }: PhaseCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <span className="phase-dot" style={{ backgroundColor: phase.color }} />
          {phase.name}
        </h2>
        <button className="btn btn-primary" onClick={onAdd} aria-label={`Add scenario to ${phase.name}`}>
          + Add Scenario
        </button>
      </div>

      {phase.scenarios.length === 0 ? (
        <div className="scenario-empty">
          No scenarios yet. Click &quot;+ Add Scenario&quot; to begin.
        </div>
      ) : (
        phase.scenarios.map((scenario, index) => (
          <div className="scenario-row" key={scenario.id}>
            <span className="scenario-num">#{index + 1}</span>
            <input
              className="desc-input"
              type="text"
              placeholder="Short description of this scenario..."
              value={scenario.description}
              onChange={(e) => onUpdate(scenario.id, 'description', e.target.value)}
              aria-label={`Scenario ${index + 1} description`}
            />
            <input
              className="days-input"
              type="number"
              min={0}
              placeholder="Months"
              value={scenario.turnoverTimeMonths || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate(scenario.id, 'turnoverTimeMonths', Number.isNaN(val) ? 0 : Math.max(0, val));
              }}
              aria-label={`Scenario ${index + 1} turnover time in months`}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>months</span>
            <input
              className="ext-input"
              type="number"
              min={0}
              placeholder="Ext."
              value={scenario.extensionMonths || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate(scenario.id, 'extensionMonths', Number.isNaN(val) ? 0 : Math.max(0, val));
              }}
              aria-label={`Scenario ${index + 1} extension months`}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>ext.</span>
            <button
              className="btn btn-icon"
              onClick={() => onRemove(scenario.id)}
              aria-label={`Remove scenario ${index + 1}`}
              title="Remove scenario"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}
