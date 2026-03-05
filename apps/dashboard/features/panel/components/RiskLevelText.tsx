import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { cn } from "@/shared/utils";

const riskLevelConfig = {
  [RiskLevel.HIGH]: { text: "[HIGH RISK]", color: "text-error" },
  [RiskLevel.MEDIUM]: { text: "[MEDIUM RISK]", color: "text-warning" },
  [RiskLevel.LOW]: { text: "[LOW RISK]", color: "text-success" },
  [RiskLevel.NONE]: { text: "[UNKNOWN RISK]", color: "text-primary" },
} as const;

export const RiskLevelText = ({ level }: { level: RiskLevel }) => {
  const config = riskLevelConfig[level];
  return (
    <span
      className={cn(
        "font-mono text-[13px] font-medium uppercase leading-5 tracking-[0.78px]",
        config.color,
      )}
    >
      {config.text}
    </span>
  );
};
