"use client";

import { ReactNode, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { cn } from "@/shared/utils/";
import { RiskTooltipCard } from "@/shared/components";
import { RISK_AREAS } from "@/shared/constants/risk-areas";
import { RiskAreaEnum } from "@/shared/types/enums";

export type RiskArea = {
  name: string;
  content?: ReactNode;
  level?: RiskLevel;
};

export enum RiskAreaCardEnum {
  DAO_OVERVIEW = "dao-overview",
  RISK_ANALYSIS = "risk-analysis",
  PANEL_TABLE = "panel-table",
}

interface RiskAreaCardProps {
  riskArea: RiskArea;
  isActive?: boolean;
  onClick?: () => void;
  variant?: RiskAreaCardEnum;
}

interface RiskAreaCardWrapperProps {
  title?: string;
  riskAreas: RiskArea[];
  activeRiskId?: string;
  onRiskClick?: (riskName: RiskAreaEnum) => void;
  className?: string;
  variant?: RiskAreaCardEnum;
  withTitle?: boolean;
}

interface RiskAreaCardInternalProps {
  risk: RiskArea;
  isActive: boolean;
  onClick?: () => void;
  variant: RiskAreaCardEnum;
}

/**
 * Internal component for the risk area card content
 */
const RiskAreaCardInternal = ({
  risk,
  isActive,
  onClick,
  variant,
}: RiskAreaCardInternalProps) => {
  // Determine which boxes should be filled based on risk level
  const isBox2Filled =
    risk.level === RiskLevel.MEDIUM || risk.level === RiskLevel.HIGH;
  const isBox3Filled = risk.level === RiskLevel.HIGH;
  const [isHovered, setIsHovered] = useState<boolean>(false);
  // Adjust styling based on variant
  const isRiskAnalysis = variant === RiskAreaCardEnum.RISK_ANALYSIS;
  const isPanelTable = variant === RiskAreaCardEnum.PANEL_TABLE;

  const riskLevelIcons = {
    [RiskLevel.LOW]: (
      <CheckCircle2
        className={cn(
          "size-4",
          isActive || isHovered ? "text-darkest" : "text-success",
        )}
      />
    ),
    [RiskLevel.MEDIUM]: (
      <AlertCircle
        className={cn(
          "size-4",
          isActive || isHovered ? "text-darkest" : "text-warning",
        )}
      />
    ),
    [RiskLevel.HIGH]: (
      <AlertTriangle
        className={cn(
          "size-4",
          isActive || isHovered ? "text-darkest" : "text-error",
        )}
      />
    ),
    [RiskLevel.NONE]: <></>,
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-1 cursor-pointer items-center gap-1",
        isPanelTable && "cursor-default",
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex h-full items-center px-1 py-2 sm:px-2",
          !isPanelTable ? "flex-1 justify-between" : "size-7 p-0 text-center",
          {
            "bg-light-dark": risk.level === RiskLevel.NONE,
            "bg-success shadow-success/30": risk.level === RiskLevel.LOW,
            "bg-warning shadow-warning/30": risk.level === RiskLevel.MEDIUM,
            "bg-error shadow-error/30": risk.level === RiskLevel.HIGH,
            "shadow-[0_0_20px_0]":
              (isActive || isHovered) && risk.level !== RiskLevel.NONE,
            "bg-success/12":
              !isActive && risk.level === RiskLevel.LOW && !isHovered,
            "bg-warning/12":
              !isActive && risk.level === RiskLevel.MEDIUM && !isHovered,
            "bg-error/12":
              !isActive && risk.level === RiskLevel.HIGH && !isHovered,
          },
        )}
      >
        <div
          className={cn(
            "flex items-center",
            isPanelTable && "w-full justify-center",
          )}
        >
          <span
            className={cn("block font-mono font-medium sm:tracking-wider", {
              "text-foreground!": risk.level === RiskLevel.NONE,
              "!text-success":
                risk.level === RiskLevel.LOW && !isActive && !isHovered,
              "text-warning!":
                risk.level === RiskLevel.MEDIUM && !isActive && !isHovered,
              "text-error!":
                risk.level === RiskLevel.HIGH && !isActive && !isHovered,
              "!text-darkest":
                (isActive && risk.level !== undefined) || isHovered,
              "text-alternative-sm": isRiskAnalysis,
              "text-xs": !isRiskAnalysis,
            })}
            title={risk.name}
          >
            {risk.content ? risk.content : risk.name}
          </span>
        </div>
        <div
          className={cn(
            "flex w-fit items-center justify-center",
            isPanelTable && "hidden",
          )}
        >
          {risk.level ? (
            riskLevelIcons[risk.level as RiskLevel]
          ) : (
            <div className="flex items-center justify-center font-mono text-xs">
              <CounterClockwiseClockIcon className="text-foreground size-4 sm:size-5" />
            </div>
          )}
        </div>
      </div>
      <div className={cn("flex h-full items-center", isPanelTable && "hidden")}>
        <div className="flex h-full flex-col gap-1">
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW && isBox3Filled,
              "bg-warning": risk.level === RiskLevel.MEDIUM && isBox3Filled,
              "bg-error": risk.level === RiskLevel.HIGH && isBox3Filled,
              "bg-success/12":
                risk.level === RiskLevel.LOW &&
                !isActive &&
                isBox3Filled &&
                !isHovered,
              "bg-warning/12":
                risk.level === RiskLevel.MEDIUM &&
                !isActive &&
                isBox3Filled &&
                !isHovered,
              "bg-error/12":
                risk.level === RiskLevel.HIGH &&
                !isActive &&
                isBox3Filled &&
                !isHovered,
              "bg-light-dark": risk.level === undefined || !isBox3Filled,
            })}
          />
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW && isBox2Filled,
              "bg-warning": risk.level === RiskLevel.MEDIUM && isBox2Filled,
              "bg-error": risk.level === RiskLevel.HIGH && isBox2Filled,
              "bg-success/12":
                risk.level === RiskLevel.LOW &&
                !isActive &&
                isBox2Filled &&
                !isHovered,
              "bg-warning/12":
                risk.level === RiskLevel.MEDIUM &&
                !isActive &&
                isBox2Filled &&
                !isHovered,
              "bg-error/12":
                risk.level === RiskLevel.HIGH &&
                !isActive &&
                isBox2Filled &&
                !isHovered,
              "bg-light-dark": risk.level === undefined || !isBox2Filled,
            })}
          />
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW,
              "bg-warning": risk.level === RiskLevel.MEDIUM,
              "bg-error": risk.level === RiskLevel.HIGH,
              "bg-success/12":
                risk.level === RiskLevel.LOW && !isActive && !isHovered,
              "bg-warning/12":
                risk.level === RiskLevel.MEDIUM && !isActive && !isHovered,
              "bg-error/12":
                risk.level === RiskLevel.HIGH && !isActive && !isHovered,
              "bg-light-dark": risk.level === undefined,
            })}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Individual card component for a single risk area
 */
