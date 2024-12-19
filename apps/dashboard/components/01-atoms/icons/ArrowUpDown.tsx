import { SVGProps } from "react";

export const ArrowUpDown = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="arrow-up-down">
        <path
          id="Vector"
          d="M7.33333 11.3335L4.66667 14.0002L2 11.3335"
          stroke="#A1A1AA"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Vector_2"
          d="M4.66663 14L4.66663 6"
          stroke="#A1A1AA"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Vector_3"
          d="M14 4.66667L11.3333 2L8.66663 4.66667"
          stroke="#A1A1AA"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Vector_4"
          d="M11.3334 10L11.3334 2"
          stroke="#A1A1AA"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  );
};
