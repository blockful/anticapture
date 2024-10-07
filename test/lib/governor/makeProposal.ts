import {
  Address,
  decodeEventLog,
  Hex,
  PublicActions,
  WalletClient,
} from "viem";
import { config } from "../../../config";
import { ENSGovernorAbi } from "../../../src/ens/abi";

export async function makeProposal(
  client: WalletClient & PublicActions,
  signerAddress: Address,
  proposal: [[target: Address], [value: bigint], [callData: Hex]],
  proposalDescription: string
) {
  const governorAddress = config.test.contracts.ENSGovernor?.address as Address;
  const { request } = await client.simulateContract({
    account: signerAddress,
    address: governorAddress,
    abi: ENSGovernorAbi,
    functionName: "propose",
    args: [...proposal, proposalDescription],
  });

  const txHash = await client.writeContract(request);
  const txReceipt = await client.waitForTransactionReceipt({ hash: txHash });
  if (txReceipt.logs.length > 0 && txReceipt.logs[0] !== undefined) {
    const decodedLog = decodeEventLog({
      abi: ENSGovernorAbi,
      ...txReceipt.logs[0],
    });
    const proposalId = (decodedLog.args as { proposalId: bigint }).proposalId;
    return proposalId;
  }
  throw new Error(
    "makeProposal: Tx Receipt logs do not contain the proposalId: the propose transaction was rejected"
  );
}
