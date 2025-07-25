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
}

export const AccordionContentArea = ({
  title,
  secondaryText,
  rightContent,
  children,
  isOpen,
  onToggle,
  className,
}: AccordionContentAreaProps) => {
  const { isDesktop, isTablet } = useScreenSize();

  return (
    <Card
      className={cn(
        "!border-b-light-dark sm:border-light-dark sm:bg-surface-default xl4k:max-w-full border-b! flex w-full flex-col flex-wrap gap-3.5 rounded-none border-x-transparent border-t-transparent p-3 shadow-sm transition-all duration-200 hover:cursor-pointer sm:relative sm:gap-0 sm:border",
        isOpen ? "sm:border-middle-dark z-20" : "sm:hover:bg-middle-dark",
        className,
      )}
      onClick={onToggle}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative mb-1 flex w-4 shrink-0 items-center justify-center">
            <span
              className={cn(
                "text-primary absolute text-xl font-thin transition-all duration-300",
                isOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            >
              +
            </span>
            <span
              className={cn(
                "text-primary absolute mb-1 text-xl font-thin transition-all duration-300",
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
          "sm:border-middle-dark sm:bg-surface-default z-20 border-transparent p-3 sm:absolute sm:border",
          "-left-px top-full w-[calc(100%+2px)]",
          isOpen
            ? "visible h-auto transition-all duration-500 ease-in-out"
            : "hidden transition-all duration-300 ease-in-out sm:invisible sm:h-0",
        )}
        onClick={(e) => {
          if (isDesktop || isTablet) {
            e.stopPropagation();
          }
        }}
      >
        <div>{children}</div>
      </div>
    </Card>
  );
};
