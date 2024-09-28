import { Address, Hex, PublicActions, WalletClient } from "viem";
import { config } from "../../../config";
import { ENSTimelockControllerAbi } from "../../../abis/ENSTimelockControllerAbi";

export async function isOperationReady(
  client: WalletClient & PublicActions,
  proposalIdInTimelock: Hex
) {
  try {
    const timelockAddress = config.test.contracts.ENSTimelockController
      .address as Address;
    const isOperationReady = await client.readContract({
      address: timelockAddress,
      abi: ENSTimelockControllerAbi,
      functionName: "isOperationReady",
      args: [proposalIdInTimelock],
    });
    return isOperationReady;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get Proposal Id in timelock");
  }
}
