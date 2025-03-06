import { SVGProps } from "react";

export const ActivityIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="activity">
        <path
          id="Vector"
          d="M14.6666 8.5H12L9.99998 14.5L5.99998 2.5L3.99998 8.5H1.33331"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
