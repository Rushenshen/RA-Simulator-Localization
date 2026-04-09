import { useState, useCallback, useEffect } from 'react';
import type { ProjectData } from './types';
import { createDefaultProject, loadProject, saveProject } from './data/projectModel';
import { IntakeSheet } from './components/IntakeSheet';
import { Dashboard } from './components/Dashboard';

type Tab = 'intake' | 'dashboard';

export function App() {
  const [project, setProject] = useState<ProjectData>(() => {
    return loadProject() ?? createDefaultProject();
  });
  const [activeTab, setActiveTab] = useState<Tab>('intake');

  useEffect(() => {
    saveProject(project);
  }, [project]);

  const handleProjectChange = useCallback((updater: (prev: ProjectData) => ProjectData) => {
    setProject(updater);
  }, []);

  const hasData = project.phases.some((p) => p.scenarios.length > 0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 Localization Simulator</h1>
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
      </nav>

      {activeTab === 'intake' && (
        <IntakeSheet project={project} onChange={handleProjectChange} />
      )}
      {activeTab === 'dashboard' && (
        <Dashboard project={project} hasData={hasData} />
      )}
    </div>
  );
}
