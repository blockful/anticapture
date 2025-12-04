import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils";
import { AlertItem } from "@/features/alerts/utils/alerts-constants";
import { AlertAvailability } from "@/features/alerts/types";
import Link from "next/link";
import { Badge } from "@/shared/components";

export const AlertCard = ({
  title,
  description,
  icon: Icon,
  availability,
  link,
  active = true,
}: AlertItem) => {
  const cardContent = (
    <Card
      className={cn(
        "bg-surface-background sm:bg-surface-default border-border-default hover:bg-surface-contrast w-full rounded-none border transition-colors duration-300",
        !active && "pointer-events-none opacity-65",
      )}
    >
      <CardContent className="p-3">
        <div className="flex flex-col items-start gap-3">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex-shrink-0">
                <Icon className="size-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-primary text-sm font-medium">{title}</h3>
              </div>
            </div>

            <Badge
              variant={
                availability === AlertAvailability.AVAILABLE
                  ? "success"
                  : "default"
              }
            >
              {availability}
            </Badge>
          </div>

          <div className="text-secondary text-sm leading-relaxed">
            {description}
          </div>
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
