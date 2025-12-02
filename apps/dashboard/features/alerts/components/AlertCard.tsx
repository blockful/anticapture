import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils";
import { AlertItem } from "@/features/alerts/utils/alerts-constants";

export const AlertCard = ({ title, description, icon: Icon }: AlertItem) => {
  const cardContent = (
    <Card
      className={cn(
        "bg-surface-background sm:bg-surface-default border-border-default w-full rounded-none border",
      )}
    >
      <CardContent className="sm:p-3">
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

            <div className="text-success bg-surface-opacity-success rounded-full px-[6px] py-0.5 text-sm font-medium">
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
