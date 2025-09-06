"use client";

type SubsectionTitleProps = {
  subsectionTitle: string;
  subsectionDescription: string;
  dateRange: string;
};

export const SubsectionTitle = ({
  subsectionTitle,
  subsectionDescription,
  dateRange,
}: SubsectionTitleProps) => {
  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex flex-col items-start">
        <p className="text-primary text-alternative-sm uppercase">
          {subsectionTitle}
        </p>
        <p className="text-secondary text-sm font-normal">
          {subsectionDescription}
        </p>
      </div>
      <div className="flex items-center">{dateRange}</div>
    </div>
  );
};
