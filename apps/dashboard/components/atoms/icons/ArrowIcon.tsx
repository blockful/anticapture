import { SVGProps } from "react";

export enum ArrowIconVariant {
  UP = "Up",
  DOWN = "Down",
  LEFT = "Left",
}

interface ArrowIconProps extends SVGProps<SVGSVGElement> {
  variant?: ArrowIconVariant;
}

export const ArrowIcon = ({
  variant = ArrowIconVariant.UP,
  ...props
}: ArrowIconProps) => {
  const ArrowIcon: Partial<Record<ArrowIconVariant, React.ReactElement>> = {
    [ArrowIconVariant.UP]: (
      <svg
        {...props}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="arrow-up">
          <path
            id="Vector"
            d="M8 13.3337V2.66699"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            id="Vector_2"
            d="M4 6.66699L8 2.66699L12 6.66699"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
          />
        </g>
      </svg>
    ),
    [ArrowIconVariant.DOWN]: (
      <svg
        {...props}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="arrow-down">
          <path
            id="Vector"
            d="M8 2.66699V13.3337"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            id="Vector_2"
            d="M4 9.33301L8 13.333L12 9.33301"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
          />
        </g>
      </svg>
    ),
    [ArrowIconVariant.LEFT]: (
      <svg
        {...props}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="arrow-left">
          <path
            id="Vector"
            d="M11.0834 7H2.91669"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            id="Vector_2"
            d="M7.00002 11.0832L2.91669 6.99984L7.00002 2.9165"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    ),
  };

  return ArrowIcon[variant] || <></>;
};
