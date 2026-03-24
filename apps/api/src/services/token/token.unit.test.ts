import { describe, it, expect, beforeEach } from "vitest";
import { DaoIdEnum } from "@/lib/enums";
import { DBToken } from "@/mappers";
import { TokenService } from "./token";

function createStubRepo() {
  const stub = {
    tokenData: null as DBToken | null | undefined,

    getTokenPropertiesByName: async () => stub.tokenData,
  };
  return stub;
}

describe("TokenService", () => {
  let service: TokenService;
  let repo: ReturnType<typeof createStubRepo>;

  beforeEach(() => {
    repo = createStubRepo();
    service = new TokenService(repo);
  });

  it("should return token properties from repo", async () => {
    const mockToken: DBToken = {
      id: "UNI",
      name: "Uniswap",
      decimals: 18,
      totalSupply: 1000000000n,
      delegatedSupply: 500000000n,
      cexSupply: 0n,
      dexSupply: 0n,
      lendingSupply: 0n,
      circulatingSupply: 0n,
      nonCirculatingSupply: 0n,
      treasury: 0n,
    };
    repo.tokenData = mockToken;

    const result = await service.getTokenProperties(DaoIdEnum.UNI);

    expect(result).toEqual(mockToken);
  });

  it("should return null when token not found", async () => {
    const result = await service.getTokenProperties(DaoIdEnum.UNI);

    expect(result).toBeNull();
  });
});
