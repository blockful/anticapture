import { useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Filter, Check } from "lucide-react";
import { cn } from "@/shared/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FilterDropdown = ({
  options,
  selectedValue,
  onValueChange,
  className,
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4, // 4px gap
        left: rect.left,
        minWidth: rect.width,
        zIndex: 99999, // increased z-index
        pointerEvents: "auto", // ensure pointer events are enabled
      });
    }
  }, [isOpen]);

  const handleOptionClick = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex cursor-pointer items-center rounded-sm border p-1 transition-colors",
          "hover:border-highlight bg-surface-hover border-transparent",
          isOpen && "border-highlight bg-surface-hover",
        )}
      >
        <Filter className="text-primary size-3" />
      </button>

      {isOpen &&
        createPortal(
          <div
            style={dropdownStyle}
            className="bg-surface-contrast border-border-contrast pointer-events-auto rounded-md border py-1"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={cn(
                  "hover:bg-surface-hover flex w-full items-center justify-between px-3 py-2 text-left",
                  selectedValue === option.value && "bg-surface-hover",
                  index === 0 && "border-border-contrast border-b",
                )}
              >
                <span className="text-primary whitespace-nowrap text-sm font-normal">
                  {option.label}
                </span>
                {selectedValue === option.value && (
                  <Check className="text-primary size-4" />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
