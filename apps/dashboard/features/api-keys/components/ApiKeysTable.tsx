"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/shared/components";
import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Table } from "@/shared/components/design-system/table/Table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";
import { formatRelativeTime } from "@/shared/utils/formatRelativeTime";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

// ⋯ options menu per row — revoke is the only action for now (rotate later).
const KeyOptions = ({
  apiKey,
  onRevoke,
}: {
  apiKey: UserApiKey;
  onRevoke: (key: UserApiKey) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          aria-label={`Options for ${apiKey.label}`}
        >
          <Ellipsis className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onRevoke(apiKey);
          }}
          className="text-error hover:bg-surface-contrast rounded-base w-full px-3 py-2 text-left text-sm font-medium transition-colors"
        >
          Revoke key
        </button>
      </PopoverContent>
    </Popover>
  );
};

export const ApiKeysTable = ({
  keys,
  onRevoke,
}: {
  keys: UserApiKey[];
  onRevoke: (key: UserApiKey) => void;
}) => {
  const columns = useMemo<ColumnDef<UserApiKey>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Name",
        cell: ({ row }) => (
          <span className="text-primary text-sm font-medium">
            {row.original.label}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.revokedAt === null ? (
            <BadgeStatus variant="success">Active</BadgeStatus>
          ) : (
            <BadgeStatus variant="dimmed">Disabled</BadgeStatus>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-secondary text-sm">
            {dateFmt.format(new Date(row.original.createdAt))}
          </span>
        ),
      },
      {
        accessorKey: "lastUsedAt",
        header: "Last Used",
        cell: ({ row }) => (
          <span className="text-secondary text-sm">
            {row.original.lastUsedAt
              ? formatRelativeTime(Date.parse(row.original.lastUsedAt) / 1000)
              : "—"}
          </span>
        ),
      },
      {
        id: "options",
        header: "",
        cell: ({ row }) =>
          row.original.revokedAt === null && (
            <KeyOptions apiKey={row.original} onRevoke={onRevoke} />
          ),
        meta: { columnClassName: "w-14" },
      },
    ],
    [onRevoke],
  );

  return (
    <Table
      columns={columns}
      data={keys}
      emptyTitle="No API keys yet"
      emptyDescription="Create one to connect your AI agent."
    />
  );
};
