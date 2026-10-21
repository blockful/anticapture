import { ExternalLink, Hourglass } from "lucide-react";
import type { Hash } from "viem";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";

interface VotePendingContentProps {
  hash: Hash | null;
  explorerBaseUrl?: string;
}

const shortenHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

/**
 * A vote that may be on-chain but could not be confirmed here. It offers no
 * way to vote again: the wallet would sign the same ballot, and the relayer
 * would only be asked to replay it.
 */
export const VotePendingContent = ({
  hash,
  explorerBaseUrl,
}: VotePendingContentProps) => (
  <div className="flex flex-col items-center gap-3 px-4 py-8">
    <div className="bg-surface-contrast flex size-12 items-center justify-center rounded-full">
      <Hourglass className="text-secondary size-6" />
    </div>

    <h3 className="text-primary text-center text-lg font-medium">
      Your vote was sent
    </h3>

    {hash && explorerBaseUrl && (
      <a
        href={`${explorerBaseUrl}/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link inline-flex items-center gap-1 text-sm leading-5 hover:underline"
      >
        {shortenHash(hash)}
        <ExternalLink className="size-3.5 shrink-0" />
      </a>
    )}

    <InlineAlert
      variant="warning"
      text={
        hash
          ? "It is not confirmed yet. Follow it on the explorer. This page shows your vote on its own once it is indexed, so there is no need to vote again."
          : "The relayer did not answer clearly, so the vote may already be on its way. This page shows your vote on its own once it is indexed, so there is no need to vote again."
      }
    />
  </div>
);
