import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import { ProposalsRepository } from ".";
import { Drizzle } from "@/api/database";
import * as schema from "ponder:schema";

describe("ProposalsRepository", () => {
  let db: Drizzle;
  let repository: ProposalsRepository;

  beforeEach(() => {
    const client = new PGlite();
    db = drizzle({ client, schema });
    repository = new ProposalsRepository(db);
  });

  describe("getProposals", () => {
    it("should return the proposals", async () => {
      const proposals = await repository.getProposals(
        0,
        10,
        "asc",
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(proposals).toBeDefined();
    });
  });
});
