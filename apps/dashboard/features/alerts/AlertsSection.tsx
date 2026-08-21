import { Bell } from "lucide-react";

import { AlertCard } from "@/features/alerts/components";
import type { AlertItem } from "@/features/alerts/utils/alerts-constants";
import { ALERTS_ITEMS } from "@/features/alerts/utils/alerts-constants";
import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";

export const AlertsSection = () => {
  return (
    <TheSectionLayout
      title={"Security Alerts"}
      icon={<Bell className="section-layout-icon" />}
      description={
        "With one click, get real-time governance alerts. Stay ahead of governance updates and take the path to being an active delegate without checking manually."
      }
      className="bg-surface-background! lg:mt-0! border-b-0!"
    >
      <div className="flex flex-col gap-2">
        <div className="bg-surface-default flex flex-col gap-1 p-4">
          {/* Not a heading: the section title above renders as h4, so any
           * heading here would invert the document outline. */}
          <p className="text-primary text-alternative-xs font-mono font-medium uppercase leading-4 tracking-wider">
            What you get pinged about
          </p>
          <p className="text-secondary text-sm font-normal leading-5">
            New proposals on-chain or Snapshot, vote reminders, delegation
            shifts, and results for the DAOs you track. You choose the triggers;
            pick a channel below to start.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 py-5 lg:grid-cols-3">
          {ALERTS_ITEMS.map((alert: AlertItem) => (
            <AlertCard
              key={alert.title}
              title={alert.title}
              icon={alert.icon}
              availability={alert.availability}
              link={alert.link}
              active={alert.active}
            />
          ))}
        </div>
      </div>
    </TheSectionLayout>
  );
};
