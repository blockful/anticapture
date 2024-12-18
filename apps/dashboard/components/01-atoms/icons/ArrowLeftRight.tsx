import { SVGProps } from "react";

export const ArrowLeftRight = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="arrow-left-right">
        <path
          id="Vector"
          d="M17 11L21 7L17 3"
          stroke="#A1A1AA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M21 7H9"
          stroke="#A1A1AA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_3"
          d="M7 21L3 17L7 13"
          stroke="#A1A1AA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_4"
          d="M15 17H3"
          stroke="#A1A1AA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
