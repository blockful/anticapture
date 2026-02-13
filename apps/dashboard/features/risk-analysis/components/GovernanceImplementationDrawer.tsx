"use client";

import React from "react";
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
  if (!metricType || !metricData) return null;

  const sections = [
    { label: "Definition", content: metricData.description },
    {
      label: "Risk Level",
      content: (
        <p
          className={cn(
            "flex items-center gap-2 font-mono text-[13px]",
            riskTextColors[metricData.riskLevel],
          )}
        >
          {iconsMapping[metricData.riskLevel]}
          {metricData.riskLevel}
        </p>
      ),
    },
    { label: "Current Setting", content: metricData.currentSetting },
    { label: "Impact", content: metricData.impact },
    { label: "Recommended Setting", content: metricData.recommendedSetting },
    { label: "Next Step", content: metricData.nextStep },
  ];

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
