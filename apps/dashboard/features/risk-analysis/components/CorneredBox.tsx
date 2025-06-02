import { ReactNode, CSSProperties } from "react";
import { cn } from "@/shared/utils/";

/**
 * Props for the CorneredBox component
 */
export interface CorneredBoxProps {
  children: ReactNode;
  className?: string;
  withBorder?: boolean;
}

/**
 * A component that wraps content with decorative corner accents
 */
export const CorneredBox = ({
  children,
  className,
  withBorder = true,
}: CorneredBoxProps) => {
  return (
    <div
      className={cn(
        "relative h-full",
        withBorder && "border-light-dark bg-dark border",
        className,
      )}
    >
      {/* Corner accents positioned outside the border */}
      <div className="border-middle-dark absolute -left-[2px] -top-[2px] z-10 size-2.5 border-l-2 border-t-2" />
      <div className="border-middle-dark absolute -right-[2px] -top-[2px] z-10 size-2.5 border-r-2 border-t-2" />
      <div className="border-middle-dark absolute -bottom-[2px] -left-[2px] z-10 size-2.5 border-b-2 border-l-2" />
      <div className="border-middle-dark absolute -bottom-[2px] -right-[2px] z-10 size-2.5 border-b-2 border-r-2" />

      {children}
    </div>
  );
};
