import { SVGProps } from "react";

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="plus">
        <path
          id="Vector"
          d="M8 3.33301V12.6663"
          stroke="#A1A1AA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M3.33398 8H12.6673"
          stroke="#A1A1AA"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
