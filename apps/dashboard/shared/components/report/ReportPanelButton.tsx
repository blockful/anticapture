"use client";

import { Flag } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { ALL_DAOS, type DaoIdEnum } from "@/shared/types/daos";

import { ReportDataModal } from "./ReportDataModal";

type ReportPanelButtonProps = {
  /** Human-readable name of the panel, exactly as shown on screen. */
  panel: string;
  /** What was flagged — an address, proposal id, etc. Shown in the ClickUp title. */
  subject?: string;
  className?: string;
};

/** Small ghost Flag icon that opens the report modal for the current panel. */
export const ReportPanelButton = ({
  panel,
  subject,
  className,
}: ReportPanelButtonProps) => {
  const params = useParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Resolve DAO: try params first (works for dynamic routes including whitelabel rewrites),
  // fall back to first pathname segment (for static routes like /aave/holders-and-delegates)
  const daoId =
    (params.daoId as string | undefined) ??
    (() => {
      const segment = pathname.split("/").filter(Boolean)[0];
      return segment && ALL_DAOS.includes(segment.toUpperCase() as DaoIdEnum)
        ? segment.toLowerCase()
        : null;
    })();

  if (!daoId) return null;

  return (
    <>
      <Tooltip tooltipContent="Report incorrect data" asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={`Report incorrect data in ${panel}`}
          data-testid="report-panel-button"
          className={className}
        >
          <Flag className="size-3.5" />
        </Button>
      </Tooltip>
      <ReportDataModal
        daoId={daoId}
        panel={panel}
        subject={subject}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
