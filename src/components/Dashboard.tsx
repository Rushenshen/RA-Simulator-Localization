import { useRef, useCallback } from 'react';
import type { ProjectData } from '../types';
import { buildScenarioCards } from '../data/projectModel';
import { TimelineCard } from './TimelineCard';

interface DashboardProps {
  project: ProjectData;
  hasData: boolean;
  onSave: () => void;
}

export function Dashboard({ project, hasData, onSave }: DashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!dashboardRef.current) return;

    // Temporarily expand all scroll containers so html2canvas captures full width
    const container = dashboardRef.current;
    const scrollWraps = container.querySelectorAll<HTMLElement>('.sc-scroll-wrap');
    const savedStyles: { el: HTMLElement; overflow: string; width: string }[] = [];

    scrollWraps.forEach((sw) => {
      savedStyles.push({ el: sw, overflow: sw.style.overflow, width: sw.style.width });
      sw.style.overflow = 'visible';
      sw.style.width = `${sw.scrollWidth + 80}px`; // 80px extra right padding
    });

    // Also expand .sc-card overflow and set uniform white background
    const scCards = container.querySelectorAll<HTMLElement>('.sc-card');
    const savedCardStyles: { el: HTMLElement; overflow: string; minWidth: string }[] = [];

    // Find the widest scroll content across all cards
    let maxScrollWidth = 0;
    scrollWraps.forEach((sw) => {
      maxScrollWidth = Math.max(maxScrollWidth, sw.scrollWidth + 80);
    });

    scCards.forEach((c) => {
      savedCardStyles.push({ el: c, overflow: c.style.overflow, minWidth: c.style.minWidth });
      c.style.overflow = 'visible';
      c.style.minWidth = `${maxScrollWidth}px`;
    });

    // Measure actual full width after expansion
    const fullWidth = Math.max(container.scrollWidth, maxScrollWidth) + 40;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: fullWidth,
        windowWidth: fullWidth,
        scrollX: 0,
        scrollY: -window.scrollY,
        useCORS: true,
      });
      const projectName = project.projectName?.trim() || 'localization-timeline';
      const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const link = document.createElement('a');
      link.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      // Restore original styles
      savedStyles.forEach(({ el, overflow, width }) => {
        el.style.overflow = overflow;
        el.style.width = width;
      });
      savedCardStyles.forEach(({ el, overflow, minWidth }) => {
        el.style.overflow = overflow;
        el.style.minWidth = minWidth;
      });
    }
  }, [project.projectName]);

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
        {project.projectName && (
          <div className="sc-project-name">{project.projectName}</div>
        )}
        <h2 className="sc-page-title">RA Strategy Simulator Dashboard</h2>
        <p className="sc-page-sub">Regulatory Timeline Overview</p>
        <div className="sc-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            📷 Export as PNG
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            💾 Save Simulation
          </button>
        </div>
      </div>

      <div ref={dashboardRef} style={{ padding: '4px' }}>
        {project.projectName && (
          <div className="sc-export-project-name">{project.projectName}</div>
        )}
        {cards.map((card) => (
          <TimelineCard
            key={card.badgeIndex}
            card={card}
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
