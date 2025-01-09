import { SVGProps } from "react";

export const HeaderIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="32"
      height="24"
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Icon">
        <g id="Group 1">
          <circle
            id="Ellipse 1"
            cx="16"
            cy="12"
            r="9"
            stroke="#A1A1AA"
            strokeWidth="2"
          />
          <circle
            id="Ellipse 2"
            cx="16.2381"
            cy="12.2379"
            r="3.07143"
            fill="#A1A1AA"
            stroke="#A1A1AA"
          />
        </g>
      </g>
    </svg>
  );
};
