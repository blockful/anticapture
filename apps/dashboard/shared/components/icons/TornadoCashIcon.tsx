import type { DaoIconProps } from "@/shared/components/icons/types";

export const TornadoCashIcon = ({
  showBackground = true,
  ...props
}: DaoIconProps) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {showBackground && <rect width="40" height="40" fill="#1a1a2e" />}
      <g transform="translate(6, 4)">
        <path
          d="M14 0C6.268 0 0 6.268 0 14c0 3.866 1.568 7.37 4.104 9.906l1.414-1.414A11.937 11.937 0 0 1 2 14C2 7.373 7.373 2 14 2c2.757 0 5.302.932 7.328 2.5l1.26-1.526A13.934 13.934 0 0 0 14 0z"
          fill="#94FEBF"
        />
        <path
          d="M14 4C8.477 4 4 8.477 4 14c0 2.762 1.12 5.262 2.932 7.068l1.414-1.414A7.965 7.965 0 0 1 6 14c0-4.418 3.582-8 8-8 1.88 0 3.61.65 4.974 1.736l1.26-1.526A9.955 9.955 0 0 0 14 4z"
          fill="#94FEBF"
        />
        <path
          d="M14 8c-3.314 0-6 2.686-6 6 0 1.657.672 3.157 1.757 4.243l1.414-1.414A3.982 3.982 0 0 1 10 14c0-2.21 1.79-4 4-4 .964 0 1.85.34 2.54.908l1.26-1.526A5.975 5.975 0 0 0 14 8z"
          fill="#94FEBF"
        />
        <path d="M14 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="#94FEBF" />
        <path
          d="M22.5 5.5C24.5 9 26 12 26 16c0 3-1 5.5-3 7.5s-5 3.5-9 3.5c-2 0-3.5-.5-5-1.5 2 1.5 4.5 2 7 1.5 3-.5 5.5-2.5 7-5s2-5.5 1.5-8.5c-.3-2.5-1-5-2-8z"
          fill="#94FEBF"
          opacity="0.7"
        />
      </g>
    </svg>
  );
};
