import { Address, Hex, verifyMessage } from "viem";

import {
  DAO_ID,
  PetitionSignatureRequest,
  PetitionSignatureResponse
} from "../types";

interface PetitionRepository {
  newPetitionSignature: (petitionSignature: PetitionSignatureResponse) => Promise<void>;
  getPetitionSignatures: (daoId: string) => Promise<PetitionSignatureResponse[]>;
}

interface AnticaptureClient {
  getSignersVotingPower: (daoId: DAO_ID, signers: Address[]) => Promise<bigint>;
}

type PetitionResponse = {
  petitionSignatures: PetitionSignatureResponse[];
  totalSignatures: number;
  totalSignaturesPower: bigint;
  latestVoters: string[];
  userSigned?: boolean;
}

export class PetitionService {
  private db: PetitionRepository;
  private anticaptureClient: AnticaptureClient;

  constructor(db: PetitionRepository, anticaptureClient: AnticaptureClient) {
    this.db = db;
    this.anticaptureClient = anticaptureClient;
  }

  async signPetition(petition: PetitionSignatureRequest) {
    if (petition.signature.length > 130) { // multisig signature
      const sigs = splitSafeSignatures(petition.signature)
      const verifiedSigs = await Promise.any(sigs.map(async (sig) => {
        return verifyMessage({
          message: petition.message,
          signature: sig,
          address: petition.accountId,
        })
      }))
      if (!verifiedSigs) throw new Error("Invalid signature")
    } else {
      const verifiedSignature = await verifyMessage({
        message: petition.message,
        signature: petition.signature,
        address: petition.accountId,
      });

      if (!verifiedSignature) throw new Error("Invalid signature")
    }

    const dbPetition = {
      ...petition,
      timestamp: BigInt(Date.now())
    }
    await this.db.newPetitionSignature(dbPetition);
    return dbPetition;
  }

  async readPetitions(daoId: DAO_ID, userAddress?: string): Promise<PetitionResponse> {
    const petitionSignatures = await this.db.getPetitionSignatures(daoId);

    if (!petitionSignatures.length) {
      return {
        petitionSignatures,
        totalSignatures: 0,
        totalSignaturesPower: 0n,
        latestVoters: [],
      }
    }

    const signers = petitionSignatures.map(({ accountId }) => accountId);

    const response: PetitionResponse = {
      petitionSignatures,
      totalSignatures: petitionSignatures.length,
      totalSignaturesPower: await this.anticaptureClient.getSignersVotingPower(daoId, signers),
      latestVoters: signers.slice(0, 10)
    };

    if (userAddress) {
      response.userSigned = petitionSignatures.some(
        (signature) =>
          signature.accountId.toLowerCase() === userAddress?.toLowerCase()
      )
    }

    return response;
  }
}

/**
 * Splits a concatenated Safe multisig signature into individual signatures
 * 
 * Safe multisig transactions combine multiple signatures into a single hex string.
 * This function parses that combined signature and returns an array of individual signatures.
 * 
 * @param sig - The concatenated hex signature from a Safe transaction
 * @returns An array of individual hex signatures
 */
function splitSafeSignatures(sig: Hex): Hex[] {
  const sigs: Hex[] = [];
  const sigBuffer = sig.slice(2)
  for (let i = 0; i < sigBuffer.length; i += 130) {
    sigs.push('0x' + sigBuffer.slice(i, i + 130) as Hex);
  }
  return sigs;
}