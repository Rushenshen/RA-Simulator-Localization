# ADR-001: Technical Decisions for RA Simulator China Localization

## Status
Accepted

---

## Decision 1: localStorage over Backend Storage

### Context
The simulator is a single-user planning tool for RA teams. We need to persist project configurations and saved simulations across browser sessions. Options: a backend API with database, or client-side localStorage.

### Decision
Use `localStorage` for all data persistence.

### Consequences
- **Positive**: Zero infrastructure/运维 cost; works offline; no auth/API complexity; instant read/write; no CORS or deployment concerns
- **Positive**: Perfectly suited for single-user tool where data doesn't need to be shared
- **Negative**: ~5 MB storage limit per origin — sufficient for this use case but not infinitely scalable
- **Negative**: Data is tied to a single browser; no cross-device sync
- **Negative**: If users clear browser data, saved simulations are lost (mitigated by PNG export)

---

## Decision 2: html2canvas for PNG Export

### Context
Users need to export the timeline visualization as a shareable PNG image for stakeholders who don't have access to the tool.

### Decision
Use `html2canvas` (v1.4.x) to capture DOM elements as PNG images.

### Consequences
- **Positive**: The only mature, well-maintained pure-frontend DOM-to-image solution; 4M+ weekly npm downloads
- **Positive**: No server-side rendering or headless browser dependency required
- **Positive**: Captures the exact visual output the user sees, including CSS styling
- **Negative**: Some CSS features (e.g., `backdrop-filter`, complex transforms) may not render perfectly
- **Negative**: Adds ~40 KB gzipped to the bundle — acceptable for the value it provides

---

## Decision 3: Cartesian Product Path Generation vs Manual Combination

### Context
The simulator has 4 phases (Design Transfer → Type Testing → Submission & Approval → Labelling & Release). Each phase can have multiple scenarios with different durations. Users need to see all possible end-to-end timelines.

### Decision
Automatically compute the Cartesian product of phase scenarios to generate all possible timeline paths.

### Consequences
- **Positive**: Users see every possible combination without manual assembly — reduces operational steps from O(n⁴) clicks to zero
- **Positive**: Ensures no scenario combination is accidentally missed
- **Positive**: Enables automatic "best case / worst case" range computation across all paths
- **Negative**: Path count grows multiplicatively (e.g., 2×3×2×2 = 24 paths) — UI must handle large path sets gracefully
- **Negative**: Not all combinations may be realistic in practice — users must interpret results contextually

---

## Decision 4: Pure CSS Timeline vs Recharts/D3

### Context
The core visualization is a horizontal stacked-bar timeline showing phase durations with Day 0 markers, relative/calendar labels, and extension indicators.

### Decision
Implement the timeline using pure CSS (flexbox + percentage widths + CSS custom properties) rather than a charting library like Recharts or D3.

### Consequences
- **Positive**: Eliminates Recharts dependency (~200 KB gzipped) — significantly smaller bundle size
- **Positive**: Pixel-level control over every visual detail (segment colors, labels, markers, extension hatching)
- **Positive**: No virtual DOM reconciliation overhead from chart library; CSS transitions are GPU-accelerated
- **Positive**: Timeline layout semantics map naturally to CSS flexbox — not fighting a chart library's abstractions
- **Negative**: More custom CSS code to maintain compared to declarative chart config
- **Negative**: If requirements evolve to need complex interactive charts (zoom, brush, tooltip hover), may need to revisit

---

## Decision 5: Per-Scenario Kickoff Date vs Global Kickoff

### Context
Each Design Transfer scenario represents a different possible starting point. The question is whether all scenarios share one global kickoff date, or each DT scenario has its own kickoff date.

### Decision
Support a per-scenario `kickoffDate` field on each Design Transfer scenario, rather than a single global date.

### Consequences
- **Positive**: Different DT scenarios may represent different product lines or transfer strategies with independent start times
- **Positive**: Calendar axis labels are computed per-card, accurately reflecting each scenario's real timeline
- **Positive**: More flexibility without additional UI complexity (just one date input per DT scenario)
- **Negative**: Slightly more complex date computation in `buildScenarioCards()` — each card resolves its own calendar labels independently
- **Negative**: Cross-card calendar comparison requires users to mentally account for different starting points
