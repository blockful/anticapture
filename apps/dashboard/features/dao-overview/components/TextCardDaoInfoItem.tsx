"use client";

import { DaoIdEnum } from "@/shared/types/daos";
import { DaoAvatarIcon } from "@/shared/components/icons";

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
      className={`flex h-full w-full gap-1.5 rounded-lg bg-dark px-2 py-1 text-sm font-medium leading-tight text-white sm:bg-light-dark ${className}`}
    >
      {item.daoId && (
        <p className="flex items-center">
          <DaoAvatarIcon
            daoId={item.daoId}
            className="size-icon-xs bg-transparent! text-tangerine"
            showBackground={false}
          />
        </p>
      )}
      <p>
        {item.label} {item.value}
      </p>
    </div>
  );
};
