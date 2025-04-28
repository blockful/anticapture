import { verifyMessage } from "viem";

import { PetitionSignatureRequest } from "../types";

interface PetitionRepository {
  newPetitionSignature: (petitionSignature: PetitionSignatureRequest) => Promise<void>;
  getPetitionSignatures: (daoId: string) => Promise<PetitionSignatureRequest[]>;
}

interface AnticaptureClient {
  getDAOs: () => Promise<string[]>;
  getSignaturesVotingPower: (daoId: string) => Promise<bigint>;
}

export class PetitionService {
  private db: PetitionRepository;
  private anticaptureClient: AnticaptureClient;

  supportedDAOs: string[] | undefined;

  constructor(db: PetitionRepository, anticaptureClient: AnticaptureClient) {
    this.db = db;
    this.anticaptureClient = anticaptureClient;
  }

  async signPetition(petition: PetitionSignatureRequest) {
    if (!this.supportedDAOs) {
      this.supportedDAOs = await this.anticaptureClient.getDAOs();
    }

    if (!this.supportedDAOs.find((dao) => dao.toUpperCase() === petition.daoId.toUpperCase())) {
      throw new Error(`Supported DAOs: ${this.supportedDAOs.join(", ")}`);
    }

    const verifiedSignature = await verifyMessage({
      message: petition.message,
      signature: petition.signature,
      address: petition.accountId,
    });

    if (!verifiedSignature) throw new Error("Invalid signature")

    await this.db.newPetitionSignature(petition);
    return petition;
  }

  async readPetitions(daoId: string, userAddress: string) {
    const petitionSignatures = await this.db.getPetitionSignatures(daoId);

    return {
      petitionSignatures,
      totalSignatures: petitionSignatures.length,
      totalSignaturesPower: await this.anticaptureClient.getSignaturesVotingPower(daoId),
      latestVoters: petitionSignatures
        .slice(0, 10)
        .map(({ accountId }) => accountId),
      userSigned: petitionSignatures.some(
        (signature) =>
          signature.accountId.toLowerCase() === userAddress?.toLowerCase()
      ),
    };
  }
}
