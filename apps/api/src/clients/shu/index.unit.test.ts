import { createPublicClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { beforeEach, describe, expect, it } from "vitest";

import { ProposalStatus } from "@/lib/constants";

import { SHUClient } from "./index";

const AZORIUS_ADDRESS = "0xAA6BfA174d2f803b517026E93DBBEc1eBa26258e";
const VOTING_STRATEGY_ADDRESS = "0x4b29d8B250B8b442ECfCd3a4e3D91933d2db720F";

// Mirrors the hardcoded on-chain constants in the SHU client
const TIMELOCK_PERIOD_BLOCKS = 14400;
const EXECUTION_PERIOD_BLOCKS = 21600;

const START_BLOCK = 1_000;
const END_BLOCK = 22_600;
const TIMELOCK_END_BLOCK = END_BLOCK + TIMELOCK_PERIOD_BLOCKS;
const EXPIRATION_BLOCK = TIMELOCK_END_BLOCK + EXECUTION_PERIOD_BLOCKS;

// Quorum is 30M SHU (forVotes + abstainVotes); 40M passes quorum and majority
const createProposal = (overrides: { status?: string } = {}) => ({
  id: "1",
  status: overrides.status ?? ProposalStatus.ACTIVE,
  startBlock: START_BLOCK,
  endBlock: END_BLOCK,
  forVotes: parseEther("40000000"),
  againstVotes: 0n,
  abstainVotes: 0n,
  endTimestamp: 0n,
});

describe("SHUClient", () => {
  let shuClient: SHUClient;

  beforeEach(() => {
    // No RPC calls happen in getProposalStatus: quorum, threshold and periods
    // are hardcoded in the client, so the transport is never exercised.
    const client = createPublicClient({ chain: mainnet, transport: http() });
    shuClient = new SHUClient(client, AZORIUS_ADDRESS, VOTING_STRATEGY_ADDRESS);
  });

  describe("getProposalStatus (Azorius post-voting lifecycle)", () => {
    it("returns ACTIVE during the voting period", async () => {
      const status = await shuClient.getProposalStatus(
        createProposal(),
        END_BLOCK - 1,
        0,
      );

      expect(status).toBe(ProposalStatus.ACTIVE);
    });

    it("returns QUEUED right after voting ends (Azorius TIMELOCKED)", async () => {
      const status = await shuClient.getProposalStatus(
        createProposal(),
        END_BLOCK,
        0,
      );

      expect(status).toBe(ProposalStatus.QUEUED);
    });

    it("returns QUEUED at the last timelocked block (contract uses <=)", async () => {
      const status = await shuClient.getProposalStatus(
        createProposal(),
        TIMELOCK_END_BLOCK,
        0,
      );

      expect(status).toBe(ProposalStatus.QUEUED);
    });

    it("returns PENDING_EXECUTION once the timelock elapses (Azorius EXECUTABLE)", async () => {
      const status = await shuClient.getProposalStatus(
        createProposal(),
        TIMELOCK_END_BLOCK + 1,
        0,
      );

      expect(status).toBe(ProposalStatus.PENDING_EXECUTION);
    });

    it("returns PENDING_EXECUTION until the execution window closes", async () => {
      const status = await shuClient.getProposalStatus(
        createProposal(),
        EXPIRATION_BLOCK - 1,
        0,
      );

      expect(status).toBe(ProposalStatus.PENDING_EXECUTION);
    });

    it("returns EXPIRED after the execution window passes", async () => {
      const status = await shuClient.getProposalStatus(
        createProposal(),
        EXPIRATION_BLOCK,
        0,
      );

      expect(status).toBe(ProposalStatus.EXPIRED);
    });

    it("returns NO_QUORUM when quorum is not met after voting ends", async () => {
      const status = await shuClient.getProposalStatus(
        {
          ...createProposal(),
          forVotes: parseEther("1000"),
          abstainVotes: 0n,
        },
        END_BLOCK,
        0,
      );

      expect(status).toBe(ProposalStatus.NO_QUORUM);
    });

    it("returns DEFEATED when quorum is met but majority is not", async () => {
      const status = await shuClient.getProposalStatus(
        {
          ...createProposal(),
          forVotes: parseEther("30000000"),
          againstVotes: parseEther("40000000"),
        },
        END_BLOCK,
        0,
      );

      expect(status).toBe(ProposalStatus.DEFEATED);
    });

    it("keeps EXECUTED once persisted by the indexer", async () => {
      const status = await shuClient.getProposalStatus(
        createProposal({ status: ProposalStatus.EXECUTED }),
        EXPIRATION_BLOCK + 1,
        0,
      );

      expect(status).toBe(ProposalStatus.EXECUTED);
    });
  });
});
