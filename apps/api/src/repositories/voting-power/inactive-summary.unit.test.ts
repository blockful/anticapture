import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import {
  accountPower,
  proposalsOnchain,
  votesOnchain,
} from "@/database/schema";

import { InactiveVotingPowerSummaryRepository } from "./inactive-summary";

const DELEGATE_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const DELEGATE_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const DELEGATE_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";

type AccountPowerInsert = typeof accountPower.$inferInsert;
type ProposalInsert = typeof proposalsOnchain.$inferInsert;
type VoteInsert = typeof votesOnchain.$inferInsert;

const VOTING_PERIOD_SECONDS = 100000;

const createAccountPower = (
  overrides: Partial<AccountPowerInsert> = {},
): AccountPowerInsert => ({
  accountId: DELEGATE_A,
  daoId: "UNI",
  votingPower: 1000n,
  ...overrides,
});

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: "proposal-1",
  txHash: "0xtx1",
  daoId: "UNI",
  proposerAccountId: DELEGATE_A,
  targets: [],
  values: [],
  signatures: [],
  calldatas: [],
  startBlock: 100,
  endBlock: 200,
  title: "Test proposal",
  description: "Test proposal",
  timestamp: 1000n,
  endTimestamp: 2000n,
  status: "EXECUTED",
  ...overrides,
});

const createVote = (overrides: Partial<VoteInsert> = {}): VoteInsert => ({
  txHash: "0xvote1",
  daoId: "UNI",
  voterAccountId: DELEGATE_A,
  proposalId: "proposal-1",
  support: "1",
  votingPower: 1000n,
  timestamp: 1500n,
  logIndex: 0,
  ...overrides,
});

describe("InactiveVotingPowerSummaryRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: InactiveVotingPowerSummaryRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new InactiveVotingPowerSummaryRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votesOnchain);
    await db.delete(proposalsOnchain);
    await db.delete(accountPower);
  });

  it("returns zeros when no data exists", async () => {
    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
    );

    expect(result).toEqual({
      totalProposals: 0,
      totalDelegatedVotingPower: 0n,
      inactiveDelegatedVotingPower: 0n,
    });
  });

  it("sums only positive voting power into the total", async () => {
    await db
      .insert(accountPower)
      .values([
        createAccountPower({ accountId: DELEGATE_A, votingPower: 1000n }),
        createAccountPower({ accountId: DELEGATE_B, votingPower: 0n }),
      ]);

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
    );

    expect(result.totalDelegatedVotingPower).toBe(1000n);
  });

  it("counts delegates with no votes on window proposals as inactive", async () => {
    await db
      .insert(accountPower)
      .values([
        createAccountPower({ accountId: DELEGATE_A, votingPower: 700n }),
        createAccountPower({ accountId: DELEGATE_B, votingPower: 300n }),
      ]);
    await db.insert(proposalsOnchain).values(createProposal());
    await db
      .insert(votesOnchain)
      .values(createVote({ voterAccountId: DELEGATE_A }));

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
    );

    expect(result).toEqual({
      totalProposals: 1,
      totalDelegatedVotingPower: 1000n,
      inactiveDelegatedVotingPower: 300n,
    });
  });

  it("only counts proposals whose voting period overlaps the window", async () => {
    await db
      .insert(accountPower)
      .values([
        createAccountPower({ accountId: DELEGATE_A, votingPower: 700n }),
        createAccountPower({ accountId: DELEGATE_B, votingPower: 300n }),
        createAccountPower({ accountId: DELEGATE_C, votingPower: 100n }),
      ]);
    await db.insert(proposalsOnchain).values([
      // Voting period ends at 101000, before the window starts.
      createProposal({ id: "proposal-old", txHash: "0xtx1", timestamp: 1000n }),
      // Voting period [500000, 600000], inside the window.
      createProposal({
        id: "proposal-window",
        txHash: "0xtx2",
        timestamp: 500000n,
      }),
    ]);
    await db.insert(votesOnchain).values([
      // A voted only on the out-of-window proposal, so it stays inactive.
      createVote({
        txHash: "0xvoteA",
        voterAccountId: DELEGATE_A,
        proposalId: "proposal-old",
        timestamp: 50000n,
      }),
      createVote({
        txHash: "0xvoteB",
        voterAccountId: DELEGATE_B,
        proposalId: "proposal-window",
        timestamp: 550000n,
      }),
    ]);

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
      200000,
    );

    expect(result).toEqual({
      totalProposals: 1,
      totalDelegatedVotingPower: 1100n,
      inactiveDelegatedVotingPower: 800n,
    });
  });

  it("excludes proposals created after toDate", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPower({ accountId: DELEGATE_A, votingPower: 500n }));
    await db.insert(proposalsOnchain).values([
      createProposal({ id: "proposal-1", txHash: "0xtx1", timestamp: 1000n }),
      createProposal({
        id: "proposal-late",
        txHash: "0xtx2",
        timestamp: 900000n,
      }),
    ]);

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
      undefined,
      500000,
    );

    expect(result.totalProposals).toBe(1);
  });

  it("excludes a proposal whose voting only opens after toDate", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPower({ accountId: DELEGATE_A, votingPower: 500n }));
    // Created before toDate, but a 20000s voting delay only opens it at 60000.
    await db
      .insert(proposalsOnchain)
      .values(createProposal({ id: "proposal-1", timestamp: 40000n }));

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      20000,
      undefined,
      50000,
    );

    // No proposal was votable inside the window, so no delegate can be called
    // inactive for it -- counting it would report 100% inactive voting power.
    expect(result.totalProposals).toBe(0);
    expect(result.inactiveDelegatedVotingPower).toBe(500n);
  });

  it("ignores votes cast after toDate on a proposal opened inside the window", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPower({ accountId: DELEGATE_A, votingPower: 500n }));
    // Opens inside the window, still votable after it ends.
    await db
      .insert(proposalsOnchain)
      .values(createProposal({ id: "proposal-1", timestamp: 1000n }));
    await db
      .insert(votesOnchain)
      .values(createVote({ voterAccountId: DELEGATE_A, timestamp: 90000n }));

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
      undefined,
      50000,
    );

    expect(result.totalProposals).toBe(1);
    // The only vote landed after the window closed, so the delegate was
    // inactive for the period the user selected.
    expect(result.inactiveDelegatedVotingPower).toBe(500n);
  });

  it("counts votes cast inside the window as active", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPower({ accountId: DELEGATE_A, votingPower: 500n }));
    await db
      .insert(proposalsOnchain)
      .values(createProposal({ id: "proposal-1", timestamp: 1000n }));
    await db
      .insert(votesOnchain)
      .values(createVote({ voterAccountId: DELEGATE_A, timestamp: 40000n }));

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
      undefined,
      50000,
    );

    expect(result.inactiveDelegatedVotingPower).toBe(0n);
  });

  it("ignores votes cast before fromDate on a proposal that overlaps the window", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPower({ accountId: DELEGATE_A, votingPower: 500n }));
    // Votable over [1000, 101000], so it overlaps a window starting at 50000.
    await db
      .insert(proposalsOnchain)
      .values(createProposal({ id: "proposal-1", timestamp: 1000n }));
    await db
      .insert(votesOnchain)
      .values(createVote({ voterAccountId: DELEGATE_A, timestamp: 20000n }));

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
      50000,
    );

    expect(result.totalProposals).toBe(1);
    // The only vote predates the window, so the delegate cast nothing inside it.
    expect(result.inactiveDelegatedVotingPower).toBe(500n);
  });

  it("counts votes cast at or after fromDate as active", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPower({ accountId: DELEGATE_A, votingPower: 500n }));
    await db
      .insert(proposalsOnchain)
      .values(createProposal({ id: "proposal-1", timestamp: 1000n }));
    await db
      .insert(votesOnchain)
      .values(createVote({ voterAccountId: DELEGATE_A, timestamp: 50000n }));

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
      50000,
    );

    expect(result.inactiveDelegatedVotingPower).toBe(0n);
  });

  it("reports zero proposals when none fall inside the window", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPower({ accountId: DELEGATE_A, votingPower: 500n }));
    await db
      .insert(proposalsOnchain)
      .values(createProposal({ timestamp: 1000n }));

    const result = await repository.getInactiveDelegatedVotingPowerSummary(
      VOTING_PERIOD_SECONDS,
      0,
      999999999,
    );

    expect(result.totalProposals).toBe(0);
  });
});
