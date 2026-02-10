import { cn } from "@/shared/utils";
import { Stage } from "@/shared/types/enums/Stage";
import { PointerIcon } from "@/shared/components/icons";

const STAGE_CONFIG = [
  {
    stage: Stage.ZERO,
    label: "STAGE 0 [HIGH RISK]",
    description: "Critical vulnerabilities detected",
    barColor: "bg-surface-solid-error",
    textColor: "text-error",
    glowShadow: "shadow-[0px_0px_20px_0px_rgba(248,113,113,0.3)]",
  },
  {
    stage: Stage.ONE,
    label: "STAGE 1 [MEDIUM RISK]",
    description: "Moderate governance exposure",
    barColor: "bg-surface-solid-warning",
    textColor: "text-warning",
    glowShadow: "shadow-[0px_0px_20px_0px_rgba(250,204,21,0.3)]",
  },
  {
    stage: Stage.TWO,
    label: "STAGE 2 [LOW RISK]",
    description: "Strong governance resilience",
    barColor: "bg-surface-solid-success",
    textColor: "text-success",
    glowShadow: "shadow-[0px_0px_20px_0px_rgba(74,222,128,0.3)]",
  },
] as const;

interface StagesCardProps {
  currentDaoStage: Stage;
}

export const StagesCard = ({ currentDaoStage }: StagesCardProps) => {
  return (
    <div className="bg-surface-default flex h-[86px] w-full items-start gap-1 p-4">
      {STAGE_CONFIG.map((config, index) => {
        const isCurrentStage = currentDaoStage === config.stage;
        const isKnownStage = ![Stage.NONE, Stage.UNKNOWN].includes(
          currentDaoStage,
        );
        const isPastStage =
          isKnownStage &&
          typeof currentDaoStage === "number" &&
          typeof config.stage === "number" &&
          config.stage < currentDaoStage;

        return (
          <div key={config.stage} className="flex flex-1 items-start gap-1">
            <div
              className={cn("flex flex-1 flex-col gap-2", {
                "opacity-50": !isCurrentStage && !isPastStage,
              })}
            >
              {/* Color bar with optional pointer */}
              <div
                className={cn("relative w-full", config.barColor, {
                  [config.glowShadow]: isCurrentStage,
                })}
              >
                {isCurrentStage && (
                  <div className="absolute left-1/2 top-[-6px] text-primary flex -translate-x-1/2 items-center justify-center">
                    <PointerIcon className="rotate-180 text-primary" />
                  </div>
                )}
                <div className={cn("h-1.5 w-full", { "opacity-50": !isCurrentStage })} />
              </div>

              {/* Stage label and description */}
              <div className="flex flex-col px-1.5 leading-5">
                <p
                  className={cn(
                    "font-mono text-[13px] font-medium uppercase tracking-wider",
                    config.textColor,
                  )}
                >
                  {config.label}
                </p>
                <p className="text-secondary text-sm font-normal">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Vertical divider between stages */}
            {index < STAGE_CONFIG.length - 1 && (
              <div className="bg-surface-action h-3 w-0.5 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
};
