"use client";

import { useQuery } from "@tanstack/react-query";

const HUB_URL = "https://hub.snapshot.org";

/**
 * Snapshot stores the privacy mode on the proposal, not in the vote envelope,
 * and our API does not surface it — so read it from the hub. The value is
 * immutable per proposal, hence it is cached indefinitely.
 *
 * Lookup failures throw instead of resolving to null: a null here means "not
 * encrypted", and callers would cache that and submit a plaintext ballot on a
 * shutter proposal.
 */
export const fetchOffchainProposalPrivacy = async (
  proposalId: string,
): Promise<string | null> => {
  const res = await fetch(`${HUB_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query Privacy($id: String!) { proposal(id: $id) { privacy } }`,
      variables: { id: proposalId },
    }),
  });
  if (!res.ok) {
    throw new Error(`Snapshot hub responded ${res.status} on privacy lookup`);
  }
  const json: {
    data?: { proposal?: { privacy?: string | null } | null };
    errors?: { message?: string }[];
  } = await res.json();
  if (json.errors?.length || !json.data?.proposal) {
    throw new Error("Could not resolve proposal privacy from the Snapshot hub");
  }
  return json.data.proposal.privacy || null;
};

export const offchainProposalPrivacyQueryOptions = (proposalId: string) => ({
  queryKey: ["offchain-proposal-privacy", proposalId] as const,
  queryFn: () => fetchOffchainProposalPrivacy(proposalId),
  staleTime: Infinity,
  gcTime: Infinity,
});

export const useOffchainProposalPrivacy = (
  proposalId: string,
  options?: { enabled?: boolean },
) => {
  const { data, isLoading } = useQuery({
    ...offchainProposalPrivacyQueryOptions(proposalId),
    enabled: options?.enabled ?? true,
  });
  return { privacy: data ?? null, isShutter: data === "shutter", isLoading };
};
