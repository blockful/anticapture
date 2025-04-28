import { verifyMessage } from "viem";

import { PetitionSignatureRequest } from "../types";

interface Database {
  newPetitionSignature: (petitionSignature: PetitionSignatureRequest) => Promise<void>;
}

export class PetitionService {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async signPetition(petitionSignature: PetitionSignatureRequest) {
    const verifiedSignature = await verifyMessage({
      message: petitionSignature.message,
      signature: petitionSignature.signature,
      address: petitionSignature.accountId,
    });

    if (!verifiedSignature) throw new Error("Invalid signature")

    await this.db.newPetitionSignature(petitionSignature);
  }
}

