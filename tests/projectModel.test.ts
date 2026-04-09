import { describe, it, expect } from 'vitest';
import {
  createDefaultProject,
  getMaxDuration,
  getTotalDuration,
  getTotalScenarios,
  formatDuration,
  createScenarioId,
  getDay0Month,
  formatAxisMonth,
  buildScenarioCards,
} from '../src/data/projectModel';
import type { ProjectData } from '../src/types';

function makeProject(): ProjectData {
  const project = createDefaultProject();
  // Design Transfer: 2 scenarios
  project.phases[0]!.scenarios = [
    { id: 'dt-1', description: 'Full DMR Mirror', turnoverTimeMonths: 18 },
    { id: 'dt-2', description: 'Minimum DMR Transfer', turnoverTimeMonths: 8 },
  ];
  // Type Testing: 1 scenario
  project.phases[1]!.scenarios = [
    { id: 'tt-1', description: 'Formal Type Testing', turnoverTimeMonths: 2 },
  ];
  // Submission & Approval: 2 scenarios
  project.phases[2]!.scenarios = [
    { id: 'sa-1', description: 'Class II Approval', turnoverTimeMonths: 1 },
    { id: 'sa-2', description: 'Class III Submission', turnoverTimeMonths: 12, extensionMonths: 3 },
  ];
  // Labelling: 1 scenario
  project.phases[3]!.scenarios = [
    { id: 'lr-1', description: 'Labelling & Shipment', turnoverTimeMonths: 2 },
  ];
  return project;
}

describe('projectModel', () => {
  describe('createDefaultProject', () => {
    it('should create a project with 4 phases and no scenarios', () => {
      const project = createDefaultProject();
      expect(project.phases).toHaveLength(4);
      for (const phase of project.phases) {
        expect(phase.scenarios).toHaveLength(0);
      }
    });

    it('should have distinct phase IDs', () => {
      const project = createDefaultProject();
      const ids = project.phases.map((p) => p.id);
      expect(new Set(ids).size).toBe(4);
    });
  });

  describe('createScenarioId', () => {
    it('should return unique IDs', () => {
      const id1 = createScenarioId();
      const id2 = createScenarioId();
      expect(id1).not.toBe(id2);
    });

    it('should start with sc-', () => {
      expect(createScenarioId()).toMatch(/^sc-/);
    });
  });

  describe('getMaxDuration', () => {
    it('should return 0 for empty scenarios', () => {
      const project = createDefaultProject();
      expect(getMaxDuration(project.phases[0]!)).toBe(0);
    });

    it('should return the longest scenario duration including extension', () => {
      const project = makeProject();
      expect(getMaxDuration(project.phases[0]!)).toBe(18); // Full DMR
      expect(getMaxDuration(project.phases[2]!)).toBe(15); // 12 + 3 extension
    });
  });

  describe('getTotalDuration', () => {
    it('should sum max durations across all phases', () => {
      const project = makeProject();
      // 18 + 2 + 15 + 2 = 37
      expect(getTotalDuration(project)).toBe(37);
    });

    it('should return 0 for empty project', () => {
      expect(getTotalDuration(createDefaultProject())).toBe(0);
    });
  });

  describe('getTotalScenarios', () => {
    it('should count all scenarios', () => {
      const project = makeProject();
      expect(getTotalScenarios(project)).toBe(6);
    });
  });

  describe('formatDuration', () => {
    it('should format single month', () => {
      expect(formatDuration(1)).toBe('1 month');
    });

    it('should format multiple months', () => {
      expect(formatDuration(6)).toBe('6 months');
      expect(formatDuration(18)).toBe('18 months');
    });
  });

  describe('getDay0Month', () => {
    it('should return the max duration of the first phase', () => {
      const project = makeProject();
      expect(getDay0Month(project)).toBe(18);
    });

    it('should return 0 when first phase has no scenarios', () => {
      expect(getDay0Month(createDefaultProject())).toBe(0);
    });
  });

  describe('formatAxisMonth', () => {
    it('should show relative labels when no kick-off', () => {
      expect(formatAxisMonth(0, 18)).toBe('M-18');
      expect(formatAxisMonth(18, 18)).toBe('Day 0');
      expect(formatAxisMonth(23, 18)).toBe('M+5');
    });

    it('should show calendar labels when kick-off provided', () => {
      expect(formatAxisMonth(0, 18, 2026, 1)).toBe('Jan 2026');
      expect(formatAxisMonth(18, 18, 2026, 1)).toBe('Jul 2027');
    });
  });

  describe('buildScenarioCards', () => {
    it('should produce one card per Design Transfer scenario', () => {
      const cards = buildScenarioCards(makeProject());
      expect(cards).toHaveLength(2);
      expect(cards[0]!.badgeIndex).toBe(1);
      expect(cards[1]!.badgeIndex).toBe(2);
    });

    it('should produce cartesian product paths within each card', () => {
      const cards = buildScenarioCards(makeProject());
      // 1 TT × 2 S&A × 1 L&R = 2 paths per card
      expect(cards[0]!.paths).toHaveLength(2);
      expect(cards[1]!.paths).toHaveLength(2);
    });

    it('should chain bars sequentially in each path', () => {
      const cards = buildScenarioCards(makeProject());
      const path1 = cards[0]!.paths[0]!; // DT 18mo -> TT 2mo -> S&A Class II 1mo -> L&R 2mo
      expect(path1.segments).toHaveLength(4);
      // DT starts at 0
      expect(path1.segments[0]!.startMonth).toBe(0);
      expect(path1.segments[0]!.widthMonths).toBe(18);
      // TT starts at 18
      expect(path1.segments[1]!.startMonth).toBe(18);
      expect(path1.segments[1]!.widthMonths).toBe(2);
      // S&A starts at 20
      expect(path1.segments[2]!.startMonth).toBe(20);
      expect(path1.segments[2]!.widthMonths).toBe(1);
      // L&R starts at 21
      expect(path1.segments[3]!.startMonth).toBe(21);
      expect(path1.segments[3]!.widthMonths).toBe(2);
      // Total = 23
      expect(path1.totalMonths).toBe(23);
    });

    it('should handle extension months with hatched bar', () => {
      const cards = buildScenarioCards(makeProject());
      const path2 = cards[0]!.paths[1]!; // DT 18mo -> TT 2mo -> S&A Class III 12+3mo -> L&R 2mo
      // Should have 5 segments: DT, TT, S&A base, S&A ext, L&R
      expect(path2.segments).toHaveLength(5);
      expect(path2.segments[2]!.widthMonths).toBe(12); // S&A best case
      expect(path2.segments[3]!.widthMonths).toBe(3);  // S&A extension
      expect(path2.segments[3]!.isExtension).toBe(true);
      // Total = 18 + 2 + 12 + 3 + 2 = 37
      expect(path2.totalMonths).toBe(37);
      expect(path2.endTagColor).toBe('amber');
    });

    it('should set day0Month to DT scenario duration', () => {
      const cards = buildScenarioCards(makeProject());
      expect(cards[0]!.day0Month).toBe(18);
      expect(cards[1]!.day0Month).toBe(8);
    });
  });
});
