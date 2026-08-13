import { TestimonialCarousel } from "@/features/panel/components/TestimonialCarousel";
import { ClickableCard } from "@/shared/components/design-system/cards/clickable-card/ClickableCard";
import { DaoAvatarIcon } from "@/shared/components/icons/DaoAvatarIcon";
import { TRACK_RECORD_CASES } from "@/shared/constants/track-record";

export const TrackRecordSection = () => {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-primary text-alternative-sm font-mono font-medium uppercase leading-5 tracking-[0.78px]">
        Track record
      </h2>

      <div className="grid gap-2 lg:grid-cols-3">
        {TRACK_RECORD_CASES.map(({ daoId, name, description, caseUrl }) => (
          <ClickableCard
            key={name}
            href={caseUrl}
            openInNewTab
            title={name}
            description={description}
            avatar={
              daoId ? (
                <DaoAvatarIcon
                  daoId={daoId}
                  className="size-icon-sm"
                  isRounded={true}
                />
              ) : (
                <span className="bg-surface-contrast text-secondary size-icon-sm flex shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {name.charAt(0)}
                </span>
              )
            }
          />
        ))}
      </div>

      <TestimonialCarousel />
    </div>
  );
};
