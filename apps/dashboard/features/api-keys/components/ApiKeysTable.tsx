"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/shared/components";
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

// ⋯ options menu per row — delete is the only action for now (rotate and
// disable are follow-ups).
const KeyOptions = ({
  apiKey,
  onDelete,
}: {
  apiKey: UserApiKey;
  onDelete: (key: UserApiKey) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          // p-2 keeps the desktop density; the min sizes preserve a 44px
          // touch target on coarse pointers.
          className="min-h-11 min-w-11 p-2 lg:min-h-0 lg:min-w-0"
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
            onDelete(apiKey);
          }}
          className="text-error hover:bg-surface-contrast rounded-base w-full px-3 py-2 text-left text-sm font-medium transition-colors"
        >
          Delete key
        </button>
      </PopoverContent>
    </Popover>
  );
};

export const ApiKeysTable = ({
  keys,
  isError = false,
  onDelete,
}: {
  keys: UserApiKey[];
  /** Failed fetch — renders the error state instead of "no keys yet". */
  isError?: boolean;
  onDelete: (key: UserApiKey) => void;
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
            <KeyOptions apiKey={row.original} onDelete={onDelete} />
          ),
        meta: { columnClassName: "w-14" },
      },
    ],
    [onDelete],
  );

  return (
    <Table
      columns={columns}
      data={keys}
      error={isError ? new Error("api keys fetch failed") : null}
      emptyTitle="No key yet"
      emptyDescription="Create your first key to connect Claude, Cursor, or any AI agent to Anticapture's data."
    />
  );
};
