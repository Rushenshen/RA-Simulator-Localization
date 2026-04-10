import type { ProjectData, Phase, Scenario } from '../types';
import { createScenarioId } from '../data/projectModel';

interface IntakeSheetProps {
  project: ProjectData;
  onChange: (updater: (prev: ProjectData) => ProjectData) => void;
}

export function IntakeSheet({ project, onChange }: IntakeSheetProps) {
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
    field: keyof Pick<Scenario, 'description' | 'turnoverTimeMonths' | 'extensionMonths' | 'kickoffDate'>,
    value: string | number | undefined,
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
      {/* Project Name */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📁 Project Name</h2>
        </div>
        <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
          <input
            className="project-name-input"
            type="text"
            placeholder="e.g. Centargo China Localization"
            value={project.projectName ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onChange((prev) => ({ ...prev, projectName: v || undefined }));
            }}
            aria-label="Project name"
          />
        </div>
      </div>

      {/* Kick-off date info banner */}
      <div className="card kickoff-card">
        <div className="card-header">
          <h2 className="card-title">🗓️ Project Kick-Off Date</h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Optional — set per Design Transfer scenario below to show actual calendar dates
          </span>
        </div>
        <p style={{ padding: '0 var(--space-4) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Each Design Transfer scenario can have its own kick-off date. If set, the timeline will display
          both relative months (M-18 … Day 0 … M+6) and actual calendar dates. Leave blank for relative-only display.
        </p>
      </div>

      {project.phases.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          isDT={phase.id === 'design-transfer'}
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
  isDT: boolean;
  onAdd: () => void;
  onRemove: (scenarioId: string) => void;
  onUpdate: (
    scenarioId: string,
    field: keyof Pick<Scenario, 'description' | 'turnoverTimeMonths' | 'extensionMonths' | 'kickoffDate'>,
    value: string | number | undefined,
  ) => void;
}

function PhaseCard({ phase, isDT, onAdd, onRemove, onUpdate }: PhaseCardProps) {
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
          <div className="scenario-row scenario-row-wrap" key={scenario.id}>
            <div className="scenario-row-main">
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
            {isDT && (
              <div className="scenario-kickoff-row">
                <label className="kickoff-inline-label">
                  <span className="kickoff-inline-icon">📅</span>
                  Kick-off Date
                  <input
                    className="kickoff-month-input"
                    type="month"
                    value={scenario.kickoffDate ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      onUpdate(scenario.id, 'kickoffDate', v || undefined);
                    }}
                    aria-label={`Scenario ${index + 1} kick-off date`}
                  />
                </label>
                <span className="kickoff-hint">
                  {scenario.kickoffDate
                    ? 'Timeline will show calendar dates'
                    : 'Optional — leave blank for relative display'}
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
