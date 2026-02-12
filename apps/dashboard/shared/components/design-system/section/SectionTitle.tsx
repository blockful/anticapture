import { ReactNode } from "react";

type SectionTitleProps = {
  icon: ReactNode;
  title: string;
  riskLevel: ReactNode;
  description: string;
};

export const SectionTitle = ({
  icon,
  title,
  riskLevel,
  description,
}: SectionTitleProps) => {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-center gap-2 lg:flex-row">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-primary text-xl font-medium leading-7 tracking-[-0.5%] lg:text-left">
              {title}
            </h4>
          </div>
          <div className="hidden items-center lg:flex">{riskLevel}</div>
        </div>
      </div>
      <div>
        <p className="text-secondary flex w-full flex-col text-justify text-sm font-normal">
          {description}
        </p>
      </div>
      <div className="flex items-center lg:hidden">{riskLevel}</div>
    </div>
  );
};
