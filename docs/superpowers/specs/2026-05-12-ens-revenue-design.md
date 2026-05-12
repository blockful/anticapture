# ENS Revenue Page — Design Spec

**Date:** 2026-05-12
**ClickUp:** https://app.clickup.com/t/86af1vzrr
**Figma:** https://www.figma.com/design/mUgy2KpQ3gJ07yZaUaXu8l/%F0%9F%9B%B0%EF%B8%8F-Product-Design?node-id=2753-61656
**Approach:** A — Two focused DS chart components + `Card` + feature module
**Status:** Approved, ready for implementation

---

## Overview

Add a `/revenue` route to the ENS whitelabel governance portal. It is a read-only financial intelligence screen surfacing ENS protocol revenue by stream, registration and renewal activity over time, name retention health, and expiration risk. Data is static mock data for v1; the backend is under construction.

---

## New Design System Components

### `Card`

**Path:** `shared/components/design-system/cards/card/`

Non-clickable card container. Renders as a `div` (not a `button`) with:

- `bg-surface-default border border-border-default rounded-lg`
- Props: `className?: string`, `children: ReactNode`
- No hover, focus, or disabled states
- Exports: `Card` component + `Card.figma.tsx` Code Connect mapping

Rationale: `ClickableCard` renders as `<button>` with hover/focus/disabled states. The Revenue cards are display-only — wrong semantics for a non-interactive container.

### `StackedBarChart`

**Path:** `shared/components/design-system/charts/stacked-bar-chart/`

ECharts stacked bar chart. Uses `echarts-for-react` (`ReactECharts`).

Props:

```ts
type StackedBarChartSeries = {
  name: string;
  data: number[];
  color: string;
};

type StackedBarChartProps = {
  series: StackedBarChartSeries[];
  xAxisLabels: string[];
  yAxisFormatter?: (value: number) => string;
  height?: number;
  className?: string;
};
```

Behavior:

- Bars stack bottom-to-top in `series` order
- Legend renders horizontally below chart — each entry: 8px filled square (2px radius) + label
- Tooltip shows breakdown per bar on hover
- Legend-click toggles series visibility (ECharts built-in)
- Gridline color: `#e4e4e7`, axis label color: `#a1a1aa`, font: Inter 12px
- Responsive: `style={{ width: '100%' }}`

Used by: Monthly Revenue by Stream, Upcoming Expirations

### `ComboChart`

**Path:** `shared/components/design-system/charts/combo-chart/`

ECharts combination chart: bar series + line series on the same axis.

Props:

```ts
type ComboChartBarSeries = {
  name: string;
  data: number[];
  color: string;
};

type ComboChartLineSeries = {
  name: string;
  data: number[];
  color: string;
};

type ComboChartProps = {
  barSeries: ComboChartBarSeries[];
  lineSeries: ComboChartLineSeries[];
  xAxisLabels: string[];
  yAxisFormatter?: (value: number) => string;
  height?: number;
  className?: string;
};
```

Behavior:

- Line series renders on top of bars
- Legend: line indicator (8px horizontal stroke, 2px thick) for line series; filled 8px square dot for bar series
- Same gridline/axis/tooltip/toggle behavior as `StackedBarChart`

Used by: Name Growth & Churn, New Users Entering ENS

**Dependencies to add to `apps/dashboard/package.json`:**

- `echarts`
- `echarts-for-react`

---

## Feature Module

**Path:** `features/revenue/`

```
features/revenue/
├── components/
│   ├── RevenueOverviewCard.tsx
│   ├── MonthlyRevenueChart.tsx
│   ├── KpiRow.tsx
│   ├── NameGrowthChart.tsx
│   ├── NewUsersChart.tsx
│   ├── UpcomingExpirationsChart.tsx
│   ├── RenewalRateCohort.tsx
│   └── DataProvenance.tsx
├── data/
│   └── mock.ts
└── index.tsx
```

### `mock.ts`

Exports typed constants matching ClickUp spec exactly:

- `REVENUE_OVERVIEW` — total ($127.3M), YTD ($3.2M), three streams with accent colors, dollar amounts, share %, volume, avg revenue
- `MONTHLY_REVENUE_SERIES` — annual stacked bar data 2019–2025 for Registration/Renewals/Premium
- `KPI_DATA` — four KPI cards with values and trend text
- `NAME_GROWTH_SERIES` — combo chart data: cumulative active names line + net gain/loss bars
- `NEW_USERS_SERIES` — combo chart data: cumulative unique wallets line + monthly new wallets bars
- `UPCOMING_EXPIRATIONS_SERIES` — stacked bar data by renewal history (Never/Once/Twice/3+)
- `RENEWAL_RATE_COHORTS` — four cohort years with rates (2021: 78%, 2022: 65%, 2023: 61%, 2024: 55%)

Shape matches what a real API would return so the swap is a single import change.

### Component details

**`RevenueOverviewCard`**
Uses `Card` as container. Two sections separated by a bottom border:

