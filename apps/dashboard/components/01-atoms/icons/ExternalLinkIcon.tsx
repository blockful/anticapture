import { SVGProps } from "react";

export const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="13"
      height="12"
      viewBox="0 0 13 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="external-link">
        <path
          id="Vector"
          d="M9.5 6.5V9.5C9.5 9.76522 9.39464 10.0196 9.20711 10.2071C9.01957 10.3946 8.76522 10.5 8.5 10.5H3C2.73478 10.5 2.48043 10.3946 2.29289 10.2071C2.10536 10.0196 2 9.76522 2 9.5V4C2 3.73478 2.10536 3.48043 2.29289 3.29289C2.48043 3.10536 2.73478 3 3 3H6"
          stroke="#FC72FF"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Vector_2"
          d="M8 1.5H11V4.5"
          stroke="#FC72FF"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Vector_3"
          d="M5.5 7L11 1.5"
          stroke="#FC72FF"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  );
};
