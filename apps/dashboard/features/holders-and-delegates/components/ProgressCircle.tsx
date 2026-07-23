interface ProgressCircleProps {
  percentage: number; // 0-100
}

const SIZE = 24;
const STROKE_WIDTH = 3;

export const ProgressCircle = ({ percentage }: ProgressCircleProps) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const radius = (SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedPercentage / 100);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      className="-rotate-90"
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={radius}
        stroke="#3F3F46"
        strokeWidth={STROKE_WIDTH}
      />
      {clampedPercentage > 0 && (
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          stroke="#4ADE80"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};
