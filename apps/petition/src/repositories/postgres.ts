import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

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

} 