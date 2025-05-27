"use client";

import { cn } from "@/shared/utils/";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { PointerIcon } from "@/shared/components/icons";
import { Stage } from "@/shared/types/enums/Stage";
import { ReactNode } from "react";

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "text-error",
  [Stage.ONE]: "text-warning",
  [Stage.TWO]: "text-success",
  [Stage.NONE]: "text-middle-dark",
};

const STAGE_TITLES: Record<Stage, string> = {
  [Stage.ZERO]: "STAGE 0: HIGH RISK",
  [Stage.ONE]: "STAGE 1: MEDIUM RISK",
  [Stage.TWO]: "STAGE 2: LOW RISK",
  [Stage.NONE]: "",
};

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  [Stage.ZERO]:
    "A Stage 0 DAO has at least one implementation detail identified as High Risk.",
  [Stage.ONE]:
    "A Stage 1 DAO has no implementation details identified as at High Risk, but still has at least one identified as Medium Risk.",
  [Stage.TWO]:
    "A Stage 2 DAO has no implementation details identified as Medium or High Risk.",
  [Stage.NONE]: "",
};

const STAGE_POINTER_POSITIONS: Record<Stage, string> = {
  [Stage.ZERO]: "bottom-0 left-[25%] -translate-x-1/2 translate-y-px",
  [Stage.ONE]: "bottom-0 left-[75%] -translate-x-1/2 translate-y-px",
  [Stage.TWO]: "hidden",
  [Stage.NONE]: "",
};

interface StagesCardRequirementsProps {
  daoStage: Stage;
  issues?: Array<string>;
  className?: string;
}

export const StagesCardRequirements = ({
  daoStage,
  issues = ["Security Council", "Voting Period", "Proposal Threshold"],
  className = "",
}: StagesCardRequirementsProps) => {
  const stageStyles =
    STAGE_STYLES[daoStage] || "border-middle-dark text-secondary";

  return (
    <div>
      <div className="relative w-full">
        <PointerIcon
          className={cn(
            "absolute bottom-0 -translate-x-1/2 translate-y-px",
            STAGE_POINTER_POSITIONS[daoStage],
          )}
        />
      </div>

      <div
        className={`bg-light-dark rounded-md p-4 ${stageStyles} ${className}`}
      >
        <Title daoStage={daoStage}>{STAGE_TITLES[daoStage]}</Title>
        <Description>{STAGE_DESCRIPTIONS[daoStage]}</Description>

        {issues.length > 0 && (
          <>
            <Title daoStage={daoStage}>Issues that need to be fixed</Title>
            <div className="flex flex-wrap gap-4">
              {issues.map((issue, index) => (
                <Issue key={index} daoStage={daoStage}>
                  {issue}
                </Issue>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Title = ({
  children,
  daoStage,
}: {
  children: ReactNode;
  daoStage: Stage;
}) => {
  return (
    <h3
      className={cn([
        "mb-2 font-mono text-xs leading-4 font-medium tracking-wider uppercase",
        STAGE_STYLES[daoStage],
      ])}
    >
      {children}
    </h3>
  );
};

const Description = ({ children }: { children: ReactNode }) => {
  return (
    <p className="font-inter text-primary mb-4 text-sm leading-5 font-normal">
      {children}
    </p>
  );
};

const Issue = ({
  children,
  daoStage,
}: {
  children: ReactNode;
  daoStage: Stage;
}) => {
  return (
    <div className="flex items-center gap-[6px]">
      {daoStage === Stage.ZERO && (
        <AlertTriangle className="text-error size-4" />
      )}
      {daoStage === Stage.ONE && (
        <AlertCircle className="text-warning size-4" />
      )}
      <span className="font-inter text-primary text-sm leading-5 font-normal">
        {children}
      </span>
    </div>
  );
};
