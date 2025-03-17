import { SVGProps } from "react";

export enum ChevronIconVariant {
  LEFT = "Left",
  RIGHT = "Right",
}

interface ChevronIconProps extends SVGProps<SVGSVGElement> {
  variant?: ChevronIconVariant;
}

export const ChevronIcon = ({
  variant = ChevronIconVariant.LEFT,
  ...props
}: ChevronIconProps) => {
  const ChevronIcon: Partial<Record<ChevronIconVariant, React.ReactElement>> = {
    [ChevronIconVariant.LEFT]: (
      <svg
        {...props}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="chevron-left">
          <path
            id="Vector"
            d="M10 12L6 8L10 4"
            stroke="white"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    ),
    [ChevronIconVariant.RIGHT]: (
      <svg
        {...props}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="chevron-right">
          <path
            id="Vector"
            d="M5.25 10.5L8.75 7L5.25 3.5"
            stroke="#EC762E"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    ),
  };

  return ChevronIcon[variant] || <></>;
};
