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
        // Leave `author` undefined on failure → treated as not editor-eligible
        // below, so the Editor pill stays hidden (fail safe to preview-only).
      });

    return () => {
      cancelled = true;
    };
  }, [daoId, draftId]);

  // The viewer may edit only once we've CONFIRMED they authored the draft.
  // While the lookup is pending (or after a failure) `author` is undefined, so
  // ownership is unconfirmed and the Editor pill must stay hidden — otherwise
  // it flashes for recipients before the form corrects the view.
  const isOwner = Boolean(
    draftId &&
    author &&
    address &&
    author.toLowerCase() === address.toLowerCase(),
  );
  const isRecipient = Boolean(draftId) && !isOwner;

  return { isRecipient };
}
