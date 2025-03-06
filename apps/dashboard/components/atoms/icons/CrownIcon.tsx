import { SVGProps } from "react";

export const CrownIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="crown">
        <path
          id="Vector"
          d="M2.5 10H9.5M1 2L2.5 8H9.5L11 2L8 5.5L6 2L4 5.5L1 2Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
