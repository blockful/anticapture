import { cn } from "@/shared/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  value: Option;
  options: Option[];
  onClick?: (value: Option) => void;
}

export const Dropdown = ({ value, options, onClick }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = (option: Option) => {
    onClick?.(option);
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="dropdown-options"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "text-primary hover:border-highlight flex min-w-[100px] cursor-pointer items-center justify-between gap-1 rounded-lg border px-2 py-1 transition-all duration-200",
          {
            "border-tangerine bg-[#26262A]": isOpen,
            "bg-surface-contrast border-transparent": !isOpen,
          },
        )}
      >
        <span className="whitespace-nowrap text-sm font-medium">
          {value.label}
        </span>
        <ChevronDown
          className={cn(
            "text-primary size-3 shrink-0 transition-transform duration-200",
            { "rotate-180": isOpen },
          )}
        />
      </button>

      {isOpen && (
        <div
          id="dropdown-options"
          role="listbox"
          className="text-primary absolute right-0 z-50 mt-1 w-full min-w-[140px] rounded-md border border-white/10 bg-[#27272A] py-1 shadow-md"
        >
          {options.map((option) => {
            const selected = option.value === value.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-1.5 px-3 py-2 text-left text-sm",
                  "transition-colors duration-150",
                  {
                    "bg-middle-dark text-white": selected,
                    "hover:bg-middle-dark/70": !selected,
                  },
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
