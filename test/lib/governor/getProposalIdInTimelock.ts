import {
  Address,
  Hex,
  keccak256,
  PublicActions,
  toBytes,
  WalletClient,
} from "viem";
import { config } from "../../../config";
import { ENSTimelockControllerAbi } from "../../abi/ENSTimelockControllerAbi";

export async function getProposalIdInTimelock(
  client: WalletClient & PublicActions,
  signerAddress: Address,
  proposal: [[target: Address], [value: bigint], [callData: Hex]],
  proposalDescription: string
) {
  try {
    const timelockAddress = config.test.contracts.ENSTimelockController?.address as Address;
    const proposalHash = keccak256(toBytes(proposalDescription));
    const proposalIdInTimelock = await client.readContract({
      account: signerAddress,
      address: timelockAddress,
      abi: ENSTimelockControllerAbi,
      functionName: "hashOperationBatch",
      args: [
        ...proposal,
        ["0x", Array(64).fill("0").join("")].join("") as Hex,
        proposalHash,
      ],
    });
    return proposalIdInTimelock;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get Proposal Id in timelock");
  }
}
