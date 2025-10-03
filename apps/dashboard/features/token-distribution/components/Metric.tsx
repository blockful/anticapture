"use client";

import { X } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

interface MetricProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  color: string;
  value?: string | number;
  percentage?: string | number;
  onRemove?: () => void;
}

export const Metric = ({
  label,
  color,
  value,
  percentage,
  onRemove,
  className,
  ...props
}: MetricProps) => {
  return (
    <button
      className={cn(
        "border-light-dark bg-surface-default hover:bg-surface-contrast flex h-full w-full flex-col justify-between rounded-sm border px-2 py-1 xl:h-7 xl:flex-row xl:items-center xl:gap-2",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 xl:items-start xl:justify-start">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="rounded-xs size-2 shrink-0"
            style={{ backgroundColor: color }}
          />
          <p className="text-primary truncate text-sm font-normal">{label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <X
            className="text-secondary hover:text-primary block size-4 cursor-pointer xl:hidden"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-end xl:justify-end">
        {value && (
          <div className="text-secondary whitespace-nowrap text-sm">
            {value}
          </div>
        )}
        {percentage && (
          <p
            className={cn(
              "flex items-center justify-end whitespace-nowrap text-end text-sm",
              {
                "text-success": Number(percentage) > 0,
                "text-error": Number(percentage) < 0,
              },
            )}
          >
            {percentage}%
          </p>
        )}
        <X
          className="text-secondary hover:text-primary hidden size-3 cursor-pointer xl:block"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        />
      </div>
    </button>
  );
};
