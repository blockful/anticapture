import { SVGProps } from "react";

export const SimpleGlobeIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="100%"
      height="100%"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.7" clipPath="url(#clip0_7152_1086)">
        <path
          d="M7.99967 14.6666C11.6816 14.6666 14.6663 11.6819 14.6663 7.99998C14.6663 4.31808 11.6816 1.33331 7.99967 1.33331C4.31778 1.33331 1.33301 4.31808 1.33301 7.99998C1.33301 11.6819 4.31778 14.6666 7.99967 14.6666Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.33301 8H14.6663"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.99967 1.33331C9.66719 3.15888 10.6148 5.528 10.6663 7.99998C10.6148 10.472 9.66719 12.8411 7.99967 14.6666C6.33215 12.8411 5.38451 10.472 5.33301 7.99998C5.38451 5.528 6.33215 3.15888 7.99967 1.33331Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_7152_1086">
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
