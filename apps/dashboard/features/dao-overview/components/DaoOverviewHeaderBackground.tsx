import { useMemo } from "react";

const PixelPattern = ({
  color,
  opacity = 1,
}: {
  color: string;
  opacity?: number;
}) => {
  const patternTopId = useMemo(
    () => `pattern-top-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );
  const patternMidId = useMemo(
    () => `pattern-mid-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );
  const patternBottomId = useMemo(
    () => `pattern-bottom-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );
  const maskTopId = useMemo(
    () => `mask-top-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );
  const maskMidId = useMemo(
    () => `mask-mid-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );
  const maskBottomId = useMemo(
    () => `mask-bottom-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  return (
    <svg width="100%" height="100%" className="absolute inset-0">
      <defs>
        <pattern
          id={patternTopId}
          x="0"
          y="0"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="0"
            y="0"
            width="1"
            height="1"
            fill={color}
            opacity={opacity}
          />
          <rect
            x="2"
            y="0"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.95}
          />
          <rect
            x="4"
            y="0"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.9}
          />
          <rect
            x="5"
            y="0"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.85}
          />
          <rect
            x="1"
            y="1"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.9}
          />
          <rect
            x="3"
            y="1"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.85}
          />
          <rect
            x="5"
            y="1"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.8}
          />
          <rect
            x="0"
            y="2"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.85}
          />
          <rect
            x="2"
            y="2"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.9}
          />
          <rect
            x="4"
            y="2"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.95}
          />

          <rect
            x="1"
            y="3"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.8}
          />
          <rect
            x="3"
            y="3"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.9}
          />
          <rect
            x="5"
            y="3"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.85}
          />

          <rect
            x="0"
            y="4"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.95}
          />
          <rect
            x="2"
            y="4"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.8}
          />
          <rect
            x="4"
            y="4"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.9}
          />

          <rect
            x="1"
            y="5"
            width="1"
            height="1"
            fill={color}
            opacity={opacity * 0.85}
          />
        </pattern>
        <pattern
          id={patternMidId}
          x="0"
          y="0"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="0"
            y="0"
            width="2"
            height="2"
            fill={color}
            opacity={opacity * 0.8}
          />
          <rect
            x="6"
            y="2"
            width="2"
            height="2"
            fill={color}
            opacity={opacity * 0.7}
          />
          <rect
            x="3"
            y="6"
            width="2"
            height="2"
            fill={color}
            opacity={opacity * 0.75}
          />
          <rect
            x="9"
            y="9"
            width="2"
            height="2"
            fill={color}
            opacity={opacity * 0.65}
          />
        </pattern>
        <pattern
          id={patternBottomId}
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="0"
            y="0"
            width="2"
            height="2"
            fill={color}
            opacity={opacity * 0.6}
          />
          <rect
            x="10"
            y="10"
            width="2"
            height="2"
            fill={color}
            opacity={opacity * 0.5}
          />
        </pattern>
        <linearGradient id={maskTopId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="30%" stopColor="white" stopOpacity="0.5" />
          <stop offset="40%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={maskMidId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="20%" stopColor="white" stopOpacity="0" />
          <stop offset="30%" stopColor="white" stopOpacity="1" />
          <stop offset="85%" stopColor="white" stopOpacity="0.5" />
          <stop offset="95%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={maskBottomId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="75%" stopColor="white" stopOpacity="0" />
          <stop offset="85%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <mask id={`${maskTopId}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${maskTopId})`} />
        </mask>

        <mask id={`${maskMidId}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${maskMidId})`} />
        </mask>

        <mask id={`${maskBottomId}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${maskBottomId})`} />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternTopId})`}
        mask={`url(#${maskTopId}-mask)`}
      />
      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternMidId})`}
        mask={`url(#${maskMidId}-mask)`}
      />
      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternBottomId})`}
        mask={`url(#${maskBottomId}-mask)`}
      />
    </svg>
  );
};

export const DaoOverviewHeaderBackground = ({
  color,
  opacity = 1,
}: {
  color: string;
  opacity?: number;
}) => {
  return (
    <div className="absolute h-[100px] w-full">
      <div
        className="h-[100px] w-full"
        style={{ backgroundColor: "#fff2fb" }}
      />
      <PixelPattern color={color} opacity={opacity} />
    </div>
  );
};
