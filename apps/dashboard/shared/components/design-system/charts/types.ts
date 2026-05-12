export type StackedBarChartSeries = {
  name: string;
  data: number[];
  color: string;
};

export type StackedBarChartProps = {
  series: StackedBarChartSeries[];
  xAxisLabels: string[];
  yAxisFormatter?: (value: number) => string;
  height?: number;
  className?: string;
};

export type ComboChartBarSeries = {
  name: string;
  data: number[];
  color: string;
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
