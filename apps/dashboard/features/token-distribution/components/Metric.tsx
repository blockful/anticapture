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
        "border-light-dark hover:bg-surface-contrast flex h-7 w-full items-center justify-between gap-2 rounded-sm border px-2",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span
          className="rounded-xs size-2"
          style={{ backgroundColor: color }}
        />
        <p className="text-primary text-sm font-medium">{label}</p>
      </div>

      <div className="flex items-center justify-end gap-2 text-end">
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
          className="text-secondary hover:text-primary size-3 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        />
      </div>
    </button>
  );
};
