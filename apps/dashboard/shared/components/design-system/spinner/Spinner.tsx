import { cn } from "@/shared/utils/cn";
import { SpinIcon } from "@/shared/components/icons/SpinIcon";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";

export type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
};

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
  xl: "size-12",
};

export const Spinner = ({ size = "lg", className }: SpinnerProps) => (
  <SpinIcon
    className={cn("shrink-0 animate-spin", sizeClasses[size], className)}
  />
);
