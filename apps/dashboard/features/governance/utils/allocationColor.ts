/**
 * Chart tokens used for weighted/quadratic allocation dots and bar segments.
 * Design mandates tokens here (no raw hex) so the bars follow the active theme.
 */
const ALLOCATION_COLOR_TOKENS = [
  "var(--base-chart-1)",
  "var(--base-chart-2)",
  "var(--base-chart-3)",
  "var(--base-chart-4)",
  "var(--base-chart-5)",
  "var(--base-chart-6)",
  "var(--base-chart-7)",
] as const;

export const getAllocationColor = (index: number): string =>
  ALLOCATION_COLOR_TOKENS[index % ALLOCATION_COLOR_TOKENS.length]!;
