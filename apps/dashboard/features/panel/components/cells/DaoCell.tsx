"use client";

import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { useScreenSize } from "@/shared/hooks";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { DaoTooltip } from "@/features/panel/components/tooltips/DaoTooltip";
import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";

export const DaoCell = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { isMobile } = useScreenSize();
  const config = daoConfigByDaoId[daoId];

  return (
    <Tooltip
      tooltipContent={
        <DaoTooltip
          title={`${config.name} DAO`}
          subtitle="Click and check a security overview."
          avatar={
            <DaoAvatarIcon
              daoId={daoId}
              className="size-9 rounded-full"
              isRounded={true}
            />
          }
        />
      }
      triggerClassName="w-full"
    >
      <ClickableCell
        href={config.disableDaoPage ? undefined : `/${daoId.toLowerCase()}`}
        className="px-4 py-3.5 text-end text-sm font-normal"
      >
        <div className="flex w-full items-center gap-1.5">
          <DaoAvatarIcon
            daoId={daoId}
            className="size-icon-sm"
            isRounded={true}
          />
          {!isMobile && (
            <span className="text-primary whitespace-nowrap text-sm font-medium">
              {config.name}
            </span>
          )}
        </div>
      </ClickableCell>
    </Tooltip>
  );
};
