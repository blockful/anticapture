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
import { emptyCall, zeroEther } from "../constants";
import { ENSGovernorAbi } from "../../../src/ens/abi";

export async function executeProposal(
  client: WalletClient & PublicActions,
  signerAddress: Address,
  proposal: [[target: Address], [value: bigint], [callData: Hex]],
  proposalDescription: string
) {
  const governorAddress = config.ponder.test.contracts.ENSGovernor?.address as Address;
  const proposalHash = keccak256(toBytes(proposalDescription));
  const { request } = await client.simulateContract({
    account: signerAddress,
    address: governorAddress,
    abi: ENSGovernorAbi,
    functionName: "execute",
    args: [...proposal, proposalHash],
  });

  return await client.writeContract(request);
}
