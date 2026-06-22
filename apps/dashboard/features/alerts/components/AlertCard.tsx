import Link from "next/link";

import type { AlertItem } from "@/features/alerts/utils/alerts-constants";
import { AlertAvailability } from "@/features/alerts/utils/alerts-constants";
import { Badge } from "@/shared/components/badges/Badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

export const AlertCard = ({
  title,
  icon: Icon,
  availability,
  link,
  active = true,
}: AlertItem) => {
  const cardContent = (
    <Card
      className={cn(
        "bg-surface-default border-border-default hover:bg-surface-contrast rounded-base h-full w-full border transition-colors duration-300",
        !active && "pointer-events-none opacity-65",
      )}
    >
      <CardContent className="p-4">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="shrink-0">
              <Icon className="size-6" />
            </div>
            <h3 className="text-primary truncate text-sm font-medium">
              {title}
            </h3>
          </div>

          <Badge
            className="shrink-0"
            variant={
              availability === AlertAvailability.AVAILABLE
                ? "success"
                : "default"
            }
          >
            {availability}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (active) {
    return (
      <Link
        href={link}
        className="flex h-full w-full flex-1"
        target="_blank"
        rel="noopener noreferrer"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};
