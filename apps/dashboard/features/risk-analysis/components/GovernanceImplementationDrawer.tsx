"use client";

import { Drawer, DrawerContent } from "@/shared/components/ui/drawer";
import { X } from "lucide-react";
import { GovernanceImplementationEnum, RiskLevel } from "@/shared/types/enums";
import { IconButton } from "@/shared/components";
import { useScreenSize } from "@/shared/hooks";
import { iconsMapping } from "@/features/risk-analysis/components/RiskDescription";
import { cn } from "@/shared/utils";
import { GovernanceImplementationField } from "@/shared/dao-config/types";

interface GovernanceImplementationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: GovernanceImplementationEnum | null;
  metricData:
    | (GovernanceImplementationField & {
        name: string;
      })
    | null;
}

const riskTextColors: Record<RiskLevel, string> = {
  [RiskLevel.HIGH]: "text-error",
  [RiskLevel.MEDIUM]: "text-warning",
  [RiskLevel.LOW]: "text-success",
  [RiskLevel.NONE]: "text-foreground",
};

export const GovernanceImplementationDrawer = ({
  isOpen,
  onClose,
  metricType,
  metricData,
}: GovernanceImplementationDrawerProps) => {
  const { isMobile } = useScreenSize();
  if (!metricType || !metricData) return null;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent>
        <div className="bg-surface-default flex h-full w-full flex-col overflow-hidden">
          <div className="bg-surface-contrast w-full shrink-0">
            {/* Header */}
            <div className="bg-surface-contrast flex justify-between p-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-secondary font-mono text-xs font-medium uppercase tracking-wide">
                  ISSUE DETAILS
                </span>
                <span className="text-primary text-lg font-medium leading-6">
                  {metricData.name}
                </span>
              </div>

              <IconButton
                variant="outline"
                size="sm"
                onClick={onClose}
                icon={X}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-3">
              {/* Definition */}
              <div className="flex gap-2">
                <h3 className="text-secondary min-w-44 whitespace-nowrap font-mono text-[13px] font-medium uppercase leading-5 tracking-wider">
                  Definition
                </h3>
                <p className="text-primary col-span-4 text-sm leading-5">
                  {metricData.description}
                </p>
              </div>

              <div className="border-border-default h-px w-full border-t border-dashed" />

              {/* Risk Level */}
              <div className="flex gap-2">
                <h3 className="text-secondary min-w-44 whitespace-nowrap font-mono text-[13px] font-medium uppercase leading-5 tracking-wider">
                  Risk Level
                </h3>
                <p
                  className={cn(
                    "text-primary col-span-4 flex items-center gap-2 font-mono text-[13px] leading-5",
                    riskTextColors[metricData.riskLevel],
                  )}
                >
                  {iconsMapping[metricData.riskLevel]}
                  {metricData.riskLevel}
                </p>
              </div>

              <div className="border-border-default h-px w-full border-t border-dashed" />

              {/* Current Setting */}
              <div className="flex gap-2">
                <h3 className="text-secondary min-w-44 whitespace-nowrap font-mono text-[13px] font-medium uppercase leading-5 tracking-wider">
                  Current Setting
                </h3>
                <p className="text-primary col-span-4 text-sm leading-5">
                  {metricData.currentSetting}
                </p>
              </div>

              <div className="border-border-default h-px w-full border-t border-dashed" />

              {/* Impact */}
              <div className="flex gap-2">
                <h3 className="text-secondary min-w-44 whitespace-nowrap font-mono text-[13px] font-medium uppercase leading-5 tracking-wider">
                  Impact
                </h3>
                <p className="text-primary col-span-4 text-sm leading-5">
                  {metricData.impact}
                </p>
              </div>

              <div className="border-border-default h-px w-full border-t border-dashed" />

              {/* Recommended Setting */}
              <div className="flex gap-2">
                <h3 className="text-secondary min-w-44 whitespace-nowrap font-mono text-[13px] font-medium uppercase leading-5 tracking-wider">
                  Recommended Setting
                </h3>
                <p className="text-primary col-span-4 text-sm leading-5">
                  {metricData.recommendedSetting}
                </p>
              </div>

              <div className="border-border-default h-px w-full border-t border-dashed" />

              {/* Next Step */}
              <div className="flex gap-2">
                <h3 className="text-secondary min-w-44 whitespace-nowrap font-mono text-[13px] font-medium uppercase leading-5 tracking-wider">
                  Next Step
                </h3>
                <p className="text-primary col-span-4 text-sm leading-5">
                  {metricData.nextStep}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
