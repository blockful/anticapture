import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { desc, ilike } from 'drizzle-orm';
import { Hex, Address } from 'viem';

import * as schema from './schema';
import { PetitionSignatureResponse, DAO_ID } from '../types';

export class PostgresPetitionRepository {
  db: NodePgDatabase<Record<string, never>>;

  constructor(databaseUrl: string) {
    this.db = drizzle(databaseUrl);
  }

  async newPetitionSignature(petitionSignature: PetitionSignatureResponse) {
    await this.db.insert(schema.petitionSignatures).values(petitionSignature);
  }

  async getPetitionSignatures(daoId: string): Promise<PetitionSignatureResponse[]> {
    const signatures = await this.db
      .select()
      .from(schema.petitionSignatures)
      .where(ilike(schema.petitionSignatures.daoId, daoId))
      .orderBy(desc(schema.petitionSignatures.timestamp));

    return signatures.map((signature) => ({
      ...signature,
      daoId: signature.daoId as DAO_ID,
      signature: signature.signature as Hex,
      accountId: signature.accountId as Address,
    }));
  }

} 