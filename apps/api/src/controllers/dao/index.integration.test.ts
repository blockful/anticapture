import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { DaoCache } from "@/cache/dao-cache";
import { DAOClient } from "@/clients";
import { DaoService } from "@/services";

import { dao } from "./index";

class SimpleDAOClient implements DAOClient {
  getDaoId() {
    return "UNI";
  }
  getQuorum(_: string | null) {
    return Promise.resolve(40000000000000000000000000n);
  }
  getProposalThreshold() {
    return Promise.resolve(2500000000000000000000000n);
  }
  getVotingDelay() {
    return Promise.resolve(2n);
  }
  getVotingPeriod() {
    return Promise.resolve(40320n);
  }
  getTimelockDelay() {
    return Promise.resolve(172800n);
  }
  getCurrentBlockNumber() {
    return Promise.resolve(1);
  }
  getBlockTime(_: number) {
    return Promise.resolve(null);
  }
  calculateQuorum(_: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }) {
    return 0n;
  }
  alreadySupportCalldataReview() {
    return false;
  }
  getProposalStatus(
    _: {
      id: string;
      status: string;
      startBlock: number;
      endBlock: number;
      forVotes: bigint;
      againstVotes: bigint;
      abstainVotes: bigint;
      endTimestamp: bigint;
    },
    __: number,
    ___: number,
  ) {
    return Promise.resolve("ACTIVE");
  }
  supportOffchainData() {
    return false;
  }
}

describe("Dao Controller", () => {
  let client: SimpleDAOClient;
  let service: DaoService;
  let app: Hono;

  beforeEach(() => {
    client = new SimpleDAOClient();
    service = new DaoService(client, new DaoCache(), 1);
    app = new Hono();
    dao(app, service);
  });

  describe("GET /dao - cache hit", () => {
    it("should not call client methods on second request", async () => {
      const getQuorumSpy = vi.spyOn(client, "getQuorum");
      const getProposalThresholdSpy = vi.spyOn(client, "getProposalThreshold");

      await app.request("/dao");
      await app.request("/dao");

      expect(getQuorumSpy).toHaveBeenCalledTimes(1);
      expect(getProposalThresholdSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /dao", () => {
    it("should return 200", async () => {
      const res = await app.request("/dao");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        id: "UNI",
        chainId: 1,
        quorum: "40000000000000000000000000",
        proposalThreshold: "2500000000000000000000000",
        votingDelay: "2",
        votingPeriod: "40320",
        timelockDelay: "172800",
        alreadySupportCalldataReview: false,
        supportOffchainData: false,
      });
    });
  });
});
