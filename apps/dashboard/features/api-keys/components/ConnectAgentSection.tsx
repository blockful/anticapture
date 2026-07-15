"use client";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components";
import { Combobox } from "@/shared/components/design-system/combobox";
import { SectionTitle } from "@/shared/components/design-system/section/section-title/SectionTitle";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";
import { cn } from "@/shared/utils/cn";
import { formatRelativeTime } from "@/shared/utils/formatRelativeTime";

// The deployed proxy exposes the Streamable HTTP MCP server under /mcp
// (infra/proxy/default.conf.template), matching the public client docs.
const MCP_URL = "https://mcp.anticapture.com/mcp";

// Per-client install snippet. The key travels as `Authorization: Bearer` —
// the only scheme the MCP proxy forwards and Gateful's token middleware
// accepts. Cursor and Codex have no CLI for remote HTTP servers, so they
// get their documented config-file snippets instead.
const CLIENTS = {
  "Claude Code": (key: string) =>
    `claude mcp add anticapture --transport http ${MCP_URL} --header "Authorization: Bearer ${key}"`,
  Cursor: (key: string) =>
    [
      "// add to ~/.cursor/mcp.json",
      "{",
      '  "mcpServers": {',
      '    "anticapture": {',
      `      "url": "${MCP_URL}",`,
      `      "headers": { "Authorization": "Bearer ${key}" }`,
      "    }",
      "  }",
      "}",
    ].join("\n"),
  Codex: (key: string) =>
    [
      "# add to ~/.codex/config.toml",
      "[mcp_servers.anticapture]",
      `url = "${MCP_URL}"`,
      `http_headers = { "Authorization" = "Bearer ${key}" }`,
    ].join("\n"),
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
            <Combobox
              items={keys.map((k) => ({ value: k.id, label: k.label }))}
              value={selected.id}
              onValueChange={setSelectedId}
            />
          )}
        </div>

        <div className="border-border-contrast bg-surface-default relative min-h-[84px] w-full border p-3">
          <code className="text-secondary block min-w-0 whitespace-pre-wrap break-words pr-16 font-mono text-sm leading-5">
            {CLIENTS[client](shownKey)}
          </code>
          {/* Pinned flush to the block's corner (b-0 r-0), like the gov
              frontend's Encode button. */}
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-0 right-0"
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
