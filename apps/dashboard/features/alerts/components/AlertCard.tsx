import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils";
import { AlertItem } from "@/features/alerts/utils/alerts-constants";

export const AlertCard = ({ title, description, icon }: AlertItem) => {
  const Icon = icon;
  const cardContent = (
    <Card
      className={cn(
        "bg-surface-background sm:bg-surface-default border-border-default w-full rounded-none border",
      )}
    >
      <CardContent className="px-0 py-4 sm:p-4">
        <div className="flex flex-col items-start gap-3">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex-shrink-0">
                <Icon className="text-primary size-5" />
              </div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-primary text-sm font-medium">{title}</h3>
              </div>
            </div>

            <div className="text-success bg-surface-opacity-success text-sm font-medium">
              active
            </div>
          </div>

          <div className="text-secondary text-sm leading-relaxed">
            {description}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return cardContent;
};
