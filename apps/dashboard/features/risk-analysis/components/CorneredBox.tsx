import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/client/utils";

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
        withBorder && "border border-lightDark bg-dark",
        className
      )}
    >
      {/* Corner accents positioned outside the border */}
      <div className="absolute -top-[2px] -left-[2px] size-2.5 border-l-2 border-t-2 border-middleDark z-10" />
      <div className="absolute -top-[2px] -right-[2px] size-2.5 border-r-2 border-t-2 border-middleDark z-10" />
      <div className="absolute -bottom-[2px] -left-[2px] size-2.5 border-b-2 border-l-2 border-middleDark z-10" />
      <div className="absolute -bottom-[2px] -right-[2px] size-2.5 border-b-2 border-r-2 border-middleDark z-10" />
      
      {children}
    </div>
  );
};
