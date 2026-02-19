"use client";

import { ReactNode } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/utils/";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { BadgeStatus } from "../design-system/badges/BadgeStatus";

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
    pattern: ["bg-warning", "bg-warning", "bg-surface-contrast"],
    icon: <AlertCircle className="text-warning size-3.5" />,
  },
  [RiskLevel.LOW]: {
    color: "success",
    pattern: ["bg-success", "bg-surface-contrast", "bg-surface-contrast"],
    icon: <CheckCircle2 className="text-success size-3.5" />,
  },
  [RiskLevel.NONE]: {
    color: "secondary",
    pattern: [
      "bg-surface-contrast",
      "bg-surface-contrast",
      "bg-surface-contrast",
    ],
    icon: <CounterClockwiseClockIcon className="text-secondary size-3.5" />,
  },
};

const RiskLabel = ({
  status,
  color,
  icon,
}: {
  status: RiskLevel;
  color: string;
  icon: ReactNode;
}) => (
  <div className="flex h-full flex-row gap-1 rounded-l-full">
    <p
      className={`items-center gap-1 text-${color} flex font-mono text-xs font-medium`}
    >
      {status} RISK
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
  status: RiskLevel;
  className?: string;
}

export const RiskLevelCardSmall = ({
  status,
  className,
}: RiskLevelCardSmallProps) => {
  const config = riskConfigs[status ?? RiskLevel.NONE];

  return (
    <BadgeStatus variant="dimmed" className="w-fit px-2 py-1">
      <RiskLabel status={status} color={config.color} icon={config.icon} />
      <RiskDots pattern={config.pattern} />
    </BadgeStatus>
  );
};
