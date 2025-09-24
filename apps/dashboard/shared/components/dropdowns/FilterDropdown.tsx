import { useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Filter, Check } from "lucide-react";
import { cn } from "@/shared/utils";
import { Button, IconButton } from "@/shared/components";

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
      <IconButton
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className={cn(
          "group border border-transparent",
          "hover:border-highlight bg-surface-hover border-transparent",
          isOpen && "border-highlight bg-surface-hover",
          className,
        )}
        iconClassName="size-3"
        size="sm"
        icon={Filter}
      />

      {isOpen &&
        createPortal(
          <div
            style={dropdownStyle}
            className="bg-surface-contrast border-border-contrast pointer-events-auto rounded-md border py-1"
          >
            {options.map((option, index) => (
              <Button
                variant="ghost"
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={cn(
                  "w-full justify-start text-left",
                  index === 0 && "border-border-contrast border-b",
                )}
              >
                <span className="text-primary whitespace-nowrap text-sm font-normal">
                  {option.label}
                </span>
                {selectedValue === option.value && (
                  <Check className="text-primary size-4" />
                )}
              </Button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
