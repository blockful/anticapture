"use client";

import { MouseEvent, ReactNode } from "react";
import { cn } from "@/shared/utils/";
import { Card } from "@/shared/components/ui/card";
import { useScreenSize } from "@/shared/hooks";

interface AccordionContentAreaProps {
  id: string;
  title: ReactNode;
  secondaryText?: string;
  rightContent?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
  showCorners?: boolean;
}

export const AccordionContentArea = ({
  title,
  secondaryText,
  rightContent,
  children,
  isOpen,
  onToggle,
  className,
  showCorners = false,
}: AccordionContentAreaProps) => {
  const { isDesktop, isTablet } = useScreenSize();

  return (
    <Card
      className={cn(
        "border-light-dark bg-surface-default xl4k:max-w-full relative flex w-full flex-col flex-wrap rounded-none border shadow-sm transition-all duration-200 hover:cursor-pointer sm:gap-0 sm:gap-3.5",
        isOpen ? "border-middle-dark z-20" : "hover:bg-middle-dark",
        className,
      )}
      onClick={onToggle}
    >
      {/* Top left and right corners */}
      {isOpen && showCorners && (
        <>
          <div className="border-primary border-l-1 border-t-1 absolute left-0 top-0 size-3" />
          <div className="border-primary border-r-1 border-t-1 absolute right-0 top-0 size-3" />
        </>
      )}

      <div className="flex w-full items-center justify-between p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative flex w-4 shrink-0 items-center justify-center">
            <span
              className={cn(
                "text-primary absolute mb-0.5 text-xl font-thin transition-all duration-300",
                isOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            >
              +
            </span>
            <span
              className={cn(
                "text-primary absolute text-xl font-thin transition-all duration-300",
                isOpen ? "opacity-100" : "rotate-90 opacity-0",
              )}
            >
              -
            </span>
          </div>
          <div className="flex items-center gap-2 sm:flex-col md:flex-row md:text-center">
            <h3 className="text-primary truncate text-sm font-medium">
              {title}
            </h3>
            {secondaryText && (
              <>
                <div className="size-1 rounded-full bg-white/30" />
                <span className="text-secondary shrink-0 truncate text-sm font-medium">
                  {secondaryText}
                </span>
              </>
            )}
          </div>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
      <div
        className={cn(
          "border-middle-dark sm:bg-surface-default z-20 border-t p-3 sm:absolute sm:border",
          "-left-px top-full w-[calc(100%+2px)]",
          isOpen
            ? "visible h-auto transition-all duration-500 ease-in-out"
            : "hidden transition-all duration-300 ease-in-out sm:h-0",
        )}
        onClick={(e) => {
          if (isDesktop || isTablet) {
            e.stopPropagation();
          }
        }}
      >
        <div>{children}</div>

        {/* Bottom left and right corners */}
        {showCorners && (
          <>
            <div className="border-primary border-b-1 border-l-1 absolute bottom-0 left-0 size-3" />
            <div className="border-primary border-b-1 border-r-1 absolute bottom-0 right-0 size-3" />
          </>
        )}
      </div>
    </Card>
  );
};
