import { Address, Hex } from "viem";

export interface PetitionSignatureRequest {
  message: string;
  signature: Hex;
  accountId: Address;
  daoId: string;
  timestamp: bigint;
}

export interface PetitionSignatureResponse extends PetitionSignatureRequest {
  votingPower: bigint;
}
