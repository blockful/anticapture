import { Bell } from "lucide-react";
import { TheSectionLayout } from "@/shared/components";

export const AlertsSection = () => {
  // get alerts constants from somewhere

  return (
    <TheSectionLayout
      title={"Security Alerts"}
      icon={<Bell className="section-layout-icon" />}
      description={
        "With one click, get real-time governance alerts. Stay ahead of governance updates and take the path to being an active delegate without checking manually."
      }
      className="bg-surface-background! mt-[56px]! sm:mt-0!"
    >
      <div className="flex flex-col gap-2">
        <h1>Alerts</h1>
      </div>
    </TheSectionLayout>
  );
};
