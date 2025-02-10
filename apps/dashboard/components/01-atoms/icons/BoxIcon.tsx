import { SVGProps } from "react";

export const BoxIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="box" clipPath="url(#clip0_5691_3808)">
        <path
          id="Vector"
          d="M10.5 7.99995V3.99995C10.4998 3.82459 10.4535 3.65236 10.3658 3.50053C10.278 3.34871 10.1519 3.22263 10 3.13495L6.5 1.13495C6.34798 1.04718 6.17554 1.00098 6 1.00098C5.82446 1.00098 5.65202 1.04718 5.5 1.13495L2 3.13495C1.84813 3.22263 1.72199 3.34871 1.63423 3.50053C1.54647 3.65236 1.50018 3.82459 1.5 3.99995V7.99995C1.50018 8.17531 1.54647 8.34755 1.63423 8.49937C1.72199 8.65119 1.84813 8.77727 2 8.86495L5.5 10.865C5.65202 10.9527 5.82446 10.9989 6 10.9989C6.17554 10.9989 6.34798 10.9527 6.5 10.865L10 8.86495C10.1519 8.77727 10.278 8.65119 10.3658 8.49937C10.4535 8.34755 10.4998 8.17531 10.5 7.99995Z"
          stroke="#EC762E"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M1.64502 3.5L6.00002 6L10.355 3.5"
          stroke="#EC762E"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_3"
          d="M6 11V6"
          stroke="#EC762E"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_5691_3808">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
