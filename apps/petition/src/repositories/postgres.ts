import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import { Hex, Address } from 'viem';

import * as schema from './schema';
import { PetitionSignatureRequest } from '../types';

export class PostgresPetitionRepository {
  db: NodePgDatabase<Record<string, never>>;

  constructor(databaseUrl: string) {
    this.db = drizzle(databaseUrl);
  }

  async newPetitionSignature(petitionSignature: PetitionSignatureRequest) {
    await this.db.insert(schema.petitionSignatures).values(petitionSignature);
  }

  async getPetitionSignatures(daoId: string) {
    const signatures = await this.db
      .select()
      .from(schema.petitionSignatures)
      .where(eq(schema.petitionSignatures.daoId, daoId))
      .orderBy(desc(schema.petitionSignatures.timestamp));

    return signatures.map((signature) => ({
      ...signature,
      signature: signature.signature as Hex,
      accountId: signature.accountId as Address,
    }));
  }

} 