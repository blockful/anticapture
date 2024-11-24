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
import { testContracts } from "../constants";

export async function getProposalIdInTimelock(
  client: WalletClient & PublicActions,
  signerAddress: Address,
  proposal: [[target: Address], [value: bigint], [callData: Hex]],
  proposalDescription: string
) {
  try {
    const TimelockContract = getContract({
      abi: ENSTimelockControllerAbi,
      address: testContracts.ENSTimelockController?.address as Address,
      client,
    });
    const proposalHash = keccak256(toBytes(proposalDescription));

    const proposalIdInTimelock: Hex = (await client.readContract({
      abi: ENSTimelockControllerAbi,
      address: testContracts.ENSTimelockController?.address as Address,
      functionName: "hashOperation",
      args: [
        ...(proposal.flat(1) as [Address, bigint, Hex]),
        [Array(32).fill("0").join("")].join(""),
        proposalHash,
      ],
    })) as Hex;
    return proposalIdInTimelock;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get Proposal Id in timelock");
  }
}
