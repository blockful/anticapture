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
    icon: <AlertTriangle className="size-3.5 text-error" />,
  },
  [RiskLevel.MEDIUM]: {
    color: "warning",
    pattern: ["bg-warning", "bg-warning", "bg-lightDark"],
    icon: <AlertCircle className="size-3.5 text-warning" />,
  },
  [RiskLevel.LOW]: {
    color: "success",
    pattern: ["bg-success", "bg-middleDark", "bg-middleDark"],
    icon: <CheckCircle2 className="size-3.5 text-success" />,
  },
  [RiskLevel.NONE]: {
    color: "foreground",
    pattern: ["bg-middleDark", "bg-middleDark", "bg-middleDark"],
    icon: <CounterClockwiseClockIcon className="size-3.5 text-foreground" />,
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
  <div className="flex h-full flex-row gap-1 rounded-l-full">
    <p
      className={`items-center gap-1 text-${color} hidden font-mono text-xs font-medium md:flex`}
    >
      {status ?? "------"}
      {icon}
    </p>
    <p
      className={`items-center gap-1 text-${color} flex font-mono text-xs font-medium md:hidden`}
    >
      {icon}
    </p>
  </div>
);

const RiskDots = ({ pattern }: { pattern: RiskConfig["pattern"] }) => (
  <div className="flex items-center gap-1 rounded-r-full">
    {pattern.map((bgClass, index) => (
      <div key={index} className={cn("size-1 rounded-full", bgClass)} />
    ))}
  </div>
);

interface RiskLevelCardSmallProps {
  status?: RiskLevel;
  className?: string;
}

export const RiskLevelCardSmall = ({
  status,
  className,
}: RiskLevelCardSmallProps) => {
  const config = riskConfigs[status ?? RiskLevel.NONE];

  return (
    <div
      className={cn(
        "flex h-full w-fit gap-1 rounded-full bg-lightDark px-2 py-0.5",
        className,
      )}
    >
      <RiskLabel status={status} color={config.color} icon={config.icon} />
      <RiskDots pattern={config.pattern} />
    </div>
  );
};
