import React from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  className?: string;
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 340,
  height = 45,
  strokeColor = "#4ADE80",
  className = "",
}) => {
  // values = [1600, 1500, 1550, 1300]
  if (data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue + 1e22 || 1;
  console.log(range);

  const points = data
    .map((value, index) => {

      const x = (index / (data.length - 1)) * width; 
      const y = 0.5 * height - ((value - ((minValue) + range / 2)) / (range/2)) * 0.5 * height; 
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg height={height} width={width} className={className}>
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
      />
    </svg>
  );
};
