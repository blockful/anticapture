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
        "border-light-dark bg-surface-default hover:bg-surface-contrast flex h-full w-full flex-col justify-between rounded-sm border px-2 py-1 sm:h-7 sm:flex-row sm:items-center",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 sm:items-start sm:justify-start">
        <div className="flex items-center gap-2">
          <span
            className="rounded-xs size-2"
            style={{ backgroundColor: color }}
          />
          <p className="text-primary text-sm font-normal">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <X
            className="text-secondary hover:text-primary block size-4 cursor-pointer sm:hidden"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-end sm:justify-end">
        {value && <div className="text-secondary text-sm">{value}</div>}
        {percentage && (
          <p
            className={cn("flex items-center justify-end text-end text-sm", {
              "text-success": Number(percentage) > 0,
              "text-error": Number(percentage) < 0,
            })}
          >
            {percentage}%
          </p>
        )}
        <X
          className="text-secondary hover:text-primary hidden size-3 cursor-pointer sm:block"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        />
      </div>
    </button>
  );
};
