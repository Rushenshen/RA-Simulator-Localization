import { useState, useCallback, useEffect } from 'react';
import type { ProjectData, SavedSimulation } from './types';
import { createDefaultProject, loadProject, saveProject, saveSimulation, loadHistory, deleteSimulation } from './data/projectModel';
import { IntakeSheet } from './components/IntakeSheet';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';

type Tab = 'intake' | 'dashboard' | 'history';

export function App() {
  const [project, setProject] = useState<ProjectData>(() => {
    return loadProject() ?? createDefaultProject();
  });
  const [activeTab, setActiveTab] = useState<Tab>('intake');
  const [history, setHistory] = useState<SavedSimulation[]>(() => loadHistory());

  useEffect(() => {
    saveProject(project);
  }, [project]);

  const handleProjectChange = useCallback((updater: (prev: ProjectData) => ProjectData) => {
    setProject(updater);
  }, []);

  const handleSave = useCallback(() => {
    const sim = saveSimulation(project);
    setHistory((prev) => [sim, ...prev]);
  }, [project]);

  const handleLoadSimulation = useCallback((sim: SavedSimulation) => {
    setProject(sim.projectData);
    setActiveTab('dashboard');
  }, []);

  const handleDeleteSimulation = useCallback((id: string) => {
    deleteSimulation(id);
    setHistory((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const hasData = project.phases.some((p) => p.scenarios.length > 0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 RA Strategy Simulator</h1>
        <p>Medical Device Registration Timeline Planning & Visualization</p>
      </header>

      <nav className="tab-nav" role="tablist">
        <button
          className={`tab-btn ${activeTab === 'intake' ? 'active' : ''}`}
          onClick={() => setActiveTab('intake')}
          role="tab"
          aria-selected={activeTab === 'intake'}
        >
          📝 Intake Sheet
        </button>
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          role="tab"
          aria-selected={activeTab === 'dashboard'}
        >
          📊 Executive Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          role="tab"
          aria-selected={activeTab === 'history'}
        >
          📂 Saved ({history.length})
        </button>
      </nav>

      {activeTab === 'intake' && (
        <IntakeSheet project={project} onChange={handleProjectChange} />
      )}
      {activeTab === 'dashboard' && (
        <Dashboard project={project} hasData={hasData} onSave={handleSave} />
      )}
      {activeTab === 'history' && (
        <History
          history={history}
          onLoad={handleLoadSimulation}
          onDelete={handleDeleteSimulation}
        />
      )}
    </div>
  );
}
