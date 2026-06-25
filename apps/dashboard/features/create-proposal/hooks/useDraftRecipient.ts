"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { getDraftProposal } from "@anticapture/client";
import type { GetDraftProposalPathParamsDaoEnumKey } from "@anticapture/client";

/**
 * Whether the viewer is a recipient of a shared draft (preview-only).
 * Needed by `WhitelabelHeader`, which hosts the Editor/Preview toggle.
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

    // Drop the prior draft's author so a draft-to-draft nav can't compute
    // ownership against a stale author before the new lookup resolves.
    setAuthor(undefined);

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
        // Leave `author` undefined on failure → not editor-eligible below.
      });

    return () => {
      cancelled = true;
    };
  }, [daoId, draftId]);

  // Editor is allowed only once ownership is confirmed; a pending/failed
  // lookup keeps `author` undefined, so the pill stays hidden (no flash).
  const isOwner = Boolean(
    draftId &&
    author &&
    address &&
    author.toLowerCase() === address.toLowerCase(),
  );
  const isRecipient = Boolean(draftId) && !isOwner;

  return { isRecipient };
}