export const RiskAreaCard = ({
  riskArea,
  isActive = false,
  onClick,
  variant = RiskAreaCardEnum.DAO_OVERVIEW,
}: RiskAreaCardProps) => {
  const riskName = riskArea.name;
  const riskInfo = RISK_AREAS[riskName as RiskAreaEnum] || {
    title: riskName,
    titleAbbreviation: RISK_AREAS[riskName as RiskAreaEnum].titleAbbreviation,
    description: "Risk description not available.",
  };

  const modifiedRiskArea = {
    ...riskArea,
    content: riskInfo.titleAbbreviation,
  };

  const riskAreaCard: Record<RiskAreaCardEnum, ReactNode> = {
    [RiskAreaCardEnum.DAO_OVERVIEW]: (
      <RiskTooltipCard
        title={riskInfo.title}
        description={riskInfo.description}
        riskLevel={riskArea.level}
      >
        <div className="relative h-[42px]">
          <RiskAreaCardInternal
            risk={riskArea}
            isActive={isActive}
            onClick={onClick}
            variant={variant}
          />
        </div>
      </RiskTooltipCard>
    ),
    [RiskAreaCardEnum.RISK_ANALYSIS]: (
      <div className="flex h-[62px] w-full">
        <div
          className={cn(
            "w-full p-1.5",
            isActive && "border-middle-dark bg-darkest sm:bg-dark border-2",
          )}
        >
          <RiskAreaCardInternal
            risk={riskArea}
            isActive={isActive}
            onClick={onClick}
            variant={variant}
          />
        </div>
        <div className="hidden h-full w-[13px] items-center justify-center sm:flex">
          {isActive && (
            <div className="border-l-middle-dark border-y-13 border-l-13 size-0 border-y-transparent" />
          )}
        </div>
      </div>
    ),
    [RiskAreaCardEnum.PANEL_TABLE]:
      riskArea.level !== RiskLevel.NONE ? (
        <RiskTooltipCard
          title={riskInfo.title}
          description={riskInfo.description}
          riskLevel={riskArea.level}
        >
          <div className="flex size-5 sm:size-7">
            <RiskAreaCardInternal
              risk={modifiedRiskArea}
              isActive={isActive}
              onClick={onClick}
              variant={variant}
            />
          </div>
        </RiskTooltipCard>
      ) : (
        <div className="flex size-5 sm:size-7">
          <RiskAreaCardInternal
            risk={modifiedRiskArea}
            isActive={isActive}
            onClick={onClick}
            variant={variant}
          />
        </div>
      ),
  };

  return riskAreaCard[variant];
};

/**
 * Wrapper component that organizes multiple RiskAreaCards into columns
 */
export const RiskAreaCardWrapper = ({
  title,
  riskAreas,
  activeRiskId,
  onRiskClick,
  className,
  variant = RiskAreaCardEnum.DAO_OVERVIEW,
  withTitle = true,
  withTooltip = true,
}: RiskAreaCardWrapperProps & { withTooltip?: boolean }) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {/* Desktop title */}
      {withTitle && (
        <h3 className="mb-3 hidden font-mono text-xs font-medium tracking-wider text-white sm:block">
          {title}
        </h3>
      )}

      <div className={cn("", className)}>
        {riskAreas.map((risk: RiskArea, index: number) => (
          <RiskAreaCard
            key={`${risk.name}-${index}`}
            riskArea={risk}
            isActive={activeRiskId === risk.name}
            onClick={() => onRiskClick?.(risk.name as RiskAreaEnum)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
};
