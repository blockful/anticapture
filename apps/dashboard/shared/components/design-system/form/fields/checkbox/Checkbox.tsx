import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "disabled:border-border-contrast disabled:bg-surface-disabled peer h-4 w-4 shrink-0 border border-solid bg-transparent transition duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      "border-primary focus-visible:ring-highlight focus-visible:ring-offset-surface-background",
      "enabled:hover:border-highlight",
      "data-[state=checked]:border-highlight data-[state=checked]:bg-highlight",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("text-primary flex items-center justify-center")}
    >
      <Check className="stroke-3 h-3 w-3" color="#18181b" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
