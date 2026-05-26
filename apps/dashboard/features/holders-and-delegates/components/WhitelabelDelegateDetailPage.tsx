"use client";

import { useQueryState } from "nuqs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { HoldersAndDelegatesSection } from "@/features/holders-and-delegates";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates/components/HoldersAndDelegatesDrawer";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getDaoPagePath, WHITELABEL_ROUTES } from "@/shared/utils/whitelabel";

export const WhitelabelDelegateDetailPage = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, setActiveTab] = useQueryState("tab");

  useEffect(() => {
    void setActiveTab("delegates");
  }, [setActiveTab]);

  return (
    <>
      <HoldersAndDelegatesSection daoId={daoId} />
      <HoldersAndDelegatesDrawer
        isOpen
        onClose={() =>
          router.push(
            getDaoPagePath({
              daoId,
              pathname,
              page: WHITELABEL_ROUTES.delegates,
            }),
          )
        }
        entityType="delegate"
        address={address}
        daoId={daoId}
      />
    </>
  );
};
