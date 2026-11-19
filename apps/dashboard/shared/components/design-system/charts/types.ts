export type StackedBarChartSeries = {
  name: string;
  data: number[];
  color: string;
};

export type StackedBarChartProps = {
  series: StackedBarChartSeries[];
  xAxisLabels: string[];
  yAxisFormatter?: (value: number) => string;
  xAxisLabelInterval?: number | ((index: number, value: string) => boolean);
  xAxisLabelFormatter?: (value: string, index: number) => string;
  gridRight?: number;
  height?: number;
  className?: string;
  /**
   * If set, renders an extra "Total" row in the tooltip with this label,
   * summing all visible series at the hovered x. Omit when summing the stacked
   * series doesn't carry meaning (e.g. categorical breakdowns of the same set).
   */
  tooltipTotalLabel?: string;
};

export type ComboChartBarSeries = {
  name: string;
  data: number[];
  color: string;
  stack?: string;
  /** How this series' value reads in the hover tooltip. Default: the raw number. */
  valueFormatter?: (value: number) => string;
};

export type ComboChartLineSeries = {
  name: string;
  data: number[];
  color: string;
  /** Curved by default. Set false for running totals, where a curve would overshoot the data. */
  smooth?: boolean;
  /** How this series' value reads in the hover tooltip. Default: the raw number. */
  valueFormatter?: (value: number) => string;
};

/** A dated event drawn as a vertical dashed line at one x-axis category. */
export type ComboChartMarker = {
  /**
   * Position of the category in `xAxisLabels`. By position, not by label:
   * two categories can print the same label. Out of range is not drawn.
   */
  index: number;
  label: string;
};

export type ComboChartProps = {
  barSeries: ComboChartBarSeries[];
  lineSeries: ComboChartLineSeries[];
  xAxisLabels: string[];
  /** Left axis (bars). Also used for the right axis unless `rightAxisFormatter` is set. */
  yAxisFormatter?: (value: number) => string;
  /** Right axis (lines), when its unit differs from the bars'. */
  rightAxisFormatter?: (value: number) => string;
  /**
   * Which x-axis labels to print. Default: every label up to 12 categories,
   * then only the "Jan <year>" ones, printed as the year (monthly series).
   */
  xAxisLabelInterval?: number | ((index: number, value: string) => boolean);
  xAxisLabelFormatter?: (value: string, index: number) => string;
  markers?: ComboChartMarker[];
  height?: number;
  className?: string;
};
