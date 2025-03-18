"use client";

import { ReactNode } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { RiskLevel } from "@/lib/enums/RiskLevel";

type RiskConfig = {
  color: string;
  pattern: [string, string, string];
  icon: ReactNode;
};

const riskConfigs: Record<RiskLevel, RiskConfig> = {
  [RiskLevel.HIGH]: {
    color: "red-400",
    pattern: ["bg-red-400/15", "bg-red-400/15", "bg-red-400"],
    icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
  },
  [RiskLevel.MEDIUM]: {
    color: "yellow-500",
    pattern: ["bg-yellow-500/15", "bg-yellow-500", "bg-white/15"],
    icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  },
  [RiskLevel.LOW]: {
    color: "green-500",
    pattern: ["bg-green-500", "bg-white/15", "bg-white/15"],
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
} as const;

const RiskLabel = ({
  status,
  color,
  icon,
}: {
  status: RiskLevel;
  color: string;
  icon: ReactNode;
}) => (
  <div className="flex h-full gap-1.5 rounded-l-full border-r border-lightDark bg-white/10 px-3">
    <p className="flex items-center text-sm font-medium text-white">
      Risk level:
    </p>
    <p className={`flex items-center gap-1 text-${color} text-sm font-medium`}>
      {status}
      {icon}
    </p>
  </div>
);

const RiskBar = ({ pattern }: { pattern: RiskConfig["pattern"] }) => (
  <div className="flex gap-1 rounded-r-full bg-white/5 p-1">
    {pattern.map((bgClass, index) => (
      <div
        key={index}
        className={cn("h-full w-12", bgClass, index === 2 && "rounded-r-full")}
      />
    ))}
  </div>
);

interface RiskLevelCardProps {
  status: RiskLevel;
  className?: string;
}

export const RiskLevelCard = ({ status, className }: RiskLevelCardProps) => {
  const config = riskConfigs[status];

  return (
    <div
      className={cn(
        "flex h-7 w-fit rounded-full border border-white/10",
        className,
      )}
    >
      <RiskLabel status={status} color={config.color} icon={config.icon} />
      <RiskBar pattern={config.pattern} />
    </div>
  );
};
