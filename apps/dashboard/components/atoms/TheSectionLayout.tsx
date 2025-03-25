"use client";

import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { ReactNode, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export const TheSectionLayout = ({
  icon,
  title,
  description,
  switchDate,
  riskLevel,
  children,
  anchorId,
}: {
  icon?: JSX.Element;
  title: string;
  description?: string;
  switchDate?: JSX.Element;
  riskLevel?: ReactNode;
  children: ReactNode;
  anchorId: string;
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
    <div className="flex h-full w-full flex-col gap-6" id={anchorId} ref={ref}>
      <div className="flex h-full w-full flex-col gap-2">
        <div className="flex h-full w-full flex-col justify-between gap-2 sm:flex-row sm:gap-0">
          <div className="flex items-center gap-3">
            {icon}
            <h1 className="text-xl font-medium leading-7 tracking-[-0.05%] text-[#FAFAFA] sm:text-left sm:leading-none">
              {title}
            </h1>
          </div>
          {switchDate && !description && (
            <div className="flex">{switchDate}</div>
          )}
        </div>
        <div className="flex w-full">
          <p className="flex w-full flex-col text-justify text-[12px] font-normal leading-[18px] text-foreground sm:text-sm">
            {description}
          </p>
        </div>
      </div>
      {riskLevel && switchDate ? (
        <div className="flex h-full w-full justify-between gap-4 sm:flex-row">
          <div>{riskLevel}</div>
          <div>{switchDate}</div>
        </div>
      ) : (
        !riskLevel &&
        switchDate &&
        description && (
          <div className="flex h-full w-full flex-col justify-end gap-4 sm:flex-row">
            <div>{riskLevel}</div>
            <div>{switchDate}</div>
          </div>
        )
      )}
      {children}
    </div>
  );
};
