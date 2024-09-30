import {
  Address,
  getContract,
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
    const TimelockContract = getContract({
      abi: ENSTimelockControllerAbi,
      address: config.test.contracts.ENSTimelockController?.address as Address,
      client,
    });
    const proposalHash = keccak256(toBytes(proposalDescription));

    const proposalIdInTimelock: Hex =
      (await TimelockContract.read.hashOperationBatch([
        ...proposal,
        ["0x", Array(64).fill("0").join("")].join("") as Hex,
        proposalHash,
      ])) as Hex;
    return proposalIdInTimelock;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get Proposal Id in timelock");
  }
}
