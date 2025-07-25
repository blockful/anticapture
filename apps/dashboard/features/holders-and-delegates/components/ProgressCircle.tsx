interface ProgressCircleProps {
  percentage: number; // 0-100
}

export const ProgressCircle = ({ percentage }: ProgressCircleProps) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // We have 8 segments, so calculate how many should be green
  const totalSegments = 8;
  const greenSegments = Math.round((clampedPercentage / 100) * totalSegments);

  // Define the segments in order (clockwise from top)
  const segments = [
    // Top segment
    {
      path: "M7.25 15.8239L8.02628 11.8999C8.27696 11.9495 8.53903 11.9761 8.8113 11.9761C9.08356 11.9761 9.34564 11.9495 9.59632 11.8999L10.3726 15.8239C9.86763 15.9237 9.34558 15.9761 8.8113 15.9761C8.27701 15.9761 7.75496 15.9237 7.25 15.8239Z",
      index: 0,
    },
    // Top-right segment
    {
      path: "M13.2253 14.6328L11 11.309C11.4379 11.0158 11.8158 10.6379 12.109 10.2L15.4329 12.4252C14.8488 13.2976 14.0977 14.0488 13.2253 14.6328Z",
      index: 1,
    },
    // Right segment
    {
      path: "M16.7101 9.56815L12.7901 8.78503C12.8933 8.26857 12.8942 7.7345 12.7928 7.21768L16.7155 6.44816C16.9175 7.47773 16.9156 8.53929 16.7101 9.56815Z",
      index: 2,
    },
    // Top-right-2 segment
    {
      path: "M15.4329 3.57477L12.109 5.80005C11.8158 5.36212 11.4379 4.98423 11 4.69105L13.2253 1.36717C14.0977 1.95124 14.8488 2.70236 15.4329 3.57477Z",
      index: 3,
    },
    // Top-2 segment
    {
      path: "M10.2969 0.152221L9.5206 4.07617C9.26992 4.02658 9.00784 3.99995 8.73558 3.99995C8.46332 3.99995 8.20124 4.02658 7.95056 4.07617L7.17428 0.152221C7.67925 0.0523245 8.2013 -5.13152e-05 8.73558 -5.13619e-05C9.26986 -5.14086e-05 9.79191 0.0523243 10.2969 0.152221Z",
      index: 4,
    },
    // Top-left segment
    {
      path: "M4.37238 1.36717L6.59766 4.69105C6.15973 4.98423 5.78184 5.36212 5.48865 5.80005L2.16478 3.57477C2.74884 2.70236 3.49997 1.95124 4.37238 1.36717Z",
      index: 5,
    },
    // Left segment
    {
      path: "M2.16478 12.4453L5.48865 10.22C5.78184 10.6579 6.15973 11.0358 6.59766 11.329L4.37238 14.6528C3.49997 14.0688 2.74884 13.3177 2.16478 12.4453Z",
      index: 6,
    },
    // Bottom-left segment
    {
      path: "M0.895395 6.43185L4.81534 7.21497C4.71216 7.73143 4.71124 8.2655 4.81262 8.78232L0.889988 9.55184C0.688013 8.52227 0.689852 7.46072 0.895395 6.43185Z",
      index: 7,
    },
  ];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
    >
      {segments.map((segment) => (
        <path
          key={segment.index}
          fillRule="evenodd"
          clipRule="evenodd"
          d={segment.path}
          fill={segment.index < greenSegments ? "#4ADE80" : "#A1A1AA"}
        />
      ))}
    </svg>
  );
};
