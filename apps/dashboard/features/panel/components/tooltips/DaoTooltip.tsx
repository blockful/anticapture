import { cn } from "@/shared/utils";
import { ReactNode } from "react";

export interface DaoTooltipProps {
  title: string;
  avatar: ReactNode;
  subtitle: string;
}

export const DaoTooltip = ({ title, avatar, subtitle }: DaoTooltipProps) => {
  return (
    <div className={cn("flex gap-3")}>
      <div className="shrink-0">{avatar}</div>
      <div className="flex flex-col gap-0 text-left">
        <p className="text-primary font-mono text-[13px] font-medium uppercase leading-5 tracking-[0.78px]">
          {title}
        </p>

        <p className="text-secondary text-xs font-medium leading-4">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
