"use client";

import { Button } from "@/shared/components";
import { OutlinedBox } from "@/shared/components/boxes/OutlinedBox";
import { StageRequirementsTooltip } from "@/features/dao-overview/components/StageRequirementsTooltip";
import { Stage } from "@/shared/types/enums/Stage";
import { cn } from "@/shared/utils/";
import { formatPlural } from "@/shared/utils/";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

interface StagesTooltipButtonProps {
  currentDaoStage: Stage;
  isStageKnown: boolean;
  highRiskItemsCount: number;
  mediumRiskItemsCount: number;
  lowRiskItemsCount: number;
  requirements: string[];
  daoId: string;
}

export const StagesTooltipButton = ({
  currentDaoStage,
  isStageKnown,
  highRiskItemsCount,
  mediumRiskItemsCount,
  lowRiskItemsCount,
  requirements,
  daoId,
}: StagesTooltipButtonProps) => {
  const totalItems =
    highRiskItemsCount || mediumRiskItemsCount || lowRiskItemsCount;

  const boxConfigs = [
    { variant: "error" as const, count: highRiskItemsCount },
    { variant: "warning" as const, count: mediumRiskItemsCount },
    { variant: "success" as const, count: lowRiskItemsCount },
  ];

  return (
    <div className="group relative">
      {/* Hidden checkbox for mobile toggle - CSS only */}
      <input type="checkbox" id="tooltip-toggle" className="peer sr-only" />
      <div className="border-light-dark bg-surface-contrast flex items-center justify-between gap-1 border-b p-2 sm:border-none sm:p-3">
        {currentDaoStage === Stage.NONE ? (
          <span className="text-secondary group-hover:text-primary font-mono text-sm/tight font-medium uppercase duration-300">
            Does not qualify
          </span>
        ) : (
          <>
            {/* Mobile: Button wrapped in label to toggle checkbox */}
            <label
              htmlFor="tooltip-toggle"
              className="cursor-pointer sm:hidden"
            >
              <Button variant="ghost" className="px-0 py-0 font-mono">
                <span className="border-foreground text-alternative-sm text-nowrap border-b border-dashed font-medium duration-300 hover:border-white">
                  <span className="text-primary uppercase duration-300">
                    {currentDaoStage !== Stage.UNKNOWN
                      ? formatPlural(totalItems, "ITEM")
                      : "? ITEMS"}
                  </span>
                  <span
                    className={cn(
                      "text-secondary duration-300",
                      isStageKnown && "group-hover:text-primary",
                    )}
                  >
                    {" "}
                    {isStageKnown
                      ? `TO STAGE ${Number(currentDaoStage) + 1}`
                      : "TO NEXT"}
                  </span>
                </span>
              </Button>
            </label>
            {/* Desktop: Link that navigates to resilience stages page */}
            <DefaultLink
              href={`/${daoId.toLowerCase()}/${PAGES_CONSTANTS.resilienceStages.page}`}
              openInNewTab={false}
              className="hidden px-0 py-0 font-mono sm:block"
            >
              <span className="border-foreground text-alternative-sm text-nowrap border-b border-dashed font-medium duration-300 hover:border-white">
                <span className="text-primary uppercase duration-300">
                  {currentDaoStage !== Stage.UNKNOWN
                    ? formatPlural(totalItems, "ITEM")
                    : "? ITEMS"}
                </span>
                <span
                  className={cn(
                    "text-secondary duration-300",
                    isStageKnown && "group-hover:text-primary",
                  )}
                >
                  {" "}
                  {isStageKnown
                    ? `TO STAGE ${Number(currentDaoStage) + 1}`
                    : "TO NEXT"}
                </span>
              </span>
            </DefaultLink>
          </>
        )}

        <div className="flex gap-1.5">
          {boxConfigs.map(({ variant, count }) => (
            <label
              key={variant}
              htmlFor="tooltip-toggle"
              className="cursor-pointer"
            >
              <OutlinedBox
                variant={variant}
                disabled={!isStageKnown}
                className={cn("border-0 px-2 py-1", {
                  border: currentDaoStage === Stage.NONE,
                })}
              >
                <span className="font-mono">{count}</span>
              </OutlinedBox>
            </label>
          ))}
        </div>
      </div>
      {/* Tooltip shown on hover (desktop) or checkbox checked (mobile) */}
      <div className="hidden peer-checked:block sm:group-hover:block">
        {isStageKnown && (
          <StageRequirementsTooltip
            currentStage={currentDaoStage}
            nextStage={Number(currentDaoStage) + 1}
            requirements={requirements}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        )}
      </div>
    </div>
  );
};