1. Hero: "Total Protocol Revenue" label + "$127.3M" (Inter Medium 30px) + "since May 2019 · $3.2M YTD" (baseline-aligned)
2. Three-column stream grid: each column renders a custom inline progress bar (track `div` with `rgba(24,24,27,0.12)` bg, fill `div` with `style={{ width: '${share}%', backgroundColor: accentColor }}`, 4px height, 8px border-radius) — the existing `ProgressBar` DS component is NOT used here because it only supports a fixed semantic color set (`default/success/error/warning`) and cannot accept arbitrary hex fill colors. Label row: name left / share % right in accent color + dollar amount (24px, accent color) + volume · avg revenue subtext.

**`MonthlyRevenueChart`** — `StackedBarChart` with `yAxisFormatter` producing `$0 / $20M / $40M / $60M` labels. Colors: Registration `#0080bc`, Renewals `#15803d`, Premium `#f472b6`.

**`KpiRow`** — `grid grid-cols-4 gap-4`. Each cell is a `Card` with:

- Title (Inter Medium 14px, `text-secondary`)
- Headline value (`font-mono` Medium 30px, `text-primary`)
- Subtext with optional directional arrow from `Iconography` DS component (green up arrow / red down arrow)

**`NameGrowthChart`** — `ComboChart`. Line: "Cumulative active names" `#0080bc`. Bars: "Net gain (month)" `#15803d`, "Net loss (month)" `#f87171`. Y-axis: `0 / 0.6M / 1.2M / 2.4M`.

**`NewUsersChart`** — `ComboChart`. Line: "Cumulative unique wallets" `#0080bc`. Bar: "New wallets (month)" `#7c3aed`. Y-axis: `0 / 10K / 20K / 30K`.

**`UpcomingExpirationsChart`** — `StackedBarChart` with subtitle "629K names expire in the next 24 months" (629K in `#0080bc`). Four series: Never renewed `#f87171`, Renewed once `#fb923c`, Renewed twice `#a855f7`, Renewed 3+ times `#15803d`.

**`RenewalRateCohort`** — Four rows with custom inline progress bars (same pattern as stream bars — `ProgressBar` DS not used due to fixed color set). Track: `rgba(24,24,27,0.12)`, fill: `#fb923c`. Each row: year label left + progress bar + percentage right.

**`DataProvenance`** — `<p className="text-[11px] text-[#a1a1aa] font-normal">` with the Dune/Steakhouse attribution text.

**`index.tsx`** — Page layout:

```
<SectionTitle title="Revenue" description="Protocol financial health: revenue, registrations, and name retention." />
<RevenueOverviewCard />
<MonthlyRevenueChart />
{/* "Usage & Adoption" section label — SegmentedControl omitted (filtering is v2) */}
<KpiRow />
<NameGrowthChart />
<NewUsersChart />
<div className="grid grid-cols-2 gap-4">
  <UpcomingExpirationsChart />
  <RenewalRateCohort />
</div>
<DataProvenance />
```

`isLoading` boolean controls Skeleton vs real content. Error boundary around each section shows `InlineAlert` with retry on failure.

---

## Route & Sidebar

**New file:** `apps/dashboard/app/whitelabel/[daoId]/revenue/page.tsx`
Imports `RevenueFeature` from `features/revenue/index.tsx`. Uses existing whitelabel layout — no layout changes needed.

**Sidebar update:** Add "Revenue" nav item with dollar-sign icon to the ENS whitelabel sidebar, between "Service Providers" and "Notifications". Uses existing `SidebarNavItem`. Active state uses ENS brand color tokens — no hardcoding.

---

## Loading & Error States

**Loading:** Each section renders a `Skeleton` DS component sized to match card geometry. Scaffolded now, activated later when real API is wired.

**Error:** Each section wrapped in an error boundary. Shows `InlineAlert` with retry action. Other sections remain visible (no full-page failure).

---

## Out of Scope (v1)

- Per-name revenue breakdown
- Predictive/forecast views
- USD/ETH toggle
- Time range selector
- Protocol comparison
- Treasury balance/spending data
- Mobile layout
- Export/share chart data

---

## Acceptance Criteria

- `/whitelabel/[daoId]/revenue` renders the Revenue page
- Sidebar shows Revenue as active nav item with ENS brand colors
- Revenue Overview card shows hero + three stream columns with correct colors, amounts, shares, volumes
- Progress bars in stream columns represent proportional all-time share
- Monthly Revenue stacked bar chart renders with correct series colors and y-axis labels
- KPI row renders four cards: Registered Names (2.1M), New Wallets (1K), Renewal Rate (62%), Avg Revenue ($24.70) with correct trend subtext
- Name Growth & Churn combo chart renders cumulative line + green/red bars
- New Users combo chart renders cumulative wallets line + purple monthly bars
- Upcoming Expirations stacked bar renders with four renewal-history series and subtitle
- Renewal Rate cohort renders four amber progress bar rows (2021: 78%, 2022: 65%, 2023: 61%, 2024: 55%)
- Data Provenance text renders at bottom
- Loading state scaffolded (skeleton placeholders)
- Error state shows inline retry without full-page failure
- Chart tooltips on hover, legend-click toggles series
- `pnpm dashboard typecheck` and `pnpm dashboard lint` pass
