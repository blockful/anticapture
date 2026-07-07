import { fetchOffchainProposalPrivacy } from "./useOffchainProposalPrivacy";

const PROPOSAL_ID =
  "0xa736ce4411be14ceaab141989ac271ce1ca96aee6d3ac26bb893ec3c898385d0";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const hubResponse = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as Response;

describe("fetchOffchainProposalPrivacy", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns the privacy mode when the hub resolves the proposal", async () => {
    mockFetch.mockResolvedValue(
      hubResponse({ data: { proposal: { privacy: "shutter" } } }),
    );

    await expect(fetchOffchainProposalPrivacy(PROPOSAL_ID)).resolves.toBe(
      "shutter",
    );
  });

  it("returns null for a proposal without a privacy mode", async () => {
    mockFetch.mockResolvedValue(
      hubResponse({ data: { proposal: { privacy: "" } } }),
    );

    await expect(fetchOffchainProposalPrivacy(PROPOSAL_ID)).resolves.toBeNull();
  });

  // A lookup failure must not be reported as "no privacy": callers would
  // cache it and submit a plaintext ballot on a shutter proposal.
  it("throws on a non-2xx hub response", async () => {
    mockFetch.mockResolvedValue(hubResponse({}, false, 502));

    await expect(fetchOffchainProposalPrivacy(PROPOSAL_ID)).rejects.toThrow();
  });

  it("throws on a network error", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    await expect(fetchOffchainProposalPrivacy(PROPOSAL_ID)).rejects.toThrow(
      "network down",
    );
  });

  it("throws when the hub returns GraphQL errors", async () => {
    mockFetch.mockResolvedValue(
      hubResponse({ errors: [{ message: "rate limited" }] }),
    );

    await expect(fetchOffchainProposalPrivacy(PROPOSAL_ID)).rejects.toThrow();
  });

  it("throws when the proposal is not found", async () => {
    mockFetch.mockResolvedValue(hubResponse({ data: { proposal: null } }));

    await expect(fetchOffchainProposalPrivacy(PROPOSAL_ID)).rejects.toThrow();
  });
});
