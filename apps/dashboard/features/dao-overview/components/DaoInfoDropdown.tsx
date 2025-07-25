"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/shared/utils/";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  icon: ReactNode;
  onClick: () => void;
}

interface DaoInfoDropdownProps {
  defaultValue: Option;
  options: Option[];
}

export const DaoInfoDropdown = ({
  defaultValue,
  options,
}: DaoInfoDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div
      className="relative min-w-[100px]"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="timeInterval-value"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "text-primary hover:border-highlight flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 transition-all duration-200",
          {
            "border-tangerine bg-[#26262A]": isOpen,
            "bg-surface-contrast border-transparent": !isOpen,
          },
        )}
      >
        {defaultValue.icon}
        <span className="text-sm font-medium whitespace-nowrap">
          {defaultValue.value}
        </span>
        <ChevronDown
          className={cn(
            "text-primary size-3 shrink-0 transition-transform duration-200",
            {
              "rotate-180": isOpen,
            },
          )}
        />
      </button>

      {isOpen && (
        <div className="text-primary absolute top-full right-0 z-50 mt-1 w-full min-w-[100px] rounded-md border border-white/10 bg-[#27272A] py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                option.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "hover:bg-middle-dark text-primary flex w-full items-center justify-between gap-1.5 px-3 py-2 text-left text-sm font-normal whitespace-nowrap",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span>{option.icon}</span>
                <span>{option.value}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
