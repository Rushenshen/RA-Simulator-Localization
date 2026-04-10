import type { SavedSimulation } from '../types';

interface HistoryProps {
  history: SavedSimulation[];
  onLoad: (sim: SavedSimulation) => void;
  onDelete: (id: string) => void;
}

export function History({ history, onLoad, onDelete }: HistoryProps) {
  if (history.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Saved Simulations</h3>
        <p>Go to the Executive Dashboard and click "💾 Save Simulation" to save your current configuration.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📂 Saved Simulations</h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {history.length} saved
          </span>
        </div>

        <div className="history-list">
          {history.map((sim) => {
            const scenarioCount = sim.projectData.phases.reduce(
              (sum, p) => sum + p.scenarios.length,
              0,
            );
            const savedDate = new Date(sim.savedAt);

            return (
              <div key={sim.id} className="history-item">
                <div className="history-info">
                  <div className="history-name">{sim.name}</div>
                  <div className="history-meta">
                    {savedDate.toLocaleDateString()} {savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {scenarioCount} scenario{scenarioCount !== 1 ? 's' : ''}
                    {sim.projectData.projectName && (
                      <> · <strong>{sim.projectData.projectName}</strong></>
                    )}
                  </div>
                </div>
                <div className="history-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => onLoad(sim)}
                    title="Load this simulation"
                  >
                    Load
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={() => {
                      if (window.confirm('Delete this saved simulation? This cannot be undone.')) {
                        onDelete(sim.id);
                      }
                    }}
                    title="Delete this simulation"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
