"use client";

import React, { useEffect } from "react";
import { TooltipInfo } from "@/components/atoms";
import { useInView } from "react-intersection-observer";

export const TheSectionLayout = ({
  icon,
  title,
  description,
  switchDate,
  children,
}: {
  icon?: React.JSX.Element;
  title: string;
  description?: string;
  switchDate?: React.JSX.Element;
  children: React.ReactNode;
}) => {
  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  const anchorId = title.toLowerCase().replace(/ /g, "-");

  useEffect(() => {
    if (inView) {
      window.dispatchEvent(
        new CustomEvent("sectionInView", { detail: anchorId }),
      );
    }
  }, [inView, anchorId]);

  return (
    <div className="flex h-full w-full flex-col gap-5" id={anchorId} ref={ref}>
      <div className="flex h-full w-full flex-col gap-2">
        <div className="flex h-full w-full flex-col justify-between gap-2 sm:flex-row sm:gap-0">
          <div className="flex items-center gap-3">
            {icon}
            <h1 className="text-left text-xl font-medium tracking-[-0.05%] text-white sm:text-3xl">
              {title}
            </h1>
          </div>

          <div className="flex">{switchDate}</div>
        </div>
        <div className="flex w-full">
          <p className="flex w-full flex-col text-start text-justify text-md text-[#a1a1aa]">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};
