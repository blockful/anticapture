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
