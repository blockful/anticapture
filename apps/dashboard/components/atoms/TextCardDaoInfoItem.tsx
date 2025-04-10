"use client";

import { DaoIdEnum } from "@/lib/types/daos";
import { DaoLogoIcon, DaoLogoVariant } from "@/components/atoms";

interface TextItemProps {
  label?: string;
  value?: string;
  daoId?: DaoIdEnum;
}

export const TextCardDaoInfoItem = ({
  item,
  className,
}: {
  item: TextItemProps;
  className?: string;
}) => {
  return (
    <div
      className={`flex h-full w-full gap-1.5 rounded-lg bg-dark px-2 py-1 text-sm font-medium leading-tight text-[#FAFAFA] sm:bg-lightDark ${className}`}
    >
      {item.daoId && (
        <p className="flex items-center">
          <DaoLogoIcon
            daoId={item.daoId}
            className="size-4"
            variant={DaoLogoVariant.SECONDARY}
          />
        </p>
      )}
      <p>
        {item.label} {item.value}
      </p>
    </div>
  );
};
