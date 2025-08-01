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
      className={`bg-surface-default sm:bg-surface-contrast text-primary flex h-full w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium leading-tight ${className}`}
    >
      {item.daoId && (
        <p className="flex items-center">
          <DaoAvatarIcon
            daoId={item.daoId}
            className="size-icon-xs text-link bg-transparent!"
            showBackground={false}
          />
        </p>
      )}
      <p className="whitespace-nowrap">
        {item.label} {item.value}
      </p>
    </div>
  );
};
