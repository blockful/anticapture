import type { Address } from "viem";

/**
 * Builds the `from` list for Tornado's castDelegatedVote: the voter's unique
 * delegators, compared case-insensitively.
 *
 * The delegators query intentionally includes the voter itself (the
 * TORNGovernor:Undelegated handler records an undelegated account as its own
 * delegate), but the governor forbids self-delegation, so a `from` list
 * containing the voter makes castDelegatedVote revert and blocks the vote.
 * The voter's own address is therefore dropped here; when nothing remains the
 * vote goes through castVote instead (castDelegatedVote rejects an empty
 * `from`).
 */
export const buildTornDelegatedVoteFrom = (
  voter: Address,
  delegatorAddresses: Address[],
): Address[] => {
  const seen = new Set<string>([voter.toLowerCase()]);
  return delegatorAddresses.filter((delegatorAddress) => {
    const normalized = delegatorAddress.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};
