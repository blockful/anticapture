"use client";

import { ChevronDown, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components";
import { SectionTitle } from "@/shared/components/design-system/section/section-title/SectionTitle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";
import { cn } from "@/shared/utils/cn";
import { formatRelativeTime } from "@/shared/utils/formatRelativeTime";

const MCP_URL = "https://mcp.anticapture.com/v1";

// Per-client install command.
const CLIENTS = {
  "Claude Code": (key: string) =>
    `claude mcp add anticapture --transport http ${MCP_URL} --header "X-API-KEY: ${key}"`,
  Cursor: (key: string) =>
    `cursor mcp add anticapture --transport http ${MCP_URL} --header "X-API-KEY: ${key}"`,
  Codex: (key: string) =>
    `codex mcp add anticapture --url ${MCP_URL} --header "X-API-KEY: ${key}"`,
} as const;

type ClientName = keyof typeof CLIENTS;

// Shown when we don't hold the plaintext (keys created in a previous
// session) — the user pastes the key they saved at creation time.
const KEY_PLACEHOLDER = "<YOUR_API_KEY>";

/**
 * "Connect your AI agent" — pick a client, pick a key, copy one command.
 * Plaintext tokens only exist in memory for keys created this session
 * (`sessionTokens`); for those the command embeds the real key (truncated on
 * screen, full on copy). Otherwise the placeholder is used.
 */
export const ConnectAgentSection = ({
  keys,
  sessionTokens,
  lastCreatedId,
}: {
  keys: UserApiKey[];
  sessionTokens: Record<string, string>;
  lastCreatedId: string | null;
}) => {
  const [client, setClient] = useState<ClientName>("Claude Code");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // A key created in this session becomes the selected one.
  useEffect(() => {
    if (lastCreatedId) setSelectedId(lastCreatedId);
  }, [lastCreatedId]);

  const selected =
    keys.find((k) => k.id === selectedId) ??
    keys.find((k) => sessionTokens[k.id]) ??
    keys[0] ??
    null;

  const token = selected ? sessionTokens[selected.id] : undefined;
  // On-screen the key is truncated like the design; the copied command
  // carries the full plaintext so it works as-is.
  const shownKey = token ? `${token.slice(0, 12)}…` : KEY_PLACEHOLDER;
  const copiedKey = token ?? KEY_PLACEHOLDER;

  const copy = async () => {
    await navigator.clipboard.writeText(CLIENTS[client](copiedKey));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionTitle
        icon={<Settings className="text-primary size-5" />}
        title="Connect your AI agent"
        description="Pick your tool and run one command in your terminal. Your key is already in it."
      />

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex gap-2">
            {(Object.keys(CLIENTS) as ClientName[]).map((name) => (
              <Button
                key={name}
                size="sm"
                variant={name === client ? "primary" : "outline"}
                onClick={() => setClient(name)}
              >
                {name}
              </Button>
            ))}
          </div>

          {selected && (
            <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="border-border-contrast bg-surface-default hover:bg-surface-contrast rounded-base text-primary flex items-center gap-1.5 border py-[5px] pl-2.5 pr-2 text-xs font-medium transition-colors"
                >
                  Key: {selected.label}
                  <ChevronDown className="text-secondary size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">
                {keys.map((key) => (
                  <button
                    key={key.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(key.id);
                      setSelectorOpen(false);
                    }}
                    className={cn(
                      "hover:bg-surface-contrast rounded-base w-full truncate px-3 py-2 text-left text-sm transition-colors",
                      key.id === selected.id
                        ? "text-primary"
                        : "text-secondary",
                    )}
                  >
                    {key.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="border-border-contrast bg-surface-default flex h-[84px] w-full gap-2.5 border p-3">
          <code className="text-secondary min-w-0 flex-1 break-all font-mono text-sm leading-5">
            {CLIENTS[client](shownKey)}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="self-end"
            onClick={copy}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {selected && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                selected.lastUsedAt ? "bg-success" : "bg-warning",
              )}
            />
            <p className="text-secondary text-xs font-medium">
              {selected.lastUsedAt
                ? `Last call from your AI ${formatRelativeTime(
                    Date.parse(selected.lastUsedAt) / 1000,
                  ).toLowerCase()}`
                : "Waiting for the first call from your AI…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
