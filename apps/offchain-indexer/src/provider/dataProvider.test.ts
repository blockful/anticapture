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
    author: "0x1111111111111111111111111111111111111111",
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
    voter: "0x2222222222222222222222222222222222222222",
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

function mockGraphQLSequence(data: Record<string, unknown>[]) {
  let index = 0;
  server.use(
    http.post(ENDPOINT, () =>
      HttpResponse.json({ data: data[Math.min(index++, data.length - 1)] }),
    ),
  );
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
          author: "0x1111111111111111111111111111111111111111",
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
          scores: [],
          scoresTotal: 0,
          quorum: 0,
          choices: [],
          network: "",
          snapshot: null,
          strategies: [],
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

    it("should query inclusively at the cursor (created_gte)", async () => {
      const queries: string[] = [];
      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as { query: string };
          queries.push(body.query);
          return HttpResponse.json({ data: { proposals: [makeProposal()] } });
        }),
      );

      await provider.fetchProposals("1700000000");

      expect(queries[0]).toContain("created_gte");
      expect(queries[0]).not.toContain("created_gt:");
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
        author: "0x1111111111111111111111111111111111111111",
        body: "",
        choices: [],
        created: 1700000000,
        discussion: "",
        end: 1700100000,
        flagged: false,
        id: "proposal-1",
        link: "",
        network: "",
        quorum: 0,
        scores: [],
        scoresTotal: 0,
        snapshot: null,
        spaceId: "ens.eth",
        start: 1700000000,
        state: "closed",
        strategies: [],
        title: "Test Proposal",
        type: "single-choice",
        updated: 1700000000,
      });
    });

    it("should map Snapshot quorum fields", async () => {
      mockGraphQL({
        proposals: [
          makeProposal({
            scores: [5347713.99, 0, 1813.59],
            scores_total: 5349527,
            quorum: 10000000,
          }),
        ],
      });

      const result = await provider.fetchProposals(null);

      expect(result.data[0]).toStrictEqual({
        author: "0x1111111111111111111111111111111111111111",
        body: "Some body",
        choices: [],
        created: 1700000000,
        discussion: "https://discuss.ens.domains/t/1",
        end: 1700100000,
        flagged: false,
        id: "proposal-1",
        link: "https://snapshot.org/#/ens.eth/proposal/proposal-1",
        network: "",
        quorum: 10000000,
        scores: [5347713.99, 0, 1813.59],
        scoresTotal: 5349527,
        snapshot: null,
        spaceId: "ens.eth",
        start: 1700000000,
        state: "closed",
        strategies: [],
        title: "Test Proposal",
        type: "single-choice",
        updated: 1700000100,
      });
    });
  });

  describe("fetchProposalsByIds", () => {
    it("should fetch and map proposals by Snapshot ids", async () => {
      const seenIds: unknown[] = [];
      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            query: string;
            variables: { ids: string[] };
          };
          seenIds.push(body.variables.ids);
          expect(body.query).toContain("id_in");
          return HttpResponse.json({
            data: {
              proposals: [
                makeProposal({
                  id: "proposal-1",
                  scores: [10, 1],
                  scores_total: 11,
                  quorum: 10,
                }),
              ],
            },
          });
        }),
      );

      const result = await provider.fetchProposalsByIds(["proposal-1"]);

      expect(seenIds).toStrictEqual([["proposal-1"]]);
      expect(result).toStrictEqual([
        {
          author: "0x1111111111111111111111111111111111111111",
          body: "Some body",
          choices: [],
          created: 1700000000,
          discussion: "https://discuss.ens.domains/t/1",
          end: 1700100000,
          flagged: false,
          id: "proposal-1",
          link: "https://snapshot.org/#/ens.eth/proposal/proposal-1",
          network: "",
          quorum: 10,
          scores: [10, 1],
          scoresTotal: 11,
          snapshot: null,
          spaceId: "ens.eth",
          start: 1700000000,
          state: "closed",
          strategies: [],
          title: "Test Proposal",
          type: "single-choice",
          updated: 1700000100,
        },
      ]);
    });

    it("should not call Snapshot when no ids are provided", async () => {
      server.use(
        http.post(ENDPOINT, () => {
          throw new Error("unexpected Snapshot request");
        }),
      );

      const result = await provider.fetchProposalsByIds([]);

      expect(result).toStrictEqual([]);
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
          voter: "0x2222222222222222222222222222222222222222",
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
      // Distinct voters: (proposalId, voter) is the votes primary key, and the
      // provider de-dupes on it, so repeating one voter isn't a real page.
      const votes = Array.from({ length: 1000 }, (_, i) =>
        makeVote({
          id: `v-${i}`,
          voter: `0x${(i + 1).toString(16).padStart(40, "0")}`,
          created: 1700000000 + i,
        }),
      );
      mockGraphQL({ votes });

      const result = await provider.fetchVotes(null);

      expect(result.data).toHaveLength(1000);
      expect(result.nextCursor).toBe("1700000999");
    });

    // The sync cursor is a `created` second, so an exclusive filter drops every
    // vote sharing the last page's final second — the common case, since votes
    // arrive in bursts. Re-reading the boundary is free: writes upsert.
    it("should query inclusively at the cursor (created_gte)", async () => {
      const queries: string[] = [];
      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as { query: string };
          queries.push(body.query);
          return HttpResponse.json({ data: { votes: [makeVote()] } });
        }),
      );

      await provider.fetchVotes("1700000050");

      expect(queries[0]).toContain("created_gte");
      expect(queries[0]).not.toContain("created_gt:");
    });

    it("should page through a full page that lands on a single created second", async () => {
      const all = Array.from({ length: 1500 }, (_, i) =>
        makeVote({
          id: `v-${i}`,
          voter: `0x${(i + 1).toString(16).padStart(40, "0")}`,
          created: 1700000000,
        }),
      );

      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            variables: { skip: number; pageSize: number };
          };
          const { skip, pageSize } = body.variables;
          return HttpResponse.json({
            data: { votes: all.slice(skip, skip + pageSize) },
          });
        }),
      );

      const result = await provider.fetchVotes(null);

      expect(result.data).toHaveLength(1500);
    });

    it("should default missing vp and reason", async () => {
      mockGraphQL({ votes: [makeVote({ vp: null, reason: null })] });

      const result = await provider.fetchVotes(null);

      expect(result.data[0]?.vp).toBe("0");
      expect(result.data[0]?.reason).toBe("");
    });
  });

  describe("fetchProposalIdsSince", () => {
    it("should fetch proposal ids since the cutoff", async () => {
      mockGraphQL({
        proposals: [
          { id: "proposal-1", created: 1700000000 },
          { id: "proposal-2", created: 1700000001 },
        ],
      });

      const result = await provider.fetchProposalIdsSince(1699999999);

      expect(result).toStrictEqual(["proposal-1", "proposal-2"]);
    });

    it("should paginate until Snapshot returns fewer than a full page", async () => {
      const firstPage = Array.from({ length: 1000 }, (_, i) => ({
        id: `proposal-${i}`,
        created: 1700000000 + i,
      }));
      const secondPage = [{ id: "proposal-1000", created: 1700001000 }];
      mockGraphQLSequence([
        { proposals: firstPage },
        { proposals: secondPage },
      ]);

      const result = await provider.fetchProposalIdsSince(0);

      expect(result).toHaveLength(1001);
      expect(result.at(0)).toBe("proposal-0");
      expect(result.at(-1)).toBe("proposal-1000");
    });

    // Finding 1: DB scan is inclusive (gte) at `since`; the Snapshot query must
    // match so a proposal created exactly at `since` is not treated as DB-only.
    it("should query inclusively at the cutoff (created_gte) so the boundary matches the DB scan", async () => {
      const cursors: unknown[] = [];
      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            query: string;
            variables: { cursor: number };
          };
          cursors.push(body.variables.cursor);
          expect(body.query).toContain("created_gte");
          expect(body.query).not.toContain("created_gt:");
          return HttpResponse.json({
            data: { proposals: [{ id: "boundary", created: 1699999999 }] },
          });
        }),
      );

      const result = await provider.fetchProposalIdsSince(1699999999);

      expect(cursors[0]).toBe(1699999999);
      expect(result).toContain("boundary");
    });

    // Finding 2: a full page ending on a shared `created` second must not drop
    // the remaining proposals sharing that second on the next page.
    it("should not skip proposals sharing the last created second across a page boundary", async () => {
      // First page: 999 distinct seconds + 1 proposal on second 1700000999,
      // which has a sibling still queued for the next page.
      const firstPage = Array.from({ length: 1000 }, (_, i) => ({
        id: `proposal-${i}`,
        created: i < 999 ? 1700000000 + i : 1700000999,
      }));
      const secondPage = [
        { id: "proposal-sibling", created: 1700000999 },
        { id: "proposal-1000", created: 1700001000 },
      ];
      mockGraphQLSequence([
        { proposals: firstPage },
        { proposals: secondPage },
      ]);

      const result = await provider.fetchProposalIdsSince(0);

      expect(result).toContain("proposal-sibling");
      // Re-fetched boundary row must be de-duped, not duplicated.
      expect(new Set(result).size).toBe(result.length);
    });
  });

  describe("fetchVotesByProposalIds", () => {
    const voter = (i: number) => `0x${i.toString(16).padStart(40, "0")}`;

    it("should skip the request when no ids are given", async () => {
      await expect(provider.fetchVotesByProposalIds([])).resolves.toStrictEqual(
        [],
      );
    });

    it("should query inclusively at the cursor (created_gte)", async () => {
      const cursors: unknown[] = [];
      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            query: string;
            variables: { cursor: number };
          };
          cursors.push(body.variables.cursor);
          expect(body.query).toContain("created_gte");
          expect(body.query).not.toContain("created_gt:");
          return HttpResponse.json({ data: { votes: [makeVote()] } });
        }),
      );

      const result = await provider.fetchVotesByProposalIds(["proposal-1"]);

      expect(cursors[0]).toBe(0);
      expect(result).toHaveLength(1);
    });

    // A full page ending on a shared `created` second must not drop the revealed
    // votes cast in that same second that spilled onto the next page. The
    // handler filters the way Snapshot does, honouring whichever operator the
    // query sends, so an exclusive cursor really loses the sibling here.
    it("should not skip votes sharing the last created second across a page boundary", async () => {
      // 999 votes on distinct seconds, then two sharing 1700000999, the second
      // of which cannot fit on a 1000-row page.
      const all = Array.from({ length: 1001 }, (_, i) =>
        makeVote({
          id: `vote-${i}`,
          voter: voter(i + 1),
          created: i < 999 ? 1700000000 + i : 1700000999,
        }),
      );

      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            query: string;
            variables: { cursor: number; pageSize: number };
          };
          const { cursor, pageSize } = body.variables;
          const inclusive = body.query.includes("created_gte");
          const votes = all
            .filter((vote) =>
              inclusive ? vote.created >= cursor : vote.created > cursor,
            )
            .slice(0, pageSize);
          return HttpResponse.json({ data: { votes } });
        }),
      );

      const result = await provider.fetchVotesByProposalIds(["proposal-1"]);

      // Both votes on the shared second survive, and the boundary vote re-read
      // by the inclusive cursor is de-duped rather than counted twice.
      expect(result).toHaveLength(1001);
      expect(result.filter((vote) => vote.created === 1700000999)).toHaveLength(
        2,
      );
    });

    // A burst of more than a full page of votes on one second must keep
    // paginating (via skip) instead of stepping past the second: votes dropped
    // here keep their encrypted choice forever, because the reveal write makes
    // the tally nonzero and the proposal stops being reveal-pending.
    it("should keep paginating through a same-second vote burst larger than a page", async () => {
      const all = Array.from({ length: 1500 }, (_, i) =>
        makeVote({
          id: `vote-${i}`,
          voter: voter(i + 1),
          created: i < 1400 ? 1700000999 : 1700001000,
        }),
      );

      server.use(
        http.post(ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            variables: { cursor: number; skip: number; pageSize: number };
          };
          const { cursor, skip, pageSize } = body.variables;
          const votes = all
            .filter((vote) => vote.created >= cursor)
            .slice(skip, skip + pageSize);
          return HttpResponse.json({ data: { votes } });
        }),
      );

      const result = await provider.fetchVotesByProposalIds(["proposal-1"]);

      expect(result).toHaveLength(1500);
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
