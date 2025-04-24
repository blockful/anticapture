"use client";

import { ReactNode } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { ClockwiseIcon } from "@/components/atoms";

type RiskConfig = {
  color: string;
  pattern: [string, string, string];
  icon: ReactNode;
};

const riskConfigs: Record<RiskLevel | "undefined-risk-level", RiskConfig> = {
  [RiskLevel.HIGH]: {
    color: "error",
    pattern: ["bg-error", "bg-error", "bg-error"],
    icon: <AlertTriangle className="text-error size-3.5 sm:size-4" />,
  },
  [RiskLevel.MEDIUM]: {
    color: "warning",
    pattern: ["bg-warning", "bg-warning", "bg-lightDark"],
    icon: <AlertCircle className="text-warning size-3.5 sm:size-4" />,
  },
  [RiskLevel.LOW]: {
    color: "success",
    pattern: ["bg-success", "bg-middleDark", "bg-middleDark"],
    icon: <CheckCircle2 className="text-success size-3.5 sm:size-4" />,
  },
  "undefined-risk-level": {
    color: "foreground",
    pattern: ["bg-middleDark", "bg-middleDark", "bg-middleDark"],
    icon: <ClockwiseIcon className="size-3.5 text-foreground sm:size-4" />,
  },
} as const;

const RiskLabel = ({
  status,
  color,
  icon,
}: {
  status: RiskLevel | undefined;
  color: string;
  icon: ReactNode;
}) => (
  <div className="flex h-full flex-row gap-1 rounded-l-full bg-lightDark px-2">
    <p className="flex items-center text-xs font-medium text-foreground">
      Risk level:
    </p>
    <p className={`flex items-center gap-1 text-${color} text-xs font-medium`}>
      {status ?? "------"}
      {icon}
    </p>
  </div>
);

const RiskBar = ({ pattern }: { pattern: RiskConfig["pattern"] }) => (
  <div className="flex items-center gap-1 rounded-r-full bg-lightDark p-1 pr-2">
    {pattern.map((bgClass, index) => (
      <div
        key={index}
        className={cn(
          "h-2 w-5",
          bgClass,
          index === 2 && "rounded-r-full",
          index === 0 && "rounded-l-full",
        )}
      />
    ))}
  </div>
);

interface RiskLevelCardProps {
  status?: RiskLevel;
  className?: string;
}

export const RiskLevelCard = ({ status, className }: RiskLevelCardProps) => {
  const config = riskConfigs[status ?? "undefined-risk-level"];

  return (
    <div className="flex h-full w-full flex-col items-start">
      <div className={cn("flex h-7 w-fit flex-1 rounded-full", className)}>
        <RiskLabel status={status} color={config.color} icon={config.icon} />
        <RiskBar pattern={config.pattern} />
      </div>
    </div>
  );
};
