import { Address, getAddress } from "viem";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { OffchainNonVotersService } from "./offchainNonVoters";

const VOTER_A = getAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
const VOTER_B = getAddress("0x1234567890123456789012345678901234567890");

function createStubRepo() {
  const stub = {
    nonVoters: [] as { voter: Address; votingPower: bigint }[],
    nonVotersCount: 0,
    getOffchainNonVoters: vi.fn(async () => stub.nonVoters),
    getOffchainNonVotersCount: vi.fn(async () => stub.nonVotersCount),
  };
  return stub;
}

describe("OffchainNonVotersService", () => {
  let service: OffchainNonVotersService;
  let repo: ReturnType<typeof createStubRepo>;

  beforeEach(() => {
    repo = createStubRepo();
    service = new OffchainNonVotersService(repo);
  });

  describe("getProposalNonVoters", () => {
    it("should return non-voters with votingPower as string", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 1000n }];
      repo.nonVotersCount = 1;

      const result = await service.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
      );

      expect(result).toEqual({
        totalCount: 1,
        items: [
          {
            voter: VOTER_A,
            votingPower: "1000",
          },
        ],
      });
    });

    it("should return empty items when no non-voters", async () => {
      const result = await service.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
      );

      expect(result).toEqual({ totalCount: 0, items: [] });
    });

    it("should pass addresses filter to repository", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 500n }];
      repo.nonVotersCount = 1;

      await service.getProposalNonVoters("proposal-1", 0, 10, "desc", [
        VOTER_A,
        VOTER_B,
      ]);

      expect(repo.getOffchainNonVoters).toHaveBeenCalledWith(
        "proposal-1",
        0,
        10,
        "desc",
        [VOTER_A, VOTER_B],
      );
    });

    it("should use count query as totalCount when addresses filter is provided", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 500n }];
      repo.nonVotersCount = 1;

      const result = await service.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
        [VOTER_A, VOTER_B],
      );

      expect(result.totalCount).toBe(1);
    });

    it("should return totalCount from count query when no addresses filter", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 500n }];
      repo.nonVotersCount = 42;

      const result = await service.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
      );

      expect(result.totalCount).toBe(42);
    });
  });
});
