"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { getDraftProposal } from "@anticapture/client";
import type { GetDraftProposalPathParamsDaoEnumKey } from "@anticapture/client";

/**
 * Resolves whether the current viewer is a *recipient* of a shared draft —
 * i.e. there is a `draftId` in the URL and the connected wallet is not the
 * draft's author. Recipients only ever see the Preview, so the Editor tab is
 * hidden for them.
 *
 * This mirrors the shared-draft resolution inside `ProposalCreationForm`, but
 * is needed independently by `WhitelabelHeader`, which hosts the Editor/Preview
 * toggle on the whitelabel route and therefore must know when to hide the
 * Editor pill.
 */
export function useDraftRecipient(): { isRecipient: boolean } {
  const { daoId: daoIdParam } = useParams();
  const daoId = (daoIdParam as string | undefined)?.toLowerCase();
  const searchParams = useSearchParams();
  const draftId = searchParams?.get("draftId") ?? undefined;
  const { address } = useAccount();

  const [author, setAuthor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!daoId || !draftId) {
      setAuthor(undefined);
      return;
    }

    let cancelled = false;
    void getDraftProposal(
      daoId as GetDraftProposalPathParamsDaoEnumKey,
      draftId,
    )
      .then((shared) => {
        if (cancelled || !shared) return;
        setAuthor(shared.author);
      })
      .catch(() => {
        // A failed lookup leaves `author` undefined, so the Editor pill stays
        // visible — the form itself still enforces preview-only for recipients.
      });

    return () => {
      cancelled = true;
    };
  }, [daoId, draftId]);

  const isRecipient = Boolean(
    draftId &&
    author &&
    (!address || author.toLowerCase() !== address.toLowerCase()),
  );

  return { isRecipient };
}
