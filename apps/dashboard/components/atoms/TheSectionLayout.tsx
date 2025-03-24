"use client";

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
    <div className="flex h-full w-full flex-col gap-6" id={anchorId} ref={ref}>
      <div className="flex h-full w-full flex-col gap-2">
        <div className="flex h-full w-full flex-col justify-between gap-2 sm:flex-row sm:gap-0">
          <div className="flex items-center gap-3">
            {icon}
            <h1 className="text-left text-xl font-medium tracking-[-0.05%] text-white sm:text-3xl">
              {title}
            </h1>
          </div>
          {switchDate && !description && (
            <div className="flex">{switchDate}</div>
          )}
        </div>
        <div className="flex w-full">
          <p className="text-md flex w-full flex-col text-justify text-[#a1a1aa]">
            {description}
          </p>
        </div>
      </div>
      {riskLevel && switchDate ? (
        <div className="flex h-full w-full flex-col justify-between gap-4 sm:flex-row">
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
