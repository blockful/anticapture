import axios from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { SnapshotProvider } from "@/provider/dataProvider";

const ENDPOINT = "https://hub.snapshot.org/graphql";
const SPACE_ID = "ens.eth";

function makeProposal(overrides?: Record<string, unknown>) {
  return {
    id: "proposal-1",
    author: "0xabc",
    title: "Test Proposal",
    body: "Some body",
    discussion: "https://discuss.ens.domains/t/1",
    type: "single-choice",
    start: 1700000000,
    end: 1700100000,
    state: "closed",
    created: 1700000000,
    updated: 1700000100,
    link: "https://snapshot.org/#/ens.eth/proposal/proposal-1",
    flagged: false,
    ...overrides,
  };
}

function makeVote(overrides?: Record<string, unknown>) {
  return {
    id: "vote-1",
    voter: "0xdef",
    proposal: { id: "proposal-1" },
    choice: 1,
    vp: 100.5,
    reason: "I agree",
    created: 1700000050,
    ...overrides,
  };
}

const server = setupServer();
const provider = new SnapshotProvider(
  axios.create({ baseURL: ENDPOINT }),
  SPACE_ID,
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function mockGraphQL(data: Record<string, unknown>) {
  server.use(http.post(ENDPOINT, () => HttpResponse.json({ data })));
}

describe("SnapshotProvider", () => {
  describe("fetchProposals", () => {
    it("should fetch and map proposals correctly", async () => {
      mockGraphQL({ proposals: [makeProposal()] });

      const result = await provider.fetchProposals(null);

      expect(result.data).toEqual([
        {
          id: "proposal-1",
          spaceId: SPACE_ID,
          author: "0xabc",
          title: "Test Proposal",
          body: "Some body",
          discussion: "https://discuss.ens.domains/t/1",
          type: "single-choice",
          start: 1700000000,
          end: 1700100000,
          state: "closed",
          created: 1700000000,
          updated: 1700000100,
          link: "https://snapshot.org/#/ens.eth/proposal/proposal-1",
          flagged: false,
        },
      ]);
      expect(result.nextCursor).toBeNull();
    });

    it("should return nextCursor after fetching all proposals", async () => {
      const proposals = Array.from({ length: 1000 }, (_, i) =>
        makeProposal({ id: `p-${i}`, created: 1700000000 + i }),
      );
      mockGraphQL({ proposals });

      const result = await provider.fetchProposals(null);

      expect(result.data).toHaveLength(1000);
      expect(result.nextCursor).toBe("1700000999");
    });

    it("should default missing fields with fallbacks", async () => {
      mockGraphQL({
        proposals: [
          makeProposal({
            body: null,
            discussion: null,
            type: null,
            state: null,
            updated: null,
            link: null,
            flagged: null,
          }),
        ],
      });

      const result = await provider.fetchProposals(null);

      expect(result.data[0]).toStrictEqual({
        author: "0xabc",
        body: "",
        created: 1700000000,
        discussion: "",
        end: 1700100000,
        flagged: false,
        id: "proposal-1",
        link: "",
        spaceId: "ens.eth",
        start: 1700000000,
        state: "closed",
        title: "Test Proposal",
        type: "single-choice",
        updated: 1700000000,
      });
    });
  });

  describe("fetchVotes", () => {
    it("should fetch and map votes correctly", async () => {
      mockGraphQL({ votes: [makeVote()] });

      const result = await provider.fetchVotes(null);

      expect(result.data).toHaveLength(1);
      expect(result.data).toEqual([
        {
          id: "vote-1",
          spaceId: SPACE_ID,
          voter: "0xdef",
          proposalId: "proposal-1",
          choice: 1,
          vp: "100.5",
          reason: "I agree",
          created: 1700000050,
        },
      ]);
      expect(result.nextCursor).toBeNull();
    });

    it("should return nextCursor after fetching all votes", async () => {
      const votes = Array.from({ length: 1000 }, (_, i) =>
        makeVote({ id: `v-${i}`, created: 1700000000 + i }),
      );
      mockGraphQL({ votes });

      const result = await provider.fetchVotes(null);

      expect(result.data).toHaveLength(1000);
      expect(result.nextCursor).toBe("1700000999");
    });

    it("should default missing vp and reason", async () => {
      mockGraphQL({ votes: [makeVote({ vp: null, reason: null })] });

      const result = await provider.fetchVotes(null);

      expect(result.data[0]?.vp).toBe("0");
      expect(result.data[0]?.reason).toBe("");
    });
  });

  describe("error handling", () => {
    it("should throw on HTTP error", async () => {
      server.use(
        http.post(
          ENDPOINT,
          () =>
            new HttpResponse(null, {
              status: 500,
              statusText: "Internal Server Error",
            }),
        ),
      );

      await expect(provider.fetchProposals(null)).rejects.toThrow();
    });

    it("should throw when response has no data", async () => {
      server.use(http.post(ENDPOINT, () => HttpResponse.json({})));

      await expect(provider.fetchProposals(null)).rejects.toThrow(
        "Snapshot API returned no data",
      );
    });
  });
});
