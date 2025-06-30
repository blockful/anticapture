"use client";

import { SkeletonRow, TheTable } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { formatAddress } from "@/shared/utils/formatAddress";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Address, isAddress } from "viem";

export const DelegationHistoryTable = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = {
    address: "0x1234567890123456789012345678901234567890",
    amount: 100,
    date: "2021-01-01",
  };

  const delegationHistoryColumns: ColumnDef<typeof data>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Address
        </div>
      ),
      cell: ({ row }) => {
        if (!isMounted) {
          return (
            <div className="flex h-10 items-center gap-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="size-6 rounded-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-24"
              />
            </div>
          );
        }

        const addressValue: string = row.getValue("address");
        const address = isAddress(addressValue)
          ? formatAddress(addressValue)
          : "Invalid address";

        return (
          <div className="group flex h-10 w-full items-center gap-2">
            <EnsAvatar
              address={addressValue as Address}
              size="sm"
              variant="rounded"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Amount
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Date
        </div>
      ),
    },
  ];

  return (
    <div>
      <TheTable
        columns={delegationHistoryColumns}
        data={[data]}
        withSorting={true}
        withPagination={true}
        filterColumn="address"
      />
    </div>
  );
};
