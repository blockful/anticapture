"use client";

import React, { useRef } from "react";

import { iconsMapping } from "@/features/risk-analysis/components/RiskDescription";
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/shared/components/design-system/drawer";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { GovernanceImplementationEnum, RiskLevel } from "@/shared/types/enums";
import { cn } from "@/shared/utils";

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

const SECTION_LABEL_CLASS =
  "text-secondary min-w-44 whitespace-nowrap font-mono text-[13px] font-medium uppercase leading-5 tracking-wider";
const SECTION_CONTENT_CLASS = "text-primary col-span-4 text-sm leading-5";
const DIVIDER_CLASS =
  "border-border-default h-px w-full border-t border-dashed";

const riskTextColors: Record<RiskLevel, string> = {
  [RiskLevel.HIGH]: "text-error",
  [RiskLevel.MEDIUM]: "text-warning",
  [RiskLevel.LOW]: "text-success",
  [RiskLevel.NONE]: "text-foreground",
};

interface DetailSectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const DetailSection = ({ label, children, className }: DetailSectionProps) => (
  <div className="flex flex-col gap-2 lg:flex-row">
    <h3 className={SECTION_LABEL_CLASS}>{label}</h3>
    <div className={cn(SECTION_CONTENT_CLASS, className)}>{children}</div>
  </div>
);

export const GovernanceImplementationDrawer = ({
  isOpen,
  onClose,
  metricType,
  metricData,
}: GovernanceImplementationDrawerProps) => {
  // Keep last valid data in refs so content stays visible during the close animation.
  const prevMetricTypeRef = useRef(metricType);
  const prevMetricDataRef = useRef(metricData);

  if (metricType) prevMetricTypeRef.current = metricType;
  if (metricData) prevMetricDataRef.current = metricData;

  const displayType = prevMetricTypeRef.current;
  const displayData = prevMetricDataRef.current;

  if (!displayType || !displayData) return null;

  const sections = [
    { label: "Definition", content: displayData.description },
    {
      label: "Risk Level",
      content: (
        <p
          className={cn(
            "flex items-center gap-2 font-mono text-[13px]",
            riskTextColors[displayData.riskLevel],
          )}
        >
          {iconsMapping[displayData.riskLevel]}
          {displayData.riskLevel}
        </p>
      ),
    },
    { label: "Current Setting", content: displayData.currentSetting },
    { label: "Impact", content: displayData.impact },
    { label: "Recommended Setting", content: displayData.recommendedSetting },
    { label: "Next Step", content: displayData.nextStep },
  ];

  return (
    <DrawerRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader
          subtitle="ISSUE DETAILS"
          title={displayData.name}
          onClose={onClose}
        />
        <DrawerBody className="overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-3">
            {sections.map((section, index) => (
              <React.Fragment key={section.label}>
                <DetailSection label={section.label}>
                  {section.content}
                </DetailSection>
                {index < sections.length - 1 && (
                  <div className={DIVIDER_CLASS} />
                )}
              </React.Fragment>
            ))}
          </div>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
};
