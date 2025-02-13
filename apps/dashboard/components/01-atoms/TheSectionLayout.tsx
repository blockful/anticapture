"use client";

import React, { useEffect } from "react";
import { TooltipInfo } from "@/components/01-atoms";
import { useInView } from "react-intersection-observer";

export const TheSectionLayout = ({
  anchorId,
  icon,
  title,
  description,
  switchDate,
  children,
}: {
  anchorId?: string;
  icon?: React.JSX.Element;
  title: string;
  description?: string;
  switchDate?: React.JSX.Element;
  children: React.ReactNode;
}) => {
  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  useEffect(() => {
    if (inView) {
      window.dispatchEvent(
        new CustomEvent("sectionInView", { detail: anchorId }),
      );
    }
  }, [inView, anchorId]);

  return (
    <div className="flex h-full w-full flex-col gap-5" id={anchorId} ref={ref}>
      <div className="flex h-full w-full flex-col justify-between gap-2 sm:flex-row sm:gap-0">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-left text-xl font-medium tracking-[-0.05%] text-white sm:text-3xl">
            {title}
          </h1>
        </div>
        <div className="flex">{switchDate}</div>
      </div>
      {description && (
        <p className="flex w-full flex-col text-start text-xs text-[#a1a1aa] sm:w-[75%] lg:w-[50%]">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};
