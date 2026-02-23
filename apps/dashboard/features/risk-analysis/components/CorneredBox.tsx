import { ReactNode } from "react";

import { cn } from "@/shared/utils/";

interface CorneredBoxProps {
  children: ReactNode;
  className?: string;
  withBorder?: boolean;
}

export const CorneredBox = ({
  children,
  className,
  withBorder = true,
}: CorneredBoxProps) => {
  return (
    <div
      className={cn(
        "relative h-full",
        withBorder && "lg:border-light-dark bg-surface-default lg:border",
        className,
      )}
    >
      {/* Corner accents positioned outside the border */}
      <div className="lg:border-middle-dark absolute -left-[2px] -top-[2px] z-10 size-2.5 lg:border-l-2 lg:border-t-2" />
      <div className="lg:border-middle-dark absolute -right-[2px] -top-[2px] z-10 size-2.5 lg:border-r-2 lg:border-t-2" />
      <div className="lg:border-middle-dark absolute -bottom-[2px] -left-[2px] z-10 size-2.5 lg:border-b-2 lg:border-l-2" />
      <div className="lg:border-middle-dark absolute -bottom-[2px] -right-[2px] z-10 size-2.5 border-r-2 lg:border-b-2" />

      {children}
    </div>
  );
};
