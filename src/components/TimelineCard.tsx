import type { ScenarioCard, TimelinePath, BarSegment } from '../types';
import { formatAxisMonth } from '../data/projectModel';

const PX_PER_MONTH = 48;
const LC_WIDTH = 180;
const BAR_TOP = 13;
const BAR_HEIGHT = 26;

interface TimelineCardProps {
  card: ScenarioCard;
  kickOffYear?: number;
  kickOffMonth?: number;
}

const BADGE_COLORS = ['#64748b', '#7c3aed', '#3b82f6', '#0d9488', '#f59e0b'];

export function TimelineCard({ card, kickOffYear, kickOffMonth }: TimelineCardProps) {
  const { day0Month, totalMonths, paths, badgeIndex, title, subTitle } = card;
  const bcWidth = (totalMonths + 2) * PX_PER_MONTH; // +2 for padding on right
  const badgeColor = BADGE_COLORS[(badgeIndex - 1) % BADGE_COLORS.length];

  const fmtMonth = (m: number) => formatAxisMonth(m, day0Month, kickOffYear, kickOffMonth);

  return (
    <div className="sc-card">
      {/* Header */}
      <div className="sc-header">
        <div className="sc-title">
          <span className="sc-badge" style={{ background: badgeColor }}>S{badgeIndex}</span>
          {title}
        </div>
        <div className="sc-desc">{subTitle}</div>
      </div>

      {/* Scrollable timeline area */}
      <div className="sc-scroll-wrap">
        <div className="sc-timeline" style={{ minWidth: LC_WIDTH + bcWidth + 20 }}>
          {/* Day 0 vertical line */}
          {day0Month > 0 && (
            <div
              className="sc-d0v"
              style={{ left: LC_WIDTH + day0Month * PX_PER_MONTH }}
            />
          )}

          {/* Grid lines every 3 months */}
          {Array.from({ length: Math.ceil((totalMonths + 2) / 3) + 1 }, (_, i) => i * 3)
            .filter((m) => m !== day0Month && m <= totalMonths + 2)
            .map((m) => (
              <div
                key={`grid-${m}`}
                className="sc-gvl"
                style={{ left: LC_WIDTH + m * PX_PER_MONTH }}
              />
            ))}

          {/* Milestone row */}
          {day0Month > 0 && (
            <div className="sc-ms-row">
              <div className="sc-lc" style={{ width: LC_WIDTH }} />
              <div className="sc-bc" style={{ width: bcWidth, position: 'relative' }}>
                <div
                  className="sc-ms-badge"
                  style={{ left: day0Month * PX_PER_MONTH }}
                >
                  ◆ Day 0 — GMP Compliance Sample Release
                </div>
              </div>
            </div>
          )}

          {/* Axis row */}
          <AxisRow
            totalMonths={totalMonths + 2}
            day0Month={day0Month}
            bcWidth={bcWidth}
            lcWidth={LC_WIDTH}
            fmtMonth={fmtMonth}
            kickOffYear={kickOffYear}
          />

          {/* Spacer */}
          <div style={{ height: 6 }} />

          {/* Data rows */}
          {paths.map((path, idx) => (
            <PathRow
              key={idx}
              path={path}
              bcWidth={bcWidth}
              lcWidth={LC_WIDTH}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <Legend segments={paths[0]?.segments ?? []} />
    </div>
  );
}

/* ---- Axis Row ---- */
function AxisRow({
  totalMonths,
  day0Month,
  bcWidth,
  lcWidth,
  fmtMonth,
  kickOffYear: _kickOffYear,
}: {
  totalMonths: number;
  day0Month: number;
  bcWidth: number;
  lcWidth: number;
  fmtMonth: (m: number) => string;
  kickOffYear?: number;
}) {
  return (
    <div className="sc-ax-row">
      <div className="sc-lc" style={{ width: lcWidth }}>
        <span className="sc-ax-label">Months</span>
      </div>
      <div className="sc-bc sc-ax-bc" style={{ width: bcWidth, position: 'relative' }}>
        {Array.from({ length: totalMonths + 1 }, (_, m) => m).map((m) => {
          const isMajor = m % 3 === 0;
          const isD0 = m === day0Month;
          const showLabel = isD0 || isMajor;

          return (
            <div
              key={m}
              className={`sc-tk ${isD0 ? 'sc-tk-d0' : isMajor ? 'sc-tk-mj' : ''}`}
              style={{ left: m * PX_PER_MONTH }}
            >
              <span className="sc-tk-t">
                {showLabel ? fmtMonth(m) : ''}
              </span>
              <span className="sc-tk-l" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Path Row (one row of chained bars) ---- */
function PathRow({
  path,
  bcWidth,
  lcWidth,
}: {
  path: TimelinePath;
  bcWidth: number;
  lcWidth: number;
}) {
  return (
    <div className="sc-dr">
      <div className="sc-lc" style={{ width: lcWidth }}>
        <div className="sc-lm">{path.label}</div>
        <div className="sc-ls">{path.subLabel}</div>
      </div>
      <div className="sc-bc" style={{ width: bcWidth, position: 'relative', height: 52 }}>
        {path.segments.map((seg, idx) => {
          const isFirst = idx === 0;
          // Bar border radius control
          const nextIsExt = path.segments[idx + 1]?.isExtension;

          let cls = 'sc-bar';
          if (seg.isExtension) cls += ' sc-bar-hatched';
          if (!isFirst && !seg.isExtension && path.segments[idx - 1]?.isExtension) cls += ' sc-bar-no-lr';
          if (seg.isExtension) cls += ' sc-bar-no-lr';
          if (nextIsExt) cls += ' sc-bar-no-rr';

          return (
            <div
              key={idx}
              className={cls}
              style={{
                left: seg.startMonth * PX_PER_MONTH,
                width: seg.widthMonths * PX_PER_MONTH,
                top: BAR_TOP,
                height: BAR_HEIGHT,
                background: seg.isExtension
                  ? `repeating-linear-gradient(45deg, #fbbf24 0px, #fbbf24 5px, #fde68a 5px, #fde68a 10px)`
                  : seg.color,
                color: seg.isExtension ? '#78350f' : '#fff',
              }}
              title={seg.label}
            >
              {seg.label}
            </div>
          );
        })}

        {/* End tag */}
        {path.totalMonths > 0 && (
          <div
            className={`sc-end-tag ${path.endTagColor === 'green' ? 'sc-end-tag-green' : 'sc-end-tag-amber'}`}
            style={{
              left: path.totalMonths * PX_PER_MONTH + 6,
              top: BAR_TOP + BAR_HEIGHT + 4,
              position: 'absolute',
            }}
          >
            {path.endTagLabel}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Legend ---- */
function Legend({ segments }: { segments: BarSegment[] }) {
  // Deduplicate by phaseShortName + isExtension
  const seen = new Set<string>();
  const items: { label: string; color: string; isExtension: boolean }[] = [];

  for (const seg of segments) {
    const key = `${seg.phaseShortName}-${seg.isExtension ?? false}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      label: seg.isExtension
        ? `${seg.phaseShortName} Extension (Base)`
        : `${seg.phaseShortName}`,
      color: seg.color,
      isExtension: seg.isExtension ?? false,
    });
  }

  // Always add Day 0
  items.push({ label: 'Day 0 Milestone', color: '#dc2626', isExtension: false });

  return (
    <div className="sc-legend">
      <div className="sc-leg-title">Legend:</div>
      {items.map((it, i) => (
        <div key={i} className="sc-leg-item">
          <div
            className="sc-swatch"
            style={
              it.isExtension
                ? { background: 'repeating-linear-gradient(45deg, #fbbf24 0px, #fbbf24 2px, #fde68a 2px, #fde68a 4px)' }
                : { background: it.color }
            }
          />
          {it.label}
        </div>
      ))}
    </div>
  );
}
