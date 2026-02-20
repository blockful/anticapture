import { cn } from "@/shared/utils";
import { SVGProps } from "react";

interface PointerIconProps extends SVGProps<SVGSVGElement> {
  hasBorder?: boolean;
}

export const PointerIcon = ({
  hasBorder = true,
  ...props
}: PointerIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="9"
      viewBox="0 0 12 9"
      fill="none"
      {...props}
    >
      <path
        className={cn({
          "stroke-border-contrast": hasBorder,
        })}
        d="M4.76314 0.5C5.14804 -0.166667 6.11029 -0.166667 6.49519 0.5L11.2583 8.75H0L4.76314 0.5Z"
        fill="currentColor"
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
};
