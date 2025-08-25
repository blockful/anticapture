export type Metric = {
  label: string;
  color: string;
  category: string;
};

export type MetricWithKey = Metric & {
  key: string; // Changed to string to support any metric key
};
