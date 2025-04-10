import { SVGProps } from "react";

export const LockIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="lock">
        <path
          id="Vector"
          d="M12.6667 7.3335H3.33333C2.59695 7.3335 2 7.93045 2 8.66683V13.3335C2 14.0699 2.59695 14.6668 3.33333 14.6668H12.6667C13.403 14.6668 14 14.0699 14 13.3335V8.66683C14 7.93045 13.403 7.3335 12.6667 7.3335Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Vector_2"
          d="M4.66663 7.3335V4.66683C4.66663 3.78277 5.01782 2.93493 5.64294 2.30981C6.26806 1.68469 7.1159 1.3335 7.99996 1.3335C8.88401 1.3335 9.73186 1.68469 10.357 2.30981C10.9821 2.93493 11.3333 3.78277 11.3333 4.66683V7.3335"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
