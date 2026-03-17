import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";

import type { ReportStatus } from "@/features/service-providers/types";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { cn } from "@/shared/utils";

interface StatusCellProps {
  status: ReportStatus;
  reportUrl?: string;
}

const STATUS_CONFIG = {
  published: {
    icon: Check,
    label: "PUBLISHED",
    iconClassName: "text-success",
    textClassName: "text-success",
  },
  overdue: {
    icon: AlertTriangle,
    label: "OVERDUE",
    iconClassName: "text-error",
    textClassName: "text-primary",
  },
  due_soon: {
    icon: Clock,
    label: "DUE SOON",
    iconClassName: "text-warning",
    textClassName: "text-primary",
  },
  upcoming: {
    icon: CalendarDays,
    label: "UPCOMING",
    iconClassName: "text-secondary",
    textClassName: "text-secondary",
  },
} as const;

export const StatusCell = ({ status, reportUrl }: StatusCellProps) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (status === "published" && reportUrl) {
    return (
      <DefaultLink
        href={reportUrl}
        openInNewTab
        className="text-primary border-border-contrast hover:border-primary mx-2 border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
      >
        <Icon className={cn("size-3.5 shrink-0", config.iconClassName)} />
        <span className="text-primary">{config.label}</span>
        <ExternalLink className="size-3 shrink-0" />
      </DefaultLink>
    );
  }

  return (
    <div className="mx-2 flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider">
      <Icon className={cn("size-3.5 shrink-0", config.iconClassName)} />
      <span className={config.textClassName}>{config.label}</span>
    </div>
  );
};
