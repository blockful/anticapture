import { SVGProps } from "react";

export const ChevronRight = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="100%"
      height="100%"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 12L10 8L6 4"
        stroke={props.color || "white"}
        strokeOpacity="0.6"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
