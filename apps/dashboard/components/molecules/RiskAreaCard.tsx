"use client";

import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/client/utils";
import { ReactNode, useRef, useState } from "react";
import { RiskTooltipCard } from "@/components/atoms";
import { RISK_AREAS } from "@/lib/constants/risk-areas";
import { RiskAreaEnum } from "@/lib/enums/RiskArea";
import { TooltipPortal } from "@/components/atoms/TooltipPortal";

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

type GridColumns = `${string}grid-cols-${number}${string}`;

interface RiskAreaCardWrapperProps {
  title?: string;
  riskAreas: RiskArea[];
  activeRiskId?: string;
  onRiskClick?: (riskName: RiskAreaEnum) => void;
  gridColumns?: GridColumns;
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
            "bg-lightDark": risk.level === undefined,
            "bg-success shadow-success/30": risk.level === RiskLevel.LOW,
            "bg-warning shadow-warning/30": risk.level === RiskLevel.MEDIUM,
            "bg-error shadow-error/30": risk.level === RiskLevel.HIGH,
            "shadow-[0_0_20px_0]": isActive || isHovered,
            "bg-opacity-[12%]":
              !isActive && risk.level !== undefined && !isHovered,
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
              "!text-foreground": risk.level === undefined,
              "!text-success":
                risk.level === RiskLevel.LOW && !isActive && !isHovered,
              "!text-warning":
                risk.level === RiskLevel.MEDIUM && !isActive && !isHovered,
              "!text-error":
                risk.level === RiskLevel.HIGH && !isActive && !isHovered,
              "text-darkest":
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
              <CounterClockwiseClockIcon className="size-4 text-foreground sm:size-5" />
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
              "bg-opacity-[12%]": !isActive && isBox3Filled && !isHovered,
              "bg-lightDark": risk.level === undefined || !isBox3Filled,
            })}
          />
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW && isBox2Filled,
              "bg-warning": risk.level === RiskLevel.MEDIUM && isBox2Filled,
              "bg-error": risk.level === RiskLevel.HIGH && isBox2Filled,
              "bg-opacity-[12%]": !isActive && isBox2Filled && !isHovered,
              "bg-lightDark": risk.level === undefined || !isBox2Filled,
            })}
          />
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW,
              "bg-warning": risk.level === RiskLevel.MEDIUM,
              "bg-error": risk.level === RiskLevel.HIGH,
              "bg-opacity-[12%]":
                !isActive && risk.level !== undefined && !isHovered,
              "bg-lightDark": risk.level === undefined,
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
      setShowTooltip(true);
    }
  };

  const [showTooltip, setShowTooltip] = useState<boolean>(false);
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
      <div
        className="relative h-[42px]"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <RiskAreaCardInternal
          risk={riskArea}
          isActive={isActive}
          onClick={onClick}
          variant={variant}
        />

        {showTooltip && (
          <div className="fixed top-[520px] z-50 mt-1 w-screen max-sm:left-0 sm:relative sm:right-[150px] sm:top-0 sm:w-[376px]">
            <RiskTooltipCard
              title={riskInfo.title}
              description={riskInfo.description}
              riskLevel={riskArea.level}
            />
          </div>
        )}
      </div>
    ),
    [RiskAreaCardEnum.RISK_ANALYSIS]: (
      <div className="flex h-[62px] w-full">
        <div
          className={cn(
            "w-full p-1.5",
            isActive && "border-[2px] border-middleDark bg-darkest sm:bg-dark",
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
            <div className="size-0 border-y-[13px] border-l-[13px] border-y-transparent border-l-middleDark" />
          )}
        </div>
      </div>
    ),
    [RiskAreaCardEnum.PANEL_TABLE]: (
      <div
        className="flex size-5 sm:size-7"
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <RiskAreaCardInternal
          risk={modifiedRiskArea}
          isActive={isActive}
          onClick={onClick}
          variant={variant}
        />
        {showTooltip && (
          <TooltipPortal>
            <div
              className="fixed left-1/2 z-50 w-80 -translate-x-1/2 text-white shadow-lg"
              style={{ top: tooltipPos.top, left: tooltipPos.left }}
            >
              <RiskTooltipCard
                title={riskInfo.title}
                description={riskInfo.description}
                riskLevel={riskArea.level}
              />
            </div>
          </TooltipPortal>
        )}
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
