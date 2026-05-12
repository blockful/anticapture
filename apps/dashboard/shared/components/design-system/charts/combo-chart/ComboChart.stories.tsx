import type { Meta, StoryObj } from "@storybook/nextjs";

import { ComboChart } from "@/shared/components/design-system/charts/combo-chart/ComboChart";
import type { ComboChartProps } from "@/shared/components/design-system/charts/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<ComboChartProps> = {
  title: "Data Display/Charts/ComboChart",
  component: ComboChart,
  parameters: {
    layout: "padded",
    design: getFigmaDesignConfigByNodeId("2753-61841"),
  },
  tags: ["autodocs"],
  argTypes: {
    height: {
      control: { type: "number" },
      description: "Chart height in pixels",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<ComboChartProps>;

const formatCompact = (value: number) => {
  if (value === 0) return "0";
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return String(value);
};

export const Default: Story = {
  args: {
    xAxisLabels: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    barSeries: [
      {
        name: "Net gain (month)",
        data: [80_000, 120_000, 200_000, 350_000, 50_000, 30_000, 20_000],
        color: "#15803d",
      },
      {
        name: "Net loss (month)",
        data: [-10_000, -20_000, -30_000, -50_000, -80_000, -60_000, -40_000],
        color: "#f87171",
      },
    ],
    lineSeries: [
      {
        name: "Cumulative active names",
        data: [
          100_000, 300_000, 600_000, 1_200_000, 1_500_000, 1_600_000, 1_700_000,
        ],
        color: "#0080bc",
      },
    ],
    yAxisFormatter: formatCompact,
    height: 300,
  },
};
