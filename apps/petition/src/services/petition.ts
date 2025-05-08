import { Address, verifyMessage } from "viem";

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
    const verifiedSignature = await verifyMessage({
      message: petition.message,
      signature: petition.signature,
      address: petition.accountId,
    });

    if (!verifiedSignature) throw new Error("Invalid signature")

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
