"use client";

import { ReactNode } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/utils/";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";

type RiskConfig = {
  color: string;
  pattern: [string, string, string];
  icon: ReactNode;
};

const riskConfigs: Record<RiskLevel, RiskConfig> = {
  [RiskLevel.HIGH]: {
    color: "error",
    pattern: ["bg-error", "bg-error", "bg-error"],
    icon: <AlertTriangle className="text-error size-3.5" />,
  },
  [RiskLevel.MEDIUM]: {
    color: "warning",
    pattern: ["bg-warning", "bg-warning", "bg-middle-dark"],
    icon: <AlertCircle className="text-warning size-3.5" />,
  },
  [RiskLevel.LOW]: {
    color: "success",
    pattern: ["bg-success", "bg-middle-dark", "bg-middle-dark"],
    icon: <CheckCircle2 className="text-success size-3.5" />,
  },
  [RiskLevel.NONE]: {
    color: "foreground",
    pattern: ["bg-middle-dark", "bg-middle-dark", "bg-middle-dark"],
    icon: <CounterClockwiseClockIcon className="text-secondary size-4" />,
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
  <div className="bg-light-dark flex h-full flex-row gap-1 rounded-l-full px-2">
    <p className="text-secondary flex items-center text-xs font-medium">
      Risk level:
    </p>
    <p
      className={`flex items-center gap-1 text-${color} text-alternative-sm font-mono font-medium tracking-wide`}
    >
      {status ?? "------"}
      {icon}
    </p>
  </div>
);

const RiskBar = ({ pattern }: { pattern: RiskConfig["pattern"] }) => (
  <div className="bg-light-dark flex items-center gap-1 rounded-r-full p-1 pr-2">
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
  const config = riskConfigs[status ?? RiskLevel.NONE];

  return (
    <div className="flex h-7 w-full flex-col items-start">
      <div className={cn("flex h-full w-fit flex-1 rounded-full", className)}>
        <RiskLabel status={status} color={config.color} icon={config.icon} />
        <RiskBar pattern={config.pattern} />
      </div>
    </div>
  );
};
