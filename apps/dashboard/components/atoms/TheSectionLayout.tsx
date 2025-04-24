"use client";

import { cn } from "@/lib/client/utils";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { ReactNode, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export const TheSectionLayout = ({
  icon,
  title,
  description,
  riskLevel,
  children,
  anchorId,
  className,
}: {
  icon?: JSX.Element;
  title: string;
  description?: string;
  riskLevel?: ReactNode;
  children: ReactNode;
  anchorId: string;
  className?: string;
}) => {
  const { isMobile, isDesktop } = useScreenSize();
  const { ref, inView } = useInView({
    threshold: isMobile ? 0.3 : isDesktop ? 0.5 : 0.7,
  });

  useEffect(() => {
    if (inView) {
      window.dispatchEvent(
        new CustomEvent("sectionInView", { detail: anchorId }),
      );
    }
  }, [inView, anchorId]);

  return (
    <div
      className={cn(
        "section-title-gap flex h-full w-full flex-col border-b-2 border-b-white/10 px-4 py-8 sm:border-none sm:bg-dark sm:px-5 sm:py-7",
        className,
      )}
      id={anchorId}
      ref={ref}
    >
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex h-full w-full flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="flex items-center gap-2">
              {icon}
              <h1 className="text-xl font-medium leading-7 tracking-[-0.5%] text-[#FAFAFA] sm:text-left">
                {title}
              </h1>
            </div>
            <div className="hidden items-center sm:flex">
              {riskLevel && <div className="flex h-full">{riskLevel}</div>}
            </div>
          </div>
          <div className="flex w-full">
            <p className="flex w-full flex-col text-justify text-[12px] font-normal leading-[18px] text-foreground sm:text-sm">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center sm:hidden">
          {riskLevel && <div className="flex h-full w-full">{riskLevel}</div>}
        </div>
      </div>
      <div className="border-b border-b-white/10" />

      {children}
    </div>
  );
};
