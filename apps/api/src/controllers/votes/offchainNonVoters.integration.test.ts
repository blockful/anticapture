import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";
import type { Address } from "viem";
import { OffchainNonVotersService } from "@/services/votes/offchainNonVoters";
import type { OffchainNonVotersRepository } from "@/repositories/votes/offchainNonVoters";
import { offchainNonVoters as offchainNonVotersController } from "./offchainNonVoters";

class StubOffchainNonVotersRepository implements OffchainNonVotersRepository {
  async proposalExists() {
    return true;
  }

  async getOffchainNonVoters() {
    return [];
  }

  async getOffchainNonVotersCount(_proposalId: string, _addresses?: Address[]) {
    return 0;
  }
}

describe("Offchain Non-Voters Controller", () => {
  it("should return 400 when supportOffchain=false", async () => {
    const service = new OffchainNonVotersService(
      new StubOffchainNonVotersRepository(),
    );
    const app = new Hono();
    offchainNonVotersController(app, service, false);

    const res = await app.request("/offchain/proposals/proposal-1/non-voters");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Offchain data not supported",
    });
  });
});
