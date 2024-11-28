import { Address, Hex, PublicActions, WalletClient } from "viem";
import { config } from "../../../config";
import { ENSTimelockControllerAbi } from "../../abi/ENSTimelockControllerAbi";
import { testContracts } from "../constants";

export async function isOperationDone(
  client: WalletClient & PublicActions,
  proposalIdInTimelock: Hex
) {
  try {
    const timelockAddress = testContracts.ENSTimelockController
      .address as Address;
    const isOperationDone = await client.readContract({
      address: timelockAddress,
      abi: ENSTimelockControllerAbi,
      functionName: "isOperationDone",
      args: [proposalIdInTimelock],
    });
    return isOperationDone;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get Proposal Id in timelock");
  }
}
