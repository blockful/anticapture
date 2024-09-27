import { Address, PublicActions, WalletClient } from "viem";
import { config } from "../../../config";
import { ENSGovernorAbi } from "../../../abis/ENSGovernorAbi";
import { emptyCall, zeroEther } from "../../lib/constants";

export async function castVote(
  client: WalletClient & PublicActions,
  signerAddress: Address,
  proposalId: bigint,
) {
  const governorAddress = config.test.contracts.ENSGovernor
    .address as Address;
  const { request } = await client.simulateContract({
    account: signerAddress,
    address: governorAddress,
    abi: ENSGovernorAbi,
    functionName: "castVote",
    args: [proposalId, 1],
  });

  return await client.writeContract(request);
}
