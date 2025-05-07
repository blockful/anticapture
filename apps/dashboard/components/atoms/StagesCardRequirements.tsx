"use client";

import { cn } from "@/lib/client/utils";
import { AlertCircle } from "lucide-react";
import { PointerIcon } from "@/components/atoms/icons";

export enum Stage {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
}

const STAGE_STYLES: Record<Stage, string> = {
  [Stage.ZERO]: "text-error",
  [Stage.ONE]: "text-warning",
  [Stage.TWO]: "text-success",
};

const STAGE_TITLES: Record<Stage, string> = {
  [Stage.ZERO]: "STAGE 0: HIGH RISK",
  [Stage.ONE]: "STAGE 1: MEDIUM RISK",
  [Stage.TWO]: "STAGE 2: LOW RISK",
};

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  [Stage.ZERO]:
    "A Stage 0 DAO has at least one implementation detail identified as High Risk.",
  [Stage.ONE]:
    "A Stage 1 DAO has no implementation details identified as at High Risk, but still has at least one identified as Medium Risk.",
  [Stage.TWO]:
    "A Stage 2 DAO has no implementation details identified as Medium or High Risk.",
};

const STAGE_POINTER_POSITIONS: Record<Stage, string> = {
  [Stage.ZERO]: "bottom-0 left-[25%] -translate-x-1/2 translate-y-[1px]",
  [Stage.ONE]: "bottom-0 left-[75%] -translate-x-1/2 translate-y-[1px]",
  [Stage.TWO]: "hidden",
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
    STAGE_STYLES[daoStage] || "border-middleDark text-foreground";

  return (
    <div>
      <div className="relative w-full">
        <PointerIcon
          className={cn(
            "absolute bottom-0 -translate-x-1/2 translate-y-[1px]",
            STAGE_POINTER_POSITIONS[daoStage],
          )}
        />
      </div>

      <div
        className={`rounded-md bg-lightDark p-4 ${stageStyles} ${className}`}
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
  children: React.ReactNode;
  daoStage: Stage;
}) => {
  return (
    <h3
      className={cn([
        "mb-2 font-mono text-xs font-medium uppercase leading-4 tracking-[0.72px]",
        STAGE_STYLES[daoStage],
      ])}
    >
      {children}
    </h3>
  );
};

const Description = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="font-inter mb-4 text-sm font-normal leading-5 text-white">
      {children}
    </p>
  );
};

const Issue = ({
  children,
  daoStage,
}: {
  children: React.ReactNode;
  daoStage: Stage;
}) => {
  return (
    <div className="flex items-center gap-[6px]">
      <AlertCircle className={cn(["size-4", STAGE_STYLES[daoStage]])} />
      <span className="font-inter text-sm font-normal leading-5 text-white">
        {children}
      </span>
    </div>
  );
};
