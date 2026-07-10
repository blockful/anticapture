"use client";

import { Check, Copy, TerminalSquare } from "lucide-react";
import { useState } from "react";

import { SectionTitle } from "@/shared/components/design-system/section/section-title/SectionTitle";
import { cn } from "@/shared/utils/cn";

const MCP_URL = "https://mcp.anticapture.com/v1";

// Per-client install command. The key placeholder is shown verbatim — the
// user pastes their own key (revealed once at creation) in place of it.
const CLIENTS = {
  "Claude Code": (key: string) =>
    `claude mcp add anticapture --transport http ${MCP_URL} --header "X-API-KEY: ${key}"`,
  Cursor: (key: string) =>
    `cursor mcp add anticapture --transport http ${MCP_URL} --header "X-API-KEY: ${key}"`,
  Codex: (key: string) =>
    `codex mcp add anticapture --url ${MCP_URL} --header "X-API-KEY: ${key}"`,
} as const;

type ClientName = keyof typeof CLIENTS;

const KEY_PLACEHOLDER = "<YOUR_API_KEY>";

export const ConnectAgentSection = () => {
  const [client, setClient] = useState<ClientName>("Claude Code");
  const [copied, setCopied] = useState(false);

  const command = CLIENTS[client](KEY_PLACEHOLDER);

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionTitle
        icon={<TerminalSquare className="text-primary size-5" />}
        title="Connect your AI agent"
        description="Pick your tool and run one command in your terminal. Replace the placeholder with a key you created above."
      />

      <div className="flex flex-wrap gap-2">
        {(Object.keys(CLIENTS) as ClientName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setClient(name)}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
              name === client
                ? "border-border-contrast bg-surface-contrast text-primary"
                : "border-border-default text-secondary hover:text-primary",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="border-border-contrast bg-surface-default flex items-start gap-2.5 rounded-md border p-3">
        <code className="text-secondary min-w-0 flex-1 break-all font-mono text-sm">
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy command"
          className="text-secondary hover:text-primary shrink-0 transition-colors"
        >
          {copied ? (
            <Check className="text-success size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
};
