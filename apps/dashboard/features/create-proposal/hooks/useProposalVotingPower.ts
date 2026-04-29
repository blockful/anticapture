import { useVotingPowerByAccountId } from "@anticapture/client/hooks";
import type { VotingPowerByAccountIdPathParams } from "@anticapture/client";

export function useProposalVotingPower(daoId: string, address: string) {
  const daoPathParam =
    daoId.toLowerCase() as VotingPowerByAccountIdPathParams["dao"];

  const { data, isLoading } = useVotingPowerByAccountId(daoPathParam, address);

  return {
    votingPower: BigInt(data?.votingPower ?? 0n),
    isLoading,
  };
}
