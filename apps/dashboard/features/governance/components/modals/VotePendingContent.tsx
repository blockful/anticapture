import { ExternalLink, Hourglass, Wallet } from "lucide-react";
import type { Hash } from "viem";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";

interface VotePendingContentProps {
  hash: Hash | null;
  explorerBaseUrl?: string;
  /**
   * Offered for a relayed vote the relayer never confirmed: checks the chain
   * and, if no vote from this address is there and no relayed transaction is
   * still waiting to be mined, hands the ballot to the wallet. Absent, the
   * screen keeps its old wait-only behaviour.
   */
  onVoteWithWallet?: () => void;
  isCheckingChain?: boolean;
}

const shortenHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

/**
 * A vote that may be on-chain but could not be confirmed here. A relayed one
 * may also never land: the relayer may not have sent it, or its transaction
 * may be dropped or revert. So the voter gets a way to cast the vote from
 * their own wallet rather than a screen that waits forever on a service that
 * is not answering; the chain is read before that way opens.
 */
export const VotePendingContent = ({
  hash,
  explorerBaseUrl,
  onVoteWithWallet,
  isCheckingChain = false,
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
        hash && onVoteWithWallet
          ? "It is not confirmed yet. Follow it on the explorer. If it never lands, you can cast your vote from your own wallet and pay the network fee."
          : hash
            ? "It is not confirmed yet. Follow it on the explorer. This page shows your vote on its own once it is indexed, so there is no need to vote again."
            : onVoteWithWallet
              ? "The relayer did not confirm your vote. If it is not on-chain, you can cast it from your own wallet and pay the network fee."
              : "The relayer did not answer clearly, so the vote may already be on its way. This page shows your vote on its own once it is indexed, so there is no need to vote again."
      }
    />

    {onVoteWithWallet && (
      <Button
        variant="outline"
        onClick={onVoteWithWallet}
        disabled={isCheckingChain}
        data-ph-event="vote_wallet_fallback"
        data-ph-source="gov_fe"
        data-umami-event="vote_wallet_fallback"
      >
        <Wallet className="size-3.5" />
        {isCheckingChain
          ? "Checking the chain..."
          : "Vote with my wallet instead"}
      </Button>
    )}
  </div>
);
