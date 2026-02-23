import { Bell } from "lucide-react";

import { AlertCard } from "@/features/alerts/components";
import {
  ALERTS_ITEMS,
  AlertItem,
} from "@/features/alerts/utils/alerts-constants";
import { TheSectionLayout } from "@/shared/components";

export const AlertsSection = () => {
  return (
    <TheSectionLayout
      title={"Security Alerts"}
      icon={<Bell className="section-layout-icon" />}
      description={
        "With one click, get real-time governance alerts. Stay ahead of governance updates and take the path to being an active delegate without checking manually."
      }
      className="bg-surface-background! mt-[56px]! lg:mt-0! border-b-0!"
    >
      <div className="flex flex-col gap-2">
        {/* Dashed line separator - Mobile only */}
        <div className="border-light-dark -mx-4 border-t border-dashed lg:hidden" />

        <div className="grid grid-cols-1 gap-3 py-5 lg:grid-cols-3">
          {ALERTS_ITEMS.map((alert: AlertItem) => (
            <AlertCard
              key={alert.title}
              title={alert.title}
              description={alert.description}
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
