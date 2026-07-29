/**
 * Shared ECharts theme constants.
 *
 * Colors reference CSS custom properties so charts adapt to both the dark
 * Anticapture dashboard and the light whitelabel portal automatically.
 *
 * Call `getChartTheme()` inside a component (after mount) so
 * `getComputedStyle` can resolve the current theme values.
 */

const FALLBACK_GRID = "#e4e4e7";
const FALLBACK_AXIS = "#a1a1aa";
const FALLBACK_LEGEND = "#52525b";

/** Mirrors `--base-chart-1..7` in globals.css (ECharts can't read CSS vars). */
const FALLBACK_SERIES = [
  "#3b82f6",
  "#ec4899",
  "#f59e0b",
  "#a855f7",
  "#10b981",
  "#06b6d4",
  "#fbbf24",
];

export const CHART_FONT_FAMILY = "Inter, sans-serif";

/** Resolve current theme colors from CSS custom properties. */
export const getChartTheme = () => {
  if (typeof window === "undefined") {
    return {
      gridLineColor: FALLBACK_GRID,
      axisLabelColor: FALLBACK_AXIS,
      legendTextColor: FALLBACK_LEGEND,
    };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    gridLineColor:
      style.getPropertyValue("--color-chart-grid").trim() || FALLBACK_GRID,
    axisLabelColor:
      style.getPropertyValue("--color-chart-axis-label").trim() ||
      FALLBACK_AXIS,
    legendTextColor:
      style.getPropertyValue("--color-chart-legend-text").trim() ||
      FALLBACK_LEGEND,
  };
};

/** Data-visualization palette (`--base-chart-1..7`) for multi-series charts. */
export const getChartSeriesColors = (): string[] => {
  if (typeof window === "undefined") return FALLBACK_SERIES;

  const style = getComputedStyle(document.documentElement);

  return FALLBACK_SERIES.map(
    (fallback, index) =>
      style.getPropertyValue(`--base-chart-${index + 1}`).trim() || fallback,
  );
};
