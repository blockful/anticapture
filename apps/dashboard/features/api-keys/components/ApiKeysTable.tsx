"use client";

import { Trash2 } from "lucide-react";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const formatDate = (iso: string | null): string =>
  iso ? dateFmt.format(new Date(iso)) : "—";

const HEADERS = ["Name", "Status", "Created", "Last used", ""] as const;

export const ApiKeysTable = ({
  keys,
  onRevoke,
}: {
  keys: UserApiKey[];
  onRevoke: (key: UserApiKey) => void;
}) => {
  return (
    <div className="border-border-default bg-surface-default w-full overflow-hidden rounded-md border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-border-default border-b">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-secondary px-4 py-2.5 text-xs font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const active = key.revokedAt === null;
            return (
              <tr
                key={key.id}
                className="border-border-default border-b last:border-b-0"
              >
                <td className="text-primary px-4 py-3 text-sm font-medium">
                  {key.label}
                </td>
                <td className="px-4 py-3">
                  <BadgeStatus variant={active ? "success" : "dimmed"}>
                    {active ? "Active" : "Revoked"}
                  </BadgeStatus>
                </td>
                <td className="text-secondary px-4 py-3 text-sm">
                  {formatDate(key.createdAt)}
                </td>
                <td className="text-secondary px-4 py-3 text-sm">
                  {formatDate(key.lastUsedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {active && (
                    <button
                      type="button"
                      onClick={() => onRevoke(key)}
                      aria-label={`Revoke ${key.label}`}
                      className="text-secondary hover:text-error transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
