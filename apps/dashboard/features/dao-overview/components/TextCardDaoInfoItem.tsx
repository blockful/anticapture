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
      className={`bg-dark sm:bg-light-dark text-primary flex h-full w-full gap-1.5 rounded-lg px-2 py-1 text-sm leading-tight font-medium ${className}`}
    >
      {item.daoId && (
        <p className="flex items-center">
          <DaoAvatarIcon
            daoId={item.daoId}
            className="size-icon-xs text-tangerine bg-transparent!"
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
