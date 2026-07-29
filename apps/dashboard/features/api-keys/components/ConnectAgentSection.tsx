"use client";

import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components";
import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";
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
 * Smoothly animates to the content's natural height when it changes (the
 * per-client snippets have different line counts, so switching tabs resizes
 * the code block).
 */
const AnimatedHeight = ({ children }: { children: React.ReactNode }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="overflow-hidden transition-[height] duration-300 ease-in-out"
      style={{ height }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

/**
 * "MCP" — connect an AI agent: pick a client and copy one command.
 * Plaintext tokens only exist in memory for keys created this session
 * (`sessionTokens`); the newest such key is embedded in the command (truncated
 * on screen, full on copy). Otherwise the placeholder is used.
 * The `modal` variant renders a compact title and drops the last-call status
 * line (inside SaveApiKeyModal the key was created seconds ago).
 */
export const ConnectAgentSection = ({
  keys,
  sessionTokens,
  lastCreated,
  variant = "section",
}: {
  keys: UserApiKey[];
  sessionTokens: Record<string, string>;
  lastCreated: { id: string; label: string } | null;
  variant?: "section" | "modal";
}) => {
  const [client, setClient] = useState<ClientName>("Claude Code");

  // A just-created key may not be in `keys` yet (the invalidated list is
  // still refetching, or that refetch failed) — synthesize it so the copied
  // command carries the fresh plaintext instead of an older key or the
  // placeholder.
  const knownKeys =
    lastCreated && !keys.some((k) => k.id === lastCreated.id)
      ? [
          {
            id: lastCreated.id,
            label: lastCreated.label,
            createdAt: "",
            revokedAt: null,
            lastUsedAt: null,
          },
          ...keys,
        ]
      : keys;

  const selected =
    knownKeys.find((k) => k.id === lastCreated?.id) ??
    knownKeys.find((k) => sessionTokens[k.id]) ??
    knownKeys[0] ??
    null;

  const token = selected ? sessionTokens[selected.id] : undefined;
  // On-screen the key is truncated like the design; the copied command
  // carries the full plaintext so it works as-is.
  const shownKey = token ? `${token.slice(0, 12)}…` : KEY_PLACEHOLDER;
  const copiedKey = token ?? KEY_PLACEHOLDER;

  const description = token
    ? "Connect your AI agent: pick your tool and run one command in your terminal. Your key is already in it."
    : "Connect your AI agent: pick your tool, replace the API key placeholder, and run the command in your terminal.";

  return (
    <div className="flex w-full flex-col gap-6">
      {variant === "modal" ? (
        <div className="flex flex-col gap-1">
          <p className="text-primary text-sm font-medium">MCP</p>
          <p className="text-secondary text-sm font-normal">{description}</p>
        </div>
      ) : (
        <SectionTitle
          icon={<Settings className="text-primary size-5" />}
          title="MCP"
          description={description}
        />
      )}

      <div className="flex w-full flex-col gap-3">
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

        {/* On-screen the key is redacted; the copied command carries the
            full plaintext so it works as-is. */}
        <AnimatedHeight>
          <CodeBlock
            code={CLIENTS[client](shownKey)}
            copyText={CLIENTS[client](copiedKey)}
            className="min-h-[84px]"
          />
        </AnimatedHeight>

        {variant === "section" && selected && (
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
