import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";

import { ReportStatus } from "@/features/service-providers/types";
import { cn } from "@/shared/utils";

interface StatusCellProps {
  status: ReportStatus;
  reportUrl?: string;
}

const STATUS_CONFIG = {
  published: {
    icon: Check,
    label: "PUBLISHED",
    className: "text-success",
  },
  overdue: {
    icon: AlertTriangle,
    label: "OVERDUE",
    className: "text-warning",
  },
  due_soon: {
    icon: Clock,
    label: "DUE SOON",
    className: "text-yellow-400",
  },
  upcoming: {
    icon: CalendarDays,
    label: "UPCOMING",
    className: "text-secondary",
  },
} as const;

export const StatusCell = ({ status, reportUrl }: StatusCellProps) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (status === "published" && reportUrl) {
    return (
      <a
        href={reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-80",
          config.className,
        )}
      >
        <Icon className="size-3.5 shrink-0" />
        <span>{config.label}</span>
        <ExternalLink className="size-3 shrink-0" />
      </a>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider",
        config.className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{config.label}</span>
    </div>
  );
};
