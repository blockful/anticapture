"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/shared/components";
import { Table } from "@/shared/components/design-system/table/Table";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";
import { formatRelativeTime } from "@/shared/utils/formatRelativeTime";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

// Delete is the row's only action, so it gets a direct button instead of an
// options menu (per design review). Confirmation stays in the manager's modal.
const DeleteKeyButton = ({
  apiKey,
  onDelete,
}: {
  apiKey: UserApiKey;
  onDelete: (key: UserApiKey) => void;
}) => (
  <Tooltip asChild disableMobileClick tooltipContent="Delete key">
    <Button
      variant="ghost"
      size="sm"
      // p-2 keeps the desktop density; the min sizes preserve a 44px
      // touch target on coarse pointers.
      className="text-error min-h-11 min-w-11 p-2 lg:min-h-0 lg:min-w-0"
      aria-label={`Delete ${apiKey.label}`}
      onClick={() => onDelete(apiKey)}
    >
      <Trash2 className="size-4" />
    </Button>
  </Tooltip>
);

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
            <DeleteKeyButton apiKey={row.original} onDelete={onDelete} />
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
