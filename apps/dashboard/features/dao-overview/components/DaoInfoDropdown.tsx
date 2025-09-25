"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/shared/utils/";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/components";

interface Option {
  value: string;
  icon: ReactNode;
  href: string;
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
      <Button
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="timeInterval-value"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "hover:border-highlight border transition-all duration-200",
          {
            "border-tangerine bg-[#26262A]": isOpen,
            "bg-surface-contrast border-transparent": !isOpen,
          },
        )}
      >
        {defaultValue.icon}
        <span className="whitespace-nowrap text-sm font-medium">
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
      </Button>

      {isOpen && (
        <div className="text-primary absolute right-0 top-full z-50 mt-1 w-full min-w-[100px] rounded-md border border-white/10 bg-[#27272A] py-1">
          {options.map((option) => (
            <Link
              key={option.value}
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "hover:bg-middle-dark text-primary flex w-full items-center justify-between gap-1.5 whitespace-nowrap px-3 py-2 text-left text-sm font-normal",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span>{option.icon}</span>
                <span>{option.value}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
