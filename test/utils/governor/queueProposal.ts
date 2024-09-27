import {
  Address,
  decodeEventLog,
  Hex,
  keccak256,
  PublicActions,
  toBytes,
  WalletClient,
} from "viem";
import { config } from "../../../config";
import { ENSGovernorAbi } from "../../../abis/ENSGovernorAbi";
import { emptyCall, zeroEther } from "../../lib/constants";

export async function queueProposal(
  client: WalletClient & PublicActions,
  signerAddress: Address,
  proposal: [[target: Address], [value: bigint], [callData: Hex]],
  proposalDescription: string
) {
  const governorAddress = config.test.contracts.ENSGovernor.address as Address;
  const proposalHash = keccak256(toBytes(proposalDescription));
  const { request } = await client.simulateContract({
    account: signerAddress,
    address: governorAddress,
    abi: ENSGovernorAbi,
    functionName: "queue",
    args: [...proposal, proposalHash],
  });

  return await client.writeContract(request);
}
