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
};

export type ComboChartLineSeries = {
  name: string;
  data: number[];
  color: string;
};

export type ComboChartProps = {
  barSeries: ComboChartBarSeries[];
  lineSeries: ComboChartLineSeries[];
  xAxisLabels: string[];
  yAxisFormatter?: (value: number) => string;
  height?: number;
  className?: string;
};
