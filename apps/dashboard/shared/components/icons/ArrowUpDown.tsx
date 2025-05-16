import { SVGProps } from "react";

export enum ArrowState {
  DEFAULT = "DEFAULT",
  UP = "UP",
  DOWN = "DOWN",
}

export const ArrowUpDown = ({
  props,
  activeState,
}: {
  props: SVGProps<SVGSVGElement>;
  activeState?: ArrowState;
}) => {
  return (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        id="arrow-down"
        stroke={`${activeState === ArrowState.DOWN ? "#F4F4F4" : "#A1A1AA"}`}
      >
        <path
          id="Vector"
          d="M7.33333 11.3335L4.66667 14.0002L2 11.3335"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M4.66663 14L4.66663 6"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g
        id="arrow-up"
        stroke={`${activeState === ArrowState.UP ? "#F4F4F4" : "#A1A1AA"}`}
      >
        <path
          id="Vector_3"
          d="M14 4.66667L11.3333 2L8.66663 4.66667"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_4"
          d="M11.3334 10L11.3334 2"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
