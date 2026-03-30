import { cn } from "@/shared/utils/cn";

import { CardTitle } from "@/shared/components/design-system/cards/card-title/CardTitle";
import type { ClickableCardProps } from "@/shared/components/design-system/cards/types";

export const ClickableCard = ({
  title,
  avatar,
  subtitle,
  description,
  badge,
  isDisabled = false,
  onClick,
  className,
}: ClickableCardProps) => {
  const hasLargeDescription = Boolean(description);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // Base
        "border-border-default bg-surface-default flex w-full border p-3 text-left",
        // Hover (suppressed when disabled via pointer-events-none)
        "hover:bg-surface-contrast",
        // Transition
        "transition-colors duration-200",
        // Disabled
        isDisabled && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
    >
      {hasLargeDescription ? (
        <div className="flex w-full flex-col gap-1">
          <CardTitle size="small" text={title} avatar={avatar} badge={badge} />
          <p className="text-body-md text-secondary">{description}</p>
        </div>
      ) : (
        <div className="flex w-full items-center gap-3">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <CardTitle size="small" text={title} badge={badge} />
            {subtitle && (
              <span className="text-body-sm text-secondary">{subtitle}</span>
            )}
          </div>
        </div>
      )}
    </button>
  );
};
