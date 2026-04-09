import { useRef, useCallback } from 'react';
import type { ProjectData } from '../types';
import { buildScenarioCards } from '../data/projectModel';
import { TimelineCard } from './TimelineCard';

interface DashboardProps {
  project: ProjectData;
  hasData: boolean;
}

export function Dashboard({ project, hasData }: DashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!dashboardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#f0f2f5',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `localization-timeline-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Export failed. Please try again.');
    }
  }, []);

  if (!hasData) {
    return (
      <div className="empty-state">
        <h3>No Data Yet</h3>
        <p>Switch to the Intake Sheet tab and add scenarios to see the timeline visualization.</p>
      </div>
    );
  }

  const cards = buildScenarioCards(project);

  return (
    <div>
      <div className="sc-page-header">
        <h2 className="sc-page-title">Localization Feasibility Assessment</h2>
        <p className="sc-page-sub">Regulatory Timeline Overview</p>
        <button className="btn btn-secondary" onClick={handleExport} style={{ marginTop: 8 }}>
          📷 Export as PNG
        </button>
      </div>

      <div ref={dashboardRef} style={{ padding: '4px' }}>
        {cards.map((card) => (
          <TimelineCard
            key={card.badgeIndex}
            card={card}
            kickOffYear={project.kickOffYear}
            kickOffMonth={project.kickOffMonth}
          />
        ))}

        {/* Note box */}
        <div className="sc-note-box">
          <strong>📌 Note:</strong> If the product can be successfully accepted under a{' '}
          <em>simplified regulatory approach</em>, the Best-case timeline for Submission &amp;
          Approval could potentially be shortened.
        </div>
      </div>
    </div>
  );
}
