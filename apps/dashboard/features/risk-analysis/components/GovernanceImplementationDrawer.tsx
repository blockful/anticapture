"use client";

import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/shared/components/design-system/drawer";
import { GovernanceImplementationEnum, RiskLevel } from "@/shared/types/enums";
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
  if (!metricType || !metricData) return null;

  return (
    <DrawerRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader
          subtitle="ISSUE DETAILS"
          title={metricData.name}
          onClose={onClose}
        />
        <DrawerBody className="overflow-y-auto px-6 py-6">
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
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
};
