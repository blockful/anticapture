"use client";

import { ReactNode } from "react";

type SectionTitleProps = {
  icon: ReactNode;
  title: string;
  riskLevel: ReactNode;
  description: string;
  // variant?: "no-description" | "hasDecription" | "hasButtons" | "hasSwitcher";
};

export const SectionTitle = ({
  icon,
  title,
  riskLevel,
  description,
  // variant = "no-description",
}: SectionTitleProps) => {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-primary text-xl font-medium leading-7 tracking-[-0.5%] sm:text-left">
              {title}
            </h4>
          </div>
          <div className="hidden items-center sm:flex">{riskLevel}</div>
        </div>
      </div>
      <div>
        <p className="text-secondary flex w-full flex-col text-justify font-normal sm:text-sm">
          {description}
        </p>
      </div>
      <div className="flex items-center sm:hidden">{riskLevel}</div>
    </div>
  );
};
