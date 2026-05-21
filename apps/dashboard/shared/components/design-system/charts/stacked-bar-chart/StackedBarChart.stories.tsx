import type { Meta, StoryObj } from "@storybook/nextjs";

import { StackedBarChart } from "@/shared/components/design-system/charts/stacked-bar-chart/StackedBarChart";
import type { StackedBarChartProps } from "@/shared/components/design-system/charts/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<StackedBarChartProps> = {
  title: "Data Display/Charts/StackedBarChart",
  component: StackedBarChart,
  parameters: {
    layout: "padded",
    design: getFigmaDesignConfigByNodeId("2753-61715"),
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
type Story = StoryObj<StackedBarChartProps>;

const formatMillions = (value: number) => {
  if (value === 0) return "$0";
  return `$${value / 1_000_000}M`;
};

export const Default: Story = {
  args: {
    xAxisLabels: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    series: [
      {
        name: "Registration",
        data: [
          4_500_000, 9_000_000, 12_000_000, 40_000_000, 8_000_000, 6_500_000,
          2_000_000,
        ],
        color: "#0080bc",
      },
      {
        name: "Renewals",
        data: [
          500_000, 2_000_000, 3_500_000, 8_000_000, 7_000_000, 6_500_000,
          5_000_000,
        ],
        color: "#15803d",
      },
      {
        name: "Premium",
        data: [0, 0, 0, 7_000_000, 3_000_000, 5_000_000, 2_000_000],
        color: "#f472b6",
      },
    ],
    yAxisFormatter: formatMillions,
    height: 300,
  },
};
